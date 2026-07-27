"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Send, MoreVertical, Check, CheckCheck, Paperclip, Smile, FileText } from "lucide-react";
import EmojiPicker, { Theme, type EmojiClickData } from "emoji-picker-react";
import { formatPhone } from "@/lib/phone";
import { STAGE_LABEL } from "@/lib/stages";
import { originLabel } from "@/lib/lead-origin";
import { formatTime } from "@/lib/relative-time";

// mesmos placeholders que o webhook grava quando a mídia recebida não tem
// legenda (app/api/whatsapp/webhook/route.ts) — evita repetir o texto
// embaixo do player/preview que já mostra a mídia
const MEDIA_PLACEHOLDER_BODIES = new Set(["[áudio]", "[imagem]", "[vídeo]", "[documento]"]);

type Msg = {
  id: string;
  direction: string;
  author: string;
  status: string;
  body: string;
  mediaUrl: string | null;
  mediaType: string | null;
  fileName: string | null;
  createdAt: string;
};
type Lead = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  avatarUrl: string | null;
  company: string | null;
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

function Ticks({ status }: { status: string }) {
  if (status === "read") return <CheckCheck size={13} className="text-brand shrink-0" />;
  if (status === "delivered") return <CheckCheck size={13} className="text-muted shrink-0" />;
  if (status === "failed") return <Check size={13} className="text-red-400 shrink-0" />;
  return <Check size={13} className="text-muted shrink-0" />;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function LeadDetail({ leadId }: { leadId: string }) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/leads/${leadId}`, { cache: "no-store" });
    if (res.ok) setLead((await res.json()).lead);
  }, [leadId]);

  useEffect(() => {
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [load]);

  // abrir a conversa marca como lida
  useEffect(() => {
    fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markRead: true }),
    });
  }, [leadId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lead?.messages.length]);

  useEffect(() => {
    if (!showEmoji) return;
    function onClickOutside(e: MouseEvent) {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) setShowEmoji(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [showEmoji]);

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

  async function sendFile(file: File) {
    setSending(true);
    try {
      const base64 = await fileToBase64(file);
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId,
          file: { name: file.name, mimeType: file.type || "application/octet-stream", base64 },
        }),
      });
      if (res.ok) {
        load();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Falha ao enviar arquivo.");
      }
    } finally {
      setSending(false);
    }
  }

  function onEmojiClick(data: EmojiClickData) {
    setText((t) => t + data.emoji);
  }

  if (!lead) return <div className="p-6 text-muted">Carregando…</div>;

  const initials = (lead.name ?? "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const ficha = (
    <>
      <Field label="Telefone" value={formatPhone(lead.phone)} />
      {lead.email && <Field label="Email" value={lead.email} />}
      <Field label="Origem" value={originLabel(lead.source)} />
      <Field label="Estágio" value={STAGE_LABEL[lead.stage as keyof typeof STAGE_LABEL] ?? lead.stage} />
      {lead.summary && <Field label="Resumo (IA)" value={lead.summary} />}
      <p className="text-[11px] text-muted">
        {lead.aiPaused
          ? "A IA está pausada. Suas mensagens vão direto ao lead."
          : "A IA está respondendo automaticamente este lead."}
      </p>
    </>
  );

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="border-b border-line px-4 py-3 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {lead.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={lead.avatarUrl}
              alt=""
              className="w-9 h-9 rounded-full object-cover shrink-0"
            />
          ) : (
            <span className="w-9 h-9 rounded-full bg-brand/15 text-brand text-xs font-medium flex items-center justify-center shrink-0">
              {initials || "?"}
            </span>
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{lead.name ?? formatPhone(lead.phone)}</p>
            {lead.company && <p className="text-xs text-muted truncate">{lead.company}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={toggleAssumir}
            className={`text-xs font-medium px-2.5 py-1.5 rounded-lg border transition ${
              lead.aiPaused
                ? "bg-brand text-brand-ink border-brand hover:opacity-90"
                : "bg-surface-2 border-line hover:border-amber-400 text-amber-300"
            }`}
          >
            {lead.aiPaused ? "Devolver p/ IA" : "Assumir conversa"}
          </button>
          <button
            onClick={() => setShowInfo((v) => !v)}
            title="Mostrar/ocultar informações"
            className={`transition ${showInfo ? "text-cream" : "text-muted hover:text-cream"}`}
          >
            <MoreVertical size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col md:flex-row">
        {showInfo && (
          <aside className="md:hidden border-b border-line p-4 flex flex-col gap-3 shrink-0">
            {ficha}
          </aside>
        )}

        <div className="flex-1 min-h-0 overflow-y-auto p-4 flex flex-col gap-3">
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

                  {m.mediaUrl && m.mediaType === "image" && (
                    <a href={m.mediaUrl} target="_blank" rel="noopener noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={m.mediaUrl}
                        alt={m.fileName ?? "imagem"}
                        className="rounded-lg max-w-full max-h-64 mb-1"
                      />
                    </a>
                  )}
                  {m.mediaUrl && m.mediaType === "audio" && (
                    <audio controls src={m.mediaUrl} className="max-w-full mb-1" style={{ height: 36 }} />
                  )}
                  {m.mediaUrl && m.mediaType !== "image" && m.mediaType !== "audio" && (
                    <a
                      href={m.mediaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-surface/60 border border-line rounded-lg px-2.5 py-2 mb-1 hover:border-brand/50 transition"
                    >
                      <FileText size={16} className="shrink-0" />
                      <span className="text-xs truncate">{m.fileName ?? "arquivo"}</span>
                    </a>
                  )}
                  {m.body && !(m.mediaType && MEDIA_PLACEHOLDER_BODIES.has(m.body)) && (
                    <p className="text-sm whitespace-pre-wrap wrap-break-word">{m.body}</p>
                  )}

                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span className="text-[10px] text-muted">{formatTime(m.createdAt)}</span>
                    {mine && <Ticks status={m.status} />}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {showInfo && (
          <aside className="hidden md:flex md:w-70 border-l border-line p-4 flex-col gap-3 shrink-0">
            {ficha}
          </aside>
        )}
      </div>

      <div className="border-t border-line p-3 flex items-center gap-3 shrink-0 relative">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) sendFile(f);
            e.target.value = "";
          }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={sending}
          title="Anexar arquivo"
          className="w-9 h-9 flex items-center justify-center rounded-lg text-muted hover:text-cream hover:bg-surface-2 transition disabled:opacity-50 shrink-0"
        >
          <Paperclip size={18} />
        </button>

        <div ref={emojiRef} className="relative shrink-0">
          <button
            onClick={() => setShowEmoji((v) => !v)}
            title="Emoji"
            className={`w-9 h-9 flex items-center justify-center rounded-lg transition ${
              showEmoji ? "text-cream bg-surface-2" : "text-muted hover:text-cream hover:bg-surface-2"
            }`}
          >
            <Smile size={18} />
          </button>
          {showEmoji && (
            <div className="absolute bottom-full left-0 mb-2 z-50 shadow-xl rounded-xl overflow-hidden">
              <EmojiPicker
                theme={Theme.DARK}
                onEmojiClick={onEmojiClick}
                autoFocusSearch={false}
                width={300}
                height={360}
              />
            </div>
          )}
        </div>

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
          className="bg-brand text-brand-ink rounded-lg px-4 py-2 flex items-center gap-1.5 text-sm font-medium disabled:opacity-50 shrink-0"
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
      <p className="text-sm wrap-break-word">{value}</p>
    </div>
  );
}
