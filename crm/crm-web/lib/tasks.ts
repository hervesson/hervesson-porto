export type TaskItem = {
  id: string;
  title: string;
  done: boolean;
  dueAt: string | null;
  leadId: string | null;
  lead: { id: string; name: string | null } | null;
  createdAt: string;
};

// Pendentes primeiro (por prazo, sem prazo por último), concluídas no fim.
export function sortTasks(tasks: TaskItem[]): TaskItem[] {
  return [...tasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    if (!a.dueAt && !b.dueAt) return 0;
    if (!a.dueAt) return 1;
    if (!b.dueAt) return -1;
    return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
  });
}
