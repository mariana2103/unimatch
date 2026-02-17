'use client'

import { CalendarDays, Clock, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DGES_PHASES } from '@/lib/constants'

function getStatus(start: string, end: string): 'upcoming' | 'active' | 'past' {
  const now = new Date()
  if (now < new Date(start)) return 'upcoming'
  if (now > new Date(end)) return 'past'
  return 'active'
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' })
}

function daysUntil(d: string) {
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)
}

const STYLES = {
  upcoming: { dot: 'bg-navy', badge: 'bg-navy/10 text-navy', label: 'Brevemente', card: 'border-navy/15' },
  active: { dot: 'bg-emerald', badge: 'bg-emerald/10 text-emerald', label: 'Em curso', card: 'border-emerald/30 bg-emerald/[0.02]' },
  past: { dot: 'bg-muted-foreground/30', badge: 'bg-muted text-muted-foreground', label: 'Concluida', card: 'border-border opacity-50' },
}

export function DGESTimeline() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-foreground">Calendario DGES 2026</h1>
        <p className="mt-1 text-sm text-muted-foreground">Datas das fases de candidatura ao ensino superior.</p>
      </div>
      <div className="relative flex flex-col gap-0">
        {DGES_PHASES.map((phase, i) => {
          const status = getStatus(phase.startDate, phase.endDate)
          const s = STYLES[status]
          const days = daysUntil(phase.startDate)
          return (
            <div key={phase.phase} className="relative flex gap-3 pb-6">
              <div className="flex flex-col items-center">
                <div className={`z-10 h-3.5 w-3.5 rounded-full border-[3px] border-card ${s.dot} shrink-0`} />
                {i < DGES_PHASES.length - 1 && <div className="w-px flex-1 bg-border" />}
              </div>
              <Card className={`flex-1 ${s.card}`}>
                <CardHeader className="pb-1.5 pt-3 px-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-sm font-semibold">{phase.phase}</CardTitle>
                      <CardDescription className="text-[10px]">{phase.title}</CardDescription>
                    </div>
                    <Badge className={`shrink-0 text-[9px] ${s.badge}`}>{s.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-2 px-4 pb-3">
                  <div className="flex items-center gap-2 text-xs">
                    <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium">{fmt(phase.startDate)}</span>
                    <ArrowRight className="h-2.5 w-2.5 text-muted-foreground" />
                    <span className="font-medium">{fmt(phase.endDate)}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">{phase.description}</p>
                  {status === 'upcoming' && days > 0 && (
                    <span className="flex items-center gap-1 text-[10px] text-navy">
                      <Clock className="h-3 w-3" /> Faltam {days} dias
                    </span>
                  )}
                  {status === 'active' && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald">
                      <Clock className="h-3 w-3" /> Abertas - Faltam {daysUntil(phase.endDate)} dias
                    </span>
                  )}
                </CardContent>
              </Card>
            </div>
          )
        })}
      </div>
    </div>
  )
}
