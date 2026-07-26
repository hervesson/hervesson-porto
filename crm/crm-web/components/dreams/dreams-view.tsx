"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Sparkles, ArrowUp, ArrowDown, Pencil, Trash2 } from "lucide-react";
import DreamForm, { type DreamItem } from "./dream-form";

export default function DreamsView() {
  const [dreams, setDreams] = useState<DreamItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<DreamItem | undefined>(undefined);

  const load = useCallback(async () => {
    const res = await fetch("/api/dreams", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setDreams(data.dreams);
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openNew() {
    setEditing(undefined);
    setModalOpen(true);
  }
  function openEdit(d: DreamItem) {
    setEditing(d);
    setModalOpen(true);
  }

  async function remove(id: string) {
    if (!confirm("Excluir este sonho?")) return;
    setDreams((prev) => prev.filter((d) => d.id !== id));
    await fetch(`/api/dreams/${id}`, { method: "DELETE" });
  }

  async function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= dreams.length) return;
    const a = dreams[index];
    const b = dreams[target];
    const next = [...dreams];
    next[index] = b;
    next[target] = a;
    setDreams(next);
    await Promise.all([
      fetch(`/api/dreams/${a.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: b.order }),
      }),
      fetch(`/api/dreams/${b.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: a.order }),
      }),
    ]);
    load();
  }

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Sonhos</h1>
          <p className="text-sm text-muted mt-0.5">
            O que te motiva — aparece todo dia no Dashboard, antes de qualquer número.
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-1.5 bg-brand text-brand-ink text-sm font-medium rounded-lg px-3 py-2 hover:opacity-90 transition shrink-0"
        >
          <Plus size={16} /> Novo sonho
        </button>
      </div>

      {!loaded ? (
        <p className="text-sm text-muted">Carregando…</p>
      ) : dreams.length === 0 ? (
        <div className="bg-surface border border-line rounded-xl p-8 text-center flex flex-col items-center gap-2">
          <Sparkles size={28} className="text-muted" />
          <p className="text-sm text-muted max-w-sm mx-auto">
            Nenhum sonho cadastrado ainda — adicione o primeiro pra ver aqui toda manhã.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {dreams.map((d, i) => (
            <div key={d.id} className="bg-surface border border-line rounded-xl overflow-hidden flex flex-col">
              <div className="relative h-40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={d.imageUrl} alt={d.title} className="w-full h-full object-cover" />
              </div>
              <div className="p-4 flex flex-col gap-1.5 flex-1">
                <p className="font-medium">{d.title}</p>
                {d.note && <p className="text-sm text-muted flex-1">{d.note}</p>}
                <div className="flex items-center justify-between pt-2 mt-auto">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      className="text-muted hover:text-cream transition disabled:opacity-30"
                      title="Mover pra cima"
                    >
                      <ArrowUp size={15} />
                    </button>
                    <button
                      onClick={() => move(i, 1)}
                      disabled={i === dreams.length - 1}
                      className="text-muted hover:text-cream transition disabled:opacity-30"
                      title="Mover pra baixo"
                    >
                      <ArrowDown size={15} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(d)} className="text-muted hover:text-brand transition" title="Editar">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => remove(d.id)} className="text-muted hover:text-red-400 transition" title="Excluir">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && <DreamForm dream={editing} onClose={() => setModalOpen(false)} onSaved={load} />}
    </div>
  );
}
