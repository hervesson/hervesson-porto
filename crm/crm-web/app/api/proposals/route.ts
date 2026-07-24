import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { STATUS_VALUES, computeStats, formatProposalNumber } from "@/lib/proposals";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET = lista de propostas + indicadores.
export async function GET() {
  const session = await requireUser();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const proposals = await prisma.proposal.findMany({
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ proposals, stats: computeStats(proposals) });
}

// POST = cria uma proposta com os itens.
export async function POST(req: Request) {
  const session = await requireUser();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const clientName = typeof body.clientName === "string" ? body.clientName.trim() : "";
  const leadId = typeof body.leadId === "string" && body.leadId ? body.leadId : null;
  const validUntil = body.validUntil ? new Date(body.validUntil) : null;
  const notes = typeof body.notes === "string" ? body.notes.trim() || null : null;
  const status = typeof body.status === "string" && STATUS_VALUES.includes(body.status) ? body.status : "rascunho";
  const items: { description: string; value: number }[] = Array.isArray(body.items)
    ? body.items
        .map((i: any) => ({
          description: typeof i.description === "string" ? i.description.trim() : "",
          value: Number(i.value),
        }))
        .filter((i: { description: string; value: number }) => i.description && Number.isFinite(i.value) && i.value > 0)
    : [];

  if (!clientName) {
    return NextResponse.json({ error: "nome do cliente é obrigatório" }, { status: 400 });
  }
  if (items.length === 0) {
    return NextResponse.json({ error: "adicione ao menos 1 item" }, { status: 400 });
  }

  const year = new Date().getFullYear();
  const countThisYear = await prisma.proposal.count({
    where: { createdAt: { gte: new Date(`${year}-01-01`), lt: new Date(`${year + 1}-01-01`) } },
  });
  const number = formatProposalNumber(year, countThisYear + 1);

  const proposal = await prisma.proposal.create({
    data: {
      number,
      clientName,
      leadId,
      status,
      validUntil,
      notes,
      items: {
        create: items.map((i, idx) => ({ description: i.description, value: Math.round(i.value), order: idx })),
      },
    },
    include: { items: true },
  });

  return NextResponse.json({ ok: true, proposal });
}
