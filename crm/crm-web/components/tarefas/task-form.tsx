"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { PRIORITIES, type TaskItem } from "@/lib/tasks";

const inputClass =
  "bg-surface-2 border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-brand w-full";
const labelClass = "text-xs text-muted";

type LeadOption = { id: string; name: string | null; phone: string | null };

export default function TaskForm({
  task,
  onClose,
  onSaved,
}: {
  task?: TaskItem;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = Boolean(task);
  const [title, setTitle] = useState(task?.title ?? "");
  const [dueAt, setDueAt] = useState(task?.dueAt?.slice(0, 10) ?? "");
  const [priority, setPriority] = useState(task?.priority ?? "normal");
  const [leadId, setLeadId] = useState(task?.leadId ?? "");
  const [leads, setLeads] = useState<LeadOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/leads", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setLeads(data.leads));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Informe o título.");
      return;
    }
    setError("");
    setSubmitting(true);

    const payload = {
      title: title.trim(),
      dueAt: dueAt || null,
      priority,
      leadId: leadId || null,
    };

    const res = await fetch(isEdit ? `/api/tasks/${task!.id}` : "/api/tasks", {
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

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={onSubmit}
        className="w-full max-w-md bg-surface border border-line rounded-2xl p-6 flex flex-col gap-4"
      >
        <div className="flex items-start justify-between">
          <h2 className="font-semibold text-lg">{isEdit ? "Editar tarefa" : "Nova tarefa"}</h2>
          <button type="button" onClick={onClose} className="text-muted hover:text-cream transition" aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <label className="flex flex-col gap-1">
          <span className={labelClass}>Título</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="O que precisa ser feito?" className={inputClass} autoFocus />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Urgência</span>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className={inputClass}>
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Prazo (opcional)</span>
            <input type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} className={inputClass} />
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

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="bg-brand text-brand-ink font-medium rounded-lg px-4 py-2.5 hover:opacity-90 disabled:opacity-60 transition"
          >
            {submitting ? "Salvando…" : isEdit ? "Salvar" : "Criar tarefa"}
          </button>
        </div>
      </form>
    </div>
  );
}
