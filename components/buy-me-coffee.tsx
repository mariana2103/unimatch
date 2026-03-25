'use client'

import { useState } from 'react'
import { Heart, X, ExternalLink } from 'lucide-react'

const PAYPAL_URL = 'https://www.paypal.com/donate?business=marianacabralmeida%40gmail.com&currency_code=EUR'

const MESSAGE = `O UniMatch é um projeto pessoal que criei para ajudar estudantes portugueses a navegar no acesso ao ensino superior.

Mantenho o sistema a funcionar com dados reais da DGES, um assistente de IA e atualizações regulares — tudo isto tem custos reais de servidor e API.

Sou estudante e faço isto no meu tempo livre. Se o UniMatch te ajudou, qualquer contribuição faz diferença — literalmente. Obrigada 💙`

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

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl border bg-card p-6 shadow-2xl">
            <button
              onClick={() => setOpen(false)}
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

            <a
              href={PAYPAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-navy px-4 py-3 text-sm font-semibold text-white hover:bg-navy/90 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Contribuir via PayPal
            </a>

            <p className="mt-3 text-center text-[11px] text-muted-foreground/60">
              marianacabralmeida@gmail.com
            </p>
          </div>
        </div>
      )}
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

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl border bg-card p-6 shadow-2xl">
            <button
              onClick={() => setOpen(false)}
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

            <a
              href={PAYPAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-navy px-4 py-3 text-sm font-semibold text-white hover:bg-navy/90 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Contribuir via PayPal
            </a>

            <p className="mt-3 text-center text-[11px] text-muted-foreground/60">
              marianacabralmeida@gmail.com
            </p>
          </div>
        </div>
      )}
    </>
  )
}

// Keep old export names so existing imports don't break
export { SupportButton as BuyMeCoffee, SupportMinimal as BuyMeCoffeeMinimal }
