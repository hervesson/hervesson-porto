"use client";

import { useEffect, useState } from "react";
import { Bot } from "lucide-react";

// Interruptor geral do pré-atendimento por IA — desliga a resposta
// automática em todas as conversas de uma vez (ex: fora do horário
// comercial), sem mexer no "Assumir" individual de cada lead.
export default function AiToggle() {
  const [enabled, setEnabled] = useState<boolean | null>(null); // null = carregando
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings/ai", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setEnabled(d.enabled))
      .catch(() => setEnabled(true));
  }, []);

  async function toggle() {
    if (enabled === null || saving) return;
    const next = !enabled;
    setSaving(true);
    setEnabled(next); // otimista
    try {
      const res = await fetch("/api/settings/ai", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setEnabled(!next); // reverte se falhar
    } finally {
      setSaving(false);
    }
  }

  const on = enabled ?? true;

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={enabled === null || saving}
      title={on ? "IA respondendo automaticamente — clique pra desligar" : "IA desligada — ninguém recebe resposta automática"}
      className={`flex items-center gap-2 text-xs px-2.5 py-1 rounded-full border transition-colors disabled:opacity-60 ${
        on
          ? "border-brand/40 text-brand bg-brand/10 hover:bg-brand/15"
          : "border-line text-muted bg-surface-2 hover:bg-line"
      }`}
    >
      <Bot className="w-3.5 h-3.5" />
      IA {on ? "ligada" : "desligada"}
      <span
        className={`ml-0.5 w-7 h-4 rounded-full relative transition-colors ${on ? "bg-brand" : "bg-line"}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
            on ? "translate-x-3" : "translate-x-0"
          }`}
        />
      </span>
    </button>
  );
}
