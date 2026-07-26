import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jidToPhone } from "@/lib/phone";
import { scheduleAgentRun } from "@/lib/ai/agent-scheduler";
import { createLeadNotification } from "@/lib/notifications";
import { fetchProfilePicture } from "@/lib/evolution";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Extrai o texto de uma mensagem da Evolution (Baileys) — cobre os tipos comuns.
function extractText(message: Record<string, unknown> | undefined): string {
  if (!message) return "";
  const m = message as Record<string, any>;
  return (
    m.conversation ??
    m.extendedTextMessage?.text ??
    m.imageMessage?.caption ??
    m.videoMessage?.caption ??
    m.buttonsResponseMessage?.selectedDisplayText ??
    m.listResponseMessage?.title ??
    ""
  );
}

// Mapeia o status de entrega da Evolution/Baileys pro nosso enum simples.
// Best-effort: a Evolution manda ora string (ex. "DELIVERY_ACK"), ora o
// código numérico do Baileys (WAMessageStatus). Cobre os dois formatos —
// ajustar aqui se o payload real vier diferente (não verificado em produção
// ainda, precisa do evento MESSAGES_UPDATE habilitado na Evolution).
function mapDeliveryStatus(raw: unknown): string | null {
  const s = String(raw ?? "").toUpperCase();
  if (s === "0" || s === "ERROR") return "failed";
  if (s === "1" || s === "2" || s === "PENDING" || s === "SERVER_ACK") return "sent";
  if (s === "3" || s === "DELIVERY_ACK") return "delivered";
  if (s === "4" || s === "5" || s === "READ" || s === "PLAYED") return "read";
  return null;
}

export async function POST(req: Request) {
  const payload = await req.json().catch(() => null);
  if (!payload) return NextResponse.json({ ok: true });

  const event: string = payload.event ?? payload.type ?? "";
  const items = Array.isArray(payload.data) ? payload.data : [payload.data];

  if (event === "messages.update") {
    for (const data of items) {
      try {
        const waMessageId: string | undefined = data?.keyId ?? data?.key?.id;
        const status = mapDeliveryStatus(data?.status ?? data?.update?.status);
        if (!waMessageId || !status) continue;
        await prisma.message.updateMany({ where: { waMessageId }, data: { status } });
      } catch (err) {
        console.error("[webhook] erro atualizando status de entrega:", err);
      }
    }
    return NextResponse.json({ ok: true });
  }

  if (event !== "messages.upsert") {
    // outros eventos (connection.update etc.) — só confirma
    return NextResponse.json({ ok: true });
  }

  for (const data of items) {
    try {
      const key = data?.key ?? {};
      const remoteJid: string = key.remoteJid ?? "";
      // fromMe = mensagem enviada da nossa própria conta (painel, IA, ou
      // direto do celular do Hervesson) — não dá pra distinguir a origem só
      // pelo payload, então usa o dedupe por waMessageId abaixo: painel e IA
      // já gravam a mensagem (com o id da Evolution) na hora de enviar, daí
      // o eco que chega aqui é reconhecido e ignorado; o que sobrar é
      // mensagem mandada direto do celular, fora do painel.
      const fromMe: boolean = Boolean(key.fromMe);
      if (!remoteJid || remoteJid.endsWith("@g.us")) continue;

      const body = extractText(data?.message).trim();
      if (!body) continue;

      const phone = jidToPhone(remoteJid);
      const waMessageId: string | undefined = key.id ?? undefined;
      const pushName: string | null = data?.pushName ?? null;

      // dedupe: se já registramos essa mensagem (nós mesmos enviamos, ou já
      // processamos esse evento antes), pula
      if (waMessageId) {
        const dup = await prisma.message.findUnique({ where: { waMessageId } });
        if (dup) continue;
      }

      // acha ou cria o lead pelo telefone — pushName só é confiável quando
      // não é fromMe (numa mensagem nossa, pushName é o nome do Hervesson,
      // não do contato)
      const existingLead = await prisma.lead.findUnique({ where: { phone } });
      const lead =
        existingLead ??
        (await prisma.lead.create({
          data: { phone, name: fromMe ? null : pushName, source: "whatsapp" },
        }));

      if (!existingLead && !fromMe) {
        await createLeadNotification(lead);
      }

      // busca a foto de perfil best-effort — só tenta enquanto o lead não
      // tiver uma (evita bater na Evolution toda mensagem à toa)
      if (!lead.avatarUrl) {
        try {
          const avatarUrl = await fetchProfilePicture(phone);
          if (avatarUrl) {
            await prisma.lead.update({ where: { id: lead.id }, data: { avatarUrl } });
          }
        } catch (err) {
          console.error("[webhook] erro buscando avatar:", err);
        }
      }

      await prisma.message.create({
        data: {
          leadId: lead.id,
          direction: fromMe ? "out" : "in",
          author: fromMe ? "hervesson" : "lead",
          body,
          waMessageId,
          raw: data ?? undefined,
        },
      });

      if (fromMe) {
        // chegou até aqui sem ser deduplicada, então foi mandada direto do
        // celular (painel e IA já tinham gravado a própria mensagem antes) —
        // Hervesson assumiu a conversa por fora do CRM, pausa a IA pra ela
        // não responder por cima dele.
        if (!lead.aiPaused) {
          await prisma.lead.update({ where: { id: lead.id }, data: { aiPaused: true } });
        }
        continue;
      }

      // agenda a IA com debounce — se chegar outra mensagem desse lead nos
      // próximos segundos, agrupa num único turno em vez de responder cada
      // mensagem separadamente (aiPaused é checado de novo lá dentro)
      scheduleAgentRun(lead.id);
    } catch (err) {
      console.error("[webhook] erro processando mensagem:", err);
      // não falha o webhook inteiro por causa de uma mensagem
    }
  }

  return NextResponse.json({ ok: true });
}
