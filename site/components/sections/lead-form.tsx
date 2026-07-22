"use client"

import { useState } from "react"
import { Loader2, Check } from "lucide-react"
import { maskPhoneBR, isValidPhoneBR } from "@/lib/phone"

// URL do endpoint de captura do CRM (Easypanel, domínio público), injetada no build.
const CRM_URL = process.env.NEXT_PUBLIC_CRM_LEADS_URL

export function LeadForm() {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error" | "invalid-phone">("idle")

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValidPhoneBR(phone)) {
      setStatus("invalid-phone")
      return
    }
    if (!CRM_URL) {
      setStatus("error")
      return
    }
    setStatus("sending")
    try {
      const res = await fetch(CRM_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email, message, source: "site-form" }),
      })
      setStatus(res.ok ? "ok" : "error")
    } catch {
      setStatus("error")
    }
  }

  if (status === "ok") {
    return (
      <div className="mt-8 max-w-md mx-auto rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
        <Check className="w-6 h-6 mx-auto text-brand" />
        <p className="mt-2 text-white font-medium">Recebido! Vou te retornar em breve.</p>
      </div>
    )
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-8 max-w-md mx-auto grid gap-3 text-left"
    >
      <p className="text-sm text-gray-300 text-center">Ou deixe seu contato que eu retorno:</p>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Seu nome"
        required
        className="rounded-lg bg-white/5 border border-white/15 px-4 py-3 text-white placeholder:text-gray-400 outline-none focus:border-brand"
      />
      <input
        value={phone}
        onChange={(e) => setPhone(maskPhoneBR(e.target.value))}
        placeholder="WhatsApp (com DDD)"
        required
        type="tel"
        inputMode="tel"
        className="rounded-lg bg-white/5 border border-white/15 px-4 py-3 text-white placeholder:text-gray-400 outline-none focus:border-brand"
      />
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Seu e-mail"
        required
        type="email"
        inputMode="email"
        className="rounded-lg bg-white/5 border border-white/15 px-4 py-3 text-white placeholder:text-gray-400 outline-none focus:border-brand"
      />
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="O que você precisa? (opcional)"
        rows={3}
        className="rounded-lg bg-white/5 border border-white/15 px-4 py-3 text-white placeholder:text-gray-400 outline-none focus:border-brand resize-none"
      />
      <button
        type="submit"
        disabled={status === "sending"}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand text-white font-medium px-6 py-3 hover:opacity-90 transition-opacity disabled:opacity-60"
      >
        {status === "sending" && <Loader2 className="w-4 h-4 animate-spin" />}
        Enviar contato
      </button>
      {status === "error" && (
        <p className="text-sm text-red-300 text-center">
          Não consegui enviar agora. Me chama no WhatsApp acima, por favor.
        </p>
      )}
      {status === "invalid-phone" && (
        <p className="text-sm text-red-300 text-center">
          Confere o número do WhatsApp — falta dígito.
        </p>
      )}
    </form>
  )
}
