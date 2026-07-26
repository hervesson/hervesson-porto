import {
  Calendar,
  CheckSquare,
  FileText,
  Kanban,
  LayoutDashboard,
  MessageCircle,
  Sparkles,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

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
    label: "Geral",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Agenda", href: "/agenda", icon: Calendar },
      { label: "Tarefas", href: "/tarefas", icon: CheckSquare },
      { label: "Sonhos", href: "/sonhos", icon: Sparkles },
    ],
  },
  {
    label: "Vendas",
    items: [
      { label: "CRM", href: "/kanban", icon: Kanban },
      { label: "Clientes", href: "/clientes", icon: Users },
      { label: "Orçamentos", href: "/orcamentos", icon: FileText },
      { label: "WhatsApp", href: "/whatsapp", icon: MessageCircle },
    ],
  },
  {
    label: "Operações",
    items: [{ label: "Financeiro", href: "/financeiro", icon: Wallet }],
  },
];
