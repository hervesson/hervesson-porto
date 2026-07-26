export const PRIORITIES = [
  { value: "urgente", label: "Urgente", accent: "#ef4444" },
  { value: "normal", label: "Normal", accent: "#0090ff" },
  { value: "baixa", label: "Baixa", accent: "#8a8f98" },
] as const;

export type TaskPriority = (typeof PRIORITIES)[number]["value"];
export const PRIORITY_VALUES: readonly string[] = PRIORITIES.map((p) => p.value);

export function priorityInfo(value: string) {
  return PRIORITIES.find((p) => p.value === value) ?? PRIORITIES[1];
}

export type TaskItem = {
  id: string;
  title: string;
  done: boolean;
  priority: string;
  dueAt: string | null;
  completedAt: string | null;
  leadId: string | null;
  lead: { id: string; name: string | null } | null;
  createdAt: string;
};

const PRIORITY_WEIGHT: Record<string, number> = { urgente: 0, normal: 1, baixa: 2 };

// Pendentes primeiro (por urgência, depois prazo — sem prazo por último);
// concluídas no fim, mais recente primeiro.
export function sortTasks(tasks: TaskItem[]): TaskItem[] {
  return [...tasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    if (a.done && b.done) {
      return (b.completedAt ?? "").localeCompare(a.completedAt ?? "");
    }
    const wa = PRIORITY_WEIGHT[a.priority] ?? 1;
    const wb = PRIORITY_WEIGHT[b.priority] ?? 1;
    if (wa !== wb) return wa - wb;
    if (!a.dueAt && !b.dueAt) return 0;
    if (!a.dueAt) return 1;
    if (!b.dueAt) return -1;
    return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
  });
}

// Segunda-feira da semana de `d`, à meia-noite UTC — em UTC pra bater com as
// comparações de data (.slice(0,10)) usadas no resto do app (board.tsx,
// tasks-panel.tsx); misturar horário local com UTC desalinha o limite da
// semana perto da virada do dia.
function startOfWeek(d: Date): Date {
  const day = d.getUTCDay(); // 0 = domingo
  const diff = (day === 0 ? -6 : 1) - day;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + diff));
}

function weekLabel(d: Date): string {
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "UTC" });
}

export type TaskStats = {
  weekRate: number | null; // % de conclusão da semana atual (por dueAt), null se não tinha nada com prazo
  completedThisWeek: number;
  overdueCount: number;
  trend: { key: string; label: string; rate: number; total: number }[]; // últimas 6 semanas
};

export function computeTaskStats(tasks: TaskItem[]): TaskStats {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const weekStart = startOfWeek(now);

  const inWeek = (iso: string, start: Date, end: Date) => {
    const t = new Date(iso).getTime();
    return t >= start.getTime() && t < end.getTime();
  };

  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);

  const dueThisWeek = tasks.filter((t) => t.dueAt && inWeek(t.dueAt, weekStart, weekEnd));
  const weekRate = dueThisWeek.length > 0 ? dueThisWeek.filter((t) => t.done).length / dueThisWeek.length : null;

  const completedThisWeek = tasks.filter(
    (t) => t.completedAt && inWeek(t.completedAt, weekStart, weekEnd),
  ).length;

  const overdueCount = tasks.filter((t) => !t.done && t.dueAt && t.dueAt.slice(0, 10) < today).length;

  const trend: TaskStats["trend"] = [];
  for (let i = 5; i >= 0; i--) {
    const start = new Date(weekStart);
    start.setUTCDate(start.getUTCDate() - i * 7);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 7);
    const due = tasks.filter((t) => t.dueAt && inWeek(t.dueAt, start, end));
    const done = due.filter((t) => t.done).length;
    trend.push({
      key: start.toISOString().slice(0, 10),
      label: weekLabel(start),
      rate: due.length > 0 ? done / due.length : 0,
      total: due.length,
    });
  }

  return { weekRate, completedThisWeek, overdueCount, trend };
}
