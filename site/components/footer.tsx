import Image from "next/image"
import Link from "next/link"
import { AtSign, Mail } from "lucide-react"
import { site } from "@/lib/site"

export function Footer() {
  return (
    <footer className="border-t border-black/5 dark:border-white/10 mt-24">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <Image
              src="/img/logo-light.png"
              alt="Logo Hervesson Porto"
              width={32}
              height={32}
              className="rounded-lg dark:hidden"
            />
            <Image
              src="/img/logo-dark.png"
              alt="Logo Hervesson Porto"
              width={32}
              height={32}
              className="rounded-lg hidden dark:block"
            />
            <span className="font-semibold tracking-tight">{site.name}</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {site.tagline}
          </p>
        </div>
        <div className="flex flex-col gap-2 text-sm text-gray-600 dark:text-gray-400">
          <a
            href={site.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 hover:text-foreground transition-colors"
          >
            <AtSign className="w-4 h-4" /> {site.instagramHandle}
          </a>
          <a
            href={`mailto:${site.email}`}
            className="inline-flex items-center gap-2 hover:text-foreground transition-colors"
          >
            <Mail className="w-4 h-4" /> {site.email}
          </a>
          <Link
            href="/blog"
            className="hover:text-foreground transition-colors"
          >
            Blog
          </Link>
        </div>
      </div>
      <div className="border-t border-black/5 dark:border-white/10 py-5 text-center text-xs text-gray-500 dark:text-gray-500">
        © {new Date().getFullYear()} Hervesson Porto · Trinc Technologies LTDA
      </div>
    </footer>
  )
}
