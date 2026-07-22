import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import AppShell from "@/components/layout/app-shell";

export const dynamic = "force-dynamic";

export default async function PainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireUser();
  if (!session) redirect("/login");

  return <AppShell email={session.email}>{children}</AppShell>;
}
