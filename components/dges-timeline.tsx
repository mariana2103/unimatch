'use client'

import { useState, useEffect, useMemo } from 'react'
import { Star, CalendarDays, ArrowRight, Clock, BookOpen, Filter } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { IAVE_EVENTS, DGES_EVENTS, EXAM_SUBJECTS, type TimelineEvent } from '@/lib/constants'

const LS_KEY = 'timeline_starred'

function loadStarred(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

function saveStarred(s: Set<string>) {
  localStorage.setItem(LS_KEY, JSON.stringify([...s]))
}

function fmtDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })
}

function getStatus(event: TimelineEvent): 'past' | 'active' | 'upcoming' {
  const now = new Date()
  const start = new Date(event.date + 'T00:00:00')
  const end = event.endDate ? new Date(event.endDate + 'T23:59:59') : new Date(event.date + 'T23:59:59')
  if (now > end) return 'past'
  if (now >= start) return 'active'
  return 'upcoming'
}

function daysUntil(iso: string) {
  return Math.ceil((new Date(iso + 'T00:00:00').getTime() - Date.now()) / 86400000)
}

const ALL_EVENTS: TimelineEvent[] = [
  ...IAVE_EVENTS,
  ...DGES_EVENTS,
].sort((a, b) => a.date.localeCompare(b.date))

interface EventCardProps {
  event: TimelineEvent
  starred: boolean
  onToggle: () => void
}

function EventCard({ event, starred, onToggle }: EventCardProps) {
  const status = getStatus(event)
  const days = daysUntil(event.date)
  const isIave = event.type === 'iave'

  const examNames = (event.examCodes ?? []).map(
    code => EXAM_SUBJECTS.find(e => e.code === code)?.name ?? code
  )

  return (
    <div className={`relative rounded-2xl border p-4 transition-all ${
      status === 'past'
        ? 'border-border/50 bg-slate-50 opacity-60'
        : status === 'active'
          ? 'border-emerald-200 bg-emerald-50 shadow-sm'
          : 'border-border/60 bg-white shadow-sm hover:border-navy/20 hover:shadow'
    }`}>
      {/* Star button */}
      <button
        onClick={e => { e.stopPropagation(); onToggle() }}
        className={`absolute right-3.5 top-3.5 transition-colors ${
          starred ? 'text-amber-400 hover:text-amber-500' : 'text-muted-foreground/30 hover:text-amber-400'
        }`}
        aria-label={starred ? 'Remover estrela' : 'Adicionar estrela'}
      >
        <Star className={`h-4 w-4 ${starred ? 'fill-amber-400' : ''}`} />
      </button>

      <div className="flex flex-col gap-2 pr-7">
        {/* Type + status badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant="outline"
            className={`text-[10px] py-0.5 px-2 font-semibold ${
              isIave
                ? 'border-violet-200 bg-violet-50 text-violet-700'
                : 'border-blue-200 bg-blue-50 text-blue-700'
            }`}
          >
            {isIave ? 'IAVE' : 'DGES'}
          </Badge>
          {status === 'active' && (
            <Badge variant="outline" className="text-[10px] py-0.5 px-2 border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold">
              Em curso
            </Badge>
          )}
        </div>

        {/* Date */}
        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <CalendarDays className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          {fmtDate(event.date)}
          {event.endDate && (
            <>
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
              {fmtDate(event.endDate)}
            </>
          )}
        </div>

        {/* Title */}
        <div>
          <p className="text-sm font-semibold text-foreground leading-snug">{event.title}</p>
          {event.subtitle && (
            <p className="mt-0.5 text-xs text-muted-foreground">{event.subtitle}</p>
          )}
        </div>

        {/* Exam subjects */}
        {examNames.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {examNames.map(name => (
              <span
                key={name}
                className="inline-flex items-center gap-1 rounded-lg bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-700"
              >
                <BookOpen className="h-2.5 w-2.5 shrink-0" />
                {name}
              </span>
            ))}
          </div>
        )}

        {/* Countdown */}
        {status === 'upcoming' && days > 0 && days <= 60 && (
          <span className="flex items-center gap-1 text-[10px] font-medium text-navy">
            <Clock className="h-3 w-3" />
            Faltam {days} {days === 1 ? 'dia' : 'dias'}
          </span>
        )}
        {status === 'active' && (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
            <Clock className="h-3 w-3" />
            {event.endDate ? `Faltam ${daysUntil(event.endDate)} dias para fechar` : 'A decorrer hoje'}
          </span>
        )}
      </div>
    </div>
  )
}

export function DGESTimeline() {
  const [starred, setStarred] = useState<Set<string>>(new Set())
  const [onlyStarred, setOnlyStarred] = useState(false)
  const [filter, setFilter] = useState<'all' | 'iave' | 'dges'>('all')

  useEffect(() => {
    setStarred(loadStarred())
  }, [])

  const toggleStar = (id: string) => {
    setStarred(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      saveStarred(next)
      return next
    })
  }

  const visible = useMemo(() => {
    return ALL_EVENTS.filter(e => {
      if (onlyStarred && !starred.has(e.id)) return false
      if (filter !== 'all' && e.type !== filter) return false
      return true
    })
  }, [onlyStarred, starred, filter])

  const starredCount = starred.size

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-foreground">Calendário 2025</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Exames IAVE e fases do Concurso Nacional de Acesso.
          Marca as datas importantes com ⭐.
        </p>
      </div>

      {/* Controls */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {/* Type filter */}
        <div className="flex overflow-hidden rounded-xl border border-border/60 bg-slate-50">
          {(['all', 'iave', 'dges'] as const).map(t => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3.5 py-2 text-xs font-medium transition-colors ${
                filter === t
                  ? 'bg-navy text-white shadow-sm'
                  : 'text-muted-foreground hover:bg-white hover:text-foreground'
              }`}
            >
              {t === 'all' ? 'Tudo' : t === 'iave' ? 'Exames IAVE' : 'Fases DGES'}
            </button>
          ))}
        </div>

        {/* Starred filter */}
        <button
          onClick={() => setOnlyStarred(v => !v)}
          className={`inline-flex h-9 items-center gap-2 rounded-xl border px-3.5 text-sm font-medium transition-all ${
            onlyStarred
              ? 'border-amber-300 bg-amber-50 text-amber-700 shadow-sm'
              : 'border-border/60 bg-white text-muted-foreground hover:border-amber-300 hover:text-amber-600'
          }`}
        >
          <Star className={`h-3.5 w-3.5 ${onlyStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
          Só as minhas
          {starredCount > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-400 px-1.5 text-[10px] font-bold text-white">
              {starredCount}
            </span>
          )}
        </button>

        <span className="ml-auto text-xs text-muted-foreground">
          {visible.length} {visible.length === 1 ? 'evento' : 'eventos'}
        </span>
      </div>

      {/* Events */}
      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Star className="mb-3 h-8 w-8 text-muted-foreground/30" />
          <p className="font-medium text-muted-foreground">Nenhum evento marcado.</p>
          <p className="mt-1 text-sm text-muted-foreground/60">
            Clica na ⭐ de um evento para o guardar aqui.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {visible.map(event => (
            <EventCard
              key={event.id}
              event={event}
              starred={starred.has(event.id)}
              onToggle={() => toggleStar(event.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
