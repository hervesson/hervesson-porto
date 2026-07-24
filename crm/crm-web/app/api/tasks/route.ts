import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET = lista de tarefas (painel do Dashboard resolve a ordenação).
export async function GET() {
  const session = await requireUser();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const tasks = await prisma.task.findMany({
    include: { lead: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ tasks });
}

// POST = cria uma tarefa.
export async function POST(req: Request) {
  const session = await requireUser();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) return NextResponse.json({ error: "título é obrigatório" }, { status: 400 });

  const dueAt = typeof body.dueAt === "string" && body.dueAt ? new Date(body.dueAt) : null;
  const leadId = typeof body.leadId === "string" && body.leadId ? body.leadId : null;

  const task = await prisma.task.create({
    data: { title, dueAt, leadId },
    include: { lead: { select: { id: true, name: true } } },
  });
  return NextResponse.json({ ok: true, task });
}
