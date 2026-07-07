import Image from "next/image"
import { UserCheck, Wrench, Sparkles, Handshake } from "lucide-react"

const reasons = [
  {
    icon: UserCheck,
    title: "Direto com quem constrói",
    description:
      "Sem atendente repassando recado. Quem entende sua operação é quem constrói o sistema e acompanha o resultado.",
  },
  {
    icon: Wrench,
    title: "Sob medida, não template",
    description:
      "Cada sistema e campanha nasce do seu processo. Nada de modelo genérico com a sua logo colada em cima.",
  },
  {
    icon: Sparkles,
    title: "IA aplicada, não modinha",
    description:
      "IA entra onde reduz retrabalho e perda de venda — não porque está na moda.",
  },
  {
    icon: Handshake,
    title: "Parceria, não projeto que acaba",
    description:
      "O acompanhamento continua depois da entrega. Resultado de verdade é processo contínuo, não lançamento.",
  },
]

export function WhyMe() {
  return (
    <section id="sobre" className="max-w-7xl mx-auto px-4 md:px-8 py-20 scroll-mt-16">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] items-center">
        <div className="space-y-6">
          <div className="relative w-full max-w-sm mx-auto lg:mx-0">
            <Image
              src="/img/foto-perfil.png"
              alt="Hervesson Porto"
              width={1023}
              height={1537}
              className="rounded-2xl border border-black/5 dark:border-white/10 shadow-lg"
              priority={false}
            />
          </div>
        </div>
        <div className="space-y-8">
          <div className="space-y-4">
            <p className="text-sm font-medium text-brand uppercase tracking-wide">
              Por que comigo
            </p>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
              Você fala direto com quem constrói
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Antes de falar de TI, eu construí ela. Comecei como desenvolvedor
              de software, entregando aplicativos de ponta a ponta pra startups
              brasileiras e uma empresa internacional. Hoje aplico TI e IA à
              estratégia de empresários que tocam o negócio sem estrutura de
              tecnologia por trás.
            </p>
            <blockquote className="border-l-2 border-brand pl-4 text-gray-700 dark:text-gray-200 italic">
              &ldquo;Você não precisa virar uma empresa de tecnologia. Precisa
              de alguém pensando em TI do jeito que pensa em estratégia — antes
              do problema aparecer, não depois.&rdquo;
            </blockquote>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {reasons.map((reason) => (
              <div key={reason.title} className="space-y-2">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-brand/10 text-brand">
                  <reason.icon className="w-5 h-5" />
                </span>
                <h3 className="font-semibold">{reason.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {reason.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
