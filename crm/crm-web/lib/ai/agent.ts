import Anthropic from "@anthropic-ai/sdk";
import type { Message as DbMessage, Lead, Stage } from "@prisma/client";
import { prisma } from "@/lib/db";
import { sendText } from "@/lib/evolution";
import { createAiPausedNotification } from "@/lib/notifications";
import { SYSTEM_PROMPT } from "./prompt";

const client = new Anthropic(); // usa ANTHROPIC_API_KEY do ambiente
const MODEL = process.env.AI_MODEL ?? "claude-haiku-4-5";

// Quantas mensagens de histórico mandar como contexto (mantém custo baixo).
const HISTORY_LIMIT = 30;

// Trava de segurança: se a IA já respondeu esse tanto de vezes seguidas sem
// nenhum humano entrar na conversa, pausa sozinha e avisa. Protege contra
// loop com outro bot/IA (ex.: um SDR automatizado de outra empresa) que
// ficaria conversando com a nossa IA indefinidamente.
const AI_TURN_LIMIT = 8;

// Tool que a IA é forçada a chamar: devolve a resposta + a extração estruturada.
// `strict: true` (structured outputs) é aceito pela API mas ainda não tipado no SDK.
const RESPONDER_TOOL = {
  name: "responder",
  description:
    "Responde ao lead no WhatsApp e registra a qualificação. Sempre chame esta tool.",
  input_schema: {
    type: "object",
    properties: {
      reply: {
        type: "string",
        description: "Texto exato a enviar ao lead no WhatsApp, no tom da marca.",
      },
      lead_name: {
        type: "string",
        description: "Nome do lead, se ele informou. String vazia se ainda não souber.",
      },
      suggested_stage: {
        type: "string",
        enum: ["NOVO", "QUALIFICANDO", "QUALIFICADO", "PROPOSTA"],
        description: "Estágio do funil sugerido para este lead.",
      },
      summary: {
        type: "string",
        description: "Resumo curto (1 frase) da necessidade do lead, para o CRM.",
      },
      needs_human: {
        type: "boolean",
        description:
          "true quando o Hervesson deve assumir (intenção de fechar, pedido de humano, ou fora do escopo).",
      },
    },
    required: ["reply", "lead_name", "suggested_stage", "summary", "needs_human"],
    additionalProperties: false,
  },
  strict: true,
} as unknown as Anthropic.Tool;

type ResponderInput = {
  reply: string;
  lead_name: string;
  suggested_stage: Stage;
  summary: string;
  needs_human: boolean;
};

// Converte as mensagens do banco no formato de conversa da API.
function toApiMessages(history: DbMessage[]): Anthropic.MessageParam[] {
  const msgs: Anthropic.MessageParam[] = [];
  for (const m of history) {
    const role = m.direction === "in" ? "user" : "assistant";
    // A API exige alternância começando por "user"; a Evolution garante que a
    // primeira mensagem é do lead. Mensagens consecutivas do mesmo papel são ok.
    msgs.push({ role, content: m.body });
  }
  // A conversa precisa terminar com uma mensagem do usuário para a IA responder.
  if (msgs.length === 0 || msgs[msgs.length - 1].role !== "user") return [];
  return msgs;
}

/**
 * Roda o atendimento da IA para um lead: lê o histórico, chama o Claude,
 * envia a resposta pelo WhatsApp (Evolution) e atualiza o lead + grava a mensagem.
 * Deve ser chamado só quando lead.aiPaused === false.
 */
export async function runAgent(lead: Lead): Promise<void> {
  if (lead.aiPaused || !lead.phone) return;

  const history = await prisma.message.findMany({
    where: { leadId: lead.id },
    orderBy: { createdAt: "asc" },
    take: HISTORY_LIMIT,
  });

  const messages = toApiMessages(history);
  if (messages.length === 0) return;

  let input: ResponderInput;
  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: [RESPONDER_TOOL],
      tool_choice: { type: "tool", name: "responder" },
      messages,
    });

    const toolUse = response.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
    );
    if (!toolUse) return;
    input = toolUse.input as ResponderInput;
  } catch (err) {
    console.error(`[agent] falha ao gerar resposta p/ lead ${lead.id}:`, err);
    return;
  }

  const reply = (input.reply ?? "").trim();
  if (!reply) return;

  // Envia pelo WhatsApp
  let sendResult;
  try {
    sendResult = await sendText(lead.phone, reply);
  } catch (err) {
    console.error(`[agent] falha ao enviar WhatsApp p/ lead ${lead.id}:`, err);
    return;
  }

  // Persiste a resposta + atualiza a ficha do lead
  await prisma.message.create({
    data: {
      leadId: lead.id,
      direction: "out",
      author: "ia",
      body: reply,
      // guarda o id da Evolution — o webhook usa pra reconhecer o eco dessa
      // mensagem (fromMe) como já registrada, em vez de achar que foi o
      // Hervesson respondendo pelo celular e pausar a IA à toa
      waMessageId: sendResult?.key?.id ?? undefined,
    },
  });

  const nextStage: Stage = input.needs_human ? "QUALIFICADO" : input.suggested_stage;
  // Se a IA decidiu passar pro humano, pausa o atendimento automático.
  let aiPaused = input.needs_human ? true : lead.aiPaused;

  if (!aiPaused) {
    // conta quantas mensagens a IA mandou desde a última vez que o
    // Hervesson escreveu nessa conversa — se passar do limite sem nenhum
    // humano entrar, é sinal de loop (ex.: outro bot do outro lado)
    const lastHuman = await prisma.message.findFirst({
      where: { leadId: lead.id, author: "hervesson" },
      orderBy: { createdAt: "desc" },
    });
    const iaCount = await prisma.message.count({
      where: {
        leadId: lead.id,
        author: "ia",
        ...(lastHuman ? { createdAt: { gt: lastHuman.createdAt } } : {}),
      },
    });
    if (iaCount >= AI_TURN_LIMIT) {
      aiPaused = true;
      await createAiPausedNotification(lead);
    }
  }

  await prisma.lead.update({
    where: { id: lead.id },
    data: {
      name: lead.name ?? (input.lead_name?.trim() || undefined),
      summary: input.summary || lead.summary,
      stage: nextStage,
      aiPaused,
    },
  });
}
