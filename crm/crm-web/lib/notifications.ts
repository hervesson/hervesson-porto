import { prisma } from "@/lib/db";
import type { Lead } from "@prisma/client";
import { originLabel } from "@/lib/lead-origin";

// Nunca lança — notificação é secundária, não pode derrubar a captura do
// lead nem o loop do webhook do WhatsApp (que já engole erro por item).
export async function createLeadNotification(lead: Lead): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        leadId: lead.id,
        type: lead.source,
        title: `Novo lead via ${originLabel(lead.source)}`,
        body: lead.name?.trim() || lead.phone || lead.email || null,
      },
    });
  } catch (err) {
    console.error("[notifications] falha ao criar notificação:", err);
  }
}
