import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { sendText } from "@/lib/evolution";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST = resposta manual do Hervesson (envia pelo WhatsApp via Evolution).
export async function POST(req: Request) {
  const session = await requireUser();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { leadId, body } = await req.json().catch(() => ({}));
  const text = typeof body === "string" ? body.trim() : "";
  if (!leadId || !text) {
    return NextResponse.json({ error: "leadId e body são obrigatórios" }, { status: 400 });
  }

  const lead = await prisma.lead.findUnique({ where: { id: String(leadId) } });
  if (!lead) return NextResponse.json({ error: "lead não encontrado" }, { status: 404 });
  if (!lead.phone) {
    return NextResponse.json(
      { error: "lead sem telefone de WhatsApp" },
      { status: 400 },
    );
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
