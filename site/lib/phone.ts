// Máscara em tempo real pro campo de WhatsApp do form — BR, sem DDI:
// (98) 98895-8835. Trava em 11 dígitos (DDD + 9 dígitos), então não dá pra
// digitar mais do que precisa.
export function maskPhoneBR(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 11)
  if (d.length === 0) return ""
  if (d.length <= 2) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

// Telefone BR válido = 10 (fixo) ou 11 (celular) dígitos, sem contar o DDI.
export function isValidPhoneBR(raw: string): boolean {
  const d = raw.replace(/\D/g, "")
  return d.length === 10 || d.length === 11
}
