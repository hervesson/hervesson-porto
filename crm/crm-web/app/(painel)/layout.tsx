import { redirect } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/session";
import { connectionState } from "@/lib/evolution";
import LogoutButton from "@/components/logout-button";

export const dynamic = "force-dynamic";

export default async function PainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireUser();
  if (!session) redirect("/login");

  const state = await connectionState();
  const online = state === "open";

  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-14 border-b border-line flex items-center justify-between px-4 sm:px-6 shrink-0">
        <Link href="/kanban" className="font-semibold">
          CRM <span className="text-muted font-normal">· Hervesson Porto</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2 text-sm text-muted" title={`Instância: ${state}`}>
            <span
              className={`inline-block w-2 h-2 rounded-full ${online ? "bg-emerald-400" : "bg-red-400"}`}
            />
            WhatsApp {online ? "conectado" : "offline"}
          </span>
          <LogoutButton />
        </div>
      </header>
      <main className="flex-1 min-h-0">{children}</main>
    </div>
  );
}
