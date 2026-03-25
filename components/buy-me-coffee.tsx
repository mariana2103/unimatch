'use client'

import { Coffee } from 'lucide-react'

export function BuyMeCoffee() {
  return (
    <a
      href="https://www.buymeacoffee.com/unimatch"
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex items-center gap-2.5 rounded-xl border border-amber-200/50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 px-4 py-2.5 text-sm transition-all hover:shadow-md hover:border-amber-300 dark:from-amber-900/20 dark:to-orange-900/20 dark:border-amber-800/30"
    >
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-amber-700 transition-transform group-hover:scale-110 dark:bg-amber-800/50 dark:text-amber-300">
        <Coffee className="h-3.5 w-3.5" />
      </div>
      <div className="flex flex-col">
        <span className="font-medium text-amber-900 dark:text-amber-200">Contribui com um café</span>
        <span className="text-[10px] text-amber-700/70 dark:text-amber-400/70">Ajuda a manter os dados atualizados</span>
      </div>
    </a>
  )
}

export function BuyMeCoffeeMinimal() {
  return (
    <a
      href="https://www.buymeacoffee.com/unimatch"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/70 transition-colors hover:text-amber-600 dark:hover:text-amber-400"
    >
      <Coffee className="h-3 w-3" />
      <span>Contribui com um café</span>
    </a>
  )
}
