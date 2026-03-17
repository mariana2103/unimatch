'use client'

import { useState, useEffect, useMemo } from 'react'
import { TrendingUp, Sparkles, RotateCcw, ArrowUpRight } from 'lucide-react'
import { useUser } from '@/lib/user-context'
import { calculateAdmissionGrade } from '@/lib/data'
import { EXAM_SUBJECTS } from '@/lib/constants'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { CourseUI } from '@/lib/types'

function transformCourse(row: any, reqs: any[]): CourseUI {
  return {
    id: row.id,
    nome: row.nome,
    instituicao: row.instituicao_nome,
    distrito: row.distrito,
    area: row.area,
    tipo: row.tipo,
    vagas: row.vagas,
    notaUltimoColocado: row.nota_ultimo_colocado !== null ? Math.round(row.nota_ultimo_colocado * 10) : null,
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

export function Simulator2Fase({ onViewDetails }: { onViewDetails?: (course: CourseUI) => void }) {
  const { isLoggedIn, profile, exams } = useUser()
  const [courses, setCourses] = useState<CourseUI[]>([])
  const [loadingCourses, setLoadingCourses] = useState(true)
  const [simGrades, setSimGrades] = useState<Record<string, number>>({})

  // Init sliders from real exam grades
  useEffect(() => {
    const init: Record<string, number> = {}
    for (const e of exams) init[e.exam_code] = e.grade
    setSimGrades(init)
  }, [exams])

  // Load courses once
  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('courses').select('*').not('nota_ultimo_colocado', 'is', null),
      supabase.from('course_requirements').select('*'),
    ]).then(([{ data: courseRows }, { data: reqRows }]) => {
      if (courseRows && reqRows) {
        setCourses(courseRows.map((r: any) => transformCourse(r, reqRows)))
      }
      setLoadingCourses(false)
    })
  }, [])

  const results = useMemo(() => {
    if (!profile || profile.media_final_calculada <= 0 || !courses.length) return []

    const realExams = exams.map(e => ({ subjectCode: e.exam_code, grade: e.grade }))
    const simExams = Object.entries(simGrades).map(([code, grade]) => ({ subjectCode: code, grade }))

    return courses
      .map(course => {
        const sim = calculateAdmissionGrade(profile.media_final_calculada, simExams, course)
        if (!sim.hasRequiredExams) return null

        const real = calculateAdmissionGrade(profile.media_final_calculada, realExams, course)
        const cutoff = course.notaUltimoColocado

        const realAbove = real.hasRequiredExams && cutoff !== null && real.grade >= cutoff && real.meetsMinimum
        const simAbove  = cutoff !== null && sim.grade >= cutoff && sim.meetsMinimum
        const newlyReachable = !realAbove && simAbove
        const distanceToCutoff = cutoff !== null ? sim.grade - cutoff : 0

        return { course, real, sim, realAbove, simAbove, newlyReachable, distanceToCutoff }
      })
      .filter(Boolean)
      .sort((a, b) => {
        // 1. Newly reachable first
        if (a!.newlyReachable !== b!.newlyReachable) return a!.newlyReachable ? -1 : 1
        // 2. Already above cutoff
        if (a!.simAbove !== b!.simAbove) return a!.simAbove ? -1 : 1
        // 3. Within group: sorted by distance to cutoff (DESC = closest first when below, highest first when above)
        return b!.distanceToCutoff - a!.distanceToCutoff
      }) as Array<{
        course: CourseUI
        real: ReturnType<typeof calculateAdmissionGrade>
        sim: ReturnType<typeof calculateAdmissionGrade>
        realAbove: boolean
        simAbove: boolean
        newlyReachable: boolean
        distanceToCutoff: number
      }>
  }, [courses, profile, exams, simGrades])

  const newlyReachableCount = results.filter(r => r.newlyReachable).length
  const alreadyAboveCount   = results.filter(r => r.simAbove && !r.newlyReachable).length

  const resetSliders = () => {
    const reset: Record<string, number> = {}
    for (const e of exams) reset[e.exam_code] = e.grade
    setSimGrades(reset)
  }

  // ── Empty states ────────────────────────────────────────────────────────────

  if (!isLoggedIn) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <Sparkles className="mx-auto mb-4 h-10 w-10 text-navy/30" />
        <h2 className="text-lg font-bold text-foreground">Simulador 2ª Fase</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Faz login para simular o impacto de melhorar as tuas notas de exame em tempo real.
        </p>
      </div>
    )
  }

  if (!profile || profile.media_final_calculada <= 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h2 className="text-lg font-bold text-foreground">Simulador 2ª Fase</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Completa o teu perfil com as notas do secundário para usar o simulador.
        </p>
        <a href="/profile" className="mt-4 inline-block text-sm font-medium text-navy hover:underline">
          Ir para o perfil →
        </a>
      </div>
    )
  }

  if (exams.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h2 className="text-lg font-bold text-foreground">Simulador 2ª Fase</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Adiciona as tuas provas de ingresso no perfil para usar o simulador.
        </p>
        <a href="/profile" className="mt-4 inline-block text-sm font-medium text-navy hover:underline">
          Ir para o perfil →
        </a>
      </div>
    )
  }

  // ── Main UI ─────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Page header */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-foreground">Simulador 2ª Fase</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Move os sliders para ver quais os cursos que passas a conseguir entrar.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">

        {/* ── Left panel: sliders ─────────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border/50 bg-card p-5">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Notas dos Exames</h3>
              <button
                onClick={resetSliders}
                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                Repor
              </button>
            </div>

            <div className="space-y-6">
              {exams.map(exam => {
                const name     = EXAM_SUBJECTS.find(e => e.code === exam.exam_code)?.name ?? `Exame ${exam.exam_code}`
                const real     = exam.grade
                const sim      = simGrades[exam.exam_code] ?? real
                const delta    = sim - real
                const pctReal  = (real / 200) * 100

                return (
                  <div key={exam.exam_code}>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-medium text-foreground truncate max-w-[150px]">{name}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        {delta !== 0 && (
                          <span className={cn(
                            'text-[10px] font-bold',
                            delta > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
                          )}>
                            {delta > 0 ? '+' : ''}{delta}
                          </span>
                        )}
                        <span className="w-8 text-right text-sm font-bold tabular-nums text-foreground">
                          {(sim / 10).toFixed(1)}
                        </span>
                      </div>
                    </div>

                    {/* Slider with real-grade tick mark */}
                    <div className="relative">
                      {/* Real grade tick */}
                      <div
                        className="pointer-events-none absolute top-1/2 z-10 h-3 w-px -translate-y-1/2 rounded-full bg-muted-foreground/50"
                        style={{ left: `${pctReal}%` }}
                      />
                      <input
                        type="range"
                        min={0}
                        max={200}
                        step={1}
                        value={sim}
                        onChange={e => setSimGrades(prev => ({ ...prev, [exam.exam_code]: Number(e.target.value) }))}
                        className="w-full h-1.5 cursor-pointer appearance-none rounded-full bg-muted accent-navy"
                      />
                    </div>

                    <div className="mt-1 flex justify-between text-[9px] text-muted-foreground/50">
                      <span>0</span>
                      <span>real: {(real / 10).toFixed(1)}</span>
                      <span>20</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Stats summary */}
          <div className="rounded-xl border border-border/50 bg-card p-4 space-y-2.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground text-xs">Média Secundário</span>
              <span className="font-semibold">{profile.media_final_calculada.toFixed(1)}</span>
            </div>
            <div className="h-px bg-border/40" />
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Já acessíveis</span>
              <span className="font-semibold text-foreground">{alreadyAboveCount}</span>
            </div>
            {newlyReachableCount > 0 && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-200/60 bg-emerald-50/60 dark:border-emerald-800/30 dark:bg-emerald-950/25 px-3 py-2">
                <TrendingUp className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                  +{newlyReachableCount} novo{newlyReachableCount !== 1 ? 's' : ''} com esta simulação
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Right panel: course results ─────────────────────────────────── */}
        <div>
          {loadingCourses ? (
            <div className="flex items-center justify-center py-24">
              <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-navy" />
            </div>
          ) : results.length === 0 ? (
            <div className="py-20 text-center text-sm text-muted-foreground">
              Nenhum curso encontrado com as tuas provas de ingresso.
            </div>
          ) : (
            <div className="space-y-2">
              {results.map(({ course, real, sim, realAbove, simAbove, newlyReachable, distanceToCutoff }) => {
                const cutoff   = course.notaUltimoColocado
                const nearMiss = !simAbove && cutoff !== null && cutoff - sim.grade <= 15

                return (
                  <div
                    key={course.id}
                    onClick={() => onViewDetails?.(course)}
                    className={cn(
                      'group relative flex items-center gap-4 rounded-xl border px-4 py-3.5 transition-all',
                      onViewDetails && 'cursor-pointer',
                      newlyReachable
                        ? 'border-emerald-300/70 bg-emerald-50/70 shadow-sm shadow-emerald-500/10 dark:border-emerald-700/40 dark:bg-emerald-950/25'
                        : simAbove
                          ? 'border-border/50 bg-card hover:border-border hover:shadow-sm'
                          : nearMiss
                            ? 'border-amber-200/60 bg-amber-50/40 dark:border-amber-800/30 dark:bg-amber-950/15'
                            : 'border-border/30 bg-card/60 opacity-80'
                    )}
                  >
                    {/* "Novo" badge */}
                    {newlyReachable && (
                      <span className="absolute -top-2.5 left-3 rounded-full bg-emerald-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-sm">
                        Novo
                      </span>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">{course.nome}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {course.instituicao} · {course.distrito}
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          <div className="flex items-baseline justify-end gap-1.5">
                            {/* Real grade struck through if different */}
                            {real.hasRequiredExams && real.grade !== sim.grade && (
                              <span className="text-[10px] tabular-nums text-muted-foreground/50 line-through">
                                {(real.grade / 10).toFixed(1)}
                              </span>
                            )}
                            <span className={cn(
                              'text-base font-bold tabular-nums',
                              simAbove
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : nearMiss
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-foreground'
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
                                  : 'text-red-500 dark:text-red-400'
                              )}>
                                ({sim.grade >= cutoff ? '+' : ''}{((sim.grade - cutoff) / 10).toFixed(1)})
                              </span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {onViewDetails && (
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground/30 transition-colors group-hover:text-muted-foreground" />
                    )}
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
