import type { Event as DbEvent, Lead } from "@prisma/client";

export const SAO_PAULO_TZ = "America/Sao_Paulo";

export type MergedEvent = {
  id: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string;
  allDay: boolean;
  leadId: string | null;
  leadName: string | null;
  source: "local" | "google";
  googleMissing: boolean;
};

// Evento cru do Google (start/end podem vir como dateTime OU date, nunca os dois)
type RawGoogleEvent = {
  id: string;
  status?: string;
  summary?: string;
  description?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
};

// end.date do Google é EXCLUSIVO (evento de 1 dia inteiro em 21/07 vem com
// end.date = "2026-07-22") — normaliza subtraindo 1 dia só nesse caso.
function normalizeGoogleEvent(raw: RawGoogleEvent): { startAt: string; endAt: string; allDay: boolean } | null {
  if (raw.start?.dateTime && raw.end?.dateTime) {
    return { startAt: raw.start.dateTime, endAt: raw.end.dateTime, allDay: false };
  }
  if (raw.start?.date && raw.end?.date) {
    const end = new Date(raw.end.date + "T00:00:00");
    end.setDate(end.getDate() - 1);
    return { startAt: raw.start.date + "T00:00:00", endAt: end.toISOString().slice(0, 19), allDay: true };
  }
  return null;
}

// Junta os eventos locais (do CRM) com os que vieram ao vivo do Google pro
// mesmo intervalo. Local com googleEventId que sumiu do Google = apagado
// por lá (marca, não apaga sozinho). Só no Google = criado fora do CRM,
// mostra como somente-leitura.
export function mergeEvents(
  localEvents: (DbEvent & { lead: Pick<Lead, "id" | "name"> | null })[],
  googleEvents: RawGoogleEvent[],
): MergedEvent[] {
  const googleIds = new Set(googleEvents.map((g) => g.id));
  const localGoogleIds = new Set(localEvents.map((e) => e.googleEventId).filter(Boolean));

  const fromLocal: MergedEvent[] = localEvents.map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    startAt: e.startAt.toISOString(),
    endAt: e.endAt.toISOString(),
    allDay: false,
    leadId: e.leadId,
    leadName: e.lead?.name ?? null,
    source: "local",
    googleMissing: Boolean(e.googleEventId) && !googleIds.has(e.googleEventId as string),
  }));

  const fromGoogleOnly: MergedEvent[] = googleEvents
    .filter((g) => g.status !== "cancelled" && !localGoogleIds.has(g.id))
    .map((g): MergedEvent | null => {
      const norm = normalizeGoogleEvent(g);
      if (!norm) return null;
      return {
        id: `google:${g.id}`,
        title: g.summary || "(sem título)",
        description: g.description ?? null,
        startAt: norm.startAt,
        endAt: norm.endAt,
        allDay: norm.allDay,
        leadId: null,
        leadName: null,
        source: "google",
        googleMissing: false,
      };
    })
    .filter((e): e is MergedEvent => e !== null);

  return [...fromLocal, ...fromGoogleOnly].sort((a, b) => a.startAt.localeCompare(b.startAt));
}

// Convida o lead por e-mail automaticamente sempre que ele tiver e-mail
// cadastrado (decisão do usuário — sem checkbox por evento na v1).
export function decideSendUpdates(lead: Pick<Lead, "email"> | null): "all" | "none" {
  return lead?.email ? "all" : "none";
}
