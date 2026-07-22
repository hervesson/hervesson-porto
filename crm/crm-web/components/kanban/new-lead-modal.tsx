"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { STAGES } from "@/lib/stages";
import { ORIGINS } from "@/lib/lead-origin";
import { maskPhoneBR } from "@/lib/phone";

const inputClass =
  "bg-surface-2 border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-brand w-full";
const labelClass = "text-xs text-muted";

export default function NewLeadModal({
  onClose,
  onCreated,
  initialStage,
  title = "Novo lead",
  subtitle = "Preencha os dados básicos — o resto a IA completa na conversa.",
  submitLabel = "Adicionar lead",
}: {
  onClose: () => void;
  onCreated: () => void;
  initialStage?: (typeof STAGES)[number]["key"];
  title?: string;
  subtitle?: string;
  submitLabel?: string;
}) {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [position, setPosition] = useState("");
  const [value, setValue] = useState("");
  const [origin, setOrigin] = useState("manual");
  const [stage, setStage] = useState(initialStage ?? STAGES[0].key);
  const [tagsInput, setTagsInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Informe ao menos o nome.");
      return;
    }
    setError("");
    setSubmitting(true);

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        company,
        email,
        phone,
        position,
        value: value ? Number(value) : null,
        source: origin,
        stage,
        tags,
      }),
    });

    setSubmitting(false);
    if (res.ok) {
      onCreated();
      onClose();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Falha ao criar o lead.");
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
        className="w-full max-w-lg bg-surface border border-line rounded-2xl p-6 flex flex-col gap-4"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-semibold text-lg">{title}</h2>
            <p className="text-sm text-muted mt-0.5">{subtitle}</p>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Nome</span>
            <input
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="João Ferreira"
              autoFocus
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Empresa</span>
            <input
              className={inputClass}
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Ferreira Advogados"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className={labelClass}>E-mail</span>
            <input
              type="email"
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="joao@empresa.com.br"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Telefone</span>
            <input
              type="tel"
              className={inputClass}
              value={phone}
              onChange={(e) => setPhone(maskPhoneBR(e.target.value))}
              placeholder="(11) 99999-9999"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Cargo</span>
            <input
              className={inputClass}
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="Diretor"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Valor (R$)</span>
            <input
              type="number"
              min={0}
              className={inputClass}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="15000"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Origem</span>
            <select
              className={inputClass}
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
            >
              {ORIGINS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Etapa</span>
            <select
              className={inputClass}
              value={stage}
              onChange={(e) => setStage(e.target.value as (typeof STAGES)[number]["key"])}
            >
              {STAGES.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Tags (separadas por vírgula)</span>
            <input
              className={inputClass}
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="Premium, Jurídico"
            />
          </label>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="bg-brand text-brand-ink font-medium rounded-lg px-4 py-2.5 hover:opacity-90 disabled:opacity-60 transition"
          >
            {submitting ? "Adicionando…" : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
