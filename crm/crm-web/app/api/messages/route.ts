import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { sendText, sendMedia } from "@/lib/evolution";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BASE64_LEN = 16 * 1024 * 1024; // ~16MB de base64 (~12MB de arquivo)

function mediaTypeFor(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  return "document";
}

// POST = resposta manual do Hervesson (texto ou arquivo), enviada pelo WhatsApp via Evolution.
export async function POST(req: Request) {
  const session = await requireUser();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const payload = await req.json().catch(() => ({}));
  const { leadId, body, file } = payload;

  if (!leadId || (!body && !file)) {
    return NextResponse.json(
      { error: "leadId e (body ou file) são obrigatórios" },
      { status: 400 },
    );
  }

  const lead = await prisma.lead.findUnique({ where: { id: String(leadId) } });
  if (!lead) return NextResponse.json({ error: "lead não encontrado" }, { status: 404 });
  if (!lead.phone) {
    return NextResponse.json(
      { error: "lead sem telefone de WhatsApp" },
      { status: 400 },
    );
  }

  // Anexo
  if (file) {
    const { name, mimeType, base64 } = file ?? {};
    if (!name || !mimeType || !base64) {
      return NextResponse.json({ error: "arquivo inválido" }, { status: 400 });
    }
    if (base64.length > MAX_BASE64_LEN) {
      return NextResponse.json({ error: "arquivo muito grande (máx. ~12MB)" }, { status: 413 });
    }

    const mediatype = mediaTypeFor(mimeType);
    const safeName = String(name).replace(/[^\w.\-]/g, "_");
    const fileName = `${Date.now()}-${safeName}`;
    const dir = path.join(process.cwd(), "public", "uploads", lead.id);
    const mediaUrl = `/uploads/${lead.id}/${fileName}`;

    try {
      await mkdir(dir, { recursive: true });
      await writeFile(path.join(dir, fileName), Buffer.from(base64, "base64"));
    } catch (err) {
      return NextResponse.json(
        { error: "falha ao salvar o arquivo", detail: String(err) },
        { status: 500 },
      );
    }

    try {
      await sendMedia(lead.phone, {
        mediatype,
        mimetype: mimeType,
        media: base64,
        fileName: safeName,
      });
    } catch (err) {
      return NextResponse.json(
        { error: "falha ao enviar pelo WhatsApp", detail: String(err) },
        { status: 502 },
      );
    }

    const message = await prisma.message.create({
      data: {
        leadId: lead.id,
        direction: "out",
        author: "hervesson",
        body: typeof body === "string" ? body.trim() : "",
        mediaUrl,
        mediaType: mediatype,
        fileName: safeName,
      },
    });

    return NextResponse.json({ ok: true, message });
  }

  // Texto
  const text = typeof body === "string" ? body.trim() : "";
  if (!text) {
    return NextResponse.json({ error: "leadId e body são obrigatórios" }, { status: 400 });
  }

  try {
    await sendText(lead.phone, text);
  } catch (err) {
    return NextResponse.json(
      { error: "falha ao enviar pelo WhatsApp", detail: String(err) },
      { status: 502 },
    );
  }

  const message = await prisma.message.create({
    data: { leadId: lead.id, direction: "out", author: "hervesson", body: text },
  });

  return NextResponse.json({ ok: true, message });
}
