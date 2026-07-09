"use client"

import { useEffect, useState } from "react"
import { Bot, CheckCheck, Check } from "lucide-react"

const script = [
  { from: "lead", text: "Oi! Vi o anúncio de vocês e quero saber mais 👋" },
  { from: "ia", text: "Oi! Bem-vindo 😊 Me conta rapidinho: qual é o seu negócio?" },
  { from: "lead", text: "Tenho uma loja de móveis planejados" },
  { from: "ia", text: "Ótimo! Já consigo te encaixar num horário hoje. Prefere de manhã ou à tarde?" },
] as const

export function ChatDemo() {
  const [visible, setVisible] = useState(0)
  const [typing, setTyping] = useState(false)

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    const schedule = (fn: () => void, ms: number) => {
      timers.push(setTimeout(fn, ms))
    }
    const run = () => {
      setVisible(0)
      setTyping(false)
      let t = 900
      script.forEach((msg, i) => {
        if (msg.from === "ia") {
          schedule(() => setTyping(true), t)
          t += 1400
        }
        schedule(() => {
          setTyping(false)
          setVisible(i + 1)
        }, t)
        t += 1200
      })
      schedule(run, t + 3000)
    }
    run()
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div className="mx-auto w-full max-w-[340px] rounded-[2.6rem] border border-white/10 bg-[#14181c] p-3 shadow-2xl shadow-black/40">
      <div className="flex h-[480px] flex-col overflow-hidden rounded-[2rem] bg-[#0d1216]">
        {/* header */}
        <div className="flex items-center gap-3 border-b border-white/5 bg-[#171d22] px-4 py-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/20 text-brand">
            <Bot className="h-5 w-5" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-gray-100">
              Hervesson · Atendimento
            </p>
            <p className="text-xs text-gray-400">
              {typing ? "digitando…" : "online"}
            </p>
          </div>
        </div>

        {/* mensagens */}
        <div className="flex flex-1 flex-col gap-2.5 overflow-hidden px-3 py-4">
          {script.slice(0, visible).map((msg, i) => (
            <div
              key={i}
              className={`animate-pop max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-snug ${
                msg.from === "lead"
                  ? "self-end rounded-br-md bg-[#005c4b] text-gray-50"
                  : "self-start rounded-bl-md bg-[#202c33] text-gray-100"
              }`}
            >
              {msg.text}
              {msg.from === "lead" && (
                <span className="ml-2 inline-flex align-middle text-sky-300">
                  <CheckCheck className="h-3.5 w-3.5" />
                </span>
              )}
            </div>
          ))}
          {typing && (
            <div className="animate-pop flex gap-1.5 self-start rounded-2xl rounded-bl-md bg-[#202c33] px-4 py-3.5">
              {[0, 1, 2].map((dot) => (
                <span
                  key={dot}
                  className="animate-typing h-1.5 w-1.5 rounded-full bg-gray-400"
                  style={{ animationDelay: `${dot * 0.18}s` }}
                />
              ))}
            </div>
          )}
        </div>

        {/* barra de digitação */}
        <div className="flex items-center gap-2 px-3 pb-4">
          <div className="flex-1 rounded-full bg-[#1c242b] px-4 py-2.5 text-[13px] text-gray-500">
            Mensagem
          </div>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white">
            <Check className="h-4 w-4" />
          </span>
        </div>
      </div>
    </div>
  )
}
