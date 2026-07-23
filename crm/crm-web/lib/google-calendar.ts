import { prisma } from "@/lib/db";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? "";
const SCOPE = "https://www.googleapis.com/auth/calendar.events";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const CALENDAR_BASE = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

function redirectUri(): string {
  const panelUrl = process.env.PUBLIC_PANEL_URL ?? "http://localhost:3000";
  return `${panelUrl}/api/google/callback`;
}

// Distingue "token morto de vez" (precisa reconectar) de falha passageira
// (rede, 5xx do Google) — quem chama decide o que fazer com cada caso.
export class GoogleAuthError extends Error {
  reason: "not_connected" | "invalid_grant";
  constructor(reason: "not_connected" | "invalid_grant") {
    super(`google auth: ${reason}`);
    this.reason = reason;
  }
}

export function getAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: SCOPE,
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `${AUTH_URL}?${params.toString()}`;
}

async function tokenRequest(body: Record<string, string>) {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body).toString(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (data?.error === "invalid_grant") throw new GoogleAuthError("invalid_grant");
    throw new Error(`google token endpoint -> ${res.status} ${JSON.stringify(data)}`);
  }
  return data as { access_token: string; refresh_token?: string; expires_in: number };
}

// Troca o "code" do callback pelos tokens e já grava no User.
export async function exchangeCodeForTokens(userId: string, code: string): Promise<void> {
  const data = await tokenRequest({
    code,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    redirect_uri: redirectUri(),
    grant_type: "authorization_code",
  });
  await prisma.user.update({
    where: { id: userId },
    data: {
      googleAccessToken: data.access_token,
      googleRefreshToken: data.refresh_token, // só vem na 1ª autorização (prompt=consent garante isso)
      googleTokenExpiry: new Date(Date.now() + data.expires_in * 1000),
    },
  });
}

export async function disconnectGoogle(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { googleAccessToken: null, googleRefreshToken: null, googleTokenExpiry: null },
  });
}

export async function isGoogleConnected(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { googleRefreshToken: true } });
  return Boolean(user?.googleRefreshToken);
}

// Evita duas chamadas de refresh simultâneas — só funciona porque esse app
// roda num container único (sem réplica). Se um dia isso mudar pra múltiplas
// instâncias, precisa virar um lock no banco.
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(userId: string, refreshToken: string): Promise<string> {
  try {
    const data = await tokenRequest({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    });
    await prisma.user.update({
      where: { id: userId },
      data: {
        googleAccessToken: data.access_token,
        googleTokenExpiry: new Date(Date.now() + data.expires_in * 1000),
      },
    });
    return data.access_token;
  } catch (err) {
    if (err instanceof GoogleAuthError && err.reason === "invalid_grant") {
      // token revogado de vez — limpa pra UI parar de tentar e mostrar "reconectar"
      await disconnectGoogle(userId);
    }
    throw err;
  }
}

async function getValidAccessToken(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { googleAccessToken: true, googleRefreshToken: true, googleTokenExpiry: true },
  });
  if (!user?.googleRefreshToken) throw new GoogleAuthError("not_connected");

  const expiringSoon =
    !user.googleTokenExpiry || user.googleTokenExpiry.getTime() - Date.now() < 5 * 60 * 1000;
  if (!expiringSoon && user.googleAccessToken) return user.googleAccessToken;

  if (!refreshPromise) {
    refreshPromise = refreshAccessToken(userId, user.googleRefreshToken).finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function googleFetch(userId: string, url: string, init?: RequestInit): Promise<any> {
  let token = await getValidAccessToken(userId);
  let res = await fetch(url, {
    ...init,
    headers: { ...(init?.headers ?? {}), Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (res.status === 401) {
    // proteção reativa — token pode ter caído fora de validade entre a
    // checagem proativa e essa chamada; tenta 1 refresh forçado e repete.
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { googleRefreshToken: true } });
    if (!user?.googleRefreshToken) throw new GoogleAuthError("not_connected");
    token = await refreshAccessToken(userId, user.googleRefreshToken);
    res = await fetch(url, {
      ...init,
      headers: { ...(init?.headers ?? {}), Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      cache: "no-store",
    });
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`google calendar -> ${res.status} ${text}`);
  }
  return res.json().catch(() => ({}));
}

export type GoogleEventPayload = {
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  attendees?: { email: string }[];
};

export async function listEvents(userId: string, timeMin: string, timeMax: string) {
  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "250",
  });
  const data = await googleFetch(userId, `${CALENDAR_BASE}?${params.toString()}`);
  return data.items ?? [];
}

export async function insertEvent(
  userId: string,
  payload: GoogleEventPayload,
  sendUpdates: "all" | "none",
) {
  return googleFetch(userId, `${CALENDAR_BASE}?sendUpdates=${sendUpdates}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function patchEvent(
  userId: string,
  googleEventId: string,
  payload: Partial<GoogleEventPayload>,
  sendUpdates: "all" | "none",
) {
  return googleFetch(userId, `${CALENDAR_BASE}/${googleEventId}?sendUpdates=${sendUpdates}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteEvent(userId: string, googleEventId: string, sendUpdates: "all" | "none") {
  try {
    await googleFetch(userId, `${CALENDAR_BASE}/${googleEventId}?sendUpdates=${sendUpdates}`, {
      method: "DELETE",
    });
  } catch (err) {
    // 410/404 = já não existe no Google (apagado por lá antes) — não é erro pro nosso fluxo
    if (err instanceof Error && /-> (404|410)/.test(err.message)) return;
    throw err;
  }
}
