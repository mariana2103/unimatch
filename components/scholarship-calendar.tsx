'use client'

import { useState } from 'react'
import { ExternalLink, GraduationCap, Heart, Award, ChevronDown, ChevronUp, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

type Category = 'all' | 'social' | 'merit' | 'private'

interface Scholarship {
  name: string
  entity: string
  category: 'social' | 'merit' | 'private'
  deadline: string          // ISO date string
  deadlineLabel: string     // Human-readable
  amount: string
  eligibility: string
  link?: string
  automatic?: boolean
}

const SCHOLARSHIPS: Scholarship[] = [
  {
    name: 'Bolsa de Acção Social (SAS)',
    entity: 'DGES / SAS',
    category: 'social',
    deadline: '2026-10-31',
    deadlineLabel: 'Out 2026 (abertura em Set)',
    amount: 'Até €7 080/ano',
    eligibility: 'Baseada no rendimento do agregado familiar (escalões)',
    link: 'https://www.dges.gov.pt/pt/pagina/bolsas-de-estudo',
  },
  {
    name: 'Bolsa de Mérito',
    entity: 'DGES',
    category: 'merit',
    deadline: '2026-11-30',
    deadlineLabel: 'Automática após resultados',
    amount: 'Propina anual',
    eligibility: 'Média ≥ 16 e top 5% da turma — atribuição automática',
    automatic: true,
  },
  {
    name: 'Novos Talentos — Ciência & Tecnologia',
    entity: 'Fundação Calouste Gulbenkian',
    category: 'private',
    deadline: '2026-03-31',
    deadlineLabel: 'Mar 2026',
    amount: 'Até €5 000/ano',
    eligibility: 'Média ≥ 17 em ciências; candidatura com projeto de investigação',
    link: 'https://gulbenkian.pt/bolsas',
  },
  {
    name: 'Bolsa de Mérito Santander',
    entity: 'Santander Universidades',
    category: 'private',
    deadline: '2026-05-31',
    deadlineLabel: 'Mai 2026',
    amount: '€1 500 — €3 000',
    eligibility: 'Média ≥ 16 no ano anterior; candidatura via universidade',
    link: 'https://www.santander.pt/santander-universidades',
  },
  {
    name: 'Programa de Bolsas ISA',
    entity: 'Fundação José Neves',
    category: 'private',
    deadline: '2026-02-28',
    deadlineLabel: 'Fev 2026',
    amount: 'Propina + subsistência',
    eligibility: 'Cursos de tecnologia e inovação; reembolso baseado em rendimento futuro',
    link: 'https://fjn.pt/bolsas',
  },
  {
    name: 'Bolsa EDP Energia para o Futuro',
    entity: 'Fundação EDP',
    category: 'private',
    deadline: '2026-11-15',
    deadlineLabel: 'Nov 2026',
    amount: 'Até €4 000/ano',
    eligibility: 'Engenharia, Física ou cursos ligados à energia; média ≥ 15',
    link: 'https://fundacaoedp.pt/bolsas',
  },
  {
    name: 'Bolsa de Mérito BCP',
    entity: 'Fundação Millennium BCP',
    category: 'private',
    deadline: '2026-04-30',
    deadlineLabel: 'Abr 2026',
    amount: '€2 000',
    eligibility: 'Alunos do 1º ano com média de acesso ≥ 17',
    link: 'https://www.millenniumbcp.pt/fundacao',
  },
]

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
  if (days <= 30) return { dot: 'bg-red-500',    label: `${days}d`,   text: 'text-red-600 dark:text-red-400' }
  if (days <= 90) return { dot: 'bg-amber-500',  label: `${days}d`,   text: 'text-amber-600 dark:text-amber-400' }
  return              { dot: 'bg-emerald-500', label: `${days}d`,   text: 'text-emerald-600 dark:text-emerald-400' }
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
          </div>
        </div>
        {open ? <ChevronUp className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />}
      </button>

      {open && (
        <div className="px-4 pb-4 pt-0 ml-5">
          <div className="rounded-lg bg-muted/30 p-3 space-y-2.5">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium mb-0.5">Elegibilidade</p>
              <p className="text-xs text-foreground/80">{s.eligibility}</p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium mb-0.5">Prazo</p>
                <p className="text-xs text-foreground/80">{s.deadlineLabel}</p>
              </div>
              {s.automatic && (
                <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                  Automática
                </span>
              )}
              {s.link && (
                <a
                  href={s.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="flex items-center gap-1 text-[11px] font-medium text-navy hover:underline"
                >
                  Candidatura <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
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

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-foreground">Bolsas de Estudo</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Principais bolsas e prazos para o ano letivo 2025/26.
        </p>
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
        Prazos aproximados — confirma sempre nos sites oficiais de cada entidade.
      </p>
    </div>
  )
}
