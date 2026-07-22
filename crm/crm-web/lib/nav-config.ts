import { Kanban, MessageCircle, Users, Wallet, type LucideIcon } from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

// Novos módulos entram aqui — sidebar.tsx não muda.
export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Vendas",
    items: [
      { label: "CRM", href: "/kanban", icon: Kanban },
      { label: "Clientes", href: "/clientes", icon: Users },
    ],
  },
  {
    label: "Financeiro",
    items: [{ label: "Financeiro", href: "/financeiro", icon: Wallet }],
  },
  {
    label: "Integrações",
    items: [{ label: "WhatsApp", href: "/whatsapp", icon: MessageCircle }],
  },
];
