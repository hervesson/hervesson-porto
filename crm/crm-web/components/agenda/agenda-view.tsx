"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, CalendarOff, User as UserIcon } from "lucide-react";
import type { MergedEvent } from "@/lib/agenda";
import { formatTime } from "@/lib/relative-time";
import EventModal from "./event-modal";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTH_LABEL = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });
const DAY_LABEL = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function startOfGrid(d: Date) {
  const first = startOfMonth(d);
  const grid = new Date(first);
  grid.setDate(grid.getDate() - first.getDay());
  return grid;
}

export default function AgendaView() {
  const searchParams = useSearchParams();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [events, setEvents] = useState<MergedEvent[]>([]);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<MergedEvent | undefined>(undefined);
  const [prefilledDate, setPrefilledDate] = useState<string | undefined>(undefined);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("google_connected")) setNotice("Google Agenda conectado.");
    if (searchParams.get("google_error")) setNotice("Não deu pra conectar o Google Agenda — tenta de novo.");
  }, [searchParams]);

  const gridStart = useMemo(() => startOfGrid(month), [month]);
  const gridDays = useMemo(
    () => Array.from({ length: 42 }, (_, i) => new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i)),
    [gridStart],
  );

  const load = useCallback(async () => {
    const from = gridStart.toISOString();
    const to = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + 42).toISOString();
    const res = await fetch(`/api/events?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      setEvents(data.events);
      setGoogleConnected(data.googleConnected);
      setLoaded(true);
    }
  }, [gridStart]);

  useEffect(() => {
    load();
  }, [load]);

  function openNew(date?: Date) {
    setEditingEvent(undefined);
    setPrefilledDate(date ? date.toISOString().slice(0, 10) : undefined);
    setModalOpen(true);
  }
  function openEdit(ev: MergedEvent) {
    if (ev.source !== "local") return; // eventos só-do-Google não são editáveis aqui
    setEditingEvent(ev);
    setPrefilledDate(undefined);
    setModalOpen(true);
  }

  const upcoming = useMemo(() => {
    const now = new Date();
    return events.filter((e) => new Date(e.endAt) >= now).slice(0, 15);
  }, [events]);

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-lg font-semibold">Agenda</h1>
          <p className="text-sm text-muted mt-0.5">
            {googleConnected
              ? "Sincronizada com o Google Agenda — clique em um dia pra agendar."
              : "Conecte o Google Agenda pra sincronizar de verdade."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {googleConnected ? (
            <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border border-emerald-500/30 text-emerald-300 bg-emerald-500/10">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Google conectado
            </span>
          ) : (
            <a
              href="/api/google/auth"
              className="text-xs px-2.5 py-1.5 rounded-lg border border-line text-muted hover:text-cream hover:border-brand/50 transition"
            >
              Conectar Google Agenda
            </a>
          )}
          <button
            onClick={() => openNew()}
            className="flex items-center gap-1.5 bg-brand text-brand-ink text-sm font-medium rounded-lg px-3 py-2 hover:opacity-90 transition"
          >
            <Plus size={16} /> Novo evento
          </button>
        </div>
      </div>

      {notice && (
        <div className="text-sm bg-surface-2 border border-line rounded-lg px-3 py-2 text-muted flex items-center justify-between">
          {notice}
          <button onClick={() => setNotice(null)} className="text-muted hover:text-cream">
            ✕
          </button>
        </div>
      )}

      <div className="bg-surface border border-line rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium capitalize">{MONTH_LABEL.format(month)}</p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:text-cream hover:bg-surface-2 transition"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setMonth(startOfMonth(new Date()))}
              className="text-xs px-2.5 py-1.5 rounded-lg text-muted hover:text-cream hover:bg-surface-2 transition"
            >
              Hoje
            </button>
            <button
              onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:text-cream hover:bg-surface-2 transition"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted uppercase tracking-wide mb-1">
          {WEEKDAYS.map((w) => (
            <span key={w}>{w}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {gridDays.map((day) => {
            const inMonth = day.getMonth() === month.getMonth();
            const isToday = sameDay(day, new Date());
            const dayEvents = events
              .filter((e) => sameDay(new Date(e.startAt), day))
              .sort((a, b) => a.startAt.localeCompare(b.startAt));
            const visible = dayEvents.slice(0, 3);
            const overflow = dayEvents.length - visible.length;

            return (
              <button
                key={day.toISOString()}
                onClick={() => openNew(day)}
                className={`h-24 overflow-hidden text-left rounded-lg p-1.5 border transition flex flex-col gap-1 ${
                  inMonth ? "border-line/50 bg-surface-2/40 hover:border-brand/40" : "border-line/20 bg-transparent opacity-40"
                }`}
              >
                <span className={`text-xs ${isToday ? "text-brand font-semibold" : "text-muted"}`}>{day.getDate()}</span>
                {visible.map((e) => (
                  <span
                    key={e.id}
                    onClick={(ev) => {
                      ev.stopPropagation();
                      openEdit(e);
                    }}
                    title={e.title}
                    className={`text-[10px] px-1.5 py-0.5 rounded truncate ${
                      e.googleMissing
                        ? "bg-red-500/10 text-red-300 line-through"
                        : e.source === "google"
                          ? "bg-surface text-muted border border-line"
                          : "bg-brand/15 text-brand"
                    }`}
                  >
                    {formatTime(e.startAt)} {e.title}
                  </span>
                ))}
                {overflow > 0 && <span className="text-[10px] text-muted">+{overflow} mais</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-surface border border-line rounded-xl overflow-hidden">
        <p className="text-xs font-medium text-muted uppercase tracking-wide px-4 py-3 border-b border-line">
          Próximos compromissos
        </p>
        {!loaded ? (
          <p className="p-6 text-sm text-muted">Carregando…</p>
        ) : upcoming.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center gap-2">
            <CalendarOff size={28} className="text-muted" />
            <p className="text-sm text-muted max-w-sm mx-auto">Nenhum compromisso à vista.</p>
          </div>
        ) : (
          <div className="divide-y divide-line">
            {upcoming.map((e) => (
              <button
                key={e.id}
                onClick={() => openEdit(e)}
                disabled={e.source !== "local"}
                className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-surface-2/60 transition disabled:cursor-default"
              >
                <div className="w-16 shrink-0">
                  <p className="text-xs text-muted capitalize">{DAY_LABEL.format(new Date(e.startAt))}</p>
                  <p className="text-sm font-medium">{formatTime(e.startAt)}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm truncate ${e.googleMissing ? "line-through text-muted" : ""}`}>{e.title}</p>
                  {e.leadName && (
                    <p className="text-xs text-muted truncate flex items-center gap-1">
                      <UserIcon size={11} /> {e.leadName}
                    </p>
                  )}
                </div>
                {e.source === "google" && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-2 border border-line text-muted shrink-0">
                    Google
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <EventModal
          event={editingEvent}
          initialDate={prefilledDate}
          onClose={() => setModalOpen(false)}
          onSaved={load}
          onDeleted={load}
        />
      )}
    </div>
  );
}
