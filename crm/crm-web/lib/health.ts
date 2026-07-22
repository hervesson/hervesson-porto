export const HEALTH = [
  { value: "otimo", label: "Ótimo", className: "bg-emerald-500/15 text-emerald-300" },
  { value: "bom", label: "Bom", className: "bg-brand/15 text-brand" },
  { value: "atencao", label: "Atenção", className: "bg-amber-500/15 text-amber-300" },
  { value: "risco", label: "Risco", className: "bg-red-500/15 text-red-300" },
] as const;

export function healthInfo(value: string | null) {
  return HEALTH.find((h) => h.value === value) ?? null;
}
