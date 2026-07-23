"use client";

import { useEffect, useState } from "react";
import { X, Trash2 } from "lucide-react";
import type { MergedEvent } from "@/lib/agenda";

const inputClass =
  "bg-surface-2 border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-brand w-full";
const labelClass = "text-xs text-muted";

type LeadOption = { id: string; name: string | null; phone: string | null };

function toDateInput(iso: string) {
  return iso.slice(0, 10);
}
function toTimeInput(iso: string) {
  return new Date(iso).toTimeString().slice(0, 5);
}

export default function EventModal({
  event,
  initialDate,
  onClose,
  onSaved,
  onDeleted,
}: {
  event?: MergedEvent;
  initialDate?: string;
  onClose: () => void;
  onSaved: () => void;
  onDeleted?: () => void;
}) {
  const isEdit = Boolean(event && event.source === "local");
  const [title, setTitle] = useState(event?.title ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [date, setDate] = useState(event ? toDateInput(event.startAt) : initialDate ?? "");
  const [startTime, setStartTime] = useState(event ? toTimeInput(event.startAt) : "09:00");
  const [endTime, setEndTime] = useState(event ? toTimeInput(event.endAt) : "10:00");
  const [leadId, setLeadId] = useState(event?.leadId ?? "");
  const [leads, setLeads] = useState<LeadOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/leads", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setLeads(data.leads));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Informe um título.");
      return;
    }
    if (!date) {
      setError("Informe a data.");
      return;
    }
    const startAt = new Date(`${date}T${startTime}:00`);
    const endAt = new Date(`${date}T${endTime}:00`);
    if (endAt <= startAt) {
      setError("O horário final precisa ser depois do inicial.");
      return;
    }
    setError("");
    setSubmitting(true);

    const payload = {
      title: title.trim(),
      description: description.trim(),
      leadId: leadId || null,
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
    };
    const res = await fetch(isEdit ? `/api/events/${event!.id}` : "/api/events", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSubmitting(false);
    if (res.ok) {
      onSaved();
      onClose();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Falha ao salvar.");
    }
  }

  async function onDelete() {
    if (!event || !isEdit) return;
    if (!confirm("Excluir este evento?")) return;
    setDeleting(true);
    const res = await fetch(`/api/events/${event.id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) {
      onDeleted?.();
      onClose();
    } else {
      setError("Falha ao excluir.");
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={onSubmit}
        className="w-full max-w-md bg-surface border border-line rounded-2xl p-6 flex flex-col gap-4"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-semibold text-lg">{isEdit ? "Editar evento" : "Novo evento"}</h2>
            <p className="text-sm text-muted mt-0.5">
              {leadId
                ? "Vinculado a um lead — convite por e-mail automático se ele tiver e-mail cadastrado."
                : "Compromisso na agenda."}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-muted hover:text-cream transition" aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <label className="flex flex-col gap-1">
          <span className={labelClass}>Título</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Demo com cliente" className={inputClass} autoFocus />
        </label>

        <label className="flex flex-col gap-1">
          <span className={labelClass}>Descrição (opcional)</span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={inputClass} />
        </label>

        <div className="grid grid-cols-3 gap-3">
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Data</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Início</span>
            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Fim</span>
            <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={inputClass} />
          </label>
        </div>

        <label className="flex flex-col gap-1">
          <span className={labelClass}>Lead vinculado (opcional)</span>
          <select value={leadId} onChange={(e) => setLeadId(e.target.value)} className={inputClass}>
            <option value="">Nenhum</option>
            {leads.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name ?? l.phone ?? l.id}
              </option>
            ))}
          </select>
        </label>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex items-center justify-between">
          {isEdit ? (
            <button
              type="button"
              onClick={onDelete}
              disabled={submitting || deleting}
              className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 transition disabled:opacity-50"
            >
              <Trash2 size={14} /> {deleting ? "Excluindo…" : "Excluir"}
            </button>
          ) : (
            <span />
          )}
          <button
            type="submit"
            disabled={submitting || deleting}
            className="bg-brand text-brand-ink font-medium rounded-lg px-4 py-2.5 hover:opacity-90 disabled:opacity-60 transition"
          >
            {submitting ? "Salvando…" : isEdit ? "Salvar" : "Criar evento"}
          </button>
        </div>
      </form>
    </div>
  );
}
