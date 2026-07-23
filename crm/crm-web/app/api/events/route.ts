import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { mergeEvents, decideSendUpdates, SAO_PAULO_TZ } from "@/lib/agenda";
import { listEvents, insertEvent, isGoogleConnected, GoogleAuthError } from "@/lib/google-calendar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET = eventos locais + eventos do Google mesclados, no intervalo [from, to).
export async function GET(req: Request) {
  const session = await requireUser();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  if (!from || !to) {
    return NextResponse.json({ error: "informe from e to" }, { status: 400 });
  }

  const localEvents = await prisma.event.findMany({
    where: { startAt: { gte: new Date(from), lt: new Date(to) } },
    include: { lead: { select: { id: true, name: true } } },
    orderBy: { startAt: "asc" },
  });

  const googleConnected = await isGoogleConnected(session.userId as string);
  let googleEvents: any[] = [];
  if (googleConnected) {
    try {
      googleEvents = await listEvents(session.userId as string, from, to);
    } catch (err) {
      // se o Google falhar (rede, token morto), ainda devolve os eventos
      // locais — a agenda não pode ficar refém do Google estar no ar
      console.error("[events] falha ao buscar eventos do Google:", err);
    }
  }

  return NextResponse.json({
    events: mergeEvents(localEvents, googleEvents),
    googleConnected,
  });
}

// POST = cria um evento local e tenta empurrar pro Google (best-effort).
export async function POST(req: Request) {
  const session = await requireUser();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() || null : null;
  const leadId = typeof body.leadId === "string" && body.leadId ? body.leadId : null;
  const startAt = body.startAt ? new Date(body.startAt) : null;
  const endAt = body.endAt ? new Date(body.endAt) : null;

  if (!title) return NextResponse.json({ error: "título é obrigatório" }, { status: 400 });
  if (!startAt || !endAt || Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
    return NextResponse.json({ error: "data/hora inválida" }, { status: 400 });
  }
  if (endAt <= startAt) {
    return NextResponse.json({ error: "horário final precisa ser depois do inicial" }, { status: 400 });
  }

  const lead = leadId ? await prisma.lead.findUnique({ where: { id: leadId } }) : null;

  const event = await prisma.event.create({
    data: { title, description, startAt, endAt, leadId: lead?.id ?? null },
  });

  let googleSynced = false;
  try {
    const userId = session.userId as string;
    if (await isGoogleConnected(userId)) {
      const created = await insertEvent(
        userId,
        {
          summary: title,
          description: description ?? undefined,
          start: { dateTime: startAt.toISOString(), timeZone: SAO_PAULO_TZ },
          end: { dateTime: endAt.toISOString(), timeZone: SAO_PAULO_TZ },
          attendees: lead?.email ? [{ email: lead.email }] : undefined,
        },
        decideSendUpdates(lead),
      );
      await prisma.event.update({ where: { id: event.id }, data: { googleEventId: created.id } });
      googleSynced = true;
    }
  } catch (err) {
    if (!(err instanceof GoogleAuthError)) console.error("[events] falha ao criar no Google:", err);
  }

  return NextResponse.json({ ok: true, event, googleSynced });
}
