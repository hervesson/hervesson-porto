"use client";

import { useEffect, useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { STATUSES } from "@/lib/proposals";
import { formatBRL } from "@/lib/money";

const inputClass =
  "bg-surface-2 border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-brand w-full";
const labelClass = "text-xs text-muted";

type LeadOption = { id: string; name: string | null; phone: string | null; email: string | null };
type Item = { description: string; value: string };

export type ProposalFull = {
  id: string;
  number: string;
  clientName: string;
  leadId: string | null;
  status: string;
  validUntil: string | null;
  notes: string | null;
  items: { description: string; value: number }[];
};

export default function ProposalModal({
  proposal,
  initialLeadId,
  onClose,
  onSaved,
}: {
  proposal?: ProposalFull;
  initialLeadId?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = Boolean(proposal);
  const [clientName, setClientName] = useState(proposal?.clientName ?? "");
  const [leadId, setLeadId] = useState(proposal?.leadId ?? initialLeadId ?? "");
  const [status, setStatus] = useState(proposal?.status ?? "rascunho");
  const [validUntil, setValidUntil] = useState(proposal?.validUntil?.slice(0, 10) ?? "");
  const [notes, setNotes] = useState(proposal?.notes ?? "");
  const [items, setItems] = useState<Item[]>(
    proposal?.items.map((i) => ({ description: i.description, value: String(i.value) })) ?? [
      { description: "", value: "" },
    ],
  );
  const [leads, setLeads] = useState<LeadOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/leads", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setLeads(data.leads));
  }, []);

  function onLeadChange(id: string) {
    setLeadId(id);
    if (!clientName.trim()) {
      const lead = leads.find((l) => l.id === id);
      if (lead?.name) setClientName(lead.name);
    }
  }

  function updateItem(idx: number, patch: Partial<Item>) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }
  function addItem() {
    setItems((prev) => [...prev, { description: "", value: "" }]);
  }
  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  const total = items.reduce((sum, i) => sum + (Number(i.value) || 0), 0);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientName.trim()) {
      setError("Informe o nome do cliente.");
      return;
    }
    const validItems = items.filter((i) => i.description.trim() && Number(i.value) > 0);
    if (validItems.length === 0) {
      setError("Adicione ao menos 1 item com descrição e valor.");
      return;
    }
    setError("");
    setSubmitting(true);

    const payload = {
      clientName: clientName.trim(),
      leadId: leadId || null,
      status,
      validUntil: validUntil || null,
      notes: notes.trim(),
      items: validItems.map((i) => ({ description: i.description.trim(), value: Number(i.value) })),
    };

    const res = await fetch(isEdit ? `/api/proposals/${proposal!.id}` : "/api/proposals", {
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
        className="w-full max-w-lg bg-surface border border-line rounded-2xl p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-semibold text-lg">
              {isEdit ? `Editar ${proposal!.number}` : "Novo orçamento"}
            </h2>
            <p className="text-sm text-muted mt-0.5">Proposta com itens — sem geração de PDF por enquanto.</p>
          </div>
          <button type="button" onClick={onClose} className="text-muted hover:text-cream transition" aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Cliente</span>
            <input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Nome do cliente" className={inputClass} autoFocus />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Lead vinculado (opcional)</span>
            <select value={leadId} onChange={(e) => onLeadChange(e.target.value)} className={inputClass}>
              <option value="">Nenhum</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name ?? l.phone ?? l.id}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Válido até (opcional)</span>
            <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className={inputClass} />
          </label>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className={labelClass}>Itens</span>
            <button type="button" onClick={addItem} className="flex items-center gap-1 text-xs text-brand hover:opacity-80 transition">
              <Plus size={13} /> Adicionar item
            </button>
          </div>
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                value={item.description}
                onChange={(e) => updateItem(idx, { description: e.target.value })}
                placeholder="Descrição"
                className={inputClass}
              />
              <input
                type="number"
                min={0}
                value={item.value}
                onChange={(e) => updateItem(idx, { value: e.target.value })}
                placeholder="Valor"
                className="bg-surface-2 border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-brand w-28 shrink-0"
              />
              <button
                type="button"
                onClick={() => removeItem(idx)}
                disabled={items.length === 1}
                className="text-muted hover:text-red-400 transition disabled:opacity-30 shrink-0"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          <div className="flex justify-end text-sm pt-1">
            <span className="text-muted mr-2">Total:</span>
            <span className="font-semibold">{formatBRL(total)}</span>
          </div>
        </div>

        <label className="flex flex-col gap-1">
          <span className={labelClass}>Observações (opcional)</span>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={inputClass} />
        </label>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="bg-brand text-brand-ink font-medium rounded-lg px-4 py-2.5 hover:opacity-90 disabled:opacity-60 transition"
          >
            {submitting ? "Salvando…" : isEdit ? "Salvar" : "Criar orçamento"}
          </button>
        </div>
      </form>
    </div>
  );
}
