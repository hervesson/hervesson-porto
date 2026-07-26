"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { Plus, CheckSquare, Clock } from "lucide-react";
import { sortTasks, computeTaskStats, priorityInfo, type TaskItem } from "@/lib/tasks";
import StatCard from "@/components/ui/stat-card";
import TaskForm from "./task-form";

const TABS = [
  { key: "todas", label: "Todas" },
  { key: "concluidas", label: "Concluídas" },
  { key: "pendentes", label: "Pendentes" },
] as const;
type Tab = (typeof TABS)[number]["key"];

export default function TarefasView() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState<Tab>("pendentes");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TaskItem | undefined>(undefined);

  const load = useCallback(async () => {
    const res = await fetch("/api/tasks", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setTasks(data.tasks);
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [load]);

  async function toggleDone(task: TaskItem) {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t)));
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !task.done }),
    });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Excluir esta tarefa?")) return;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
  }

  function openNew() {
    setEditing(undefined);
    setModalOpen(true);
  }
  function openEdit(t: TaskItem) {
    setEditing(t);
    setModalOpen(true);
  }

  const stats = useMemo(() => computeTaskStats(tasks), [tasks]);
  const maxTrend = Math.max(1, ...stats.trend.map((w) => w.rate));

  const sorted = useMemo(() => sortTasks(tasks), [tasks]);
  const filtered = useMemo(() => {
    if (tab === "pendentes") return sorted.filter((t) => !t.done);
    if (tab === "concluidas") return sorted.filter((t) => t.done);
    return sorted;
  }, [sorted, tab]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Tarefas</h1>
          <p className="text-sm text-muted mt-0.5">Organização pessoal — urgência, prazo e produtividade da semana.</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-1.5 bg-brand text-brand-ink text-sm font-medium rounded-lg px-3 py-2 hover:opacity-90 transition shrink-0"
        >
          <Plus size={16} /> Nova tarefa
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard
          label="Taxa de conclusão (semana)"
          value={stats.weekRate === null ? "—" : `${Math.round(stats.weekRate * 100)}%`}
        />
        <StatCard label="Concluídas (semana)" value={String(stats.completedThisWeek)} />
        <StatCard
          label="Atrasadas"
          value={String(stats.overdueCount)}
          tone={stats.overdueCount > 0 ? "neg" : undefined}
        />
      </div>

      <div className="bg-surface-2 border border-line rounded-xl p-4">
        <p className="text-xs font-medium text-muted uppercase tracking-wide mb-4">
          Produtividade — últimas 6 semanas
        </p>
        <div className="flex items-end justify-between gap-2 h-28">
          {stats.trend.map((w) => (
            <div key={w.key} className="flex-1 flex flex-col items-center gap-1.5 h-full">
              <div className="flex-1 w-full flex items-end justify-center">
                <div
                  className="w-6 rounded-t bg-brand/80"
                  style={{ height: `${(w.rate / maxTrend) * 100}%` }}
                  title={w.total > 0 ? `${Math.round(w.rate * 100)}% (${w.total} com prazo)` : "sem tarefas com prazo"}
                />
              </div>
              <span className="text-[10px] text-muted">{w.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-1 border-b border-line">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition ${
              tab === t.key ? "border-brand text-cream" : "border-transparent text-muted hover:text-cream"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-surface border border-line rounded-xl overflow-hidden">
        {!loaded ? (
          <p className="p-6 text-sm text-muted">Carregando…</p>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center gap-2">
            <CheckSquare size={28} className="text-muted" />
            <p className="text-sm text-muted max-w-sm mx-auto">Nenhuma tarefa por aqui.</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {filtered.map((t) => {
              const p = priorityInfo(t.priority);
              const overdue = !t.done && !!t.dueAt && t.dueAt.slice(0, 10) < today;
              return (
                <div
                  key={t.id}
                  className="flex items-center gap-3 px-4 py-3 border-b border-line last:border-b-0 hover:bg-surface-2/60 transition"
                >
                  <button
                    onClick={() => toggleDone(t)}
                    className={`shrink-0 w-4 h-4 rounded border flex items-center justify-center transition ${
                      t.done ? "bg-brand border-brand" : "border-line hover:border-brand/60"
                    }`}
                    title={t.done ? "Marcar como pendente" : "Marcar como feita"}
                  >
                    {t.done && <span className="text-brand-ink text-[10px] leading-none">✓</span>}
                  </button>
                  <span
                    className="shrink-0 w-2 h-2 rounded-full"
                    style={{ background: p.accent }}
                    title={p.label}
                  />
                  <span
                    onClick={() => openEdit(t)}
                    className={`flex-1 min-w-0 truncate text-sm cursor-pointer ${
                      t.done ? "line-through text-muted" : ""
                    }`}
                  >
                    {t.title}
                  </span>
                  {t.lead && (
                    <Link
                      href={`/lead/${t.lead.id}`}
                      className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-surface-2 border border-line text-muted hover:text-brand hover:border-brand/40 transition"
                    >
                      {t.lead.name ?? "lead"}
                    </Link>
                  )}
                  {t.dueAt && (
                    <span
                      className={`shrink-0 flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full ${
                        overdue ? "bg-red-500/15 text-red-300" : "bg-surface-2 border border-line text-muted"
                      }`}
                    >
                      {overdue && <Clock size={10} />}
                      {new Date(t.dueAt).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        timeZone: "UTC",
                      })}
                    </span>
                  )}
                  <button
                    onClick={() => remove(t.id)}
                    className="shrink-0 text-muted hover:text-red-400 transition text-xs"
                    title="Excluir"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {modalOpen && <TaskForm task={editing} onClose={() => setModalOpen(false)} onSaved={load} />}
    </div>
  );
}
