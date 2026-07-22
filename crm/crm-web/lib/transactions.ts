export const RECEITA_CATEGORIES = [
  { value: "projeto", label: "Projeto" },
  { value: "retainer", label: "Retainer / assinatura" },
  { value: "consultoria", label: "Consultoria avulsa" },
  { value: "outro", label: "Outro" },
] as const;

export const DESPESA_CATEGORIES = [
  { value: "pessoal", label: "Pessoal" },
  { value: "marketing", label: "Marketing" },
  { value: "estrutura", label: "Estrutura" },
  { value: "tecnologia", label: "Tecnologia" },
  { value: "outros", label: "Outros" },
] as const;

export const METHODS = [
  { value: "pix", label: "Pix" },
  { value: "cartao", label: "Cartão" },
  { value: "boleto", label: "Boleto" },
  { value: "transferencia", label: "Transferência" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "outro", label: "Outro" },
] as const;

export const STATUSES = [
  { value: "pago", label: "Pago", className: "bg-emerald-500/15 text-emerald-300" },
  { value: "pendente", label: "Pendente", className: "bg-amber-500/15 text-amber-300" },
  { value: "atrasado", label: "Atrasado", className: "bg-red-500/15 text-red-300" },
] as const;

export function categoriesFor(type: string) {
  return type === "despesa" ? DESPESA_CATEGORIES : RECEITA_CATEGORIES;
}

export function categoryLabel(type: string, value: string): string {
  return categoriesFor(type).find((c) => c.value === value)?.label ?? value;
}

export function methodLabel(value: string): string {
  return METHODS.find((m) => m.value === value)?.label ?? value;
}

export function statusInfo(value: string) {
  return STATUSES.find((s) => s.value === value) ?? STATUSES[0];
}
