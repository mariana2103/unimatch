'use client'

import { useState } from 'react'
import { Heart, Copy, Check, ExternalLink } from 'lucide-react'

const MBWAY_PHONE = '+351 968 145 322'
const REVOLUT_URL = 'https://revolut.me/unimatch'
const PAYPAL_URL = 'https://www.paypal.com/donate?business=marianacabralmeida%40gmail.com&currency_code=EUR'

export default function ApoioPage() {
  const [copied, setCopied] = useState(false)

  const copyPhone = async () => {
    try { await navigator.clipboard.writeText(MBWAY_PHONE) } catch {}
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:px-6">

      {/* Header */}
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-500/10 border border-pink-500/20">
          <Heart className="h-7 w-7 text-pink-500 fill-pink-500/20" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Apoiar o UniMatch</h1>
        <p className="mt-1 text-sm text-muted-foreground">por Mariana Cabral Meida</p>
      </div>

      {/* Message */}
      <div className="mb-6 rounded-xl border border-border/50 bg-card p-5 text-sm text-muted-foreground leading-relaxed space-y-3">
        <p>
          O UniMatch é um projeto pessoal que criei para ajudar estudantes portugueses a navegar no acesso ao ensino superior.
        </p>
        <p>
          Mantenho o sistema com dados reais da DGES, um assistente de IA e atualizações regulares — tudo com custos reais de servidor e API.
        </p>
        <p>
          Sou estudante e faço isto no meu tempo livre. Se o UniMatch te ajudou, qualquer contribuição faz diferença. Obrigada <span className="text-navy font-medium">💙</span>
        </p>
      </div>

      {/* Payment options */}
      <div className="flex flex-col gap-3">

        {/* MBway */}
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">MBway</p>
          <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2.5 mb-2">
            <span className="font-mono text-base font-semibold flex-1 text-foreground">{MBWAY_PHONE}</span>
            <button
              onClick={copyPhone}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {copied ? <Check className="h-4 w-4 text-emerald" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground">{copied ? 'Número copiado — cola na app do teu banco' : 'Copia e usa na app do teu banco'}</p>
        </div>

        {/* Revolut */}
        <a
          href={REVOLUT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between rounded-xl border border-border/50 bg-card p-4 hover:bg-muted/30 transition-colors group"
        >
          <div>
            <p className="font-medium text-foreground">Revolut</p>
            <p className="text-xs text-muted-foreground">Abre diretamente na app</p>
          </div>
          <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </a>

        {/* PayPal */}
        <a
          href={PAYPAL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between rounded-xl border border-border/50 bg-card p-4 hover:bg-muted/30 transition-colors group"
        >
          <div>
            <p className="font-medium text-foreground">PayPal</p>
            <p className="text-xs text-muted-foreground">marianacabralmeida@gmail.com</p>
          </div>
          <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </a>
      </div>

      <p className="mt-6 text-center text-[11px] text-muted-foreground/50">
        Não tens como apoiar? Partilha o UniMatch com alguém que esteja a preparar a candidatura.
      </p>
    </div>
  )
}
