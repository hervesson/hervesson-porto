"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Menu } from "lucide-react";
import Sidebar from "./sidebar";
import NotificationBell, { type NotificationItem } from "./notification-bell";

const COLLAPSE_KEY = "crm.sidebar.collapsed";
const NOTIF_POLL_MS = 20000;

export default function AppShell({
  email,
  children,
}: {
  email?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
  }, []);

  const loadNotifications = useCallback(async () => {
    const res = await fetch("/api/notifications", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    const t = setInterval(loadNotifications, NOTIF_POLL_MS); // polling — realtime simples
    return () => clearInterval(t);
  }, [loadNotifications]);

  async function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }

  async function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
  }

  function toggleCollapse() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      return next;
    });
  }

  async function logout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar
        email={email}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onLogout={logout}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-line flex items-center gap-3 px-4 md:hidden shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-muted hover:text-cream transition"
            aria-label="Abrir menu"
          >
            <Menu size={20} />
          </button>
          <Image
            src="/img/logo-dark.png"
            alt="Hervesson Porto"
            width={24}
            height={24}
            className="rounded-md shrink-0"
          />
          <span className="font-semibold truncate">
            CRM <span className="text-muted font-normal">· Hervesson Porto</span>
          </span>
          <NotificationBell
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkRead={markRead}
            onMarkAllRead={markAllRead}
            className="ml-auto flex"
          />
        </header>

        {/* Topbar desktop — só o sino por enquanto; dá espaço pra buscar/ações futuras */}
        <header className="hidden md:flex h-14 border-b border-line items-center justify-end px-6 shrink-0">
          <NotificationBell
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkRead={markRead}
            onMarkAllRead={markAllRead}
            className="flex"
          />
        </header>

        <main className="flex-1 min-h-0">{children}</main>
      </div>
    </div>
  );
}
