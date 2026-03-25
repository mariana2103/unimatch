'use client'

import { Heart } from 'lucide-react'
import Link from 'next/link'

export function SupportButton() {
  return (
    <Link
      href="/apoio"
      className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500/10 to-rose-500/10 border border-pink-500/20 px-4 py-2.5 text-sm transition-all hover:shadow-md hover:border-pink-500/40 dark:from-pink-500/20 dark:to-rose-500/20"
    >
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-pink-500 text-white transition-transform group-hover:scale-110">
        <Heart className="h-3.5 w-3.5 fill-current" />
      </div>
      <div className="flex flex-col">
        <span className="font-medium text-pink-700 dark:text-pink-300">Apoia o UniMatch</span>
        <span className="text-[10px] text-pink-600/70 dark:text-pink-400/70">via MBway ou Revolut</span>
      </div>
    </Link>
  )
}

export function SupportButtonMinimal() {
  return (
    <Link
      href="/apoio"
      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/70 transition-colors hover:text-pink-600 dark:hover:text-pink-400"
    >
      <Heart className="h-3 w-3" />
      <span>Apoiar</span>
    </Link>
  )
}
