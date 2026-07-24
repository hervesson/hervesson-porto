"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Plus, Wallet } from "lucide-react";
import { formatBRL } from "@/lib/money";
import { categoryLabel, methodLabel, statusInfo, DESPESA_CATEGORIES } from "@/lib/transactions";
import StatCard from "@/components/ui/stat-card";
import NewTransactionModal from "./new-transaction-modal";

type Tx = {
  id: string;
  type: string;
  description: string;
  value: number;
  category: string;
  method: string;
  status: string;
  date: string;
};

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
}

const MONTHS_BACK = 6;

export default function FinanceView() {
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/transactions", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setTxs(data.transactions);
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 10000); // polling — realtime simples
    return () => clearInterval(t);
  }, [load]);

  async function remove(id: string) {
    if (!confirm("Excluir este lançamento?")) return;
    await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    load();
  }

  async function cycleStatus(tx: Tx) {
    const order = ["pendente", "pago", "atrasado"];
    const next = order[(order.indexOf(tx.status) + 1) % order.length];
    setTxs((prev) => prev.map((t) => (t.id === tx.id ? { ...t, status: next } : t)));
    await fetch(`/api/transactions/${tx.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
  }

  const now = new Date();
  const currentMonth = monthKey(now);

  const stats = useMemo(() => {
    const thisMonth = txs.filter((t) => monthKey(new Date(t.date)) === currentMonth);
    const receitaMes = thisMonth
      .filter((t) => t.type === "receita")
      .reduce((s, t) => s + t.value, 0);
    const despesaMes = thisMonth
      .filter((t) => t.type === "despesa")
      .reduce((s, t) => s + t.value, 0);
    const lucro = receitaMes - despesaMes;

    const saldo = txs
      .filter((t) => t.status === "pago")
      .reduce((s, t) => s + (t.type === "receita" ? t.value : -t.value), 0);

    return { receitaMes, despesaMes, lucro, saldo };
  }, [txs, currentMonth]);

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

  const costCenters = useMemo(() => {
    const thisMonthDespesas = txs.filter(
      (t) => t.type === "despesa" && monthKey(new Date(t.date)) === currentMonth,
    );
    const total = thisMonthDespesas.reduce((s, t) => s + t.value, 0);
    return DESPESA_CATEGORIES.map((c) => {
      const value = thisMonthDespesas
        .filter((t) => t.category === c.value)
        .reduce((s, t) => s + t.value, 0);
      return { label: c.label, value, pct: total > 0 ? (value / total) * 100 : 0 };
    }).filter((c) => c.value > 0);
  }, [txs, currentMonth]);

  const recent = useMemo(() => txs.slice(0, 30), [txs]);

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Financeiro</h1>
          <p className="text-sm text-muted mt-0.5">
            Fluxo de caixa, receitas e despesas — lançado manualmente, refletido na hora.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 bg-brand text-brand-ink text-sm font-medium rounded-lg px-3 py-2 hover:opacity-90 transition shrink-0"
        >
          <Plus size={16} /> Novo lançamento
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Receita (mês)" value={formatBRL(stats.receitaMes)} tone="pos" />
        <StatCard label="Despesas (mês)" value={formatBRL(stats.despesaMes)} tone="neg" />
        <StatCard
          label="Lucro líquido (mês)"
          value={formatBRL(stats.lucro)}
          tone={stats.lucro >= 0 ? "pos" : "neg"}
        />
        <StatCard label="Saldo em caixa" value={formatBRL(stats.saldo)} />
      </div>

      <div className="bg-surface-2 border border-line rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-medium text-muted uppercase tracking-wide">
            Fluxo de caixa — últimos {MONTHS_BACK} meses
          </p>
          <div className="flex items-center gap-3 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> Receita
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-400" /> Despesa
            </span>
          </div>
        </div>
        <div className="flex items-end justify-between gap-2 h-40">
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

      {costCenters.length > 0 && (
        <div className="bg-surface-2 border border-line rounded-xl p-4">
          <p className="text-xs font-medium text-muted uppercase tracking-wide mb-3">
            Centro de custos (mês atual)
          </p>
          <div className="flex flex-col gap-2.5">
            {costCenters.map((c) => (
              <div key={c.label} className="flex items-center gap-3 text-sm">
                <span className="w-28 shrink-0 text-muted">{c.label}</span>
                <div className="flex-1 h-2 rounded-full bg-surface overflow-hidden">
                  <div
                    className="h-full bg-brand rounded-full"
                    style={{ width: `${c.pct}%` }}
                  />
                </div>
                <span className="w-24 shrink-0 text-right font-medium">
                  {formatBRL(c.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-surface border border-line rounded-xl overflow-hidden">
        <p className="text-xs font-medium text-muted uppercase tracking-wide px-4 py-3 border-b border-line">
          Lançamentos recentes
        </p>
        {!loaded ? (
          <p className="p-6 text-sm text-muted">Carregando…</p>
        ) : recent.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center gap-2">
            <Wallet size={28} className="text-muted" />
            <p className="text-sm text-muted max-w-sm mx-auto">
              Nenhum lançamento ainda — clique em &quot;Novo lançamento&quot; pra registrar a
              primeira receita ou despesa.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-muted uppercase tracking-wide">
                  <th className="px-4 py-3 font-medium">Descrição</th>
                  <th className="px-4 py-3 font-medium">Categoria</th>
                  <th className="px-4 py-3 font-medium">Data</th>
                  <th className="px-4 py-3 font-medium">Método</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Valor</th>
                  <th className="px-4 py-3 font-medium w-8" />
                </tr>
              </thead>
              <tbody>
                {recent.map((t) => {
                  const s = statusInfo(t.status);
                  return (
                    <tr
                      key={t.id}
                      className="border-b border-line last:border-b-0 hover:bg-surface-2/60 transition"
                    >
                      <td className="px-4 py-3 font-medium">{t.description}</td>
                      <td className="px-4 py-3 text-muted">
                        {categoryLabel(t.type, t.category)}
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {new Date(t.date).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-4 py-3 text-muted">{methodLabel(t.method)}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => cycleStatus(t)}
                          title="Clique pra mudar o status"
                          className={`text-xs px-2 py-0.5 rounded-full ${s.className}`}
                        >
                          {s.label}
                        </button>
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-medium ${
                          t.type === "receita" ? "text-emerald-300" : "text-red-300"
                        }`}
                      >
                        {t.type === "receita" ? "+" : "-"}
                        {formatBRL(t.value)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => remove(t.id)}
                          className="text-muted hover:text-red-400 transition text-xs"
                          title="Excluir"
                        >
                          ✕
                        </button>
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
        <NewTransactionModal onClose={() => setModalOpen(false)} onCreated={load} />
      )}
    </div>
  );
}
