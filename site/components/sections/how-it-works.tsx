const steps = [
  {
    number: "01",
    title: "Diagnóstico gratuito",
    description:
      "Primeiro eu entendo sua operação: onde está a dor, o que trava e o que faz sentido resolver primeiro. Sem compromisso e sem orçamento no escuro.",
  },
  {
    number: "02",
    title: "Solução sob medida",
    description:
      "Construo o sistema, a automação ou a campanha que o diagnóstico apontou — desenhado pro seu processo, não um template genérico com a sua logo em cima.",
  },
  {
    number: "03",
    title: "Acompanhamento contínuo",
    description:
      "Entregar é o começo. Acompanho os números, testo e ajusto pra cada mês render mais que o anterior. Resultado é processo, não sorte.",
  },
]

export function HowItWorks() {
  return (
    <section id="como-funciona" className="bg-gray-50 dark:bg-white/[0.02] border-y border-black/5 dark:border-white/5 scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-20">
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-14">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Como funciona
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Um processo direto, pensado pra quem quer sair do improviso sem
            virar refém de agência.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.number}
              className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/[0.03] p-7 space-y-3"
            >
              <span className="text-4xl font-semibold text-brand/25">
                {step.number}
              </span>
              <h3 className="text-lg font-semibold">{step.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
