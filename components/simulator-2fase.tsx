'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import {
  TrendingUp, Sparkles, RotateCcw, ArrowUpRight,
  Plus, X, Info, ChevronDown,
} from 'lucide-react'
import { useUser } from '@/lib/user-context'
import { calculateAdmissionGrade } from '@/lib/data'
import { EXAM_SUBJECTS } from '@/lib/constants'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { CourseUI } from '@/lib/types'

// ─── helpers ───────────────────────────────────────────────────────────────

function transformCourse(row: any, reqs: any[]): CourseUI {
  return {
    id: row.id,
    nome: row.nome,
    instituicao: row.instituicao_nome,
    distrito: row.distrito,
    area: row.area,
    tipo: row.tipo,
    vagas: row.vagas,
    notaUltimoColocado:
      row.nota_ultimo_colocado !== null
        ? Math.round(row.nota_ultimo_colocado * 10)
        : null,
    pesoSecundario: row.peso_secundario,
    pesoExame: row.peso_exames,
    notaMinima: row.nota_minima_p_ingresso ?? null,
    provasIngresso: reqs
      .filter((r: any) => r.course_id === row.id)
      .map((r: any) => ({
        code: r.exam_code,
        name: EXAM_SUBJECTS.find(e => e.code === r.exam_code)?.name ?? r.exam_code,
        weight: r.weight,
        conjunto_id: r.conjunto_id ?? 1,
      })),
    historico: row.history
      ? row.history.map((h: any) => ({ year: h.year, nota: Math.round(h.nota * 10) }))
      : null,
    link_oficial: row.link_oficial,
  }
}

// ─── Grade Slider ───────────────────────────────────────────────────────────

interface GradeSliderProps {
  label: string
  value: number           // 0–200 (exam) or 0–200 (media *10)
  max: number             // 200 for exams; 200 for media shown as ×10
  realValue?: number      // show a tick at this position
  onChange: (v: number) => void
  onRemove?: () => void
  displayScale?: number   // divide for display, e.g. 10 → shows 0–20
}

