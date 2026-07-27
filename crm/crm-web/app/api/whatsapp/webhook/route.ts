import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";
import { jidToPhone } from "@/lib/phone";
import { scheduleAgentRun } from "@/lib/ai/agent-scheduler";
import { createLeadNotification } from "@/lib/notifications";
import { fetchProfilePicture, getBase64FromMediaMessage } from "@/lib/evolution";

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

type MediaKind = "audio" | "image" | "video" | "document";

// Detecta se a mensagem tem mídia anexada (a Evolution manda só metadados no
// payload — o conteúdo real vem de getBase64FromMediaMessage).
function detectMediaKind(message: Record<string, unknown> | undefined): MediaKind | null {
  if (!message) return null;
  const m = message as Record<string, any>;
  if (m.audioMessage) return "audio";
  if (m.imageMessage) return "image";
  if (m.videoMessage) return "video";
  if (m.documentMessage) return "document";
  return null;
}

const PLACEHOLDER_BODY: Record<MediaKind, string> = {
  audio: "[áudio]",
  image: "[imagem]",
  video: "[vídeo]",
  document: "[documento]",
};

const EXT_BY_MIME: Record<string, string> = {
  "audio/ogg": "ogg",
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "application/pdf": "pdf",
};

function extFromMime(mime: string | undefined): string {
  if (!mime) return "bin";
  const clean = mime.split(";")[0]?.trim() ?? mime;
  return EXT_BY_MIME[clean] ?? clean.split("/")[1] ?? "bin";
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

      const mediaKind = detectMediaKind(data?.message);
      let body = extractText(data?.message).trim();
      if (!body && mediaKind) body = PLACEHOLDER_BODY[mediaKind];
      if (!body) continue; // nem texto reconhecido, nem mídia — ignora

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

      // baixa a mídia recebida (áudio, imagem, vídeo, documento) — best-effort,
      // se falhar a mensagem ainda é salva com o texto/placeholder
      let mediaUrl: string | undefined;
      let mediaType: string | undefined;
      let fileName: string | undefined;
      if (mediaKind && waMessageId) {
        try {
          const media = await getBase64FromMediaMessage(waMessageId);
          if (media?.base64) {
            const safeName =
              typeof media.fileName === "string" && media.fileName
                ? media.fileName.replace(/[^\w.\-]/g, "_")
                : `${mediaKind}.${extFromMime(media.mimetype)}`;
            const dir = path.join(process.cwd(), "public", "uploads", lead.id);
            const savedName = `${Date.now()}-${safeName}`;
            await mkdir(dir, { recursive: true });
            await writeFile(path.join(dir, savedName), Buffer.from(media.base64, "base64"));
            mediaUrl = `/uploads/${lead.id}/${savedName}`;
            mediaType = mediaKind;
            fileName = safeName;
          }
        } catch (err) {
          console.error("[webhook] erro baixando mídia recebida:", err);
        }
      }

      await prisma.message.create({
        data: {
          leadId: lead.id,
          direction: fromMe ? "out" : "in",
          author: fromMe ? "hervesson" : "lead",
          body,
          mediaUrl,
          mediaType,
          fileName,
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
