import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jidToPhone } from "@/lib/phone";
import { runAgent } from "@/lib/ai/agent";
import { createLeadNotification } from "@/lib/notifications";

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
      // ignora mensagens enviadas por nós e mensagens de grupo
      if (key.fromMe) continue;
      if (!remoteJid || remoteJid.endsWith("@g.us")) continue;

      const body = extractText(data?.message).trim();
      if (!body) continue;

      const phone = jidToPhone(remoteJid);
      const waMessageId: string | undefined = key.id ?? undefined;
      const pushName: string | null = data?.pushName ?? null;

      // dedupe: se já registramos essa mensagem, pula
      if (waMessageId) {
        const dup = await prisma.message.findUnique({ where: { waMessageId } });
        if (dup) continue;
      }

      // acha ou cria o lead pelo telefone
      const existingLead = await prisma.lead.findUnique({ where: { phone } });
      const lead =
        existingLead ??
        (await prisma.lead.create({ data: { phone, name: pushName, source: "whatsapp" } }));

      if (!existingLead) {
        await createLeadNotification(lead);
      }

      await prisma.message.create({
        data: {
          leadId: lead.id,
          direction: "in",
          author: "lead",
          body,
          waMessageId,
          raw: data ?? undefined,
        },
      });

      // aciona a IA (a função checa aiPaused internamente)
      await runAgent(lead);
    } catch (err) {
      console.error("[webhook] erro processando mensagem:", err);
      // não falha o webhook inteiro por causa de uma mensagem
    }
  }

  return NextResponse.json({ ok: true });
}
