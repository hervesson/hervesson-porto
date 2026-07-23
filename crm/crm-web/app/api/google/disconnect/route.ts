import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { disconnectGoogle } from "@/lib/google-calendar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const session = await requireUser();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await disconnectGoogle(session.userId as string);
  return NextResponse.json({ ok: true });
}
