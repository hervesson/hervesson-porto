import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET = últimas notificações + contagem de não lidas.
export async function GET() {
  const session = await requireUser();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.notification.count({ where: { read: false } }),
  ]);

  return NextResponse.json({ notifications, unreadCount });
}

// PATCH = marca como lida. Body: { id } (uma) ou { all: true } (todas).
export async function PATCH(req: Request) {
  const session = await requireUser();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  if (body.all === true) {
    await prisma.notification.updateMany({ where: { read: false }, data: { read: true } });
    return NextResponse.json({ ok: true });
  }

  if (typeof body.id === "string" && body.id) {
    await prisma.notification.update({ where: { id: body.id }, data: { read: true } });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "informe id ou all" }, { status: 400 });
}
