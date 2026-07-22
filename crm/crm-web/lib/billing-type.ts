export const BILLING_TYPES = [
  { value: "projeto", label: "Projeto (valor único)" },
  { value: "retainer", label: "Retainer (mensalidade)" },
] as const;

export function billingTypeLabel(value: string | null): string {
  if (value === "projeto") return "Projeto";
  if (value === "retainer") return "Retainer";
  return "—";
}
