"use client"

import { useEffect, useState, type ReactNode } from "react"
import {
  Search,
  Star,
  MapPin,
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  UserPlus,
  Check,
  FileText,
  Handshake,
  Package,
} from "lucide-react"

function useLoop(run: (schedule: (fn: () => void, ms: number) => void) => number) {
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    const schedule = (fn: () => void, ms: number) => {
      timers.push(setTimeout(fn, ms))
    }
    const cycle = () => {
      const total = run(schedule)
      schedule(cycle, total)
    }
    cycle()
    return () => timers.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

function BrowserFrame({ url, children }: { url: string; children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-md rounded-3xl border border-white/10 bg-[#14181c] shadow-2xl shadow-black/40">
      <div className="flex items-center gap-3 border-b border-white/5 px-5 py-3.5">
        <span className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
        </span>
        <span className="flex-1 truncate rounded-full bg-white/5 px-4 py-1.5 text-center text-xs text-gray-400">
          {url}
        </span>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

/* 02 — Tráfego pago: busca no Google com o anúncio em primeiro lugar */
const QUERY = "loja de móveis planejados"

export function AdsDemo() {
  const [typed, setTyped] = useState(0)
  const [showResults, setShowResults] = useState(false)

  useLoop((schedule) => {
    setTyped(0)
    setShowResults(false)
    let t = 700
    for (let i = 1; i <= QUERY.length; i++) {
      schedule(() => setTyped(i), t)
      t += 65
    }
    t += 450
    schedule(() => setShowResults(true), t)
    return t + 4500
  })

  return (
    <BrowserFrame url="google.com/search">
      <div className="flex h-[380px] flex-col gap-4">
        <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-gray-400" />
          <span className="truncate text-sm text-gray-200">
            {QUERY.slice(0, typed)}
            <span className="animate-pulse text-gray-400">|</span>
          </span>
        </div>
        {showResults && (
          <>
            <div className="animate-pop rounded-2xl border border-brand/60 bg-gradient-to-br from-brand/15 to-transparent p-4 ring-1 ring-brand/30">
              <div className="flex items-center gap-2 text-xs">
                <span className="rounded bg-brand/25 px-1.5 py-0.5 font-semibold text-sky-300">
                  Anúncio
                </span>
                <span className="text-gray-400">suaempresa.com.br</span>
              </div>
              <p className="mt-2 text-sm font-semibold text-gray-50">
                Sua empresa aqui, em primeiro lugar
              </p>
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-300">
                <span className="flex text-amber-400">
                  {[0, 1, 2, 3, 4].map((s) => (
                    <Star key={s} className="h-3 w-3 fill-current" />
                  ))}
                </span>
                4,9 · atendimento imediato
              </div>
              <div className="mt-1.5 flex items-center gap-1 text-xs text-gray-400">
                <MapPin className="h-3 w-3" /> Perto de você · aberto agora
              </div>
            </div>
            {["concorrente-1.com.br", "concorrente-2.com.br"].map((c, i) => (
              <div
                key={c}
                className="animate-pop rounded-2xl border border-white/5 bg-white/[0.02] p-4 opacity-50"
                style={{ animationDelay: `${0.15 * (i + 1)}s` }}
              >
                <p className="text-xs text-gray-500">{c}</p>
                <div className="mt-2 h-2 w-2/3 rounded bg-white/10" />
                <div className="mt-1.5 h-2 w-1/2 rounded bg-white/5" />
              </div>
            ))}
          </>
        )}
      </div>
    </BrowserFrame>
  )
}

/* 03 — Conteúdo: post de Instagram com carrossel passando sozinho */
const SLIDES = [
  "Decidir no feeling tá custando caro",
  "Antes: planilha solta. Depois: sistema em tempo real",
  "IA aplicada onde reduz perda de venda",
  "Vamos conversar?",
]

export function InstaDemo() {
  const [slide, setSlide] = useState(0)
  const [liked, setLiked] = useState(false)

  useLoop((schedule) => {
    setSlide(0)
    setLiked(false)
    let t = 2400
    for (let i = 1; i < SLIDES.length; i++) {
      const idx = i
      schedule(() => setSlide(idx), t)
      t += 2400
    }
    schedule(() => setLiked(true), t - 1400)
    return t + 1200
  })

  return (
    <div className="mx-auto w-full max-w-[340px] rounded-[2.6rem] border border-white/10 bg-[#14181c] p-3 shadow-2xl shadow-black/40">
      <div className="overflow-hidden rounded-[2rem] bg-[#0d1216]">
        {/* header do post */}
        <div className="flex items-center gap-3 px-4 py-3">
          <span className="h-8 w-8 rounded-full bg-gradient-to-tr from-brand to-sky-300" />
          <span className="flex-1 text-sm font-semibold text-gray-100">
            hervessongporto
          </span>
          <span className="text-gray-400">···</span>
        </div>
        {/* slide */}
        <div className="relative flex h-[300px] flex-col justify-between bg-[#1e1f24] p-5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold tracking-widest text-brand">
              {String(slide + 1).padStart(2, "0")} / 04
            </span>
            <span className="flex gap-1">
              {SLIDES.map((_, i) => (
                <span
                  key={i}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    i === slide ? "w-4 bg-gray-200" : "w-1 bg-gray-600"
                  }`}
                />
              ))}
            </span>
          </div>
          <p key={slide} className="animate-pop text-xl font-bold leading-snug text-gray-50">
            {SLIDES[slide]}
          </p>
        </div>
        {/* ações */}
        <div className="flex items-center gap-4 px-4 py-3 text-gray-200">
          <Heart
            className={`h-5 w-5 transition-all duration-300 ${
              liked ? "scale-110 fill-red-500 text-red-500" : ""
            }`}
          />
          <MessageCircle className="h-5 w-5" />
          <Send className="h-5 w-5" />
          <Bookmark className="ml-auto h-5 w-5" />
        </div>
        <p className="px-4 pb-5 text-xs leading-relaxed text-gray-400">
          <span className="font-semibold text-gray-200">hervessongporto</span>{" "}
          conteúdo que gera confiança antes da primeira conversa 📈
        </p>
      </div>
    </div>
  )
}

/* 04 — Sistemas & CRM: cadastro salvo e card andando no funil */
const NAME = "Mariana Silva"
const COLUMNS = ["Novo", "Contato", "Proposta"]

export function CrmDemo() {
  const [typed, setTyped] = useState(0)
  const [saved, setSaved] = useState(false)
  const [col, setCol] = useState(-1)

  useLoop((schedule) => {
    setTyped(0)
    setSaved(false)
    setCol(-1)
    let t = 700
    for (let i = 1; i <= NAME.length; i++) {
      schedule(() => setTyped(i), t)
      t += 80
    }
    t += 500
    schedule(() => setSaved(true), t)
    t += 800
    for (let c = 0; c < COLUMNS.length; c++) {
      const idx = c
      schedule(() => setCol(idx), t)
      t += 1500
    }
    return t + 1800
  })

  return (
    <BrowserFrame url="sistema.suaempresa.com.br/clientes">
      <div className="grid h-[380px] grid-cols-[1.2fr_2fr] gap-4">
        {/* formulário */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="flex items-center gap-2 text-xs font-semibold text-gray-200">
            <UserPlus className="h-3.5 w-3.5 text-brand" /> Novo cliente
          </p>
          <p className="mt-4 text-[10px] font-semibold tracking-widest text-gray-500">
            NOME
          </p>
          <div className="mt-1 truncate rounded-lg bg-white/5 px-3 py-2 text-xs text-gray-200">
            {NAME.slice(0, typed)}
            {!saved && <span className="animate-pulse text-gray-500">|</span>}
          </div>
          <p className="mt-3 text-[10px] font-semibold tracking-widest text-gray-500">
            TELEFONE
          </p>
          <div className="mt-1 rounded-lg bg-white/5 px-3 py-2 text-xs text-gray-200">
            (98) 99999-0000
          </div>
          <div
            className={`mt-4 flex items-center justify-center gap-1.5 rounded-full py-2 text-xs font-semibold transition-colors duration-300 ${
              saved ? "bg-brand/20 text-sky-300" : "bg-brand text-white"
            }`}
          >
            {saved && <Check className="h-3.5 w-3.5" />}
            {saved ? "Salvo" : "Salvar"}
          </div>
        </div>
        {/* funil */}
        <div className="grid grid-cols-3 gap-2">
          {COLUMNS.map((column, i) => (
            <div
              key={column}
              className="rounded-2xl border border-white/5 bg-white/[0.02] p-2"
            >
              <p className="truncate px-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                {column}
              </p>
              <div className="mt-2 space-y-2">
                {col === i && (
                  <div className="animate-pop rounded-lg border border-brand/50 bg-brand/10 p-2">
                    <p className="truncate text-[10px] font-semibold text-gray-100">
                      {NAME}
                    </p>
                    <p className="mt-0.5 truncate text-[9px] text-gray-400">
                      Veio do site
                    </p>
                  </div>
                )}
                <div className="h-6 rounded-lg bg-white/[0.04]" />
                {i === 0 && <div className="h-6 rounded-lg bg-white/[0.03]" />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </BrowserFrame>
  )
}

/* 05 — Processo & operação: esteira do lead à entrega acendendo */
const STEPS = [
  { icon: UserPlus, label: "Lead" },
  { icon: MessageCircle, label: "Atendimento" },
  { icon: FileText, label: "Proposta" },
  { icon: Handshake, label: "Fechamento" },
  { icon: Package, label: "Entrega" },
]

export function ProcessDemo() {
  const [active, setActive] = useState(-1)

  useLoop((schedule) => {
    setActive(-1)
    let t = 800
    for (let i = 0; i < STEPS.length; i++) {
      const idx = i
      schedule(() => setActive(idx), t)
      t += 1100
    }
    return t + 2200
  })

  return (
    <BrowserFrame url="sistema.suaempresa.com.br/operacao">
      <div className="flex h-[180px] items-center">
        <div className="relative w-full">
          <div className="absolute left-[10%] right-[10%] top-[22px] h-px bg-white/10" />
          <div
            className="absolute left-[10%] top-[22px] h-px bg-brand transition-all duration-700"
            style={{
              width: `${(Math.max(active, 0) / (STEPS.length - 1)) * 80}%`,
            }}
          />
          <div className="relative flex w-full items-start justify-between">
            {STEPS.map((step, i) => (
              <div key={step.label} className="flex flex-1 flex-col items-center">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-full border transition-all duration-500 ${
                    i <= active
                      ? "border-brand bg-[#14181c] text-brand"
                      : "border-white/10 bg-[#14181c] text-gray-500"
                  } ${i === active ? "scale-110 shadow-lg shadow-brand/20" : ""}`}
                >
                  <step.icon className="h-4 w-4" />
                </div>
                <span
                  className={`mt-2 text-[10px] transition-colors duration-500 ${
                    i <= active ? "text-gray-200" : "text-gray-500"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </BrowserFrame>
  )
}
