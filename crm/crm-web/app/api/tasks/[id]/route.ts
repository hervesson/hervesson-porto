import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { PRIORITY_VALUES } from "@/lib/tasks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// PATCH = alterna "done" e/ou edita título/prazo/urgência/lead vinculado.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireUser();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};

  if (typeof body.done === "boolean") {
    data.done = body.done;
    // completedAt é dedicado — não dá pra inferir de updatedAt (esse atualiza
    // em qualquer edição, não só quando a tarefa é concluída).
    data.completedAt = body.done ? new Date() : null;
  }
  if (typeof body.title === "string" && body.title.trim()) data.title = body.title.trim();
  if (typeof body.priority === "string" && PRIORITY_VALUES.includes(body.priority)) data.priority = body.priority;
  if (body.dueAt === null) data.dueAt = null;
  else if (typeof body.dueAt === "string" && body.dueAt) data.dueAt = new Date(body.dueAt);
  if (body.leadId === null) data.leadId = null;
  else if (typeof body.leadId === "string" && body.leadId) data.leadId = body.leadId;

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
