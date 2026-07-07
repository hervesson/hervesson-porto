import Image from "next/image"
import Link from "next/link"
import { site } from "@/lib/site"

const nav = [
  { label: "Soluções", href: "/#solucoes" },
  { label: "Como funciona", href: "/#como-funciona" },
  { label: "Sobre", href: "/#sobre" },
  { label: "Blog", href: "/blog" },
]

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-black/5 dark:border-white/10 bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <Image
            src="/img/logo-light.png"
            alt="Logo Hervesson Porto"
            width={36}
            height={36}
            className="rounded-lg dark:hidden"
          />
          <Image
            src="/img/logo-dark.png"
            alt="Logo Hervesson Porto"
            width={36}
            height={36}
            className="rounded-lg hidden dark:block"
          />
          <span className="font-semibold tracking-tight">{site.name}</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600 dark:text-gray-300">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <a
          href={site.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-full bg-brand text-white text-sm font-medium px-4 py-2 hover:opacity-90 transition-opacity"
        >
          Chamar no WhatsApp
        </a>
      </div>
    </header>
  )
}
