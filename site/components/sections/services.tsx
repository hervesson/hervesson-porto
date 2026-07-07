import {
  Bot,
  Megaphone,
  PenSquare,
  Database,
  Workflow,
  Check,
} from "lucide-react"

const services = [
  {
    number: "01",
    icon: Bot,
    name: "IA aplicada",
    title: "Atendimento que responde antes do cliente desistir",
    description:
      "Cliente que espera demais compra do concorrente. Um atendente de IA responde no WhatsApp na hora, qualifica e agenda — enquanto você toca o negócio.",
    features: [
      "Resposta imediata no WhatsApp, a qualquer hora",
      "Lead chega até você já qualificado",
      "IA onde reduz perda de venda, não onde está na moda",
    ],
  },
  {
    number: "02",
    icon: Megaphone,
    name: "Tráfego pago",
    title: "Sua empresa na frente de quem já está procurando",
    description:
      "Campanhas de Google e Meta Ads calibradas pro seu ticket, pra atrair quem quer comprar — não curioso que só navega.",
    features: [
      "Google Ads e Meta Ads gerenciados de ponta a ponta",
      "Foco em custo de aquisição e retorno, não em curtida",
      "Relatório claro do que entrou e do que rendeu, mês a mês",
    ],
  },
  {
    number: "03",
    icon: PenSquare,
    name: "Conteúdo & social",
    title: "Presença que gera confiança antes da primeira conversa",
    description:
      "Quem chega no seu perfil decide em segundos se você é confiável. Conteúdo com a identidade da sua marca constrói essa confiança antes de você dizer uma palavra.",
    features: [
      "Carrosséis e posts com a cara da sua marca",
      "Calendário de conteúdo que não depende da inspiração do dia",
      "Autoridade que sustenta o investimento em tráfego",
    ],
  },
  {
    number: "04",
    icon: Database,
    name: "Sistemas & CRM",
    title: "Seus clientes organizados num lugar só — e que é seu",
    description:
      "Cadastro na planilha, histórico no WhatsApp, proposta no e-mail. Um sistema feito pro seu processo junta tudo isso, e nada mais se perde.",
    features: [
      "Cadastro, funil e histórico de cada cliente num só lugar",
      "Feito pro seu processo, não um SaaS genérico que não encaixa",
      "O sistema é seu, sem mensalidade de ferramenta que não usa",
    ],
  },
  {
    number: "05",
    icon: Workflow,
    name: "Processo & operação",
    title: "Sua operação rodando sem depender da sua memória",
    description:
      "Do lead à entrega, cada etapa clara e automatizada. É isso que separa empresa que escala de empresa que trava no dono.",
    features: [
      "Fluxo mapeado: lead, atendimento, proposta, fechamento, entrega",
      "Automação no que hoje é manual e trava sua equipe",
      "Estrutura que aparece no lucro, não só no papel",
    ],
  },
]

export function Services() {
  return (
    <section id="solucoes" className="max-w-7xl mx-auto px-4 md:px-8 py-20 scroll-mt-16">
      <div className="max-w-3xl mx-auto text-center space-y-4 mb-14">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
          Soluções que funcionam <span className="text-brand">juntas</span>
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Tráfego que traz o cliente certo, atendimento que não deixa venda
          escapar, conteúdo que gera confiança e sistemas que organizam tudo —
          cada peça reforça a outra.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <div
            key={service.number}
            className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/[0.03] p-7 flex flex-col gap-4 hover:border-brand/40 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-brand/10 text-brand">
                <service.icon className="w-5 h-5" />
              </span>
              <span className="text-sm font-medium text-gray-400 dark:text-gray-500">
                {service.number} · {service.name}
              </span>
            </div>
            <h3 className="text-lg font-semibold leading-snug">
              {service.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {service.description}
            </p>
            <ul className="mt-auto space-y-2 text-sm text-gray-600 dark:text-gray-300">
              {service.features.map((feature) => (
                <li key={feature} className="flex gap-2">
                  <Check className="w-4 h-4 mt-0.5 shrink-0 text-brand" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
