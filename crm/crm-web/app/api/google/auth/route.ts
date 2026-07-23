import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { requireUser } from "@/lib/session";
import { getAuthUrl } from "@/lib/google-calendar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET = inicia o fluxo OAuth do Google — redireciona pro consentimento.
export async function GET() {
  const session = await requireUser();
  if (!session) return NextResponse.redirect(new URL("/login", process.env.PUBLIC_PANEL_URL));

  const state = randomBytes(16).toString("hex");
  const res = NextResponse.redirect(getAuthUrl(state));
  res.cookies.set("google_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 min — só precisa sobreviver até o callback voltar
  });
  return res;
}
