'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import {
  TrendingUp, Sparkles, RotateCcw, ArrowUpRight,
  Plus, X, Info, ChevronDown, Heart, Lock,
} from 'lucide-react'
import { useUser } from '@/lib/user-context'
import { calculateAdmissionGrade, filterValidExams } from '@/lib/data'
import { EXAM_SUBJECTS } from '@/lib/constants'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { CourseUI } from '@/lib/types'

// ─── helpers ───────────────────────────────────────────────────────────────

function transformCourse(row: any, courseReqs: any[]): CourseUI {
  return {
    id: row.id,
    nome: row.nome,
    instituicao: row.instituicao_nome,
    distrito: row.distrito,
    area: row.area,
    tipo: row.tipo,
    vagas: row.vagas,
    notaUltimoColocado:   row.nota_ultimo_colocado    != null ? row.nota_ultimo_colocado    * 10 : null,
    notaUltimoColocadoF2: row.nota_ultimo_colocado_f2 != null ? row.nota_ultimo_colocado_f2 * 10 : null,
    pesoSecundario: row.peso_secundario,
    pesoExame: row.peso_exames,
    notaMinima:     row.nota_minima_p_ingresso ?? null,
    notaMinimProva: row.nota_minima_prova      ?? null,
    provasIngresso: courseReqs.map((r: any) => ({
      code: r.exam_code,
      name: EXAM_SUBJECTS.find(e => e.code === r.exam_code)?.name ?? r.exam_code,
      weight: r.weight,
      conjunto_id: r.conjunto_id ?? 1,
    })),
    historico: row.history
      ? row.history.map((h: any) => ({
          year:    h.year,
          nota_f1:  h.nota_f1 != null ? h.nota_f1 * 10 : (h.nota != null ? h.nota * 10 : null),
          nota_f2:  h.nota_f2 != null ? h.nota_f2 * 10 : null,
          vagas_f1: h.vagas_f1 ?? null,
          vagas_f2: h.vagas_f2 ?? null,
        }))
      : null,
    link_oficial: row.link_oficial,
  }
}

// ─── Grade Slider ───────────────────────────────────────────────────────────

interface GradeSliderProps {
  label: string
  value: number           // 0–200 (exam) or 0–200 (media *10)
  min?: number            // lower bound of slider (default 0); use 95 for exam PIs
  max: number             // 200 for exams; 200 for media shown as ×10
  realValue?: number      // show a tick at this position
  onChange: (v: number) => void
  onRemove?: () => void
  displayScale?: number   // divide for display, e.g. 10 → shows 0–20
}

