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
import Link from "next/link";
import { STAGES } from "@/lib/stages";
import { formatPhone } from "@/lib/phone";

export type LeadCard = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  source: string;
  stage: string;
  aiPaused: boolean;
  summary: string | null;
  updatedAt: string;
  messages: { body: string; direction: string; createdAt: string }[];
  _count: { messages: number };
};

function Card({ lead }: { lead: LeadCard }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: lead.id });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;
  const last = lead.messages[0];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-surface-2 border border-line rounded-xl p-3 select-none ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2" {...listeners} {...attributes}>
        <div className="min-w-0">
          <p className="font-medium truncate">{lead.name ?? "Sem nome"}</p>
          <p className="text-xs text-muted truncate">{formatPhone(lead.phone)}</p>
        </div>
        {lead.aiPaused ? (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 shrink-0">
            Você
          </span>
        ) : (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand/15 text-brand shrink-0">
            IA
          </span>
        )}
      </div>

      {lead.summary && (
        <p className="text-xs text-muted mt-2 line-clamp-2">{lead.summary}</p>
      )}
      {last && (
        <p className="text-xs text-cream/70 mt-2 line-clamp-1">
          {last.direction === "in" ? "" : "→ "}
          {last.body}
        </p>
      )}

      <div className="flex items-center justify-between mt-2">
        <span className="text-[10px] text-muted">
          {lead._count.messages} msg · {sourceLabel(lead.source)}
        </span>
        <Link href={`/lead/${lead.id}`} className="text-[11px] text-brand hover:underline">
          abrir →
        </Link>
      </div>
    </div>
  );
}

function sourceLabel(s: string) {
  if (s === "whatsapp") return "WhatsApp";
  if (s === "site-form") return "Site";
  return "Manual";
}

function Column({
  stageKey,
  label,
  accent,
  leads,
}: {
  stageKey: string;
  label: string;
  accent: string;
  leads: LeadCard[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stageKey });
  return (
    <div className="w-72 shrink-0 flex flex-col">
      <div className="flex items-center gap-2 px-1 pb-2">
        <span className="w-2 h-2 rounded-full" style={{ background: accent }} />
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-muted">{leads.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-24 rounded-xl p-2 flex flex-col gap-2 border ${
          isOver ? "border-brand bg-surface/60" : "border-line/50 bg-surface/30"
        }`}
      >
        {leads.map((lead) => (
          <Card key={lead.id} lead={lead} />
        ))}
      </div>
    </div>
  );
}

export default function Board() {
  const [leads, setLeads] = useState<LeadCard[]>([]);
  const [loaded, setLoaded] = useState(false);
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

  if (!loaded) {
    return <div className="p-6 text-muted">Carregando leads…</div>;
  }

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-3 p-4 h-full min-h-0">
          {STAGES.map((s) => (
            <Column
              key={s.key}
              stageKey={s.key}
              label={s.label}
              accent={s.accent}
              leads={leads.filter((l) => l.stage === s.key)}
            />
          ))}
        </div>
      </div>
    </DndContext>
  );
}
