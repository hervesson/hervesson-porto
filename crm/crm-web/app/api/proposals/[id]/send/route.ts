import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { sendMedia } from "@/lib/whatsapp/cloud-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST = manda o PDF já anexado na proposta pro lead vinculado, via WhatsApp,
// e registra a mensagem na conversa (mesmos campos dos anexos enviados pelo
// painel). Se a proposta ainda estava em rascunho, passa pra "enviado".
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireUser();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const proposal = await prisma.proposal.findUnique({ where: { id }, include: { lead: true } });
  if (!proposal) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (!proposal.pdfUrl) {
    return NextResponse.json({ error: "anexe o PDF da proposta antes de enviar" }, { status: 400 });
  }
  if (!proposal.leadId || !proposal.lead) {
    return NextResponse.json({ error: "vincule um lead à proposta antes de enviar" }, { status: 400 });
  }
  if (!proposal.lead.phone) {
    return NextResponse.json({ error: "o lead vinculado não tem telefone de WhatsApp" }, { status: 400 });
  }

  const filePath = path.join(process.cwd(), "public", proposal.pdfUrl);
  const fileName = path.basename(proposal.pdfUrl).replace(/^\d+-/, "");
  const caption = `Proposta ${proposal.number} — ${proposal.clientName}`;

  let buffer: Buffer;
  try {
    buffer = await readFile(filePath);
  } catch (err) {
    return NextResponse.json({ error: "arquivo do PDF não encontrado no servidor", detail: String(err) }, { status: 404 });
  }

  try {
    await sendMedia(proposal.lead.phone, {
      kind: "document",
      mimeType: "application/pdf",
      fileName,
      buffer,
      caption,
    });
  } catch (err) {
    return NextResponse.json({ error: "falha ao enviar pelo WhatsApp", detail: String(err) }, { status: 502 });
  }

  const becameEnviado = proposal.status === "rascunho";

  const [message, updated] = await prisma.$transaction([
    prisma.message.create({
      data: {
        leadId: proposal.leadId,
        direction: "out",
        author: "hervesson",
        body: caption,
        mediaUrl: proposal.pdfUrl,
        mediaType: "document",
        fileName,
      },
    }),
    prisma.proposal.update({
      where: { id },
      data: becameEnviado ? { status: "enviado" } : {},
    }),
  ]);

  return NextResponse.json({ ok: true, message, proposal: updated });
}
