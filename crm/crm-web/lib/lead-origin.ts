// "whatsapp" e "site-form" são setados automaticamente (webhook / form do site).
// Os demais são escolhidos manualmente no modal de novo lead.
export const ORIGINS = [
  { value: "manual", label: "Manual" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "site-form", label: "Site" },
  { value: "indicacao", label: "Indicação" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "instagram", label: "Instagram" },
  { value: "evento", label: "Evento" },
  { value: "outro", label: "Outro" },
] as const;

export type OriginValue = (typeof ORIGINS)[number]["value"];

export function originLabel(value: string): string {
  return ORIGINS.find((o) => o.value === value)?.label ?? value;
}
