import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { isAiGloballyEnabled, setAiGloballyEnabled } from "@/lib/ai/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET = estado atual do interruptor geral de IA.
export async function GET() {
  const session = await requireUser();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const enabled = await isAiGloballyEnabled();
  return NextResponse.json({ enabled });
}

// PATCH = liga/desliga. Body: { enabled: boolean }
export async function PATCH(req: Request) {
  const session = await requireUser();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  if (typeof body.enabled !== "boolean") {
    return NextResponse.json({ error: "informe enabled (boolean)" }, { status: 400 });
  }

  await setAiGloballyEnabled(body.enabled);
  return NextResponse.json({ ok: true, enabled: body.enabled });
}
