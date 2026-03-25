'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { GraduationCap, RefreshCw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-navy to-navy-dark text-white shadow-lg shadow-navy/30 mb-6">
        <GraduationCap className="h-8 w-8" />
      </div>
      <h1 className="text-xl font-bold text-foreground">Ocorreu um erro</h1>
      <p className="mt-2 text-sm text-muted-foreground/70">
        Algo correu mal. Tenta recarregar a página.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-xl border border-border/60 px-4 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-muted/50"
        >
          <RefreshCw className="h-4 w-4" />
          Tentar novamente
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-navy/30 transition-all hover:bg-navy/90"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  )
}
