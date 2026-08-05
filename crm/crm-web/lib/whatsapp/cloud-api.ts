// Cliente da WhatsApp Cloud API (oficial da Meta).
// Doc: https://developers.facebook.com/docs/whatsapp/cloud-api
//
// Substituiu a Evolution API (Baileys) em 2026-08-05: o Baileys não entrega
// mais mensagens interativas e viola o Termo de Uso da Meta.
//
// PORTÁVEL DE PROPÓSITO: este módulo não importa nada do CRM (nem Prisma, nem
// tipos locais). Foi escrito pra ser copiado inteiro pro sistema de pedidos do
// açaí. Se precisar mexer, mantenha essa independência.

const VERSION = process.env.WHATSAPP_API_VERSION ?? "v23.0";
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID ?? "";
const TOKEN = process.env.WHATSAPP_ACCESS_TOKEN ?? "";
const GRAPH = "https://graph.facebook.com";

export type SendResult = {
  /** wamid.* — id da mensagem na Meta. Usado pra dedupe do eco no webhook. */
  id: string;
};

async function graph(path: string, init?: RequestInit) {
  const res = await fetch(`${GRAPH}/${VERSION}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      ...(init?.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`WhatsApp ${path} -> ${res.status} ${text}`);
  }
  return res.json().catch(() => ({}));
}

// A resposta de envio traz { messages: [{ id: "wamid...." }] }.
function firstMessageId(data: unknown): string {
  const d = data as { messages?: Array<{ id?: string }> };
  return d?.messages?.[0]?.id ?? "";
}

/**
 * Envia texto simples. Só funciona dentro da janela de atendimento de 24h
 * (aberta pela última mensagem do contato). Fora dela a Meta rejeita — use
 * sendTemplate.
 */
export async function sendText(phone: string, text: string): Promise<SendResult> {
  const data = await graph(`/${PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phone,
      type: "text",
      text: { preview_url: true, body: text },
    }),
  });
  return { id: firstMessageId(data) };
}

/**
 * Envia um template aprovado. É o único jeito de iniciar conversa ou de falar
 * fora da janela de 24h.
 * `components` segue o formato da Meta (header/body/button com parameters).
 */
export async function sendTemplate(
  phone: string,
  name: string,
  languageCode = "pt_BR",
  components?: unknown[],
): Promise<SendResult> {
  const data = await graph(`/${PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: phone,
      type: "template",
      template: {
        name,
        language: { code: languageCode },
        ...(components?.length ? { components } : {}),
      },
    }),
  });
  return { id: firstMessageId(data) };
}

export type MediaKind = "image" | "video" | "audio" | "document" | "sticker";

/**
 * Sobe um arquivo pros servidores da Meta e devolve o id da mídia.
 * Diferente da Evolution, a Cloud API não aceita base64 no envio — é upload
 * primeiro, envio depois. O id vale 30 dias.
 */
export async function uploadMedia(
  buffer: Buffer,
  mimeType: string,
  fileName: string,
): Promise<string> {
  const form = new FormData();
  form.append("messaging_product", "whatsapp");
  form.append("type", mimeType);
  form.append("file", new Blob([new Uint8Array(buffer)], { type: mimeType }), fileName);

  const data = (await graph(`/${PHONE_NUMBER_ID}/media`, {
    method: "POST",
    body: form,
  })) as { id?: string };

  if (!data?.id) throw new Error("upload de mídia não devolveu id");
  return data.id;
}

/**
 * Envia mídia já hospedada na Meta (ver uploadMedia).
 * `caption` só é aceito em image, video e document — áudio e sticker ignoram.
 */
export async function sendMediaById(
  phone: string,
  kind: MediaKind,
  mediaId: string,
  opts?: { caption?: string; fileName?: string },
): Promise<SendResult> {
  const payload: Record<string, unknown> = { id: mediaId };
  if (opts?.caption && kind !== "audio" && kind !== "sticker") {
    payload.caption = opts.caption;
  }
  if (kind === "document" && opts?.fileName) payload.filename = opts.fileName;

  const data = await graph(`/${PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: phone,
      type: kind,
      [kind]: payload,
    }),
  });
  return { id: firstMessageId(data) };
}

/** Atalho: sobe o arquivo e envia em seguida. */
export async function sendMedia(
  phone: string,
  opts: {
    kind: MediaKind;
    mimeType: string;
    fileName: string;
    buffer: Buffer;
    caption?: string;
  },
): Promise<SendResult> {
  const mediaId = await uploadMedia(opts.buffer, opts.mimeType, opts.fileName);
  return sendMediaById(phone, opts.kind, mediaId, {
    caption: opts.caption,
    fileName: opts.fileName,
  });
}

/**
 * Baixa uma mídia recebida. O webhook só manda o id — o conteúdo exige duas
 * chamadas: uma pra descobrir a URL, outra pra buscar os bytes (a URL exige o
 * mesmo Bearer token e expira em minutos).
 */
export async function downloadMedia(
  mediaId: string,
): Promise<{ buffer: Buffer; mimeType: string; fileName?: string }> {
  const meta = (await graph(`/${mediaId}`)) as {
    url?: string;
    mime_type?: string;
    file_name?: string;
  };
  if (!meta?.url) throw new Error(`mídia ${mediaId} sem URL`);

  const res = await fetch(meta.url, {
    headers: { Authorization: `Bearer ${TOKEN}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`download de mídia -> ${res.status}`);

  return {
    buffer: Buffer.from(await res.arrayBuffer()),
    mimeType: meta.mime_type ?? "application/octet-stream",
    fileName: meta.file_name,
  };
}

/**
 * Marca a mensagem do contato como lida (dois tiques azuis no celular dele).
 * Best-effort — falhar aqui não pode derrubar o processamento do webhook.
 */
export async function markAsRead(waMessageId: string): Promise<void> {
  try {
    await graph(`/${PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      body: JSON.stringify({
        messaging_product: "whatsapp",
        status: "read",
        message_id: waMessageId,
      }),
    });
  } catch (err) {
    console.error("[whatsapp] falha ao marcar como lida:", err);
  }
}

export type NumberStatus = {
  /** CONNECTED, PENDING, FLAGGED, RESTRICTED... */
  status: string;
  /** GREEN | YELLOW | RED — qualidade percebida pelos usuários. */
  quality: string;
  /** Nome de exibição aprovado. */
  verifiedName: string;
  online: boolean;
};

/**
 * Estado do número na plataforma. Substitui o connectionState() da Evolution:
 * aqui não existe "conectado/desconectado" (a infra é da Meta), o que importa
 * é o status do número e a nota de qualidade — se cair pra RED, a Meta reduz
 * o limite de envio e depois bloqueia.
 */
export async function numberStatus(): Promise<NumberStatus> {
  try {
    const data = (await graph(
      `/${PHONE_NUMBER_ID}?fields=verified_name,quality_rating,status`,
    )) as { verified_name?: string; quality_rating?: string; status?: string };

    const status = data?.status ?? "UNKNOWN";
    return {
      status,
      quality: data?.quality_rating ?? "UNKNOWN",
      verifiedName: data?.verified_name ?? "",
      online: status === "CONNECTED",
    };
  } catch {
    return { status: "OFFLINE", quality: "UNKNOWN", verifiedName: "", online: false };
  }
}
