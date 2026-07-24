export const STATUSES = [
  { value: "rascunho", label: "Rascunho", className: "bg-surface-2 border border-line text-muted" },
  { value: "enviado", label: "Enviado", className: "bg-blue-500/15 text-blue-300" },
  { value: "aprovado", label: "Aprovado", className: "bg-emerald-500/15 text-emerald-300" },
  { value: "recusado", label: "Recusado", className: "bg-red-500/15 text-red-300" },
  { value: "faturado", label: "Faturado", className: "bg-brand/15 text-brand" },
] as const;

export type ProposalStatus = (typeof STATUSES)[number]["value"];
export const STATUS_VALUES: readonly string[] = STATUSES.map((s) => s.value);

export function statusInfo(value: string) {
  return STATUSES.find((s) => s.value === value) ?? STATUSES[0];
}

type ProposalWithItems = {
  status: string;
  items: { value: number }[];
};

export function proposalTotal(items: { value: number }[]): number {
  return items.reduce((sum, i) => sum + i.value, 0);
}

// "em aberto" = ainda não decidido pelo cliente
const OPEN_STATUSES = ["rascunho", "enviado"];
// entrou na "mesa" do cliente pra decisão — usado no denominador da taxa de aprovação
const DECIDED_STATUSES = ["enviado", "aprovado", "recusado", "faturado"];
const WON_STATUSES = ["aprovado", "faturado"];

export function computeStats(proposals: ProposalWithItems[]) {
  const open = proposals.filter((p) => OPEN_STATUSES.includes(p.status));
  const decided = proposals.filter((p) => DECIDED_STATUSES.includes(p.status));
  const won = proposals.filter((p) => WON_STATUSES.includes(p.status));

  const openTotal = open.reduce((sum, p) => sum + proposalTotal(p.items), 0);
  const approvalRate = decided.length > 0 ? won.length / decided.length : null;
  const avgTicket =
    won.length > 0 ? won.reduce((sum, p) => sum + proposalTotal(p.items), 0) / won.length : null;

  return {
    openCount: open.length,
    openTotal,
    approvalRate,
    avgTicket,
  };
}

export function formatProposalNumber(year: number, seq: number): string {
  return `ORC-${year}-${String(seq).padStart(3, "0")}`;
}
