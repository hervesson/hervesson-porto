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
  const [tab, setTab] = useState<Tab>("todas");
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

  const today = new Date().toISOString().slice(0, 10);

  const sorted = useMemo(() => sortTasks(tasks), [tasks]);
  const filtered = useMemo(() => {
    if (tab === "pendentes") return sorted.filter((t) => !t.done);
    if (tab === "concluidas") return sorted.filter((t) => t.done);
    return sorted;
  }, [sorted, tab]);

  const todayTasks = useMemo(
    () => sorted.filter((t) => t.dueAt && t.dueAt.slice(0, 10) === today),
    [sorted, today],
  );
  const overdueTasks = useMemo(
    () => sorted.filter((t) => !t.done && t.dueAt && t.dueAt.slice(0, 10) < today),
    [sorted, today],
  );

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

      <div className="bg-surface-2 border border-line rounded-xl p-4 pt-5">
        <p className="text-xs font-medium text-muted uppercase tracking-wide">
          Produtividade — últimas 6 semanas
        </p>
        <p className="text-xs text-muted/70 mt-0.5 mb-5">
          % das tarefas com prazo naquela semana que foram concluídas
        </p>
        <div className="flex gap-3">
          {/* eixo Y — escala fixa 0-100%, não normalizada pelo maior valor da
              amostra (senão uma semana fraca de 40% pareceria "cheia") */}
          <div className="flex flex-col justify-between h-28 text-[10px] text-muted shrink-0">
            <span>100%</span>
            <span>50%</span>
            <span>0%</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="relative h-28">
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                <div className="border-t border-line/50" />
                <div className="border-t border-line/50" />
                <div className="border-t border-line/50" />
              </div>
              <div className="absolute inset-0 flex items-end justify-between gap-2">
                {stats.trend.map((w) => (
                  <div key={w.key} className="flex-1 h-full relative flex justify-center">
                    <span
                      className="absolute text-[10px] text-muted whitespace-nowrap"
                      style={{ bottom: `calc(${w.rate * 100}% + 4px)` }}
                    >
                      {Math.round(w.rate * 100)}%
                    </span>
                    <div
                      className="absolute bottom-0 w-6 rounded-t bg-brand/80"
                      style={{ height: `${w.rate * 100}%` }}
                      title={w.total > 0 ? `${Math.round(w.rate * 100)}% (${w.total} com prazo)` : "sem tarefas com prazo essa semana"}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-between gap-2 mt-1.5">
              {stats.trend.map((w) => (
                <span key={w.key} className="flex-1 text-center text-[10px] text-muted">
                  {w.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TaskListSection
          title="Hoje"
          tasks={todayTasks}
          emptyMessage="Nada com prazo pra hoje."
          today={today}
          loaded={loaded}
          onToggle={toggleDone}
          onEdit={openEdit}
          onRemove={remove}
        />
        <TaskListSection
          title="Atrasadas"
          tasks={overdueTasks}
          emptyMessage="Nada atrasado — tudo em dia."
          today={today}
          loaded={loaded}
          onToggle={toggleDone}
          onEdit={openEdit}
          onRemove={remove}
        />
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

      <div className="bg-surface border border-line rounded-xl overflow-hidden shrink-0">
        {!loaded ? (
          <p className="p-6 text-sm text-muted">Carregando…</p>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center gap-2">
            <CheckSquare size={28} className="text-muted" />
            <p className="text-sm text-muted max-w-sm mx-auto">Nenhuma tarefa por aqui.</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {filtered.map((t) => (
              <TaskRow key={t.id} task={t} today={today} onToggle={toggleDone} onEdit={openEdit} onRemove={remove} />
            ))}
          </div>
        )}
      </div>

      {modalOpen && <TaskForm task={editing} onClose={() => setModalOpen(false)} onSaved={load} />}
    </div>
  );
}

function TaskRow({
  task,
  today,
  onToggle,
  onEdit,
  onRemove,
}: {
  task: TaskItem;
  today: string;
  onToggle: (t: TaskItem) => void;
  onEdit: (t: TaskItem) => void;
  onRemove: (id: string) => void;
}) {
  const p = priorityInfo(task.priority);
  const overdue = !task.done && !!task.dueAt && task.dueAt.slice(0, 10) < today;
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-line last:border-b-0 hover:bg-surface-2/60 transition">
      <button
        onClick={() => onToggle(task)}
        className={`shrink-0 w-4 h-4 rounded border flex items-center justify-center transition ${
          task.done ? "bg-brand border-brand" : "border-line hover:border-brand/60"
        }`}
        title={task.done ? "Marcar como pendente" : "Marcar como feita"}
      >
        {task.done && <span className="text-brand-ink text-[10px] leading-none">✓</span>}
      </button>
      <span className="shrink-0 w-2 h-2 rounded-full" style={{ background: p.accent }} title={p.label} />
      <span
        onClick={() => onEdit(task)}
        className={`flex-1 min-w-0 truncate text-sm cursor-pointer ${task.done ? "line-through text-muted" : ""}`}
      >
        {task.title}
      </span>
      {task.lead && (
        <Link
          href={`/lead/${task.lead.id}`}
          className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-surface-2 border border-line text-muted hover:text-brand hover:border-brand/40 transition"
        >
          {task.lead.name ?? "lead"}
        </Link>
      )}
      {task.dueAt && (
        <span
          className={`shrink-0 flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full ${
            overdue ? "bg-red-500/15 text-red-300" : "bg-surface-2 border border-line text-muted"
          }`}
        >
          {overdue && <Clock size={10} />}
          {new Date(task.dueAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "UTC" })}
        </span>
      )}
      <button onClick={() => onRemove(task.id)} className="shrink-0 text-muted hover:text-red-400 transition text-xs" title="Excluir">
        ✕
      </button>
    </div>
  );
}

function TaskListSection({
  title,
  tasks,
  emptyMessage,
  today,
  loaded,
  onToggle,
  onEdit,
  onRemove,
}: {
  title: string;
  tasks: TaskItem[];
  emptyMessage: string;
  today: string;
  loaded: boolean;
  onToggle: (t: TaskItem) => void;
  onEdit: (t: TaskItem) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="bg-surface border border-line rounded-xl overflow-hidden flex flex-col shrink-0">
      <p className="text-xs font-medium text-muted uppercase tracking-wide px-4 py-3 border-b border-line">
        {title} <span className="text-cream/60 normal-case">· {tasks.length}</span>
      </p>
      {!loaded ? (
        <p className="p-6 text-sm text-muted">Carregando…</p>
      ) : tasks.length === 0 ? (
        <p className="p-6 text-sm text-muted">{emptyMessage}</p>
      ) : (
        <div className="flex flex-col max-h-72 overflow-y-auto">
          {tasks.map((t) => (
            <TaskRow key={t.id} task={t} today={today} onToggle={onToggle} onEdit={onEdit} onRemove={onRemove} />
          ))}
        </div>
      )}
    </div>
  );
}
