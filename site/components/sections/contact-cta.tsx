import { MessageCircle, Mail } from "lucide-react"
import { site } from "@/lib/site"

export function ContactCta() {
  return (
    <section id="contato" className="max-w-7xl mx-auto px-4 md:px-8 py-20 scroll-mt-16">
      <div className="relative overflow-hidden rounded-3xl border border-black/5 dark:border-white/10 bg-[#1e1f24] text-white px-6 py-16 md:px-16 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_80%_at_50%_-20%,rgba(0,144,255,0.35),transparent)]" />
        <div className="relative space-y-5 max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Vamos fazer a tecnologia trabalhar pra sua empresa?
          </h2>
          <p className="text-gray-300">
            Me chama no WhatsApp e a gente começa pelo diagnóstico gratuito.
            Sem compromisso e sem letra miúda.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <a
              href={site.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-brand text-white font-medium px-7 py-3.5 hover:opacity-90 transition-opacity"
            >
              <MessageCircle className="w-5 h-5" />
              Chamar no WhatsApp agora
            </a>
            <a
              href={`mailto:${site.email}`}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 text-white font-medium px-7 py-3.5 hover:bg-white/10 transition-colors"
            >
              <Mail className="w-5 h-5" />
              Prefiro e-mail
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
