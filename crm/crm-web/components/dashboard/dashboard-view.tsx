"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { STAGES, CLOSED_STAGES, STALE_DAYS, daysSince } from "@/lib/stages";
import { formatBRL } from "@/lib/money";
import { formatTime } from "@/lib/relative-time";
import { computeStats as computeProposalStats } from "@/lib/proposals";
import type { MergedEvent } from "@/lib/agenda";
import StatCard from "@/components/ui/stat-card";
import TasksPanel from "./tasks-panel";
import DreamsPanel from "./dreams-panel";

type Lead = {
  id: string;
  name: string | null;
  stage: string;
  createdAt: string;
  messages: { createdAt: string }[];
};

type Tx = { type: string; value: number; date: string };

type Proposal = {
  id: string;
  number: string;
  clientName: string;
  status: string;
  validUntil: string | null;
  items: { value: number }[];
};

const MONTHS_BACK = 6;

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export default function DashboardView() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [todayEvents, setTodayEvents] = useState<MergedEvent[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date();
    dayEnd.setHours(23, 59, 59, 999);

    const [leadsRes, txRes, proposalsRes, eventsRes] = await Promise.all([
      fetch("/api/leads", { cache: "no-store" }),
      fetch("/api/transactions", { cache: "no-store" }),
      fetch("/api/proposals", { cache: "no-store" }),
      fetch(
        `/api/events?from=${encodeURIComponent(dayStart.toISOString())}&to=${encodeURIComponent(dayEnd.toISOString())}`,
        { cache: "no-store" },
      ),
    ]);
    if (leadsRes.ok) setLeads((await leadsRes.json()).leads);
    if (txRes.ok) setTxs((await txRes.json()).transactions);
    if (proposalsRes.ok) setProposals((await proposalsRes.json()).proposals);
    if (eventsRes.ok) setTodayEvents((await eventsRes.json()).events);
    setLoaded(true);
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30000); // polling — realtime simples
    return () => clearInterval(t);
  }, [load]);

  const now = new Date();
  const currentMonth = monthKey(now);

  const stats = useMemo(() => {
    const receitaMes = txs
      .filter((t) => t.type === "receita" && monthKey(new Date(t.date)) === currentMonth)
      .reduce((s, t) => s + t.value, 0);
    const leadsNoPipeline = leads.filter((l) => !CLOSED_STAGES.includes(l.stage)).length;
    const clientesAtivos = leads.filter((l) => l.stage === "FECHADO").length;
    return { receitaMes, leadsNoPipeline, clientesAtivos, proposalStats: computeProposalStats(proposals) };
  }, [txs, leads, proposals, currentMonth]);

  const chartMonths = useMemo(() => {
    const months: { key: string; receita: number; despesa: number }[] = [];
    for (let i = MONTHS_BACK - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = monthKey(d);
      const inMonth = txs.filter((t) => monthKey(new Date(t.date)) === key);
      months.push({
        key,
        receita: inMonth.filter((t) => t.type === "receita").reduce((s, t) => s + t.value, 0),
        despesa: inMonth.filter((t) => t.type === "despesa").reduce((s, t) => s + t.value, 0),
      });
    }
    return months;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txs]);
  const maxChartValue = Math.max(1, ...chartMonths.flatMap((m) => [m.receita, m.despesa]));

  const funnel = useMemo(() => {
    const counts = new Map<string, number>();
    for (const l of leads) counts.set(l.stage, (counts.get(l.stage) ?? 0) + 1);
    const max = Math.max(1, ...STAGES.map((s) => counts.get(s.key) ?? 0));
    return STAGES.map((s) => ({ ...s, count: counts.get(s.key) ?? 0, max }));
  }, [leads]);

  const alerts = useMemo(() => {
    const staleLeads = leads
      .filter((l) => !CLOSED_STAGES.includes(l.stage))
      .map((l) => ({
        id: l.id,
        name: l.name ?? "Sem nome",
        days: daysSince(l.messages[0]?.createdAt ?? l.createdAt),
      }))
      .filter((l) => l.days >= STALE_DAYS)
      .sort((a, b) => b.days - a.days)
      .slice(0, 5);

    const in7Days = new Date();
    in7Days.setDate(in7Days.getDate() + 7);
    const expiringProposals = proposals
      .filter((p) => p.status === "enviado" && p.validUntil && new Date(p.validUntil) <= in7Days)
      .sort((a, b) => new Date(a.validUntil!).getTime() - new Date(b.validUntil!).getTime());

    return { staleLeads, expiringProposals };
  }, [leads, proposals]);

  const hasAlerts = alerts.staleLeads.length > 0 || alerts.expiringProposals.length > 0;

  const rawDateLabel = now.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
  const dateLabel = rawDateLabel.charAt(0).toUpperCase() + rawDateLabel.slice(1);

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold">{greeting()}, Hervesson 👋</h1>
        <p className="text-sm text-muted mt-0.5">{dateLabel}</p>
      </div>

      <DreamsPanel />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Receita (mês)" value={formatBRL(stats.receitaMes)} tone="pos" />
        <StatCard label="Leads no pipeline" value={String(stats.leadsNoPipeline)} />
        <StatCard label="Clientes ativos" value={String(stats.clientesAtivos)} />
        <StatCard
          label="Propostas em aberto"
          value={`${stats.proposalStats.openCount} · ${formatBRL(stats.proposalStats.openTotal)}`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface-2 border border-line rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-medium text-muted uppercase tracking-wide">
              Receita vs. despesa — {MONTHS_BACK} meses
            </p>
            <Link href="/financeiro" className="text-xs text-brand hover:underline flex items-center gap-1 shrink-0">
              Ver financeiro <ArrowRight size={12} />
            </Link>
          </div>
          <div className="flex items-end justify-between gap-2 h-32">
            {chartMonths.map((m) => (
              <div key={m.key} className="flex-1 flex flex-col items-center gap-1.5 h-full">
                <div className="flex-1 w-full flex items-end justify-center gap-1">
                  <div
                    className="w-2.5 rounded-t bg-emerald-400/80"
                    style={{ height: `${(m.receita / maxChartValue) * 100}%` }}
                    title={`Receita: ${formatBRL(m.receita)}`}
                  />
                  <div
                    className="w-2.5 rounded-t bg-red-400/80"
                    style={{ height: `${(m.despesa / maxChartValue) * 100}%` }}
                    title={`Despesa: ${formatBRL(m.despesa)}`}
                  />
                </div>
                <span className="text-[10px] text-muted capitalize">{monthLabel(m.key)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface-2 border border-line rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-medium text-muted uppercase tracking-wide">Funil de vendas</p>
            <Link href="/kanban" className="text-xs text-brand hover:underline flex items-center gap-1 shrink-0">
              Ver CRM <ArrowRight size={12} />
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {funnel.map((s) => (
              <div
                key={s.key}
                className="flex items-center gap-3 text-sm"
                title={`${s.count} lead${s.count === 1 ? "" : "s"}`}
              >
                <span className="w-28 shrink-0 text-xs text-muted truncate">{s.label}</span>
                <div className="flex-1 h-2 rounded-full bg-surface overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(s.count / s.max) * 100}%`, background: s.accent }}
                  />
                </div>
                <span className="w-6 shrink-0 text-xs text-right font-medium">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TasksPanel />

        <div className="flex flex-col gap-6">
          <div className="bg-surface-2 border border-line rounded-xl p-4">
            <p className="text-xs font-medium text-muted uppercase tracking-wide mb-3">
              Ao que prestar atenção
            </p>
            {!loaded ? (
              <p className="text-sm text-muted">Carregando…</p>
            ) : !hasAlerts ? (
              <p className="text-sm text-muted">Tudo em dia por aqui.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {alerts.staleLeads.map((l) => (
                  <div key={l.id} className="flex items-center gap-2 text-sm">
                    <Clock size={13} className="text-red-300 shrink-0" />
                    <span className="flex-1 truncate">{l.name}</span>
                    <span className="text-xs text-red-300 shrink-0">sem contato há {l.days}d</span>
                  </div>
                ))}
                {alerts.expiringProposals.map((p) => (
                  <div key={p.id} className="flex items-center gap-2 text-sm">
                    <Clock size={13} className="text-amber-300 shrink-0" />
                    <span className="flex-1 truncate">
                      {p.clientName} — {p.number}
                    </span>
                    <span className="text-xs text-amber-300 shrink-0">
                      vence{" "}
                      {new Date(p.validUntil!).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-surface-2 border border-line rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-muted uppercase tracking-wide">Agenda de hoje</p>
              <Link href="/agenda" className="text-xs text-brand hover:underline flex items-center gap-1 shrink-0">
                Ver agenda <ArrowRight size={12} />
              </Link>
            </div>
            {!loaded ? (
              <p className="text-sm text-muted">Carregando…</p>
            ) : todayEvents.length === 0 ? (
              <p className="text-sm text-muted">Nenhum compromisso hoje.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {todayEvents.map((ev) => (
                  <div key={ev.id} className="flex items-center gap-3 text-sm">
                    <span className="w-16 shrink-0 text-xs text-muted">
                      {ev.allDay ? "Dia todo" : formatTime(ev.startAt)}
                    </span>
                    <span className="flex-1 truncate">{ev.title}</span>
                    {ev.leadName && <span className="text-xs text-muted shrink-0">{ev.leadName}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
