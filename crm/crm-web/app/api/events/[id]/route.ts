import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { decideSendUpdates, SAO_PAULO_TZ } from "@/lib/agenda";
import { insertEvent, patchEvent, deleteEvent, isGoogleConnected, GoogleAuthError } from "@/lib/google-calendar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// PATCH = atualiza um evento local e reflete no Google (best-effort).
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireUser();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.event.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  if (typeof body.title === "string" && body.title.trim()) data.title = body.title.trim();
  if (typeof body.description === "string") data.description = body.description.trim() || null;
  if (body.leadId === null) data.leadId = null;
  else if (typeof body.leadId === "string" && body.leadId) data.leadId = body.leadId;
  if (body.startAt) data.startAt = new Date(body.startAt);
  if (body.endAt) data.endAt = new Date(body.endAt);

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "nada para atualizar" }, { status: 400 });
  }

  const event = await prisma.event.update({ where: { id }, data });
  const lead = event.leadId ? await prisma.lead.findUnique({ where: { id: event.leadId } }) : null;

  let googleSynced = false;
  try {
    const userId = session.userId as string;
    if (await isGoogleConnected(userId)) {
      const payload = {
        summary: event.title,
        description: event.description ?? undefined,
        start: { dateTime: event.startAt.toISOString(), timeZone: SAO_PAULO_TZ },
        end: { dateTime: event.endAt.toISOString(), timeZone: SAO_PAULO_TZ },
        attendees: lead?.email ? [{ email: lead.email }] : undefined,
      };
      if (event.googleEventId) {
        await patchEvent(userId, event.googleEventId, payload, decideSendUpdates(lead));
        googleSynced = true;
      } else {
        // ainda não tinha sido criado no Google (ex.: foi conectado depois) — cria agora
        const created = await insertEvent(userId, payload, decideSendUpdates(lead));
        await prisma.event.update({ where: { id: event.id }, data: { googleEventId: created.id } });
        googleSynced = true;
      }
    }
  } catch (err) {
    if (!(err instanceof GoogleAuthError)) console.error("[events] falha ao atualizar no Google:", err);
  }

  return NextResponse.json({ ok: true, event, googleSynced });
}

// DELETE = remove o evento local e tenta remover do Google também.
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireUser();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.event.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });

  if (existing.googleEventId) {
    try {
      const userId = session.userId as string;
      if (await isGoogleConnected(userId)) {
        await deleteEvent(userId, existing.googleEventId, "all");
      }
    } catch (err) {
      if (!(err instanceof GoogleAuthError)) console.error("[events] falha ao apagar no Google:", err);
    }
  }

  await prisma.event.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
