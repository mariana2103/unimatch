import Link from 'next/link'
import { GraduationCap } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-navy to-navy-dark text-white shadow-lg shadow-navy/30 mb-6">
        <GraduationCap className="h-8 w-8" />
      </div>
      <h1 className="text-4xl font-bold tabular-nums text-foreground">404</h1>
      <p className="mt-2 text-base font-medium text-muted-foreground">Página não encontrada</p>
      <p className="mt-1 text-sm text-muted-foreground/60">
        Este endereço não existe ou foi removido.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-navy px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-navy/30 transition-all hover:bg-navy/90 hover:shadow-navy/40"
      >
        Voltar ao UniMatch
      </Link>
    </div>
  )
}