function GradeSlider({
  label, value, min = 0, max, realValue, onChange, onRemove, displayScale = 10,
}: GradeSliderProps) {
  const delta  = realValue !== undefined ? value - realValue : 0
  const range  = max - min
  const pctRef = realValue !== undefined ? ((realValue - min) / range) * 100 : null

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          {onRemove && (
            <button
              onClick={onRemove}
              className="shrink-0 rounded-full p-0.5 text-muted-foreground/50 hover:bg-muted hover:text-foreground transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          )}
          <span className="truncate text-xs font-medium text-foreground">{label}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {delta !== 0 && (
            <span className={cn(
              'text-[10px] font-bold tabular-nums',
              delta > 0 ? 'text-emerald' : 'text-destructive',
            )}>
              {delta > 0 ? '+' : ''}{(delta / displayScale).toFixed(1)}
            </span>
          )}
          <span className="w-9 text-right text-sm font-bold tabular-nums text-foreground">
            {(value / displayScale).toFixed(1)}
          </span>
        </div>
      </div>

      <div className="relative mt-1">
        {/* Real-grade tick */}
        {pctRef !== null && (
          <div
            className="pointer-events-none absolute top-1/2 z-10 h-4 w-0.5 -translate-y-1/2 rounded-full bg-muted-foreground/50"
            style={{ left: `calc(${pctRef}% - 1px)` }}
          />
        )}
        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="w-full"
          style={{
            background: `linear-gradient(to right, var(--navy) ${((value - min) / range) * 100}%, var(--border) ${((value - min) / range) * 100}%)`,
          }}
        />
        {realValue !== undefined && (
          <div className="mt-0.5 flex justify-between text-[9px] text-muted-foreground/40">
            <span>{(min / displayScale).toFixed(1)}</span>
            <span>real: {(realValue / displayScale).toFixed(1)}</span>
            <span>{max / displayScale}</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Add Exam Picker ────────────────────────────────────────────────────────

function AddExamPicker({
  existing,
  onAdd,
}: {
  existing: string[]
  onAdd: (code: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const available = EXAM_SUBJECTS.filter(e => !existing.includes(e.code))

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (available.length === 0) return null

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border/60 py-2 text-xs text-muted-foreground transition-colors hover:border-navy/40 hover:text-navy"
      >
        <Plus className="h-3.5 w-3.5" />
        Adicionar prova hipotética
        <ChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-y-auto rounded-lg border border-border bg-popover shadow-lg">
          {available.map(exam => (
            <button
              key={exam.code}
              onClick={() => { onAdd(exam.code); setOpen(false) }}
              className="flex w-full items-center px-3 py-2 text-left text-xs text-foreground hover:bg-muted/60 transition-colors"
            >
              {exam.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main component ─────────────────────────────────────────────────────────

export function Simulator2Fase({ onViewDetails }: { onViewDetails?: (course: CourseUI) => void }) {
  const { isLoggedIn, profile, exams, favorites, toggleFavorite } = useUser()

  const [view, setView]               = useState<'favorites' | 'simulator'>('favorites')
  const [phase, setPhase]             = useState<'1' | '2'>('1')
  const [includePrivadas, setIncludePrivadas] = useState(false)
  const [courses, setCourses]         = useState<CourseUI[]>([])
  const [loadingCourses, setLoading]  = useState(true)

  // Simulated media interna (stored ×10 to match exam scale: 0–200)
  const [simMedia, setSimMedia]     = useState(0)
  // Simulated exam grades (0–200), keyed by exam_code
  const [simGrades, setSimGrades]   = useState<Record<string, number>>({})
  // Exam codes added by the user (hypothetical)
  const [extraCodes, setExtraCodes] = useState<string[]>([])

  const realMedia  = (profile?.media_final_calculada ?? 0) * 10  // to 0-200
  const realExams  = useMemo(
    () => filterValidExams(exams, phase === '1' ? 1 : 2),
    [exams, phase],
  )

  // Initialise simulation from profile whenever profile/exams change
  useEffect(() => {
    setSimMedia(realMedia)
    const init: Record<string, number> = {}
    for (const e of exams) init[e.exam_code] = e.grade
    setSimGrades(init)
    setExtraCodes([])
  }, [realMedia, exams])

  // Load all courses — show first batch immediately, stream the rest
  useEffect(() => {
    let cancelled = false
    const supabase = createClient()
    const PAGE = 1000
    const SELECT = `
      id, nome, instituicao_nome, distrito, area, tipo, vagas,
      nota_ultimo_colocado, nota_ultimo_colocado_f2,
      peso_secundario, peso_exames,
      nota_minima_p_ingresso, nota_minima_prova,
      link_oficial, history,
      course_requirements(exam_code, weight, conjunto_id)
    `
    const run = async () => {
      let from = 0
      let isFirst = true
      while (!cancelled) {
        const { data, error } = await supabase
          .from('courses')
          .select(SELECT)
          .range(from, from + PAGE - 1)
        if (cancelled) break
        if (error || !data || data.length === 0) break
        const batch = data.map((r: any) => transformCourse(r, r.course_requirements ?? []))
        if (isFirst) {
          setCourses(batch)
          setLoading(false)
          isFirst = false
        } else {
          setCourses(prev => [...prev, ...batch])
        }
        if (data.length < PAGE) break
        from += PAGE
      }
      if (isFirst && !cancelled) setLoading(false)
    }
    run()
    return () => { cancelled = true }
  }, [])

  // All exam codes currently in the simulation (profile + extra)
  const allSimCodes = useMemo(
    () => [...new Set([...exams.map(e => e.exam_code), ...extraCodes])],
    [exams, extraCodes],
  )

  // Apply validity rules: fase restriction + 4-year window (+ extra hypothetical codes always valid)
  const simExamsList = useMemo(() => {
    const validRealCodes = new Set(
      filterValidExams(exams, phase === '1' ? 1 : 2).map(e => e.subjectCode)
    )
    return allSimCodes
      .filter(code => extraCodes.includes(code) || validRealCodes.has(code))
      .map(code => ({ subjectCode: code, grade: simGrades[code] ?? 95 }))
  }, [allSimCodes, simGrades, exams, extraCodes, phase])

  // The media as a 0-20 float for calculateAdmissionGrade
  const simMediaScaled  = simMedia / 10
  const realMediaScaled = realMedia / 10

  const favoriteCourses = useMemo(
    () => courses.filter(c =>
      favorites.includes(c.id) &&
      (includePrivadas || c.tipo === 'publica')
    ),
    [courses, favorites, includePrivadas],
  )

  const results = useMemo(() => {
    if (simMediaScaled <= 0 || !favoriteCourses.length) return []

    return favoriteCourses
      .map(course => {
        const sim  = calculateAdmissionGrade(simMediaScaled, simExamsList, course)
        if (!sim.hasRequiredExams) return null

        const real = calculateAdmissionGrade(realMediaScaled, realExams, course)
        const cutoff = phase === '2'
          ? (course.notaUltimoColocadoF2 ?? course.notaUltimoColocado)
          : course.notaUltimoColocado

        const realAbove = real.hasRequiredExams && cutoff !== null && real.grade >= cutoff && real.meetsMinimum
        const simAbove  = cutoff !== null && sim.grade >= cutoff && sim.meetsMinimum
        const newlyReachable = !realAbove && simAbove
        const distanceToCutoff = cutoff !== null ? sim.grade - cutoff : 0

        return { course, real, sim, realAbove, simAbove, newlyReachable, distanceToCutoff }
      })
      .filter(Boolean)
      .sort((a, b) => {
        if (a!.newlyReachable !== b!.newlyReachable) return a!.newlyReachable ? -1 : 1
        if (a!.simAbove !== b!.simAbove) return a!.simAbove ? -1 : 1
        return b!.distanceToCutoff - a!.distanceToCutoff
      }) as Array<{
        course: CourseUI
        real: ReturnType<typeof calculateAdmissionGrade>
        sim:  ReturnType<typeof calculateAdmissionGrade>
        realAbove: boolean
        simAbove:  boolean
        newlyReachable: boolean
        distanceToCutoff: number
      }>
  }, [favoriteCourses, simMediaScaled, realMediaScaled, realExams, simExamsList, phase])

  const newCount   = results.filter(r => r.newlyReachable).length
  const aboveCount = results.filter(r => r.simAbove && !r.newlyReachable).length

  function reset() {
    setSimMedia(realMedia)
    const init: Record<string, number> = {}
    for (const e of exams) init[e.exam_code] = e.grade
    setSimGrades(init)
    setExtraCodes([])
  }

  function addExtra(code: string) {
    setExtraCodes(prev => [...prev, code])
    setSimGrades(prev => ({ ...prev, [code]: 95 }))
  }

  function removeExtra(code: string) {
    setExtraCodes(prev => prev.filter(c => c !== code))
    setSimGrades(prev => { const n = { ...prev }; delete n[code]; return n })
  }

  // ── Empty states ─────────────────────────────────────────────────────────

  if (!isLoggedIn) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <Sparkles className="mx-auto mb-4 h-10 w-10 text-muted-foreground/30" />
        <h2 className="text-lg font-bold">Simulador de Candidatura</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Faz login para simular o impacto das tuas notas em tempo real.
        </p>
      </div>
    )
  }

  // All favorited courses regardless of cutoff
  const allFavoriteCourses = useMemo(
    () => courses.filter(c => favorites.includes(c.id)),
    [courses, favorites],
  )

  // ── Main UI ───────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">

      {/* ── Header + sub-tabs ─────────────────────────────────────────────── */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Simulador de Candidatura</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Favoritos e simulação de candidatura em tempo real.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start flex-wrap">
          {/* Sub-tab toggle */}
          <div className="flex items-center rounded-lg border border-border/60 bg-muted/30 p-0.5">
            <button
              onClick={() => setView('favorites')}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all',
                view === 'favorites'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Heart className="h-3 w-3" />
              Favoritos
              {!loadingCourses && allFavoriteCourses.length > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
                  {allFavoriteCourses.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setView('simulator')}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all',
                view === 'simulator'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <TrendingUp className="h-3 w-3" />
              Simulador
            </button>
          </div>

          {view === 'simulator' && (
            <>
              <div className="flex items-center rounded-lg border border-border/60 bg-muted/30 p-0.5">
                {(['1', '2'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setPhase(p)}
                    className={cn(
                      'rounded-md px-4 py-1.5 text-xs font-semibold transition-all',
                      phase === p
                        ? 'bg-background shadow-sm text-foreground'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {p}ª Fase
                  </button>
                ))}
              </div>
              <button
                onClick={() => setIncludePrivadas(v => !v)}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all',
                  includePrivadas
                    ? 'border-border bg-muted text-foreground'
                    : 'border-border/50 text-muted-foreground hover:text-foreground hover:border-border',
                )}
              >
                <Lock className="h-3 w-3" />
                {includePrivadas ? 'Incluindo privadas' : 'Só públicas'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Favoritos view ────────────────────────────────────────────────── */}
      {view === 'favorites' && (
        <div>
          {loadingCourses ? (
            <div className="flex items-center justify-center py-24">
              <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-navy" />
            </div>
          ) : allFavoriteCourses.length === 0 ? (
            <div className="rounded-xl border border-border/40 bg-card/50 py-20 text-center">
              <Heart className="mx-auto mb-3 h-10 w-10 text-muted-foreground/20" />
              <p className="text-sm font-medium text-muted-foreground">Ainda não tens favoritos.</p>
              <p className="mt-1 text-xs text-muted-foreground/60">
                Guarda cursos com o{' '}
                <Heart className="inline h-3 w-3 text-destructive/60" />{' '}
                no explorador.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {allFavoriteCourses.map(course => (
                <div
                  key={course.id}
                  onClick={() => onViewDetails?.(course)}
                  className="group flex cursor-pointer items-center gap-4 rounded-xl border border-border/50 bg-card px-4 py-3.5 transition-all hover:border-border hover:shadow-sm"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{course.nome}</p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {course.instituicao} · {course.distrito}
                          {course.area && <span className="ml-1.5 text-muted-foreground/50">· {course.area}</span>}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        {course.notaUltimoColocado !== null ? (
                          <>
                            <p className="text-sm font-bold tabular-nums text-foreground">
                              {(course.notaUltimoColocado / 10).toFixed(1)}
                            </p>
                            <p className="text-[10px] text-muted-foreground">último colocado</p>
                          </>
                        ) : (
                          <p className="text-[10px] text-muted-foreground/50">sem dados</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); toggleFavorite(course.id) }}
                    className="shrink-0 rounded-full p-1.5 text-destructive transition-colors hover:bg-destructive/10"
                    title="Remover dos favoritos"
                  >
                    <Heart className="h-4 w-4 fill-destructive" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Simulator view ────────────────────────────────────────────────── */}
      {view === 'simulator' && (<>

      {/* 2ª fase disclaimer */}
      {phase === '2' && (
        <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-warning/25 bg-warning/8 px-4 py-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <p className="text-xs text-warning">
            <span className="font-semibold">Nota:</span> para cursos sem dados de corte da 2ª Fase,
            é usado o corte da 1ª Fase como referência. Os cortes reais da 2ª Fase são tipicamente mais baixos.
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">

        {/* ── Left: inputs panel ───────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Média Interna — stat-style +/- control */}
          <div className="rounded-xl border border-border/50 bg-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground">Média do Secundário</p>
                {realMedia > 0 && simMedia !== realMedia && (
                  <p className="text-[9px] text-muted-foreground/50">
                    real: {(realMedia / 10).toFixed(1)}
                  </p>
                )}
              </div>
              {simMedia !== realMedia && realMedia > 0 && (
                <span className={`text-[10px] font-bold tabular-nums ${simMedia > realMedia ? 'text-emerald' : 'text-destructive'}`}>
                  {simMedia > realMedia ? '+' : ''}{((simMedia - realMedia) / 10).toFixed(1)}
                </span>
              )}
            </div>
            <div className="mt-3 flex items-center justify-between">
              <button
                onClick={() => setSimMedia(v => Math.max(0, v - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:border-border hover:text-foreground active:bg-muted"
              >
                <span className="text-base leading-none">−</span>
              </button>
              <span className="text-2xl font-bold tabular-nums text-foreground">
                {(simMedia / 10).toFixed(1)}
              </span>
              <button
                onClick={() => setSimMedia(v => Math.min(200, v + 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:border-border hover:text-foreground active:bg-muted"
              >
                <span className="text-base leading-none">+</span>
              </button>
            </div>
          </div>

          {/* Provas */}
          <div className="rounded-xl border border-border/50 bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Provas de Ingresso (simuladas)
              </h3>
              <button
                onClick={reset}
                className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                Repor
              </button>
            </div>

            {allSimCodes.length === 0 ? (
              <p className="py-2 text-center text-xs text-muted-foreground">
                Sem provas. Adiciona uma abaixo.{' '}
                <a href="/profile" className="font-medium text-navy hover:underline">
                  Ou vai ao perfil →
                </a>
              </p>
            ) : (
              <div className="space-y-5">
                {allSimCodes.map(code => {
                  const name      = EXAM_SUBJECTS.find(e => e.code === code)?.name ?? `Exame ${code}`
                  const isExtra   = extraCodes.includes(code)
                  const realGrade = exams.find(e => e.exam_code === code)?.grade

                  return (
                    <GradeSlider
                      key={code}
                      label={name}
                      value={simGrades[code] ?? 95}
                      min={95}
                      max={200}
                      realValue={realGrade}
                      onChange={v => setSimGrades(prev => ({ ...prev, [code]: v }))}
                      onRemove={isExtra ? () => removeExtra(code) : undefined}
                      displayScale={10}
                    />
                  )
                })}
              </div>
            )}

            <div className="mt-5">
              <AddExamPicker existing={allSimCodes} onAdd={addExtra} />
            </div>
          </div>

          {/* Stats */}
          <div className="rounded-xl border border-border/50 bg-card p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Já acessíveis</span>
              <span className="font-semibold tabular-nums">{aboveCount}</span>
            </div>
            {newCount > 0 && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald/25 bg-emerald/8 px-3 py-2">
                <TrendingUp className="h-3.5 w-3.5 shrink-0 text-emerald" />
                <p className="text-[11px] font-semibold text-emerald">
                  +{newCount} novo{newCount !== 1 ? 's' : ''} com esta simulação
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Right: results ───────────────────────────────────────────────── */}
        <div>
          {loadingCourses ? (
            <div className="flex items-center justify-center py-24">
              <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-navy" />
            </div>
          ) : favorites.length === 0 ? (
            <div className="rounded-xl border border-border/40 bg-card/50 py-16 text-center">
              <Heart className="mx-auto mb-3 h-8 w-8 text-muted-foreground/20" />
              <p className="text-sm text-muted-foreground">Ainda não tens favoritos.</p>
              <p className="mt-1 text-xs text-muted-foreground/60">
                Guarda cursos com o{' '}
                <Heart className="inline h-3 w-3 text-destructive/60" />{' '}
                no explorador para os simular aqui.
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="rounded-xl border border-border/40 bg-card/50 py-16 text-center">
              <p className="text-sm text-muted-foreground">
                Nenhum favorito tem as provas que adicionaste.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {results.map(({ course, real, sim, simAbove, newlyReachable }) => {
                const cutoff       = phase === '2'
                  ? (course.notaUltimoColocadoF2 ?? course.notaUltimoColocado)
                  : course.notaUltimoColocado
                const failsMinimum = !sim.meetsMinimum
                // nearMiss only makes sense when minimums are met — otherwise it's red, not orange
                const nearMiss     = !simAbove && !failsMinimum && cutoff !== null && cutoff - sim.grade <= 15

                return (
                  <div
                    key={course.id}
                    onClick={() => onViewDetails?.(course)}
                    className={cn(
                      'group relative flex cursor-pointer items-center gap-4 rounded-xl border px-4 py-3.5 transition-all',
                      newlyReachable
                        ? 'border-emerald/25 bg-emerald/8 shadow-sm'
                        : simAbove
                          ? 'border-border/50 bg-card hover:border-border hover:shadow-sm'
                          : failsMinimum
                            ? 'border-destructive/25 bg-destructive/8'
                            : nearMiss
                              ? 'border-warning/25 bg-warning/8'
                              : 'border-border/30 bg-card/50 opacity-75',
                    )}
                  >
                    {newlyReachable && (
                      <span className="absolute -top-2.5 left-3 rounded-full bg-emerald px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary-foreground shadow-sm">
                        Novo
                      </span>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">{course.nome}</p>
                          <p className="truncate text-[11px] text-muted-foreground">
                            {course.instituicao} · {course.distrito}
                          </p>
                          {failsMinimum && (
                            <p className="mt-0.5 text-[10px] font-semibold text-destructive">
                              Nota mínima não atingida
                            </p>
                          )}
                        </div>

                        <div className="shrink-0 text-right">
                          <div className="flex items-baseline justify-end gap-1.5">
                            {real.hasRequiredExams && real.grade !== sim.grade && (
                              <span className="text-[10px] tabular-nums text-muted-foreground/50 line-through">
                                {(real.grade / 10).toFixed(1)}
                              </span>
                            )}
                            <span className={cn(
                              'text-base font-bold tabular-nums',
                              simAbove      ? 'text-emerald' :
                              failsMinimum  ? 'text-destructive' :
                              nearMiss      ? 'text-warning' :
                                             'text-foreground',
                            )}>
                              {(sim.grade / 10).toFixed(1)}
                            </span>
                          </div>

                          {cutoff !== null && (
                            <p className="text-[10px] tabular-nums text-muted-foreground">
                              ú.c. {(cutoff / 10).toFixed(1)}{' '}
                              <span className={cn(
                                'font-semibold',
                                sim.grade >= cutoff
                                  ? 'text-emerald'
                                  : 'text-destructive',
                              )}>
                                ({sim.grade >= cutoff ? '+' : ''}{((sim.grade - cutoff) / 10).toFixed(1)})
                              </span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground/20 transition-colors group-hover:text-muted-foreground/60" />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
      </>)}
    </div>
  )
}
