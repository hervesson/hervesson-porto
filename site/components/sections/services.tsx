import type { ComponentType, ReactNode } from "react"
import {
  Bot,
  Megaphone,
  PenSquare,
  Database,
  Workflow,
} from "lucide-react"
import { ChatDemo } from "@/components/ui/chat-demo"
import {
  AdsDemo,
  InstaDemo,
  CrmDemo,
  ProcessDemo,
} from "@/components/ui/service-demos"
import { site } from "@/lib/site"

interface Service {
  number: string
  icon: ComponentType<{ className?: string }>
  name: string
  title: string
  description: string
  features: string[]
  visual?: ReactNode
}

const services: Service[] = [
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
    visual: <ChatDemo />,
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
    visual: <AdsDemo />,
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
    visual: <InstaDemo />,
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
    visual: <CrmDemo />,
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
    visual: <ProcessDemo />,
  },
]

function VisualPlaceholder({ service }: { service: Service }) {
  return (
    <div className="relative mx-auto flex aspect-[4/3] w-full max-w-md items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
      <span className="absolute -right-6 -bottom-10 text-[180px] font-extrabold leading-none text-brand/10">
        {service.number}
      </span>
      <service.icon className="h-16 w-16 text-brand/40" />
    </div>
  )
}

export function Services() {
  return (
    <section
      id="solucoes"
      className="max-w-7xl mx-auto px-4 md:px-8 py-20 scroll-mt-16"
    >
      <div className="max-w-3xl mx-auto text-center space-y-4 mb-20">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
          Soluções que funcionam <span className="text-brand">juntas</span>
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Tráfego que traz o cliente certo, atendimento que não deixa venda
          escapar, conteúdo que gera confiança e sistemas que organizam tudo —
          cada peça reforça a outra.
        </p>
      </div>

      <div className="space-y-24">
        {services.map((service, index) => (
          <div
            key={service.number}
            className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20"
          >
            <div className={index % 2 === 1 ? "lg:order-2" : undefined}>
              {service.visual ?? <VisualPlaceholder service={service} />}
            </div>
            <div className={index % 2 === 1 ? "lg:order-1" : undefined}>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand">
                <span className="mr-2 text-gray-500">{service.number}</span>
                {service.name}
              </p>
              <h3 className="mt-4 text-2xl font-semibold leading-snug tracking-tight md:text-3xl">
                {service.title}
              </h3>
              <p className="mt-4 text-gray-600 dark:text-gray-300">
                {service.description}
              </p>
              <ul className="mt-8 space-y-3 border-t border-black/5 pt-8 text-sm text-gray-600 dark:border-white/10 dark:text-gray-200">
                {service.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                    {feature}
                  </li>
                ))}
              </ul>
              <a
                href={site.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-9 inline-flex items-center rounded-full border border-brand/50 px-7 py-3 text-sm font-medium text-brand transition-colors hover:bg-brand hover:text-white"
              >
                Descobrir se é pra mim
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
