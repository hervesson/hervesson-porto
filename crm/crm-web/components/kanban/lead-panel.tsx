"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { X, Trash2, MessageCircle, Mail, Pencil, FileText } from "lucide-react";
import ProposalModal from "@/components/orcamentos/proposal-modal";
import { STAGES } from "@/lib/stages";
import { formatPhone, maskPhoneBR } from "@/lib/phone";
import { ORIGINS, originLabel } from "@/lib/lead-origin";
import { formatBRL } from "@/lib/money";
import { timeAgo } from "@/lib/relative-time";
import { HEALTH, healthInfo } from "@/lib/health";
import { BILLING_TYPES, billingTypeLabel } from "@/lib/billing-type";

const editInputClass =
  "bg-surface-2 border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-brand w-full";

type Msg = { body: string; createdAt: string };
type LeadFull = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  company: string | null;
  position: string | null;
  value: number | null;
  tags: string[];
  source: string;
  stage: string;
  aiPaused: boolean;
  summary: string | null;
  note: string | null;
  billingType: string | null;
  mrr: number | null;
  health: string | null;
  clientSince: string | null;
  updatedAt: string;
  messages: Msg[];
};

export default function LeadPanel({
  leadId,
  onClose,
  onUpdated,
}: {
  leadId: string;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [lead, setLead] = useState<LeadFull | null>(null);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [proposalModalOpen, setProposalModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    company: "",
    position: "",
    phone: "",
    email: "",
    value: "",
    tags: "",
    source: "manual",
    note: "",
    stage: STAGES[0].key as string,
    billingType: "",
    mrr: "",
    health: "",
  });

  const load = useCallback(async () => {
    const res = await fetch(`/api/leads/${leadId}`, { cache: "no-store" });
    if (res.ok) setLead((await res.json()).lead);
  }, [leadId]);

  useEffect(() => {
    load();
  }, [load]);

  async function patch(data: Record<string, unknown>) {
    if (!lead) return;
    setLead({ ...lead, ...data } as LeadFull); // otimista — feedback instantâneo
    setSaving(true);
    const res = await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    // reconcilia com o que o servidor realmente salvou (ex.: clientSince
    // preenchido sozinho na primeira vez que fecha — não vem no payload
    // otimista). O PATCH não devolve "messages" (só os campos escalares do
    // lead), então mescla em vez de substituir pra não perder a thread.
    if (res.ok) {
      const json = await res.json().catch(() => null);
      if (json?.lead) setLead((prev) => (prev ? { ...prev, ...json.lead } : prev));
    }
    setSaving(false);
    onUpdated();
  }

  async function remove() {
    if (!confirm("Excluir este lead? Essa ação não pode ser desfeita.")) return;
    await fetch(`/api/leads/${leadId}`, { method: "DELETE" });
    onUpdated();
    onClose();
  }

  function startEdit() {
    if (!lead) return;
    setForm({
      name: lead.name ?? "",
      company: lead.company ?? "",
      position: lead.position ?? "",
      phone: lead.phone ? maskPhoneBR(lead.phone) : "",
      email: lead.email ?? "",
      value: lead.value != null ? String(lead.value) : "",
      tags: lead.tags.join(", "),
      source: lead.source,
      note: lead.note ?? "",
      stage: lead.stage,
      billingType: lead.billingType ?? "",
      mrr: lead.mrr != null ? String(lead.mrr) : "",
      health: lead.health ?? "",
    });
    setEditing(true);
  }

  async function saveEdit() {
    await patch({
      name: form.name,
      company: form.company,
      position: form.position,
      phone: form.phone,
      email: form.email,
      value: form.value ? Number(form.value) : null,
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      source: form.source,
      note: form.note,
      stage: form.stage,
      billingType: form.billingType,
      mrr: form.billingType === "retainer" && form.mrr ? Number(form.mrr) : null,
      health: form.billingType === "retainer" ? form.health : "",
    });
    setEditing(false);
  }

  const last = lead?.messages[lead.messages.length - 1];
  const initials = (lead?.name ?? "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <aside className="relative w-full max-w-md bg-surface border-l border-line h-full overflow-y-auto flex flex-col">
        {!lead ? (
          <div className="p-6 text-muted">Carregando…</div>
        ) : (
          <>
            <div className="p-5 border-b border-line flex items-start justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-11 h-11 rounded-full bg-brand/15 text-brand font-semibold flex items-center justify-center shrink-0">
                  {initials || "?"}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold truncate">{lead.name ?? "Sem nome"}</p>
                  {(lead.position || lead.company) && (
                    <p className="text-xs text-muted truncate">
                      {[lead.position, lead.company].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={startEdit}
                  title="Editar lead"
                  className="text-muted hover:text-cream transition"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={remove}
                  title="Excluir lead"
                  className="text-muted hover:text-red-400 transition"
                >
                  <Trash2 size={17} />
                </button>
                <button
                  onClick={onClose}
                  title="Fechar"
                  className="text-muted hover:text-cream transition"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="p-5 flex flex-col gap-5">
              {editing ? (
                <>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-muted">Nome</span>
                    <input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className={editInputClass}
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex flex-col gap-1">
                      <span className="text-xs text-muted">Empresa</span>
                      <input
                        value={form.company}
                        onChange={(e) => setForm({ ...form, company: e.target.value })}
                        className={editInputClass}
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-xs text-muted">Cargo</span>
                      <input
                        value={form.position}
                        onChange={(e) => setForm({ ...form, position: e.target.value })}
                        className={editInputClass}
                      />
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex flex-col gap-1">
                      <span className="text-xs text-muted">Telefone</span>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: maskPhoneBR(e.target.value) })}
                        className={editInputClass}
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-xs text-muted">E-mail</span>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className={editInputClass}
                      />
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex flex-col gap-1">
                      <span className="text-xs text-muted">Valor (R$)</span>
                      <input
                        type="number"
                        min={0}
                        value={form.value}
                        onChange={(e) => setForm({ ...form, value: e.target.value })}
                        className={editInputClass}
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-xs text-muted">Tags (vírgula)</span>
                      <input
                        value={form.tags}
                        onChange={(e) => setForm({ ...form, tags: e.target.value })}
                        className={editInputClass}
                      />
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex flex-col gap-1">
                      <span className="text-xs text-muted">Etapa</span>
                      <select
                        value={form.stage}
                        onChange={(e) => setForm({ ...form, stage: e.target.value })}
                        className={editInputClass}
                      >
                        {STAGES.map((s) => (
                          <option key={s.key} value={s.key}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-xs text-muted">Origem</span>
                      <select
                        value={form.source}
                        onChange={(e) => setForm({ ...form, source: e.target.value })}
                        className={editInputClass}
                      >
                        {ORIGINS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  {form.stage === "FECHADO" && (
                    <div className="border border-line rounded-xl p-3 flex flex-col gap-3">
                      <p className="text-[11px] text-muted uppercase tracking-wide">
                        Cliente ativo
                      </p>
                      <label className="flex flex-col gap-1">
                        <span className="text-xs text-muted">Tipo de cobrança</span>
                        <select
                          value={form.billingType}
                          onChange={(e) => setForm({ ...form, billingType: e.target.value })}
                          className={editInputClass}
                        >
                          <option value="">—</option>
                          {BILLING_TYPES.map((b) => (
                            <option key={b.value} value={b.value}>
                              {b.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      {form.billingType === "retainer" && (
                        <>
                          <label className="flex flex-col gap-1">
                            <span className="text-xs text-muted">MRR (R$/mês)</span>
                            <input
                              type="number"
                              min={0}
                              value={form.mrr}
                              onChange={(e) => setForm({ ...form, mrr: e.target.value })}
                              className={editInputClass}
                            />
                          </label>
                          <label className="flex flex-col gap-1">
                            <span className="text-xs text-muted">Saúde</span>
                            <select
                              value={form.health}
                              onChange={(e) => setForm({ ...form, health: e.target.value })}
                              className={editInputClass}
                            >
                              <option value="">—</option>
                              {HEALTH.map((h) => (
                                <option key={h.value} value={h.value}>
                                  {h.label}
                                </option>
                              ))}
                            </select>
                          </label>
                        </>
                      )}
                      {form.billingType === "projeto" && (
                        <p className="text-[11px] text-muted">
                          Projeto usa o "Valor do negócio" já preenchido acima como receita.
                        </p>
                      )}
                    </div>
                  )}

                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-muted">Nota</span>
                    <textarea
                      value={form.note}
                      onChange={(e) => setForm({ ...form, note: e.target.value })}
                      rows={3}
                      placeholder="Anotação sua sobre esse lead — a IA não vê isso."
                      className={`${editInputClass} resize-none`}
                    />
                  </label>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditing(false)}
                      className="text-sm px-3 py-2 rounded-lg border border-line text-muted hover:text-cream transition"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={saveEdit}
                      className="text-sm px-3 py-2 rounded-lg bg-brand text-brand-ink font-medium hover:opacity-90 transition"
                    >
                      Salvar
                    </button>
                  </div>
                </>
              ) : (
                <>
              {lead.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {lead.tags.map((t) => (
                    <span
                      key={t}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-surface-2 border border-line text-muted"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-3 gap-2">
                <Link
                  href={`/whatsapp?lead=${lead.id}`}
                  className="flex flex-col items-center gap-1.5 bg-surface-2 border border-line rounded-lg py-3 text-xs hover:border-brand/50 transition"
                >
                  <MessageCircle size={17} /> WhatsApp
                </Link>
                <a
                  href={lead.email ? `mailto:${lead.email}` : undefined}
                  className={`flex flex-col items-center gap-1.5 bg-surface-2 border border-line rounded-lg py-3 text-xs transition ${
                    lead.email ? "hover:border-brand/50" : "opacity-40 pointer-events-none"
                  }`}
                >
                  <Mail size={17} /> E-mail
                </a>
                <button
                  type="button"
                  onClick={() => setProposalModalOpen(true)}
                  className="flex flex-col items-center gap-1.5 bg-surface-2 border border-line rounded-lg py-3 text-xs hover:border-brand/50 transition"
                >
                  <FileText size={17} /> Proposta
                </button>
              </div>

              <div>
                <p className="text-[11px] text-muted uppercase tracking-wide mb-1.5">
                  Etapa do pipeline
                </p>
                <select
                  value={lead.stage}
                  onChange={(e) => patch({ stage: e.target.value })}
                  className="bg-surface-2 border border-line rounded-lg px-3 py-2 text-sm w-full outline-none focus:border-brand"
                >
                  {STAGES.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              {lead.stage === "FECHADO" && (
                <div className="bg-surface-2 border border-line rounded-xl p-3.5">
                  <p className="text-xs font-medium text-muted mb-2">Cliente ativo</p>
                  <div className="flex flex-col gap-2">
                    <InfoRow label="Tipo" value={billingTypeLabel(lead.billingType)} />
                    {lead.billingType === "retainer" ? (
                      <>
                        <InfoRow
                          label="MRR"
                          value={lead.mrr != null ? formatBRL(lead.mrr) : "—"}
                        />
                        <InfoRow label="Saúde" value={healthInfo(lead.health)?.label ?? "—"} />
                        <InfoRow
                          label="Cliente desde"
                          value={
                            lead.clientSince
                              ? new Date(lead.clientSince).toLocaleDateString("pt-BR")
                              : "—"
                          }
                        />
                      </>
                    ) : (
                      <InfoRow
                        label="Valor do projeto"
                        value={lead.value != null ? formatBRL(lead.value) : "—"}
                      />
                    )}
                  </div>
                </div>
              )}

              <div className="bg-surface-2 border border-line rounded-xl p-3.5">
                <p className="text-xs font-medium text-muted mb-1.5">Atendimento</p>
                <p className="text-sm">
                  {lead.aiPaused
                    ? "Você está respondendo manualmente."
                    : "A IA está respondendo automaticamente."}
                </p>
                <button
                  onClick={() => patch({ aiPaused: !lead.aiPaused })}
                  disabled={saving}
                  className="mt-3 text-xs font-medium bg-surface border border-line rounded-lg px-3 py-1.5 hover:border-brand/50 transition disabled:opacity-50"
                >
                  {lead.aiPaused ? "Devolver p/ IA" : "Assumir conversa"}
                </button>
              </div>

              <div className="bg-surface-2 border border-line rounded-xl p-3.5">
                <p className="text-xs font-medium text-muted mb-1.5">O que o lead precisa</p>
                <p className="text-sm">
                  {lead.summary ||
                    "Ainda sem resumo — aparece aqui assim que a IA conversar com o lead."}
                </p>
              </div>

              <div className="bg-surface-2 border border-line rounded-xl p-3.5">
                <p className="text-xs font-medium text-muted mb-1.5">Nota</p>
                <p className="text-sm whitespace-pre-wrap">
                  {lead.note || "Sem anotação — adicione clicando em editar."}
                </p>
              </div>

              <div>
                <p className="text-[11px] text-muted uppercase tracking-wide mb-2">
                  Informações
                </p>
                <div className="flex flex-col gap-2.5">
                  {lead.value != null && (
                    <InfoRow label="Valor do negócio" value={formatBRL(lead.value)} />
                  )}
                  <InfoRow label="Telefone" value={formatPhone(lead.phone)} />
                  {lead.email && <InfoRow label="E-mail" value={lead.email} />}
                  <InfoRow label="Origem" value={originLabel(lead.source)} />
                  <InfoRow
                    label="Última atividade"
                    value={timeAgo(last ? last.createdAt : lead.updatedAt)}
                  />
                </div>
              </div>
                </>
              )}
            </div>
          </>
        )}
      </aside>

      {proposalModalOpen && lead && (
        <ProposalModal
          initialLeadId={lead.id}
          onClose={() => setProposalModalOpen(false)}
          onSaved={() => {}}
        />
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-muted shrink-0">{label}</span>
      <span className="text-right truncate">{value}</span>
    </div>
  );
}
