import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import type { Stage } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STAGES: Stage[] = [
  "NOVO",
  "QUALIFICANDO",
  "QUALIFICADO",
  "PROPOSTA",
  "FECHADO",
  "PERDIDO",
];

// GET = lead + thread completa
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireUser();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!lead) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ lead });
}

// PATCH = atualiza stage / ordem / aiPaused / nome / nota
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireUser();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};

  if (typeof body.stage === "string" && STAGES.includes(body.stage as Stage)) {
    data.stage = body.stage;
  }
  if (typeof body.order === "number") data.order = body.order;
  if (typeof body.aiPaused === "boolean") data.aiPaused = body.aiPaused;
  if (typeof body.name === "string") data.name = body.name.trim() || null;
  if (typeof body.note === "string") data.note = body.note;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "nada para atualizar" }, { status: 400 });
  }

  const lead = await prisma.lead.update({ where: { id }, data });
  return NextResponse.json({ ok: true, lead });
}
