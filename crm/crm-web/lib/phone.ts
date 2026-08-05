// Normaliza número de telefone para só dígitos com DDI.
export function normalizeDigits(input: string): string {
  return String(input).split("@")[0].split(":")[0].replace(/\D/g, "");
}

/**
 * Variações do mesmo número brasileiro, com e sem o nono dígito.
 *
 * A Meta devolve o `wa_id` de celulares brasileiros frequentemente SEM o nono
 * dígito ("559888958835"), enquanto o número que o lead informa no site e o que
 * está salvo no banco costuma ter ("5598988958835"). Sem tratar isso, o mesmo
 * contato vira dois leads e a conversa se parte em duas.
 *
 * Devolve sempre as duas formas (a original primeiro), pra usar em
 * `where: { phone: { in: phoneVariants(x) } }`.
 */
export function phoneVariants(phone: string): string[] {
  const d = normalizeDigits(phone);
  if (!d.startsWith("55")) return [d];

  const ddd = d.slice(2, 4);
  const rest = d.slice(4);

  // 9 dígitos começando com 9 -> celular no formato novo: gera o antigo
  if (rest.length === 9 && rest.startsWith("9")) {
    return [d, `55${ddd}${rest.slice(1)}`];
  }
  // 8 dígitos começando com 6-9 -> celular no formato antigo: gera o novo.
  // (fixo começa com 2-5, e aí não existe variação a fazer)
  if (rest.length === 8 && /^[6-9]/.test(rest)) {
    return [d, `55${ddd}9${rest}`];
  }
  return [d];
}

/**
 * Forma canônica pra SALVAR um número novo no banco: sempre com o nono
 * dígito quando aplicável (13 dígitos: 55 + DDD + 9XXXXXXXX).
 *
 * Diferente de phoneVariants (que serve pra BUSCAR, e por isso devolve as
 * duas formas), esta função decide qual delas gravar. Sem isso, um lead
 * criado a partir de mensagem recebida da Meta nasce com o wa_id cru — sem
 * o 9 — e todo envio de volta pra ele falha (o número que a Meta aceita
 * mandar é o de 13 dígitos, o mesmo cadastrado como destinatário de teste).
 */
export function canonicalPhone(phone: string): string {
  const variants = phoneVariants(phone);
  return variants.find((v) => v.length === 13) ?? variants[0];
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
