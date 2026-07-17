// Client REST da Evolution API. Doc: https://doc.evolution-api.com/v2
const BASE = process.env.EVOLUTION_API_URL ?? "http://evolution-api:8080";
const KEY = process.env.EVOLUTION_API_KEY ?? "";
const INSTANCE = process.env.EVOLUTION_INSTANCE ?? "hervesson";

async function ev(path: string, init?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      apikey: KEY,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Evolution ${path} -> ${res.status} ${text}`);
  }
  return res.json().catch(() => ({}));
}

// Envia texto. `phone` = só dígitos com DDI (ex: 5598988958835).
export async function sendText(phone: string, text: string) {
  return ev(`/message/sendText/${INSTANCE}`, {
    method: "POST",
    body: JSON.stringify({ number: phone, text }),
  });
}

// Estado da conexão da instância ("open" = conectado).
export async function connectionState(): Promise<string> {
  try {
    const data = await ev(`/instance/connectionState/${INSTANCE}`);
    return data?.instance?.state ?? data?.state ?? "unknown";
  } catch {
    return "offline";
  }
}
