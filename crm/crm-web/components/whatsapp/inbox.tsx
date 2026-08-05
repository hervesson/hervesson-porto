"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Search } from "lucide-react";
import LeadDetail from "@/components/lead/detail";
import AiToggle from "@/components/whatsapp/ai-toggle";
import { formatPhone } from "@/lib/phone";
import { timeAgo } from "@/lib/relative-time";

type ConversationLead = {
  id: string;
  name: string | null;
  phone: string | null;
  company: string | null;
  avatarUrl: string | null;
  aiPaused: boolean;
  updatedAt: string;
  unreadCount: number;
  messages: { body: string; direction: string; createdAt: string }[];
};

function initialsOf(name: string | null) {
  return (name ?? "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export default function WhatsappInbox({ online }: { online: boolean }) {
  const searchParams = useSearchParams();
  const [leads, setLeads] = useState<ConversationLead[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get("lead"));
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/leads", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setLeads(data.leads.filter((l: ConversationLead) => l.phone));
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 5000); // polling — realtime simples
    return () => clearInterval(t);
  }, [load]);

  const conversations = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...leads]
      .filter(
        (l) =>
          !q ||
          l.name?.toLowerCase().includes(q) ||
          l.company?.toLowerCase().includes(q) ||
          l.phone?.includes(q),
      )
      .sort((a, b) => {
        // ordena pela última MENSAGEM, não por `updatedAt` — esse campo é
        // bumpado pelo Prisma em qualquer update do lead (ex.: abrir a
        // conversa já marca como lida e mexe no lead), o que fazia a
        // conversa pular pro topo só de ser aberta, sem mensagem nova.
        const aTime = new Date(a.messages[0]?.createdAt ?? a.updatedAt).getTime();
        const bTime = new Date(b.messages[0]?.createdAt ?? b.updatedAt).getTime();
        return bTime - aTime;
      });
  }, [leads, query]);

  const selected = leads.find((l) => l.id === selectedId);
  const totalUnread = leads.reduce((sum, l) => sum + l.unreadCount, 0);

  function selectConversation(id: string) {
    setSelectedId(id);
    // otimista — o LeadDetail já marca como lida de verdade no servidor ao abrir
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, unreadCount: 0 } : l)));
  }

  return (
    <div className="h-full flex flex-col p-3 sm:p-4">
      <div className="flex items-center justify-between gap-3 pb-3 shrink-0">
        <h1 className="text-lg font-semibold flex items-center gap-2">
          WhatsApp
          {totalUnread > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-brand text-brand-ink font-medium">
              {totalUnread}
            </span>
          )}
        </h1>
        <div className="flex items-center gap-2">
          <AiToggle />
          <span
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${
              online
                ? "border-emerald-500/30 text-emerald-300 bg-emerald-500/10"
                : "border-red-500/30 text-red-300 bg-red-500/10"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${online ? "bg-emerald-400" : "bg-red-400"}`} />
            {online ? "Conectado" : "Offline"}
          </span>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex border border-line rounded-2xl overflow-hidden bg-surface">
        <aside
          className={`w-full md:w-80 border-r border-line flex-col overflow-y-auto shrink-0 ${
            selectedId ? "hidden md:flex" : "flex"
          }`}
        >
          <div className="p-3 border-b border-line shrink-0">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar conversa…"
                className="w-full bg-surface-2 border border-line rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-brand"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {!loaded ? (
              <p className="p-4 text-sm text-muted">Carregando…</p>
            ) : conversations.length === 0 ? (
              <p className="p-4 text-sm text-muted">
                {query ? "Nenhuma conversa encontrada." : "Nenhuma conversa ainda."}
              </p>
            ) : (
              conversations.map((lead) => {
                const last = lead.messages[0];
                const unread = lead.unreadCount > 0;
                return (
                  <button
                    key={lead.id}
                    onClick={() => selectConversation(lead.id)}
                    className={`w-full text-left flex items-center gap-3 px-4 py-3 border-b border-line hover:bg-surface-2/60 transition ${
                      selectedId === lead.id ? "bg-surface-2" : ""
                    }`}
                  >
                    {lead.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={lead.avatarUrl}
                        alt=""
                        className="w-9 h-9 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <span className="w-9 h-9 rounded-full bg-brand/15 text-brand text-xs font-medium flex items-center justify-center shrink-0">
                        {initialsOf(lead.name) || "?"}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className={`text-sm truncate ${unread ? "font-semibold text-cream" : "font-medium"}`}
                        >
                          {lead.name ?? formatPhone(lead.phone)}
                        </p>
                        {last && (
                          <span className="text-[10px] text-muted shrink-0">
                            {timeAgo(last.createdAt)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className={`text-xs truncate ${unread ? "text-cream/80" : "text-muted"}`}
                        >
                          {last ? last.body : (lead.company ?? "Sem mensagens ainda")}
                        </p>
                        {unread && (
                          <span className="text-[10px] min-w-4.5 h-4.5 px-1 rounded-full bg-brand text-brand-ink font-medium flex items-center justify-center shrink-0">
                            {lead.unreadCount > 9 ? "9+" : lead.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                    {!unread && !lead.aiPaused && (
                      <span className="text-[9px] px-1 py-0.5 rounded bg-brand/15 text-brand shrink-0">
                        IA
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <div className={`flex-1 min-w-0 flex-col ${selectedId ? "flex" : "hidden md:flex"}`}>
          {selected ? (
            <>
              <div className="md:hidden border-b border-line p-2 shrink-0">
                <button
                  onClick={() => setSelectedId(null)}
                  className="text-sm text-muted flex items-center gap-1.5 px-2 py-1"
                >
                  <ArrowLeft size={14} /> Voltar
                </button>
              </div>
              <LeadDetail leadId={selected.id} />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted text-sm">
              Selecione uma conversa
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
