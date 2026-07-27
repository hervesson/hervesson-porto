import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { STATUS_VALUES, proposalTotal } from "@/lib/proposals";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BASE64_LEN = 16 * 1024 * 1024;

async function savePdf(pdf: { name?: string; mimeType?: string; base64?: string }): Promise<string | null> {
  if (!pdf?.base64) return null;
  if (pdf.base64.length > MAX_BASE64_LEN) throw new Error("arquivo muito grande (máx. ~12MB)");
  const safeName = (pdf.name || "proposta.pdf").replace(/[^\w.\-]/g, "_");
  const fileName = `${Date.now()}-${safeName}`;
  const dir = path.join(process.cwd(), "public", "uploads", "proposals");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, fileName), Buffer.from(pdf.base64, "base64"));
  return `/uploads/proposals/${fileName}`;
}

// PATCH = edita campos e/ou substitui a lista de itens. Se o status virar
// "faturado" (e ainda não era), cria o lançamento correspondente no Financeiro.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireUser();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.proposal.findUnique({ where: { id }, include: { items: true } });
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};

  if (typeof body.clientName === "string" && body.clientName.trim()) data.clientName = body.clientName.trim();
  if (typeof body.status === "string" && STATUS_VALUES.includes(body.status)) data.status = body.status;
  if (body.validUntil === null) data.validUntil = null;
  else if (typeof body.validUntil === "string") data.validUntil = new Date(body.validUntil);
  if (typeof body.notes === "string") data.notes = body.notes.trim() || null;
  if (body.leadId === null) data.leadId = null;
  else if (typeof body.leadId === "string" && body.leadId) data.leadId = body.leadId;

  if (body.pdf) {
    try {
      data.pdfUrl = await savePdf(body.pdf);
    } catch (err) {
      return NextResponse.json({ error: String((err as Error).message ?? err) }, { status: 413 });
    }
  }

  const items: { description: string; value: number }[] | null = Array.isArray(body.items)
    ? body.items
        .map((i: any) => ({
          description: typeof i.description === "string" ? i.description.trim() : "",
          value: Number(i.value),
        }))
        .filter((i: { description: string; value: number }) => i.description && Number.isFinite(i.value) && i.value > 0)
    : null;

  const becameFaturado = existing.status !== "faturado" && data.status === "faturado";
  const finalItems = items ?? existing.items;
  if (becameFaturado && finalItems.length === 0) {
    return NextResponse.json({ error: "proposta sem itens não pode ser faturada" }, { status: 400 });
  }

  const [proposal] = await prisma.$transaction([
    prisma.proposal.update({
      where: { id },
      data: {
        ...data,
        ...(items
          ? { items: { deleteMany: {}, create: items.map((i, idx) => ({ description: i.description, value: Math.round(i.value), order: idx })) } }
          : {}),
      },
      include: { items: true },
    }),
    ...(becameFaturado
      ? [
          prisma.transaction.create({
            data: {
              type: "receita",
              description: `Proposta ${existing.number} — ${(data.clientName as string) ?? existing.clientName}`,
              value: Math.round(proposalTotal(finalItems)),
              category: "outro",
              method: "outro",
              status: "pago",
              leadId: (data.leadId as string | null) ?? existing.leadId,
            },
          }),
        ]
      : []),
  ]);

  return NextResponse.json({ ok: true, proposal });
}

// DELETE = remove a proposta (e os itens, em cascata). Não mexe em nenhuma
// Transaction já criada anteriormente — é um registro financeiro independente.
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireUser();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.proposal.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
