import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TYPES = ["receita", "despesa"];
const METHOD_VALUES = ["pix", "cartao", "boleto", "transferencia", "dinheiro", "outro"];
const STATUS_VALUES = ["pago", "pendente", "atrasado"];

// GET = lista de lançamentos, mais recentes primeiro.
export async function GET() {
  const session = await requireUser();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const transactions = await prisma.transaction.findMany({
    orderBy: { date: "desc" },
  });
  return NextResponse.json({ transactions });
}

// POST = cria um lançamento (receita ou despesa).
export async function POST(req: Request) {
  const session = await requireUser();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { description, value, category, method, status, type, leadId, date } = body;

  if (!TYPES.includes(type)) {
    return NextResponse.json({ error: "type inválido" }, { status: 400 });
  }
  if (typeof description !== "string" || !description.trim()) {
    return NextResponse.json({ error: "descrição é obrigatória" }, { status: 400 });
  }
  const numValue = Number(value);
  if (!Number.isFinite(numValue) || numValue <= 0) {
    return NextResponse.json({ error: "valor inválido" }, { status: 400 });
  }
  if (typeof method !== "string" || !METHOD_VALUES.includes(method)) {
    return NextResponse.json({ error: "método inválido" }, { status: 400 });
  }
  const finalStatus = STATUS_VALUES.includes(status) ? status : "pago";

  const transaction = await prisma.transaction.create({
    data: {
      type,
      description: description.trim(),
      value: Math.round(numValue),
      category: typeof category === "string" ? category : "outro",
      method,
      status: finalStatus,
      date: date ? new Date(date) : new Date(),
      leadId: typeof leadId === "string" && leadId ? leadId : null,
    },
  });

  return NextResponse.json({ ok: true, transaction });
}
