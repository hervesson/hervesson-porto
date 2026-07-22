"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LogOut, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { NAV_GROUPS } from "@/lib/nav-config";

// "collapsed" só reduz a sidebar a partir do breakpoint md (desktop). No
// drawer mobile ela sempre aparece expandida — por isso os labels usam
// `md:hidden` (escondem só a partir de md) em vez de sumir via JS, que
// vazaria o estado "recolhido" do desktop pro drawer mobile.
export default function Sidebar({
  email,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  onLogout,
}: {
  email?: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onLogout: () => void;
}) {
  const pathname = usePathname();
  const hideLabel = collapsed ? "md:hidden" : "";

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 md:z-auto bg-surface border-r border-line flex flex-col shrink-0 transition-transform duration-200 md:translate-x-0 w-64 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "md:w-18" : "md:w-60"}`}
      >
        <div className="h-14 flex items-center justify-between px-4 border-b border-line shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Image
              src="/img/logo-dark.png"
              alt="Hervesson Porto"
              width={28}
              height={28}
              className="rounded-md shrink-0"
            />
            <span className={`font-semibold truncate ${hideLabel}`}>
              CRM <span className="text-muted font-normal">· Hervesson Porto</span>
            </span>
          </div>
          <button
            onClick={onCloseMobile}
            className="text-muted hover:text-cream transition md:hidden"
            aria-label="Fechar menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 min-h-0 overflow-y-auto py-3 px-2 flex flex-col gap-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p
                className={`px-2.5 pb-1.5 text-[11px] font-medium tracking-wide uppercase text-muted/70 ${hideLabel}`}
              >
                {group.label}
              </p>
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const active = pathname?.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition ${
                        active
                          ? "bg-surface-2 text-cream font-medium"
                          : "text-muted hover:bg-surface-2/60 hover:text-cream"
                      }`}
                    >
                      {active && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-brand" />
                      )}
                      <Icon size={17} className={`shrink-0 ${active ? "text-brand" : ""}`} />
                      <span className={`truncate ${hideLabel}`}>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-line p-2 flex flex-col gap-1 shrink-0">
          <button
            onClick={onToggleCollapse}
            className="hidden md:flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-muted hover:bg-surface-2/60 hover:text-cream transition"
          >
            {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
            {!collapsed && <span>Recolher</span>}
          </button>

          <div
            className={`flex items-center gap-2.5 px-2.5 py-2 ${
              collapsed ? "md:flex-col md:gap-1.5 md:justify-center" : ""
            }`}
          >
            <span className="w-7 h-7 rounded-full bg-brand/15 text-brand text-xs font-medium flex items-center justify-center shrink-0">
              {(email ?? "?").charAt(0).toUpperCase()}
            </span>
            <div className={`min-w-0 flex-1 ${hideLabel}`}>
              <p className="text-sm truncate">{email}</p>
            </div>
            <button
              onClick={onLogout}
              title="Sair"
              className="text-muted hover:text-cream transition shrink-0"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
