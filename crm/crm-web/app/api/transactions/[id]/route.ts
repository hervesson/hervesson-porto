import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUS_VALUES = ["pago", "pendente", "atrasado"];

// PATCH = atualiza um lançamento (hoje, principalmente o status)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireUser();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};

  if (typeof body.status === "string" && STATUS_VALUES.includes(body.status)) {
    data.status = body.status;
  }
  if (typeof body.description === "string") data.description = body.description.trim();
  if (typeof body.value === "number" && body.value > 0) data.value = Math.round(body.value);

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "nada para atualizar" }, { status: 400 });
  }

  const transaction = await prisma.transaction.update({ where: { id }, data });
  return NextResponse.json({ ok: true, transaction });
}

// DELETE = remove um lançamento
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireUser();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.transaction.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
