'use client'

import { Heart } from 'lucide-react'
import Link from 'next/link'

export function SupportButton() {
  return (
    <Link
      href="/apoio"
      className="group flex items-center gap-2 rounded-xl border border-navy/20 bg-navy/5 px-4 py-2.5 text-sm font-medium text-navy transition-all hover:bg-navy/10 hover:border-navy/30 hover:shadow-sm"
    >
      <Heart className="h-4 w-4 text-navy/70 group-hover:text-navy transition-colors" />
      Apoiar o projeto
    </Link>
  )
}

export function SupportMinimal() {
  return (
    <Link
      href="/apoio"
      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/70 transition-colors hover:text-navy"
    >
      <Heart className="h-3 w-3" />
      <span>Apoiar o projeto</span>
    </Link>
  )
}

// Backward compat
export { SupportButton as BuyMeCoffee, SupportMinimal as BuyMeCoffeeMinimal }