function GradeSlider({
  label, value, max, realValue, onChange, onRemove, displayScale = 10,
}: GradeSliderProps) {
  const delta  = realValue !== undefined ? value - realValue : 0
  const pctRef = realValue !== undefined ? (realValue / max) * 100 : null

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
              delta > 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400',
            )}>
              {delta > 0 ? '+' : ''}{(delta / displayScale).toFixed(1)}
            </span>
          )}
          <span className="w-9 text-right text-sm font-bold tabular-nums text-foreground">
            {(value / displayScale).toFixed(1)}
          </span>
        </div>
      </div>

      <div className="relative py-1">
        {pctRef !== null && (
          <div
            className="pointer-events-none absolute top-1/2 z-10 h-3.5 w-0.5 -translate-y-1/2 rounded-full bg-muted-foreground/40"
            style={{ left: `${pctRef}%` }}
          />
        )}
        <input
          type="range"
          min={0}
          max={max}
          step={1}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="w-full cursor-pointer appearance-none rounded-full accent-navy"
          style={{ height: '6px' }}
        />
      </div>

      {realValue !== undefined && (
        <div className="mt-0.5 flex justify-between text-[9px] text-muted-foreground/40">
          <span>0</span>
          <span>real: {(realValue / displayScale).toFixed(1)}</span>
          <span>{max / displayScale}</span>
        </div>
      )}
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
  const { isLoggedIn, profile, exams } = useUser()

  const [phase, setPhase]           = useState<'1' | '2'>('1')
  const [courses, setCourses]       = useState<CourseUI[]>([])
  const [loadingCourses, setLoading] = useState(true)

  // Simulated media interna (stored ×10 to match exam scale: 0–200)
  const [simMedia, setSimMedia]     = useState(0)
  // Simulated exam grades (0–200), keyed by exam_code
  const [simGrades, setSimGrades]   = useState<Record<string, number>>({})
  // Exam codes added by the user (hypothetical)
  const [extraCodes, setExtraCodes] = useState<string[]>([])

  const realMedia  = (profile?.media_final_calculada ?? 0) * 10  // to 0-200
  const realExams  = useMemo(
    () => exams.map(e => ({ subjectCode: e.exam_code, grade: e.grade })),
    [exams],
  )

  // Initialise simulation from profile whenever profile/exams change
  useEffect(() => {
    setSimMedia(realMedia)
    const init: Record<string, number> = {}
    for (const e of exams) init[e.exam_code] = e.grade
    setSimGrades(init)
    setExtraCodes([])
  }, [realMedia, exams])

  // Load all courses with a cutoff once
  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('courses').select('*').not('nota_ultimo_colocado', 'is', null),
      supabase.from('course_requirements').select('*'),
    ]).then(([{ data: courseRows }, { data: reqRows }]) => {
      if (courseRows && reqRows) {
        setCourses(courseRows.map((r: any) => transformCourse(r, reqRows)))
      }
      setLoading(false)
    })
  }, [])

  // All exam codes currently in the simulation (profile + extra)
  const allSimCodes = useMemo(
    () => [...new Set([...exams.map(e => e.exam_code), ...extraCodes])],
    [exams, extraCodes],
  )

  const simExamsList = useMemo(
    () => allSimCodes.map(code => ({ subjectCode: code, grade: simGrades[code] ?? 100 })),
    [allSimCodes, simGrades],
  )

  // The media as a 0-20 float for calculateAdmissionGrade
  const simMediaScaled  = simMedia / 10
  const realMediaScaled = realMedia / 10

  const results = useMemo(() => {
    if (simMediaScaled <= 0 || !courses.length) return []

    return courses
      .map(course => {
        const sim  = calculateAdmissionGrade(simMediaScaled, simExamsList, course)
        if (!sim.hasRequiredExams) return null

        const real = calculateAdmissionGrade(realMediaScaled, realExams, course)
        const cutoff = course.notaUltimoColocado

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
  }, [courses, simMediaScaled, realMediaScaled, realExams, simExamsList])

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
    setSimGrades(prev => ({ ...prev, [code]: 100 }))
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

  // ── Main UI ───────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">

      {/* ── Header + phase toggle ─────────────────────────────────────────── */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Simulador de Candidatura</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Ajusta a média e os exames — os cursos atualizam em tempo real.
          </p>
        </div>

        <div className="flex items-center rounded-lg border border-border/60 bg-muted/30 p-0.5 self-start">
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
      </div>

      {/* 2ª fase disclaimer */}
      {phase === '2' && (
        <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-amber-200/60 bg-amber-50/60 px-4 py-3 dark:border-amber-800/30 dark:bg-amber-950/20">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-xs text-amber-700 dark:text-amber-300">
            <span className="font-semibold">Nota:</span> as médias de corte mostradas são da 1ª Fase —
            não temos dados históricos da 2ª Fase. Os cortes da 2ª Fase são tipicamente
            0,5–2 valores mais baixos. Usa esta simulação como referência, não como garantia.
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">

        {/* ── Left: inputs panel ───────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Média Interna */}
          <div className="rounded-xl border border-border/50 bg-card p-5">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Média Interna
            </h3>
            <GradeSlider
              label="Média do Secundário"
              value={simMedia}
              max={200}
              realValue={realMedia > 0 ? realMedia : undefined}
              onChange={setSimMedia}
              displayScale={10}
            />
          </div>

          {/* Provas */}
          <div className="rounded-xl border border-border/50 bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Provas de Ingresso
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
                      value={simGrades[code] ?? 100}
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
              <div className="flex items-center gap-2 rounded-lg border border-emerald-200/50 bg-emerald-50/60 px-3 py-2 dark:border-emerald-800/30 dark:bg-emerald-950/25">
                <TrendingUp className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
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
          ) : simMedia <= 0 && allSimCodes.length === 0 ? (
            <div className="rounded-xl border border-border/40 bg-card/50 py-16 text-center">
              <p className="text-sm text-muted-foreground">
                Preenche a média e adiciona provas para ver resultados.
              </p>
              <a href="/profile" className="mt-2 inline-block text-xs font-medium text-navy hover:underline">
                Preencher perfil →
              </a>
            </div>
          ) : results.length === 0 ? (
            <div className="rounded-xl border border-border/40 bg-card/50 py-16 text-center">
              <p className="text-sm text-muted-foreground">
                Nenhum curso corresponde às provas adicionadas.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {results.map(({ course, real, sim, simAbove, newlyReachable, distanceToCutoff }) => {
                const cutoff  = course.notaUltimoColocado
                const nearMiss = !simAbove && cutoff !== null && cutoff - sim.grade <= 15

                return (
                  <div
                    key={course.id}
                    onClick={() => onViewDetails?.(course)}
                    className={cn(
                      'group relative flex cursor-pointer items-center gap-4 rounded-xl border px-4 py-3.5 transition-all',
                      newlyReachable
                        ? 'border-emerald-300/60 bg-emerald-50/60 shadow-sm dark:border-emerald-700/40 dark:bg-emerald-950/20'
                        : simAbove
                          ? 'border-border/50 bg-card hover:border-border hover:shadow-sm'
                          : nearMiss
                            ? 'border-amber-200/50 bg-amber-50/40 dark:border-amber-800/30 dark:bg-amber-950/15'
                            : 'border-border/30 bg-card/50 opacity-75',
                    )}
                  >
                    {newlyReachable && (
                      <span className="absolute -top-2.5 left-3 rounded-full bg-emerald-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-sm">
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
                              simAbove  ? 'text-emerald-600 dark:text-emerald-400' :
                              nearMiss  ? 'text-amber-600 dark:text-amber-400' :
                                          'text-foreground',
                            )}>
                              {(sim.grade / 10).toFixed(1)}
                            </span>
                          </div>

                          {cutoff !== null && (
                            <p className="text-[10px] tabular-nums text-muted-foreground">
                              corte {(cutoff / 10).toFixed(1)}{' '}
                              <span className={cn(
                                'font-semibold',
                                sim.grade >= cutoff
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-rose-500 dark:text-rose-400',
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
    </div>
  )
}
