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
      <div className="px-4 sm:px-6 py-3 border-b border-line flex items-center gap-3">
        <Link href="/kanban" className="text-muted hover:text-cream">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="font-semibold">{lead.name ?? "Lead sem nome"}</h1>
      </div>
      <LeadDetail leadId={lead.id} />
    </div>
  );
}
