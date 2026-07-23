import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { exchangeCodeForTokens } from "@/lib/google-calendar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET = volta do consentimento do Google com ?code=...&state=...
export async function GET(req: NextRequest) {
  const session = await requireUser();
  const base = process.env.PUBLIC_PANEL_URL ?? req.nextUrl.origin;
  if (!session) return NextResponse.redirect(new URL("/login", base));

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const savedState = req.cookies.get("google_oauth_state")?.value;

  const fail = (reason: string) =>
    NextResponse.redirect(new URL(`/agenda?google_error=${reason}`, base));

  if (!code) return fail("no_code");
  if (!state || !savedState || state !== savedState) return fail("bad_state");

  try {
    await exchangeCodeForTokens(session.userId as string, code);
  } catch (err) {
    console.error("[google/callback] falha ao trocar code por tokens:", err);
    return fail("exchange_failed");
  }

  const res = NextResponse.redirect(new URL("/agenda?google_connected=1", base));
  res.cookies.delete("google_oauth_state");
  return res;
}
