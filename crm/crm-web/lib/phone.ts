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
