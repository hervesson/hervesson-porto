"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, FileText, MessageCircle } from "lucide-react";
import { STATUSES, statusInfo, proposalTotal } from "@/lib/proposals";
import { formatBRL } from "@/lib/money";
import StatCard from "@/components/ui/stat-card";
import ProposalModal, { type ProposalFull } from "./proposal-modal";

type Proposal = ProposalFull & { createdAt: string };
type Stats = {
  openCount: number;
  openTotal: number;
  approvalRate: number | null;
  avgTicket: number | null;
};

export default function OrcamentosView() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Proposal | undefined>(undefined);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/proposals", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setProposals(data.proposals);
      setStats(data.stats);
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [load]);

  async function changeStatus(p: Proposal, status: string) {
    setProposals((prev) => prev.map((x) => (x.id === p.id ? { ...x, status } : x)));
    await fetch(`/api/proposals/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Excluir este orçamento?")) return;
    await fetch(`/api/proposals/${id}`, { method: "DELETE" });
    load();
  }

  async function sendWhatsapp(p: Proposal) {
    setSendingId(p.id);
    const res = await fetch(`/api/proposals/${p.id}/send`, { method: "POST" });
    setSendingId(null);
    if (res.ok) {
      load();
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Falha ao enviar pelo WhatsApp.");
    }
  }

  function openNew() {
    setEditing(undefined);
    setModalOpen(true);
  }
  function openEdit(p: Proposal) {
    setEditing(p);
    setModalOpen(true);
  }

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Orçamentos</h1>
          <p className="text-sm text-muted mt-0.5">
            Propostas com itens — anexe o PDF e envie direto pro lead no WhatsApp.
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-1.5 bg-brand text-brand-ink text-sm font-medium rounded-lg px-3 py-2 hover:opacity-90 transition shrink-0"
        >
          <Plus size={16} /> Novo orçamento
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatCard label="Em aberto" value={`${stats.openCount} · ${formatBRL(stats.openTotal)}`} />
          <StatCard
            label="Taxa de aprovação"
            value={stats.approvalRate === null ? "—" : `${Math.round(stats.approvalRate * 100)}%`}
          />
          <StatCard label="Ticket médio" value={stats.avgTicket === null ? "—" : formatBRL(stats.avgTicket)} />
        </div>
      )}

      <div className="bg-surface border border-line rounded-xl overflow-hidden">
        {!loaded ? (
          <p className="p-6 text-sm text-muted">Carregando…</p>
        ) : proposals.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center gap-2">
            <FileText size={28} className="text-muted" />
            <p className="text-sm text-muted max-w-sm mx-auto">
              Nenhum orçamento ainda — clique em &quot;Novo orçamento&quot; pra criar o primeiro.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-muted uppercase tracking-wide">
                  <th className="px-4 py-3 font-medium">Número</th>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Itens</th>
                  <th className="px-4 py-3 font-medium">Validade</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Total</th>
                  <th className="px-4 py-3 font-medium w-20" />
                </tr>
              </thead>
              <tbody>
                {proposals.map((p) => {
                  const s = statusInfo(p.status);
                  return (
                    <tr key={p.id} className="border-b border-line last:border-b-0 hover:bg-surface-2/60 transition">
                      <td className="px-4 py-3 font-medium text-brand cursor-pointer" onClick={() => openEdit(p)}>
                        {p.number}
                      </td>
                      <td className="px-4 py-3 cursor-pointer" onClick={() => openEdit(p)}>
                        {p.clientName}
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {p.items.length} item{p.items.length === 1 ? "" : "(ns)"}
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {p.validUntil ? new Date(p.validUntil).toLocaleDateString("pt-BR") : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={p.status}
                          onChange={(e) => changeStatus(p, e.target.value)}
                          className={`text-xs px-2 py-1 rounded-full border-0 outline-none cursor-pointer ${s.className}`}
                        >
                          {STATUSES.map((st) => (
                            <option key={st.value} value={st.value}>
                              {st.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{formatBRL(proposalTotal(p.items))}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          {p.pdfUrl && p.leadId && (
                            <button
                              onClick={() => sendWhatsapp(p)}
                              disabled={sendingId === p.id}
                              className="text-muted hover:text-brand transition disabled:opacity-40"
                              title="Enviar PDF pro lead no WhatsApp"
                            >
                              <MessageCircle size={15} />
                            </button>
                          )}
                          <button
                            onClick={() => remove(p.id)}
                            className="text-muted hover:text-red-400 transition text-xs"
                            title="Excluir"
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <ProposalModal proposal={editing} onClose={() => setModalOpen(false)} onSaved={load} />
      )}
    </div>
  );
}
