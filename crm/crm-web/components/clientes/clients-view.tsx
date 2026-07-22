"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Plus, Users } from "lucide-react";
import { formatBRL } from "@/lib/money";
import { healthInfo } from "@/lib/health";
import { billingTypeLabel } from "@/lib/billing-type";
import NewLeadModal from "@/components/kanban/new-lead-modal";
import LeadPanel from "@/components/kanban/lead-panel";

type ClientLead = {
  id: string;
  name: string | null;
  email: string | null;
  company: string | null;
  value: number | null;
  billingType: string | null;
  mrr: number | null;
  health: string | null;
  clientSince: string | null;
  stage: string;
};

function initialsOf(name: string | null) {
  return (name ?? "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

// meses corridos desde a data — usado só pra composição do LTV (aproximado, não fiscal)
function monthsSince(iso: string | null): number {
  if (!iso) return 0;
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(0, ms / (1000 * 60 * 60 * 24 * 30));
}

export default function ClientsView() {
  const [leads, setLeads] = useState<ClientLead[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [openLeadId, setOpenLeadId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/leads", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setLeads(data.leads.filter((l: ClientLead) => l.stage === "FECHADO"));
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 5000); // polling — realtime simples
    return () => clearInterval(t);
  }, [load]);

  const stats = useMemo(() => {
    const count = leads.length;
    const retainers = leads.filter((l) => l.billingType === "retainer");
    const projetos = leads.filter((l) => l.billingType === "projeto");

    const totalMrr = retainers.reduce((s, l) => s + (l.mrr ?? 0), 0);
    const withMrr = retainers.filter((l) => l.mrr != null);
    const avgMrr = withMrr.length ? totalMrr / withMrr.length : 0;
    const withTenure = retainers.filter((l) => l.clientSince);
    const avgTenure = withTenure.length
      ? withTenure.reduce((s, l) => s + monthsSince(l.clientSince), 0) / withTenure.length
      : 0;
    const ltv = avgMrr * avgTenure;

    const totalProjetos = projetos.reduce((s, l) => s + (l.value ?? 0), 0);

    return {
      count,
      retainerCount: retainers.length,
      totalMrr,
      avgMrr,
      avgTenure,
      ltv,
      totalProjetos,
    };
  }, [leads]);

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Clientes</h1>
          <p className="text-sm text-muted mt-0.5">
            Carteira de projetos e retainers — clique num cliente para abrir a ficha completa.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 bg-brand text-brand-ink text-sm font-medium rounded-lg px-3 py-2 hover:opacity-90 transition shrink-0"
        >
          <Plus size={16} /> Novo cliente
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Clientes ativos" value={String(stats.count)} />
        <StatCard label="MRR da carteira (retainers)" value={formatBRL(stats.totalMrr)} />
        <StatCard label="Receita de projetos" value={formatBRL(stats.totalProjetos)} />
        <StatCard label="LTV médio (retainers)" value={formatBRL(Math.round(stats.ltv))} />
      </div>

      {stats.retainerCount > 0 && (
        <div className="bg-surface-2 border border-line rounded-xl p-4">
          <p className="text-xs font-medium text-muted uppercase tracking-wide mb-3">
            Composição do LTV — retainers
          </p>
          <div className="flex items-center gap-3 text-sm flex-wrap">
            <span className="font-semibold">{formatBRL(Math.round(stats.avgMrr))}</span>
            <span className="text-muted">faturamento médio/mês</span>
            <span className="text-muted">×</span>
            <span className="font-semibold">{stats.avgTenure.toFixed(1)}</span>
            <span className="text-muted">meses de permanência média</span>
            <span className="text-muted">=</span>
            <span className="font-semibold text-brand">{formatBRL(Math.round(stats.ltv))}</span>
            <span className="text-muted">LTV médio</span>
          </div>
        </div>
      )}

      <div className="bg-surface border border-line rounded-xl overflow-hidden">
        {!loaded ? (
          <p className="p-6 text-sm text-muted">Carregando…</p>
        ) : leads.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center gap-2">
            <Users size={28} className="text-muted" />
            <p className="text-sm text-muted max-w-sm mx-auto">
              Nenhum cliente ainda — quando um lead fecha negócio (etapa &quot;Fechado&quot; no
              CRM), ele aparece aqui automaticamente.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-muted uppercase tracking-wide">
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Empresa</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 font-medium">Saúde</th>
                  <th className="px-4 py-3 font-medium text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => {
                  const h = healthInfo(lead.health);
                  const isRetainer = lead.billingType === "retainer";
                  return (
                    <tr
                      key={lead.id}
                      onClick={() => setOpenLeadId(lead.id)}
                      className="border-b border-line last:border-b-0 hover:bg-surface-2/60 cursor-pointer transition"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="w-8 h-8 rounded-full bg-brand/15 text-brand text-xs font-medium flex items-center justify-center shrink-0">
                            {initialsOf(lead.name) || "?"}
                          </span>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{lead.name ?? "Sem nome"}</p>
                            {lead.email && (
                              <p className="text-xs text-muted truncate">{lead.email}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted">{lead.company ?? "—"}</td>
                      <td className="px-4 py-3 text-muted">
                        {billingTypeLabel(lead.billingType)}
                      </td>
                      <td className="px-4 py-3">
                        {isRetainer ? (
                          h ? (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${h.className}`}>
                              {h.label}
                            </span>
                          ) : (
                            <span className="text-muted text-xs">—</span>
                          )
                        ) : (
                          <span className="text-muted text-xs">n/a</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {isRetainer
                          ? lead.mrr != null
                            ? `${formatBRL(lead.mrr)}/mês`
                            : "—"
                          : lead.value != null
                            ? formatBRL(lead.value)
                            : "—"}
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
        <NewLeadModal
          onClose={() => setModalOpen(false)}
          onCreated={load}
          initialStage="FECHADO"
          title="Novo cliente"
          subtitle="Cadastra direto como cliente ativo (etapa Fechado). Defina o tipo de cobrança na ficha, depois de criar."
          submitLabel="Adicionar cliente"
        />
      )}

      {openLeadId && (
        <LeadPanel leadId={openLeadId} onClose={() => setOpenLeadId(null)} onUpdated={load} />
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface-2 border border-line rounded-xl p-4">
      <p className="text-xs text-muted mb-1">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  );
}
