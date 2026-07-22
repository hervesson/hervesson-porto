"use client";

import { useState } from "react";
import { X, ArrowUp, ArrowDown } from "lucide-react";
import { categoriesFor, METHODS, STATUSES } from "@/lib/transactions";

const inputClass =
  "bg-surface-2 border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-brand w-full";
const labelClass = "text-xs text-muted";

export default function NewTransactionModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [type, setType] = useState<"receita" | "despesa">("receita");
  const [description, setDescription] = useState("");
  const [value, setValue] = useState("");
  const [category, setCategory] = useState<string>(categoriesFor("receita")[0].value);
  const [method, setMethod] = useState<string>(METHODS[0].value);
  const [status, setStatus] = useState<string>(STATUSES[0].value);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function changeType(next: "receita" | "despesa") {
    setType(next);
    setCategory(categoriesFor(next)[0].value);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) {
      setError("Informe uma descrição.");
      return;
    }
    if (!value || Number(value) <= 0) {
      setError("Informe um valor válido.");
      return;
    }
    setError("");
    setSubmitting(true);

    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, description, value: Number(value), category, method, status }),
    });

    setSubmitting(false);
    if (res.ok) {
      onCreated();
      onClose();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Falha ao lançar.");
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
            <h2 className="font-semibold text-lg">Novo lançamento</h2>
            <p className="text-sm text-muted mt-0.5">
              Receita ou despesa — refletido nos indicadores.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-cream transition"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => changeType("receita")}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-medium border transition ${
              type === "receita"
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                : "bg-surface-2 border-line text-muted hover:text-cream"
            }`}
          >
            <ArrowUp size={15} /> Receita
          </button>
          <button
            type="button"
            onClick={() => changeType("despesa")}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-medium border transition ${
              type === "despesa"
                ? "bg-red-500/15 border-red-500/40 text-red-300"
                : "bg-surface-2 border-line text-muted hover:text-cream"
            }`}
          >
            <ArrowDown size={15} /> Despesa
          </button>
        </div>

        <label className="flex flex-col gap-1">
          <span className={labelClass}>Descrição</span>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex.: Assinatura Pro — Cliente X"
            className={inputClass}
            autoFocus
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Valor (R$)</span>
            <input
              type="number"
              min={0}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="1500"
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Categoria</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={inputClass}
            >
              {categoriesFor(type).map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Método</span>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className={inputClass}
            >
              {METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Status</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={inputClass}
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="bg-brand text-brand-ink font-medium rounded-lg px-4 py-2.5 hover:opacity-90 disabled:opacity-60 transition"
          >
            {submitting ? "Lançando…" : "Lançar"}
          </button>
        </div>
      </form>
    </div>
  );
}
