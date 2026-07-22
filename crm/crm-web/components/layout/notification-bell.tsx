"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Globe, MessageCircle } from "lucide-react";
import { timeAgo } from "@/lib/relative-time";

export type NotificationItem = {
  id: string;
  leadId: string | null;
  type: string;
  title: string;
  body: string | null;
  read: boolean;
  createdAt: string;
};

function SourceIcon({ type }: { type: string }) {
  if (type === "whatsapp") return <MessageCircle size={14} className="shrink-0 text-muted" />;
  if (type === "site-form") return <Globe size={14} className="shrink-0 text-muted" />;
  return <Bell size={14} className="shrink-0 text-muted" />;
}

export default function NotificationBell({
  notifications,
  unreadCount,
  onMarkRead,
  onMarkAllRead,
  className,
}: {
  notifications: NotificationItem[];
  unreadCount: number;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  function openNotification(n: NotificationItem) {
    if (!n.read) onMarkRead(n.id);
    setOpen(false);
    if (n.leadId) router.push(`/lead/${n.leadId}`);
  }

  return (
    <div ref={ref} className={`relative ${className ?? ""}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative text-muted hover:text-cream transition"
        aria-label="Notificações"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 rounded-full bg-brand text-brand-ink text-[10px] font-medium flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto bg-surface border border-line rounded-xl shadow-xl z-50 flex flex-col">
          <div className="p-3 border-b border-line flex items-center justify-between shrink-0">
            <span className="text-sm font-medium">Notificações</span>
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllRead}
                className="text-xs text-brand hover:opacity-80 transition"
              >
                Marcar todas como lidas
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <p className="p-4 text-sm text-muted text-center">Nenhuma notificação ainda.</p>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => openNotification(n)}
                className={`text-left p-3 border-b border-line last:border-b-0 hover:bg-surface-2/60 transition flex flex-col gap-0.5 ${
                  n.read ? "opacity-60" : ""
                }`}
              >
                <span className="flex items-center gap-1.5 text-sm font-medium">
                  {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-brand shrink-0" />}
                  <SourceIcon type={n.type} />
                  {n.title}
                </span>
                {n.body && <span className="text-xs text-muted truncate pl-4.5">{n.body}</span>}
                <span className="text-[11px] text-muted/70 pl-4.5">{timeAgo(n.createdAt)}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
