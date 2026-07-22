import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { normalizePhone } from "@/lib/phone";
import { ORIGINS } from "@/lib/lead-origin";
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
const ORIGIN_VALUES: readonly string[] = ORIGINS.map((o) => o.value);
const HEALTH_VALUES = ["otimo", "bom", "atencao", "risco"];
const BILLING_TYPE_VALUES = ["projeto", "retainer"];

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

// PATCH = atualiza qualquer campo editável do lead (ficha do painel lateral)
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
  if (typeof body.company === "string") data.company = body.company.trim() || null;
  if (typeof body.position === "string") data.position = body.position.trim() || null;
  if (typeof body.email === "string") data.email = body.email.trim() || null;
  if (typeof body.phone === "string") {
    data.phone = body.phone.trim() ? normalizePhone(body.phone.trim()) : null;
  }
  if (body.value === null) data.value = null;
  else if (typeof body.value === "number") data.value = Math.round(body.value);
  if (Array.isArray(body.tags)) {
    data.tags = body.tags.map((t: unknown) => String(t).trim()).filter(Boolean);
  }
  if (typeof body.source === "string" && ORIGIN_VALUES.includes(body.source)) {
    data.source = body.source;
  }
  if (body.markRead === true) data.lastReadAt = new Date();
  if (body.mrr === null) data.mrr = null;
  else if (typeof body.mrr === "number") data.mrr = Math.round(body.mrr);
  if (typeof body.health === "string" && HEALTH_VALUES.includes(body.health)) {
    data.health = body.health;
  }
  if (typeof body.billingType === "string" && BILLING_TYPE_VALUES.includes(body.billingType)) {
    data.billingType = body.billingType;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "nada para atualizar" }, { status: 400 });
  }

  // primeira vez que vira retainer — começa a contar a permanência como cliente
  if (data.stage === "FECHADO" || data.billingType === "retainer") {
    const current = await prisma.lead.findUnique({
      where: { id },
      select: { billingType: true, clientSince: true },
    });
    const billingType = (data.billingType as string | undefined) ?? current?.billingType;
    if (current && billingType === "retainer" && !current.clientSince) {
      data.clientSince = new Date();
    }
  }

  const lead = await prisma.lead.update({ where: { id }, data });
  return NextResponse.json({ ok: true, lead });
}

// DELETE = remove o lead (e as mensagens, em cascata)
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireUser();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.lead.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
