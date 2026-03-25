'use client'

import { useState } from 'react'
import { Heart, X, Copy, Check } from 'lucide-react'

const MBWAY_PHONE = '+351 964221102'

const MESSAGE = `O UniMatch é um projeto gratuito que criei para ajudar estudantes portugueses a deixar de ter medo do acesso ao ensino superior.

Médias reais da DGES, simulador de nota, assistente de IA, calendário de candidaturas — tudo numa só app, sem publicidade, sem paywall.

Sou estudante e construí isto sozinha, no meu tempo livre. Se te ajudou a escolher um curso ou a perceber as tuas hipóteses, um café faz toda a diferença. Obrigada 💙`

function SupportDialog({ onClose }: { onClose: () => void }) {
  const [copied, setCopied] = useState(false)

  const copyMbway = async () => {
    await navigator.clipboard.writeText(MBWAY_PHONE)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border bg-card p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-navy/10">
          <Heart className="h-6 w-6 text-navy" />
        </div>

        <h2 className="text-lg font-bold text-foreground">Apoiar o UniMatch</h2>
        <p className="mt-1 text-sm text-muted-foreground">por Mariana Cabral Meida</p>

        <p className="mt-4 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
          {MESSAGE}
        </p>

        <button
          onClick={copyMbway}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-navy px-4 py-3 text-sm font-semibold text-white hover:bg-navy/90 transition-colors"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Número copiado!' : `MBway — ${MBWAY_PHONE}`}
        </button>

        <p className="mt-3 text-center text-[11px] text-muted-foreground/60">
          Abre o teu banco → MBway → cola o número
        </p>
      </div>
    </div>
  )
}

export function SupportButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group flex items-center gap-2 rounded-xl border border-navy/20 bg-navy/5 px-4 py-2.5 text-sm font-medium text-navy transition-all hover:bg-navy/10 hover:border-navy/30 hover:shadow-sm"
      >
        <Heart className="h-4 w-4 text-navy/70 group-hover:text-navy transition-colors" />
        Apoiar o projeto
      </button>

      {open && <SupportDialog onClose={() => setOpen(false)} />}
    </>
  )
}

export function SupportMinimal() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/70 transition-colors hover:text-navy"
      >
        <Heart className="h-3 w-3" />
        <span>Apoiar o projeto</span>
      </button>

      {open && <SupportDialog onClose={() => setOpen(false)} />}
    </>
  )
}

// Keep old export names so existing imports don't break
export { SupportButton as BuyMeCoffee, SupportMinimal as BuyMeCoffeeMinimal }
