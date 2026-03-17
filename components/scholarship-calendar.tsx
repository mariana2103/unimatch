'use client'

import { useState } from 'react'
import { ExternalLink, GraduationCap, Heart, Award, ChevronDown, ChevronUp, Calendar, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import scholarshipsData from '@/lib/scholarships.json'

type Category = 'all' | 'social' | 'merit' | 'private'

interface Scholarship {
  name: string
  entity: string
  category: 'social' | 'merit' | 'private'
  deadline: string
  deadlineLabel: string
  amount: string
  eligibility: string
  link?: string
  automatic?: boolean
  verified: boolean
  lastVerified: string
}

const SCHOLARSHIPS = scholarshipsData.scholarships as Scholarship[]

const CATEGORY_LABELS: Record<Category, string> = {
  all: 'Todas',
  social: 'Ação Social',
  merit: 'Mérito',
  private: 'Privadas',
}

const CATEGORY_ICONS: Record<Category, typeof Heart> = {
  all: Calendar,
  social: Heart,
  merit: Award,
  private: GraduationCap,
}

function urgencyColor(deadline: string) {
  const today = new Date()
  const due = new Date(deadline)
  const days = Math.ceil((due.getTime() - today.getTime()) / 86400000)
  if (days < 0)   return { dot: 'bg-muted-foreground/30', label: 'Encerrada', text: 'text-muted-foreground' }
  if (days <= 30) return { dot: 'bg-red-500',    label: `${days}d`, text: 'text-red-600 dark:text-red-400' }
  if (days <= 90) return { dot: 'bg-amber-500',  label: `${days}d`, text: 'text-amber-600 dark:text-amber-400' }
  return              { dot: 'bg-emerald-500', label: `${days}d`, text: 'text-emerald-600 dark:text-emerald-400' }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-PT', { month: 'short', year: 'numeric' })
}

function ScholarshipRow({ s }: { s: Scholarship }) {
  const [open, setOpen] = useState(false)
  const urg = urgencyColor(s.deadline)

  return (
    <div className="border-b border-border/40 last:border-0">
      <button
        className="flex w-full items-start gap-3 px-4 py-3.5 text-left hover:bg-muted/30 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${urg.dot}`} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-foreground">{s.name}</span>
            <span className={`shrink-0 text-[11px] font-semibold tabular-nums ${urg.text}`}>
              {urg.label}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground">{s.entity}</span>
            <span className="h-2.5 w-px bg-border/60" />
            <span className="text-[11px] font-medium text-foreground/70">{s.amount}</span>
            {!s.verified && (
              <>
                <span className="h-2.5 w-px bg-border/60" />
                <span className="flex items-center gap-0.5 text-[10px] text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-2.5 w-2.5" />
                  Não verificada
                </span>
              </>
            )}
          </div>
        </div>
        {open
          ? <ChevronUp className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
          : <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
        }
      </button>

      {open && (
        <div className="px-4 pb-4 pt-0 ml-5">
          <div className="rounded-lg bg-muted/30 p-3 space-y-2.5">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium mb-0.5">Elegibilidade</p>
              <p className="text-xs text-foreground/80">{s.eligibility}</p>
            </div>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium mb-0.5">Prazo</p>
                <p className="text-xs text-foreground/80">{s.deadlineLabel}</p>
              </div>
              <div className="flex items-center gap-2">
                {s.verified
                  ? (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" />
                      Verificado {formatDate(s.lastVerified)}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="h-3 w-3" />
                      Não verificado — confirma no site oficial
                    </span>
                  )
                }
                {s.automatic && (
                  <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                    Automática
                  </span>
                )}
              </div>
            </div>
            {s.link && (
              <a
                href={s.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] font-medium text-navy hover:underline"
              >
                Candidatura oficial <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function ScholarshipCalendar() {
  const [filter, setFilter] = useState<Category>('all')

  const filtered = filter === 'all'
    ? SCHOLARSHIPS
    : SCHOLARSHIPS.filter(s => s.category === filter)

  const unverifiedCount = SCHOLARSHIPS.filter(s => !s.verified).length

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-foreground">Bolsas de Estudo</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Principais bolsas e prazos para o ano letivo 2025/26.
        </p>
        {unverifiedCount > 0 && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800/40 dark:bg-amber-950/20 px-3 py-2.5">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="text-[11px] text-amber-700 dark:text-amber-300">
              {unverifiedCount} bolsa{unverifiedCount !== 1 ? 's' : ''} ainda não verificada{unverifiedCount !== 1 ? 's' : ''} — os prazos e valores podem ter mudado.
              Confirma sempre no site oficial antes de te candidatares.
            </p>
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className="mb-4 flex gap-1.5 flex-wrap">
        {(Object.keys(CATEGORY_LABELS) as Category[]).map(cat => {
          const Icon = CATEGORY_ICONS[cat]
          return (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                filter === cat
                  ? 'bg-navy text-white'
                  : 'border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <Icon className="h-3 w-3" />
              {CATEGORY_LABELS[cat]}
            </button>
          )
        })}
      </div>

      {/* List */}
      <div className="overflow-hidden rounded-xl border border-border/50 bg-card">
        {filtered.map(s => (
          <ScholarshipRow key={s.name} s={s} />
        ))}
      </div>

      <p className="mt-3 text-center text-[10px] text-muted-foreground">
        Informação desatualizada?{' '}
        <a
          href="https://github.com/codingdud/Dges/issues/new?title=Bolsa+desatualizada&body=Nome+da+bolsa%3A+%0AO+que+está+errado%3A+%0ALink+oficial%3A+"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-navy hover:underline"
        >
          Reporta aqui
        </a>
        {' '}— confirma sempre nos sites oficiais.
      </p>
    </div>
  )
}
