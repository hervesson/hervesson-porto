"use client";

import { useEffect, useState, useCallback } from "react";
import { CheckSquare } from "lucide-react";
import { sortTasks, type TaskItem } from "@/lib/tasks";

export default function TasksPanel() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [title, setTitle] = useState("");
  const [dueAt, setDueAt] = useState("");

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
    const t = setInterval(load, 10000); // polling — realtime simples
    return () => clearInterval(t);
  }, [load]);

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    setTitle("");
    setDueAt("");
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: trimmed, dueAt: dueAt || null }),
    });
    load();
  }

  async function toggleDone(task: TaskItem) {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t)));
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !task.done }),
    });
  }

  async function remove(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
  }

  const sorted = sortTasks(tasks);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="bg-surface-2 border border-line rounded-xl p-4">
      <p className="text-xs font-medium text-muted uppercase tracking-wide mb-3">
        Minhas tarefas
      </p>

      <form onSubmit={addTask} className="flex items-center gap-2 mb-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nova tarefa…"
          className="flex-1 min-w-0 bg-surface border border-line rounded-lg px-3 py-1.5 text-sm outline-none focus:border-brand/50"
        />
        <input
          type="date"
          value={dueAt}
          onChange={(e) => setDueAt(e.target.value)}
          className="w-32 shrink-0 bg-surface border border-line rounded-lg px-2 py-1.5 text-xs text-muted outline-none focus:border-brand/50"
        />
        <button
          type="submit"
          className="shrink-0 bg-brand text-brand-ink text-sm font-medium rounded-lg px-3 py-1.5 hover:opacity-90 transition"
        >
          +
        </button>
      </form>

      {!loaded ? (
        <p className="text-sm text-muted">Carregando…</p>
      ) : sorted.length === 0 ? (
        <div className="text-center py-4 flex flex-col items-center gap-1.5">
          <CheckSquare size={22} className="text-muted" />
          <p className="text-xs text-muted">Nenhuma tarefa. Adicione uma acima.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto">
          {sorted.map((t) => {
            const overdue = !t.done && !!t.dueAt && t.dueAt.slice(0, 10) < today;
            return (
              <div key={t.id} className="flex items-center gap-2.5 group">
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
                  className={`flex-1 min-w-0 truncate text-sm ${
                    t.done ? "line-through text-muted" : ""
                  }`}
                >
                  {t.title}
                </span>
                {t.dueAt && (
                  <span
                    className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded ${
                      overdue ? "bg-red-500/15 text-red-300" : "bg-surface border border-line text-muted"
                    }`}
                  >
                    {new Date(t.dueAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                  </span>
                )}
                <button
                  onClick={() => remove(t.id)}
                  className="shrink-0 text-muted hover:text-red-400 transition text-xs opacity-0 group-hover:opacity-100"
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
  );
}
