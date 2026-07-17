import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jidToPhone } from "@/lib/phone";
import { runAgent } from "@/lib/ai/agent";

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

export async function POST(req: Request) {
  const payload = await req.json().catch(() => null);
  if (!payload) return NextResponse.json({ ok: true });

  const event: string = payload.event ?? payload.type ?? "";
  if (event !== "messages.upsert") {
    // outros eventos (connection.update etc.) — só confirma
    return NextResponse.json({ ok: true });
  }

  // A Evolution pode mandar data como objeto único ou array.
  const items = Array.isArray(payload.data) ? payload.data : [payload.data];

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
      const lead = await prisma.lead.upsert({
        where: { phone },
        update: { name: undefined },
        create: { phone, name: pushName, source: "whatsapp" },
      });

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
