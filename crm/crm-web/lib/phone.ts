// Normaliza número de telefone para só dígitos com DDI.
// A Evolution manda o "remoteJid" no formato "5598988958835@s.whatsapp.net".
export function jidToPhone(jid: string): string {
  return jid.split("@")[0].split(":")[0].replace(/\D/g, "");
}

// Aceita entradas soltas do formulário do site ("+55 (98) 98895-8835") e normaliza.
export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  // se veio sem DDI (número BR local com 10-11 dígitos), assume 55
  if (digits.length >= 10 && digits.length <= 11) return "55" + digits;
  return digits;
}

// Formata para exibição amigável no painel (BR): +55 (98) 98895-8835
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "—";
  const d = phone.replace(/\D/g, "");
  if (d.startsWith("55") && (d.length === 12 || d.length === 13)) {
    const ddd = d.slice(2, 4);
    const rest = d.slice(4);
    const mid = rest.length === 9 ? rest.slice(0, 5) : rest.slice(0, 4);
    const end = rest.length === 9 ? rest.slice(5) : rest.slice(4);
    return `+55 (${ddd}) ${mid}-${end}`;
  }
  return "+" + d;
}

// Máscara em tempo real pra inputs — BR, sem DDI: (98) 98895-8835. Trava em
// 11 dígitos (DDD + 9 dígitos), então não dá pra digitar mais do que precisa.
// Aceita valor já com "55" na frente (ex: ao popular o input a partir do que
// tá salvo no banco) e tira o DDI antes de aplicar a máscara.
export function maskPhoneBR(raw: string): string {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("55") && (d.length === 12 || d.length === 13)) d = d.slice(2);
  d = d.slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

// Telefone BR válido = 10 (fixo) ou 11 (celular) dígitos, sem contar o DDI.
export function isValidPhoneBR(raw: string): boolean {
  const d = raw.replace(/\D/g, "");
  return d.length === 10 || d.length === 11;
}
