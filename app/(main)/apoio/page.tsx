'use client'

import { useState } from 'react'
import { Heart, Loader2 } from 'lucide-react'

const PRESETS = [2, 5, 10]

export default function ApoioPage() {
  const [amount, setAmount] = useState<number | ''>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePreset = (v: number) => setAmount(v)

  const handleSubmit = async () => {
    const euros = Number(amount)
    if (!euros || euros < 1) { setError('Mínimo €1.'); return }
    if (euros > 500) { setError('Máximo €500.'); return }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: euros }),
      })
      const json = await res.json()
      if (!res.ok || !json.url) { setError(json.error ?? 'Erro ao processar.'); return }
      window.location.href = json.url
    } catch {
      setError('Erro de ligação. Tenta novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-12 sm:px-6">

      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-navy/10">
          <Heart className="h-6 w-6 text-navy" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Apoiar o UniMatch</h1>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          O UniMatch é gratuito e sem anúncios.<br />
          Se te ajudou na candidatura, obrigada. 💙
        </p>
      </div>

      <div className="rounded-2xl border border-border/50 bg-card p-6 space-y-5">

        {/* Preset amounts */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Valor</p>
          <div className="flex gap-2 mb-3">
            {PRESETS.map(v => (
              <button
                key={v}
                onClick={() => handlePreset(v)}
                className={`flex-1 rounded-xl border py-2.5 text-sm font-semibold transition-all ${
                  amount === v
                    ? 'border-navy bg-navy/10 text-navy dark:bg-navy/20'
                    : 'border-border/60 text-muted-foreground hover:border-navy/40 hover:text-foreground'
                }`}
              >
                €{v}
              </button>
            ))}
          </div>

          {/* Custom amount input */}
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">€</span>
            <input
              type="number"
              min={1}
              max={500}
              placeholder="Outro valor"
              value={amount}
              onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full rounded-xl border border-border/60 bg-muted/30 pl-8 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-navy/50 focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        </div>

        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading || !amount}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-navy py-3 text-sm font-semibold text-white transition-all hover:bg-navy/90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> A processar...</>
          ) : (
            <>Apoiar{amount ? ` — €${amount}` : ''}</>
          )}
        </button>

        <p className="text-center text-[11px] text-muted-foreground/50">
          Pagamento seguro via Stripe · Cartão de crédito
        </p>
      </div>

    </div>
  )
}
