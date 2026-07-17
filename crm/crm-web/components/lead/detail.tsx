"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Send } from "lucide-react";
import { formatPhone } from "@/lib/phone";
import { STAGE_LABEL } from "@/lib/stages";

type Msg = {
  id: string;
  direction: string;
  author: string;
  body: string;
  createdAt: string;
};
type Lead = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  source: string;
  stage: string;
  aiPaused: boolean;
  summary: string | null;
  note: string | null;
  messages: Msg[];
};

const authorLabel: Record<string, string> = {
  lead: "Lead",
  ia: "IA",
  hervesson: "Você",
};

export default function LeadDetail({ leadId }: { leadId: string }) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/leads/${leadId}`, { cache: "no-store" });
    if (res.ok) setLead((await res.json()).lead);
  }, [leadId]);

  useEffect(() => {
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lead?.messages.length]);

  async function toggleAssumir() {
    if (!lead) return;
    const aiPaused = !lead.aiPaused;
    setLead({ ...lead, aiPaused });
    await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aiPaused }),
    });
  }

  async function send() {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId, body }),
    });
    setSending(false);
    if (res.ok) {
      setText("");
      load();
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Falha ao enviar.");
    }
  }

  if (!lead) return <div className="p-6 text-muted">Carregando…</div>;

  return (
    <div className="flex-1 min-h-0 grid grid-rows-[auto_1fr_auto] md:grid-cols-[1fr_280px] md:grid-rows-[1fr_auto]">
      {/* Thread */}
      <div className="md:row-span-2 min-h-0 overflow-y-auto p-4 flex flex-col gap-3 order-2 md:order-1">
        {lead.messages.length === 0 && (
          <p className="text-muted text-sm">Nenhuma mensagem ainda.</p>
        )}
        {lead.messages.map((m) => {
          const mine = m.direction === "out";
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-3 py-2 ${
                  mine
                    ? m.author === "ia"
                      ? "bg-brand/20 border border-brand/30"
                      : "bg-emerald-500/15 border border-emerald-500/30"
                    : "bg-surface-2 border border-line"
                }`}
              >
                <p className="text-[10px] text-muted mb-0.5">{authorLabel[m.author] ?? m.author}</p>
                <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Ficha */}
      <aside className="border-b md:border-b-0 md:border-l border-line p-4 flex flex-col gap-3 order-1 md:order-2">
        <Field label="Telefone" value={formatPhone(lead.phone)} />
        {lead.email && <Field label="Email" value={lead.email} />}
        <Field label="Origem" value={lead.source} />
        <Field label="Estágio" value={STAGE_LABEL[lead.stage as keyof typeof STAGE_LABEL] ?? lead.stage} />
        {lead.summary && <Field label="Resumo (IA)" value={lead.summary} />}

        <button
          onClick={toggleAssumir}
          className={`mt-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
            lead.aiPaused
              ? "bg-brand text-brand-ink hover:opacity-90"
              : "bg-surface-2 border border-line hover:border-amber-400 text-amber-300"
          }`}
        >
          {lead.aiPaused ? "Devolver p/ IA" : "Assumir conversa"}
        </button>
        <p className="text-[11px] text-muted">
          {lead.aiPaused
            ? "A IA está pausada. Suas mensagens vão direto ao lead."
            : "A IA está respondendo automaticamente este lead."}
        </p>
      </aside>

      {/* Caixa de resposta */}
      <div className="border-t border-line p-3 flex gap-2 order-3 md:col-start-1">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          placeholder={lead.aiPaused ? "Responder como você…" : "Responder (assume a conversa)…"}
          className="flex-1 bg-surface-2 border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-brand"
        />
        <button
          onClick={send}
          disabled={sending || !text.trim()}
          className="bg-brand text-brand-ink rounded-lg px-4 flex items-center gap-1.5 text-sm font-medium disabled:opacity-50"
        >
          <Send size={15} /> Enviar
        </button>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-muted">{label}</p>
      <p className="text-sm break-words">{value}</p>
    </div>
  );
}
