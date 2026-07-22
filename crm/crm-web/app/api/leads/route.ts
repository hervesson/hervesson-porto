import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { normalizePhone } from "@/lib/phone";
import { ORIGINS } from "@/lib/lead-origin";
import { STAGES } from "@/lib/stages";
import { createLeadNotification } from "@/lib/notifications";

const ORIGIN_VALUES: readonly string[] = ORIGINS.map((o) => o.value);
const STAGE_VALUES: readonly string[] = STAGES.map((s) => s.key);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": process.env.CORS_ALLOW_ORIGIN ?? "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Preflight CORS (form do site)
export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

// GET = lista de leads pro painel (com a última mensagem + não lidas). Requer login.
export async function GET() {
  const session = await requireUser();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const [leads, unreadRows] = await Promise.all([
    prisma.lead.findMany({
      orderBy: [{ order: "asc" }, { updatedAt: "desc" }],
      include: {
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
        _count: { select: { messages: true } },
      },
    }),
    prisma.$queryRaw<{ leadId: string; count: bigint }[]>`
      SELECT m."leadId" as "leadId", COUNT(*) as count
      FROM "Message" m
      JOIN "Lead" l ON l.id = m."leadId"
      WHERE m.direction = 'in' AND m."createdAt" > l."lastReadAt"
      GROUP BY m."leadId"
    `,
  ]);

  const unreadMap = new Map(unreadRows.map((r) => [r.leadId, Number(r.count)]));
  const leadsWithUnread = leads.map((l) => ({
    ...l,
    unreadCount: unreadMap.get(l.id) ?? 0,
  }));

  return NextResponse.json({ leads: leadsWithUnread });
}

// POST = captura de lead. Público (usado pelo formulário do site) OU manual (logado no painel).
// A sessão (cookie same-origin) é o que diferencia os dois fluxos — o form do
// site é cross-origin e nunca manda o cookie do painel, então nunca cai no
// ramo autenticado abaixo.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const session = await requireUser();

  const name = body.name ? String(body.name).trim() : null;
  const email = body.email ? String(body.email).trim() : null;
  const message = body.message ? String(body.message).trim() : null;
  const rawPhone = body.phone ? String(body.phone).trim() : "";
  const phone = rawPhone ? normalizePhone(rawPhone) : null;

  if (!name && !phone && !email) {
    return NextResponse.json(
      { error: "Informe ao menos nome, telefone ou email." },
      { status: 400, headers: CORS },
    );
  }

  // dedupe por telefone quando houver
  const existing = phone ? await prisma.lead.findUnique({ where: { phone } }) : null;

  let lead;
  if (session) {
    // criação manual a partir do painel — aceita os campos extras do modal "Novo lead"
    const company = body.company ? String(body.company).trim() : null;
    const position = body.position ? String(body.position).trim() : null;
    const value =
      body.value !== undefined && body.value !== null && body.value !== ""
        ? Math.round(Number(body.value))
        : null;
    const tags: string[] = Array.isArray(body.tags)
      ? body.tags.map((t: unknown) => String(t).trim()).filter(Boolean)
      : [];
    const source = ORIGIN_VALUES.includes(body.source) ? body.source : "manual";
    const stage = STAGE_VALUES.includes(body.stage) ? body.stage : "NOVO";

    lead = existing
      ? await prisma.lead.update({
          where: { id: existing.id },
          data: {
            name: name ?? existing.name,
            email: email ?? existing.email,
            company,
            position,
            value,
            tags,
            source,
            stage,
          },
        })
      : await prisma.lead.create({
          data: { name, email, phone, company, position, value, tags, source, stage },
        });
  } else if (existing) {
    lead = await prisma.lead.update({
      where: { id: existing.id },
      data: { name: existing.name ?? name, email: existing.email ?? email },
    });
  } else {
    lead = await prisma.lead.create({
      // o "o que precisa" do form já entra como resumo inicial — a IA
      // substitui por um resumo próprio assim que conversar com o lead
      data: { name, email, phone, source: "site-form", summary: message },
    });
    await createLeadNotification(lead);
  }

  // registra a mensagem do formulário como primeira mensagem da thread
  if (message) {
    await prisma.message.create({
      data: {
        leadId: lead.id,
        direction: "in",
        author: "lead",
        body: message,
      },
    });
  }

  return NextResponse.json({ ok: true, leadId: lead.id }, { headers: CORS });
}
