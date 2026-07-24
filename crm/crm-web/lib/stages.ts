import type { Stage } from "@prisma/client";

export const STAGES: { key: Stage; label: string; accent: string }[] = [
  { key: "NOVO", label: "Novo", accent: "#0090ff" },
  { key: "QUALIFICANDO", label: "Qualificando", accent: "#8b5cf6" },
  { key: "QUALIFICADO", label: "Qualificado", accent: "#f59e0b" },
  { key: "PROPOSTA", label: "Proposta", accent: "#10b981" },
  { key: "FECHADO", label: "Fechado", accent: "#22c55e" },
  { key: "PERDIDO", label: "Perdido", accent: "#ef4444" },
];

export const STAGE_LABEL: Record<Stage, string> = Object.fromEntries(
  STAGES.map((s) => [s.key, s.label]),
) as Record<Stage, string>;

// Estágios que já saíram do funil ativo — não faz sentido cobrar follow-up
// de quem já fechou ou já foi perdido.
export const CLOSED_STAGES = ["FECHADO", "PERDIDO"];
// Sem nenhuma mensagem trocada (nem nós, nem o lead) há esse tanto de dias,
// e ainda ativo no funil = alerta de follow-up.
export const STALE_DAYS = 5;

export function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}
