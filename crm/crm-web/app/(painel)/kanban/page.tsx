import Board from "@/components/kanban/board";

export const dynamic = "force-dynamic";

export default function KanbanPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="px-4 sm:px-6 py-3 border-b border-line flex items-center justify-between">
        <h1 className="text-lg font-semibold">Leads</h1>
        <p className="text-sm text-muted">Arraste os cards entre as colunas</p>
      </div>
      <Board />
    </div>
  );
}
