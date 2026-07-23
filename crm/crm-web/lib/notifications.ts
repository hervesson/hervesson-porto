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

// Disparada quando a trava de segurança do agente pausa a IA sozinha (ver
// lib/ai/agent.ts) — ex.: a conversa entrou num loop com outro bot.
export async function createAiPausedNotification(lead: Lead): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        leadId: lead.id,
        type: "ia-pausada",
        title: "IA pausada automaticamente",
        body: `${lead.name?.trim() || lead.phone || "Lead"} — conversa longa sem qualificar, dá uma olhada.`,
      },
    });
  } catch (err) {
    console.error("[notifications] falha ao criar notificação de pausa:", err);
  }
}
