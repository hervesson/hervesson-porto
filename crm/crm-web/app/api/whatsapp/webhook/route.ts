import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { normalizeDigits, phoneVariants, canonicalPhone } from "@/lib/phone";
import { scheduleAgentRun } from "@/lib/ai/agent-scheduler";
import { createLeadNotification } from "@/lib/notifications";
import { downloadMedia, markAsRead } from "@/lib/whatsapp/cloud-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ?? "";
const APP_SECRET = process.env.WHATSAPP_APP_SECRET ?? "";

// ---------------------------------------------------------------------------
// GET — verificação do endpoint. A Meta chama uma vez, na hora que você cadastra
// a URL no painel, e espera o hub.challenge de volta em texto puro.
// ---------------------------------------------------------------------------
export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token && token === VERIFY_TOKEN) {
    return new Response(challenge ?? "", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }
  return new Response("forbidden", { status: 403 });
}

// ---------------------------------------------------------------------------
// Assinatura: a Meta assina o corpo cru com o App Secret. Sem essa checagem,
// qualquer um que descubra a URL injeta mensagem no CRM.
// ---------------------------------------------------------------------------
function signatureValid(raw: string, header: string | null): boolean {
  if (!APP_SECRET) {
    // Sem segredo configurado não dá pra validar. Recusa em produção em vez de
    // aceitar às cegas; em dev, deixa passar pra facilitar o túnel local.
    if (process.env.NODE_ENV === "production") return false;
    console.warn("[webhook] WHATSAPP_APP_SECRET não configurado — pulando validação");
    return true;
  }
  if (!header?.startsWith("sha256=")) return false;

  const expected = createHmac("sha256", APP_SECRET).update(raw, "utf8").digest();
  const received = Buffer.from(header.slice("sha256=".length), "hex");
  if (received.length !== expected.length) return false;
  return timingSafeEqual(expected, received);
}

// ---------------------------------------------------------------------------
// Formato dos eventos da Cloud API. Só os campos que usamos — a Meta manda
// bem mais (sha256, timestamps, contexto de resposta) e nada disso importa aqui.
// ---------------------------------------------------------------------------
type MediaKind = "audio" | "image" | "video" | "document";

type MediaNode = { id?: string; caption?: string };

type MetaMessage = {
  id?: string;
  /** quem enviou (mensagem recebida) */
  from?: string;
  /** para quem foi (eco de mensagem enviada do celular) */
  to?: string;
  recipient_id?: string;
  type?: string;
  text?: { body?: string };
  image?: MediaNode;
  video?: MediaNode;
  audio?: MediaNode;
  document?: MediaNode;
  button?: { text?: string };
  interactive?: {
    button_reply?: { title?: string };
    list_reply?: { title?: string };
  };
  location?: { name?: string };
  reaction?: { emoji?: string };
};

type MetaValue = {
  contacts?: Array<{ profile?: { name?: string }; wa_id?: string }>;
  messages?: MetaMessage[];
  /** ecos: só chegam com Coexistence + campo "message_echoes" assinado */
  message_echoes?: MetaMessage[];
  statuses?: Array<{ id?: string; status?: string }>;
};

type MetaPayload = {
  entry?: Array<{ changes?: Array<{ value?: MetaValue }> }>;
};

const PLACEHOLDER: Record<MediaKind, string> = {
  audio: "[áudio]",
  image: "[imagem]",
  video: "[vídeo]",
  document: "[documento]",
};

function extractText(msg: MetaMessage): string {
  switch (msg.type) {
    case "text":
      return msg.text?.body ?? "";
    case "image":
      return msg.image?.caption ?? "";
    case "video":
      return msg.video?.caption ?? "";
    case "document":
      return msg.document?.caption ?? "";
    case "button":
      // resposta de botão de template
      return msg.button?.text ?? "";
    case "interactive":
      // resposta de botão ou de lista interativa
      return (
        msg.interactive?.button_reply?.title ??
        msg.interactive?.list_reply?.title ??
        ""
      );
    case "location":
      return msg.location?.name ?? "[localização]";
    case "reaction":
      return msg.reaction?.emoji ? `[reagiu ${msg.reaction.emoji}]` : "";
    default:
      return "";
  }
}

function mediaKindOf(msg: MetaMessage): MediaKind | null {
  const t = msg.type;
  if (t === "audio" || t === "image" || t === "video" || t === "document") return t;
  return null;
}

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

function extFromMime(mime?: string): string {
  if (!mime) return "bin";
  const clean = mime.split(";")[0]?.trim() ?? mime;
  return EXT_BY_MIME[clean] ?? clean.split("/")[1] ?? "bin";
}

// Status de entrega da Meta -> nosso enum simples.
function mapStatus(raw: unknown): string | null {
  switch (String(raw ?? "").toLowerCase()) {
    case "sent":
      return "sent";
    case "delivered":
      return "delivered";
    case "read":
      return "read";
    case "failed":
      return "failed";
    default:
      return null;
  }
}

