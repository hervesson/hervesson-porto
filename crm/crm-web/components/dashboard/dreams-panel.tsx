"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { computeTaskStats, type TaskItem } from "@/lib/tasks";
import type { DreamItem } from "@/components/dreams/dream-form";

export default function DreamsPanel() {
  const [dreams, setDreams] = useState<DreamItem[]>([]);
  const [weekRate, setWeekRate] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const [dreamsRes, tasksRes] = await Promise.all([
      fetch("/api/dreams", { cache: "no-store" }),
      fetch("/api/tasks", { cache: "no-store" }),
    ]);
    if (dreamsRes.ok) setDreams((await dreamsRes.json()).dreams);
    if (tasksRes.ok) {
      const { tasks }: { tasks: TaskItem[] } = await tasksRes.json();
      setWeekRate(computeTaskStats(tasks).weekRate);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!loaded) return null;

  return (
    <div className="bg-surface-2 border border-line rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-muted uppercase tracking-wide">Sonhos</p>
        <Link href="/sonhos" className="text-xs text-brand hover:underline flex items-center gap-1 shrink-0">
          Gerenciar sonhos <ArrowRight size={12} />
        </Link>
      </div>

      {dreams.length === 0 ? (
        <div className="text-center py-6 flex flex-col items-center gap-2">
          <Sparkles size={22} className="text-muted" />
          <p className="text-sm text-muted">Adicione seus sonhos pra ver aqui toda manhã.</p>
          <Link href="/sonhos" className="text-xs text-brand hover:underline">
            Adicionar sonho →
          </Link>
        </div>
      ) : (
        <>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {dreams.map((d) => (
              <div
                key={d.id}
                className="relative shrink-0 w-56 h-32 rounded-xl overflow-hidden"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={d.imageUrl} alt={d.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-sm font-semibold text-white leading-tight">{d.title}</p>
                  {d.note && (
                    <p className="text-[11px] text-white/80 leading-snug line-clamp-2 mt-0.5">{d.note}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted mt-3">
            {weekRate !== null ? (
              <>
                Essa semana você concluiu{" "}
                <span className="text-brand font-medium">{Math.round(weekRate * 100)}%</span> das
                suas tarefas — cada uma te aproxima dos seus sonhos.
              </>
            ) : (
              "Continue firme — cada tarefa concluída te aproxima dos seus sonhos."
            )}
          </p>
        </>
      )}
    </div>
  );
}
