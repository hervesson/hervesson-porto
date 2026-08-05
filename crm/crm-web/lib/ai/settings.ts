import { prisma } from "@/lib/db";

// Interruptor geral do pré-atendimento por IA. Só existe 1 User nesse app
// (ver comentário no schema), então "geral" = o valor no único registro.

export async function isAiGloballyEnabled(): Promise<boolean> {
  const user = await prisma.user.findFirst({ select: { aiGloballyEnabled: true } });
  // Sem usuário (banco vazio) não deveria acontecer em produção, mas por
  // segurança falha pro lado de "ligado" — comportamento padrão do sistema.
  return user?.aiGloballyEnabled ?? true;
}

export async function setAiGloballyEnabled(enabled: boolean): Promise<void> {
  const user = await prisma.user.findFirst({ select: { id: true } });
  if (!user) return;
  await prisma.user.update({ where: { id: user.id }, data: { aiGloballyEnabled: enabled } });
}
