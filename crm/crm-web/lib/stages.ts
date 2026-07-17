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
