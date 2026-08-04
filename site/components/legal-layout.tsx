import Link from "next/link"
import { legal } from "@/lib/legal"

// Casca compartilhada das páginas jurídicas (privacidade e termos).
// Mesma largura e ritmo tipográfico do blog, pra não parecer outro site.

export function LegalPage({
  title,
  intro,
  children,
}: {
  title: string
  intro: string
  children: React.ReactNode
}) {
  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-16">
      <div className="space-y-3 mb-12">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
          {title}
        </h1>
        <p className="text-gray-600 dark:text-gray-300">{intro}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Última atualização: {legal.atualizadoEm}
        </p>
      </div>
      <div className="space-y-10">{children}</div>
      <div className="mt-16 pt-8 border-t border-black/5 dark:border-white/10 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/" className="hover:text-foreground transition-colors">
          ← Voltar para a página inicial
        </Link>
      </div>
    </div>
  )
}

export function Section({
  n,
  title,
  children,
}: {
  n: number
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold tracking-tight">
        {n}. {title}
      </h2>
      <div className="space-y-3 text-gray-600 dark:text-gray-300 leading-relaxed">
        {children}
      </div>
    </section>
  )
}

export function List({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="list-disc pl-5 space-y-1.5">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  )
}
