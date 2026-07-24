"use client";

import { useEffect, useState, useCallback } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
} from "@dnd-kit/core";
import { Plus, Clock } from "lucide-react";
import { STAGES, CLOSED_STAGES, STALE_DAYS, daysSince } from "@/lib/stages";
import { formatPhone } from "@/lib/phone";
import { originLabel } from "@/lib/lead-origin";
import { formatBRL } from "@/lib/money";
import NewLeadModal from "./new-lead-modal";
import LeadPanel from "./lead-panel";

export type LeadCard = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  company: string | null;
  value: number | null;
  tags: string[];
  source: string;
  stage: string;
  aiPaused: boolean;
  summary: string | null;
  createdAt: string;
  updatedAt: string;
  messages: { body: string; direction: string; createdAt: string }[];
  _count: { messages: number };
};

function Card({ lead, onOpen }: { lead: LeadCard; onOpen: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: lead.id });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;
  const last = lead.messages[0];
  const daysSinceContact = daysSince(last?.createdAt ?? lead.createdAt);
  const isStale = !CLOSED_STAGES.includes(lead.stage) && daysSinceContact >= STALE_DAYS;

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onOpen(lead.id)}
      className={`bg-surface-2 border border-line rounded-xl p-3 select-none cursor-pointer hover:border-brand/40 transition ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2" {...listeners} {...attributes}>
        <div className="min-w-0">
          <p className="font-medium truncate">{lead.name ?? "Sem nome"}</p>
          <p className="text-xs text-muted truncate">
            {lead.company ? lead.company : formatPhone(lead.phone)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {lead.aiPaused ? (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300">
              Você
            </span>
          ) : (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand/15 text-brand">
              IA
            </span>
          )}
          {isStale && (
            <span
              title={`Sem contato há ${daysSinceContact} dias`}
              className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-300"
            >
              <Clock size={10} /> {daysSinceContact}d
            </span>
          )}
        </div>
      </div>

      {lead.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {lead.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-1.5 py-0.5 rounded bg-surface border border-line text-muted"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {lead.summary && (
        <p className="text-xs text-muted mt-2 line-clamp-2">{lead.summary}</p>
      )}
      {last && last.body !== lead.summary && (
        <p className="text-xs text-cream/70 mt-2 line-clamp-1">
          {last.direction === "in" ? "" : "→ "}
          {last.body}
        </p>
      )}

      <div className="mt-2">
        <span className="text-[10px] text-muted">
          {lead.value ? `${formatBRL(lead.value)} · ` : ""}
          {lead._count.messages} msg · {originLabel(lead.source)}
        </span>
      </div>
    </div>
  );
}

function SourceBreakdown({ leads }: { leads: LeadCard[] }) {
  const counts = new Map<string, number>();
  for (const l of leads) counts.set(l.source, (counts.get(l.source) ?? 0) + 1);
  const rows = Array.from(counts.entries())
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);
  const max = Math.max(1, ...rows.map((r) => r.count));

  if (rows.length === 0) return null;

  return (
    <div className="mx-4 sm:mx-6 mb-3 bg-surface-2/40 border border-line/50 rounded-xl px-4 py-3 shrink-0">
      <p className="text-[11px] font-medium text-muted uppercase tracking-wide mb-2.5">
        Origem dos leads · {leads.length} no total
      </p>
      <div className="flex flex-col gap-1.5">
        {rows.map((r) => (
          <div
            key={r.source}
            className="flex items-center gap-3"
            title={`${r.count} lead${r.count === 1 ? "" : "s"}`}
          >
            <span className="w-20 shrink-0 text-xs text-muted truncate">{originLabel(r.source)}</span>
            <div className="flex-1 h-2 rounded-full bg-surface overflow-hidden">
              <div
                className="h-full bg-brand rounded-full"
                style={{ width: `${(r.count / max) * 100}%` }}
              />
            </div>
            <span className="w-6 shrink-0 text-xs text-right font-medium">{r.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Column({
  stageKey,
  label,
  accent,
  leads,
  onOpen,
}: {
  stageKey: string;
  label: string;
  accent: string;
  leads: LeadCard[];
  onOpen: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stageKey });
  return (
    <div className="w-72 shrink-0 flex flex-col min-h-0 h-full">
      <div className="flex items-center gap-2 px-1 pb-2 shrink-0">
        <span className="w-2 h-2 rounded-full" style={{ background: accent }} />
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-muted">{leads.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-24 overflow-y-auto rounded-xl p-2 flex flex-col gap-2 border ${
          isOver ? "border-brand bg-surface/60" : "border-line/50 bg-surface/30"
        }`}
      >
        {leads.map((lead) => (
          <Card key={lead.id} lead={lead} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
}

export default function Board() {
  const [leads, setLeads] = useState<LeadCard[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [openLeadId, setOpenLeadId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const load = useCallback(async () => {
    const res = await fetch("/api/leads", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setLeads(data.leads);
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 5000); // polling — realtime simples
    return () => clearInterval(t);
  }, [load]);

  async function onDragEnd(e: DragEndEvent) {
    const leadId = String(e.active.id);
    const stage = e.over ? String(e.over.id) : null;
    if (!stage) return;
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.stage === stage) return;

    // otimista
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, stage } : l)),
    );
    await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage }),
    });
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">CRM</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 bg-brand text-brand-ink text-sm font-medium rounded-lg px-3 py-2 hover:opacity-90 transition"
        >
          <Plus size={16} /> Novo lead
        </button>
      </div>

      {!loaded ? (
        <div className="p-6 text-muted">Carregando leads…</div>
      ) : (
        <>
        <SourceBreakdown leads={leads} />
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <div className="flex-1 min-h-0 overflow-x-auto">
            <div className="flex gap-3 p-4 h-full min-h-0">
              {STAGES.map((s) => (
                <Column
                  key={s.key}
                  stageKey={s.key}
                  label={s.label}
                  accent={s.accent}
                  leads={leads.filter((l) => l.stage === s.key)}
                  onOpen={setOpenLeadId}
                />
              ))}
            </div>
          </div>
        </DndContext>
        </>
      )}

      {modalOpen && (
        <NewLeadModal onClose={() => setModalOpen(false)} onCreated={load} />
      )}

      {openLeadId && (
        <LeadPanel
          leadId={openLeadId}
          onClose={() => setOpenLeadId(null)}
          onUpdated={load}
        />
      )}
    </div>
  );
}