// Baixa a mídia e salva em public/uploads/<leadId>/. Best-effort: se falhar, a
// mensagem ainda é gravada com o placeholder de texto.
async function saveIncomingMedia(leadId: string, mediaId: string, kind: MediaKind) {
  const media = await downloadMedia(mediaId);
  const safeName =
    media.fileName?.replace(/[^\w.\-]/g, "_") || `${kind}.${extFromMime(media.mimeType)}`;
  const savedName = `${Date.now()}-${safeName}`;
  const dir = path.join(process.cwd(), "public", "uploads", leadId);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, savedName), media.buffer);
  return {
    mediaUrl: `/uploads/${leadId}/${savedName}`,
    mediaType: kind,
    fileName: safeName,
  };
}

// ---------------------------------------------------------------------------
// POST — eventos.
// ---------------------------------------------------------------------------
export async function POST(req: Request) {
  const raw = await req.text();
  if (!signatureValid(raw, req.headers.get("x-hub-signature-256"))) {
    return new Response("invalid signature", { status: 401 });
  }

  let payload: MetaPayload;
  try {
    payload = JSON.parse(raw) as MetaPayload;
  } catch {
    return NextResponse.json({ ok: true });
  }

  for (const entry of payload?.entry ?? []) {
    for (const change of entry?.changes ?? []) {
      const value = change?.value ?? {};

      try {
        // --- confirmações de entrega das mensagens que nós enviamos ---
        for (const st of value.statuses ?? []) {
          const status = mapStatus(st?.status);
          if (!st?.id || !status) continue;
          await prisma.message.updateMany({
            where: { waMessageId: st.id },
            data: { status },
          });
        }

        // --- mensagens recebidas ---
        for (const msg of value.messages ?? []) {
          await handleInbound(msg, value, false);
        }

        // --- ecos: mensagens que o Hervesson mandou pelo celular ---
        // Só chegam quando a Coexistence estiver ativa e o campo
        // "message_echoes" assinado no app. Sem isso, o array não vem.
        for (const msg of value.message_echoes ?? []) {
          await handleInbound(msg, value, true);
        }
      } catch (err) {
        console.error("[webhook] erro processando change:", err);
        // não falha o webhook inteiro — a Meta reentrega tudo e duplicaria
      }
    }
  }

  return NextResponse.json({ ok: true });
}

async function handleInbound(msg: MetaMessage, value: MetaValue, isEcho: boolean) {
  const waMessageId = msg.id;
  // Em eco, "to" é o contato; em mensagem recebida, é "from".
  const rawPhone = isEcho ? (msg.to ?? msg.recipient_id) : msg.from;
  if (!rawPhone) return;

  const phone = normalizeDigits(String(rawPhone));

  // dedupe — a Meta reentrega o mesmo evento quando não recebe 200 a tempo
  if (waMessageId) {
    const dup = await prisma.message.findUnique({ where: { waMessageId } });
    if (dup) return;
  }

  const kind = mediaKindOf(msg);
  let body = extractText(msg).trim();
  if (!body && kind) body = PLACEHOLDER[kind];
  if (!body) return; // tipo não suportado (contacts, system, order...)

  // nome do perfil vem em contacts[], e só é confiável em mensagem recebida
  const profileName: string | null = isEcho
    ? null
    : (value.contacts?.[0]?.profile?.name ?? null);

  // Busca tolerante ao nono dígito: a Meta manda o wa_id de celular brasileiro
  // muitas vezes sem o 9, e o banco tem com. Sem isso, vira lead duplicado.
  const existing = await prisma.lead.findFirst({
    where: { phone: { in: phoneVariants(phone) } },
  });

  const lead =
    existing ??
    (await prisma.lead.create({
      // salva na forma canônica (com o 9), não o wa_id cru — senão o envio de
      // volta falha, porque a Meta não aceita mandar pro número sem o 9
      data: { phone: canonicalPhone(phone), name: profileName, source: "whatsapp" },
    }));

  if (!existing && !isEcho) {
    await createLeadNotification(lead);
  }

  // mídia recebida
  let media: { mediaUrl: string; mediaType: string; fileName: string } | undefined;
  const mediaId = kind ? msg[kind]?.id : undefined;
  if (kind && mediaId) {
    try {
      media = await saveIncomingMedia(lead.id, mediaId, kind);
    } catch (err) {
      console.error("[webhook] erro baixando mídia:", err);
    }
  }

  await prisma.message.create({
    data: {
      leadId: lead.id,
      direction: isEcho ? "out" : "in",
      author: isEcho ? "hervesson" : "lead",
      body,
      ...(media ?? {}),
      waMessageId,
      raw: msg as Prisma.InputJsonValue,
    },
  });

  if (isEcho) {
    // Hervesson respondeu pelo celular — assume a conversa e cala a IA.
    if (!lead.aiPaused) {
      await prisma.lead.update({ where: { id: lead.id }, data: { aiPaused: true } });
    }
    return;
  }

  if (waMessageId) await markAsRead(waMessageId);

  // debounce: agrupa rajada de mensagens num único turno da IA
  scheduleAgentRun(lead.id);
}
