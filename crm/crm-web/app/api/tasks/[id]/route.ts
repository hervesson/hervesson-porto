import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// PATCH = alterna "done" e/ou edita título/prazo.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireUser();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};

  if (typeof body.done === "boolean") data.done = body.done;
  if (typeof body.title === "string" && body.title.trim()) data.title = body.title.trim();
  if (body.dueAt === null) data.dueAt = null;
  else if (typeof body.dueAt === "string" && body.dueAt) data.dueAt = new Date(body.dueAt);

  const task = await prisma.task.update({
    where: { id },
    data,
    include: { lead: { select: { id: true, name: true } } },
  });
  return NextResponse.json({ ok: true, task });
}

// DELETE = remove a tarefa.
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireUser();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.task.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
