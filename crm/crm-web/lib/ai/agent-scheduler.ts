import { prisma } from "@/lib/db";
import { runAgent } from "./agent";

// Espera esse tempo sem mensagem nova do mesmo lead antes de rodar a IA —
// agrupa rajadas ("oi" + "tudo bem?" em 2 mensagens seguidas) num único
// turno, em vez de responder cada mensagem isoladamente.
const DEBOUNCE_MS = 6000;

const timers = new Map<string, NodeJS.Timeout>();

export function scheduleAgentRun(leadId: string): void {
  const existing = timers.get(leadId);
  if (existing) clearTimeout(existing);

  const timer = setTimeout(async () => {
    timers.delete(leadId);
    try {
      // busca o lead de novo (não o que veio na hora do webhook) — pode ter
      // se passado alguns segundos, e o Hervesson pode ter assumido a
      // conversa nesse meio-tempo.
      const lead = await prisma.lead.findUnique({ where: { id: leadId } });
      if (lead) await runAgent(lead);
    } catch (err) {
      console.error(`[agent-scheduler] falha ao rodar agente p/ lead ${leadId}:`, err);
    }
  }, DEBOUNCE_MS);

  timers.set(leadId, timer);
}
