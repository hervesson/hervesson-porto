import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import LeadDetail from "@/components/lead/detail";

export const dynamic = "force-dynamic";

export default async function LeadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) notFound();

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 sm:px-6 py-2 border-b border-line flex items-center gap-3 shrink-0">
        <Link href="/kanban" className="text-muted hover:text-cream flex items-center gap-1.5 text-sm">
          <ArrowLeft size={16} /> Kanban
        </Link>
      </div>
      <LeadDetail leadId={lead.id} />
    </div>
  );
}
