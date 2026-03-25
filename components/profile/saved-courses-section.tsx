'use client'

import { useState, useEffect, useCallback } from 'react'
import { Heart, ExternalLink, Trash2, ChevronUp, ChevronDown, CheckCircle2, XCircle, AlertCircle, GraduationCap } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/lib/user-context'
import { calculateAdmissionGrade, filterValidExams } from '@/lib/data'
import { EXAM_SUBJECTS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { CourseUI } from '@/lib/types'

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
      name: EXAM_SUBJECTS.find((e: any) => e.code === r.exam_code)?.name ?? r.exam_code,
      weight: r.weight,
      conjunto_id: r.conjunto_id ?? 1,
    })),
    historico: row.history
      ? row.history.map((h: any) => ({
          year: h.year,
          nota_f1: h.nota_f1 != null ? h.nota_f1 * 10 : (h.nota != null ? h.nota * 10 : null),
          nota_f2: h.nota_f2 != null ? h.nota_f2 * 10 : null,
          vagas_f1: h.vagas_f1 ?? null,
          vagas_f2: h.vagas_f2 ?? null,
        }))
      : null,
    link_oficial: row.link_oficial,
  }
}

const MAX_CANDIDATURA = 6

const OPTION_LABELS = ['1ª Opção', '2ª Opção', '3ª Opção', '4ª Opção', '5ª Opção', '6ª Opção']

interface SlotProps {
  course: CourseUI
  index: number
  total: number
  profile: any
  exams: any[]
  onMoveUp: () => void
  onMoveDown: () => void
  onRemove: () => void
  isCandidatura: boolean
}

function CourseSlot({ course, index, total, profile, exams, onMoveUp, onMoveDown, onRemove, isCandidatura }: SlotProps) {
  const hasGrades = profile && profile.media_final_calculada > 0

  let admissionGrade: number | null = null
  let meetsMinimum = false
  let hasRequiredExams = true

  if (hasGrades) {
    const result = calculateAdmissionGrade(
      profile.media_final_calculada,
      filterValidExams(exams, 1),
      course,
    )
    admissionGrade = result.grade
    meetsMinimum = result.meetsMinimum
    hasRequiredExams = result.hasRequiredExams
  }

  const cutoff = course.notaUltimoColocado
  const diff = admissionGrade !== null && cutoff !== null ? admissionGrade - cutoff : null
  const isAbove = diff !== null && diff > 5
  const isNear  = diff !== null && diff >= 0 && diff <= 5
  const isBelow = diff !== null && diff < 0

  const borderClass = isCandidatura
    ? (isAbove ? 'border-emerald/40 bg-emerald/5 dark:bg-emerald/5'
      : isNear  ? 'border-warning/40 bg-warning/5 dark:bg-warning/5'
      : isBelow ? 'border-destructive/30 bg-destructive/5 dark:bg-destructive/5'
      : 'border-border/40 bg-background')
    : 'border-border/30 bg-muted/30'

  return (
    <div className={cn('flex items-start gap-2.5 rounded-xl border px-3 py-2.5 transition-colors', borderClass)}>
      {/* Slot badge */}
      {isCandidatura ? (
        <div className="flex h-6 min-w-13 shrink-0 items-center justify-center rounded-md bg-navy/10 px-1.5 text-[9px] font-bold uppercase tracking-wide text-navy">
          {OPTION_LABELS[index]}
        </div>
      ) : (
        <div className="flex h-6 min-w-13 shrink-0 items-center justify-center rounded-md bg-muted text-[9px] font-medium text-muted-foreground">
          Guardado
        </div>
      )}

      {/* Course info */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-snug text-foreground line-clamp-1">{course.nome}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {course.instituicao} · {course.distrito}
        </p>

        {hasGrades && isCandidatura && (
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            {admissionGrade !== null && (
              <span className="text-[10px] tabular-nums text-muted-foreground">
                Nota: <span className="font-semibold text-foreground">{(admissionGrade / 10).toFixed(2)}</span>
              </span>
            )}
            {diff !== null && (
              <span className={cn('text-[10px] tabular-nums font-medium',
                isAbove ? 'text-emerald' : isNear ? 'text-warning' : 'text-destructive'
              )}>
                {diff >= 0 ? `+${(diff / 10).toFixed(2)} val.` : `${(diff / 10).toFixed(2)} val.`}
              </span>
            )}
            {!hasRequiredExams && (
              <span className="text-[10px] text-warning flex items-center gap-0.5">
                <AlertCircle className="h-2.5 w-2.5" /> Exames em falta
              </span>
            )}
            {hasRequiredExams && !meetsMinimum && admissionGrade !== null && (
              <span className="text-[10px] text-destructive flex items-center gap-0.5">
                <XCircle className="h-2.5 w-2.5" /> Abaixo do mínimo
              </span>
            )}
          </div>
        )}
      </div>

      {/* Right: cutoff + actions */}
      <div className="flex shrink-0 flex-col items-end gap-1">
        {cutoff !== null && isCandidatura && (
          <p className="text-[10px] tabular-nums text-muted-foreground">
            Corte: <span className="font-medium">{(cutoff / 10).toFixed(2)}</span>
          </p>
        )}

        <div className="flex items-center gap-0.5">
          <button
            onClick={onMoveUp}
            disabled={index === 0}
            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground/40 hover:text-foreground hover:bg-muted/60 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
            aria-label="Mover para cima"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onMoveDown}
            disabled={index === total - 1}
            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground/40 hover:text-foreground hover:bg-muted/60 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
            aria-label="Mover para baixo"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          {course.link_oficial && (
            <a
              href={course.link_oficial}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground/30 hover:text-navy hover:bg-navy/5 transition-colors"
              aria-label="Ver página oficial"
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
          <button
            onClick={onRemove}
            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground/30 hover:text-destructive/60 hover:bg-destructive/5 transition-colors"
            aria-label="Remover dos guardados"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  )
}

export function SavedCoursesSection() {
  const { favorites, profile, exams, isLoggedIn, toggleFavorite } = useUser()
  const [courses, setCourses] = useState<CourseUI[]>([])
  const [order, setOrder] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  // Initialise order from localStorage (keyed by user id), then sync new favorites in
  useEffect(() => {
    if (!profile?.id) return
    if (favorites.length === 0) {
      setOrder([])
      return
    }
    const stored = localStorage.getItem(`candidatura_order_${profile.id}`)
    if (stored) {
      try {
        const parsed: string[] = JSON.parse(stored)
        const valid = parsed.filter(id => favorites.includes(id))
        const newFavs = favorites.filter(id => !valid.includes(id))
        setOrder([...valid, ...newFavs])
      } catch {
        setOrder([...favorites])
      }
    } else {
      setOrder([...favorites])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, favorites.join(',')])

  // Persist order to localStorage whenever it changes
  useEffect(() => {
    if (!profile?.id || order.length === 0) return
    localStorage.setItem(`candidatura_order_${profile.id}`, JSON.stringify(order))
  }, [order, profile?.id])

  // Fetch course data for all favorites
  useEffect(() => {
    if (favorites.length === 0) {
      setCourses([])
      return
    }
    let cancelled = false
    const run = async () => {
      setLoading(true)
      const supabase = createClient()
      const { data } = await supabase
        .from('courses')
        .select(`
          id, nome, instituicao_nome, distrito, area, tipo, vagas,
          nota_ultimo_colocado, nota_ultimo_colocado_f2,
          peso_secundario, peso_exames,
          nota_minima_p_ingresso, nota_minima_prova,
          link_oficial, history,
          course_requirements(exam_code, weight, conjunto_id)
        `)
        .in('id', favorites)
      if (!cancelled && data) {
        setCourses(data.map((row: any) => transformCourse(row, row.course_requirements ?? [])))
      }
      if (!cancelled) setLoading(false)
    }
    run()
    return () => { cancelled = true }
  }, [favorites])

  const moveUp = useCallback((courseId: string) => {
    setOrder(prev => {
      const idx = prev.indexOf(courseId)
      if (idx <= 0) return prev
      const next = [...prev]
      ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
      return next
    })
  }, [])

  const moveDown = useCallback((courseId: string) => {
    setOrder(prev => {
      const idx = prev.indexOf(courseId)
      if (idx < 0 || idx >= prev.length - 1) return prev
      const next = [...prev]
      ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
      return next
    })
  }, [])

  if (!isLoggedIn) return null

  const orderedCourses = order
    .map(id => courses.find(c => c.id === id))
    .filter(Boolean) as CourseUI[]

  const candidatura = orderedCourses.slice(0, MAX_CANDIDATURA)
  const extra = orderedCourses.slice(MAX_CANDIDATURA)

  const hasGrades = profile && profile.media_final_calculada > 0

  return (
    <div className="rounded-2xl border border-border/50 bg-card p-6">
      {/* Header */}
      <div className="mb-1 flex items-center gap-2">
        <Heart className="h-4 w-4 text-destructive" />
        <h2 className="text-sm font-semibold text-foreground">Candidatura</h2>
        {favorites.length > 0 && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {Math.min(favorites.length, MAX_CANDIDATURA)}/{MAX_CANDIDATURA} opções
          </span>
        )}
      </div>
      <p className="mb-4 text-[11px] text-muted-foreground">
        O DGES permite até 6 opções ordenadas por preferência. Ordena os teus cursos guardados para simular a tua candidatura.
      </p>

      {favorites.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <GraduationCap className="h-8 w-8 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            Guarda cursos com o ícone ♥ no explorador para os veres aqui.
          </p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-navy border-t-transparent" />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {!hasGrades && candidatura.length > 0 && (
            <div className="mb-1 flex items-center gap-1.5 rounded-lg bg-muted/60 px-3 py-2 text-[11px] text-muted-foreground">
              <AlertCircle className="h-3 w-3 shrink-0" />
              Adiciona as tuas notas e exames no perfil para ver a probabilidade de entrada em cada curso.
            </div>
          )}

          {/* Candidatura slots (1–6) */}
          {candidatura.map((course, i) => (
            <CourseSlot
              key={course.id}
              course={course}
              index={i}
              total={orderedCourses.length}
              profile={profile}
              exams={exams}
              onMoveUp={() => moveUp(course.id)}
              onMoveDown={() => moveDown(course.id)}
              onRemove={() => toggleFavorite(course.id)}
              isCandidatura
            />
          ))}

          {/* Extra saved (beyond 6) */}
          {extra.length > 0 && (
            <>
              <p className="mt-1 text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wide">
                Outros guardados (fora da candidatura)
              </p>
              {extra.map((course, i) => (
                <CourseSlot
                  key={course.id}
                  course={course}
                  index={candidatura.length + i}
                  total={orderedCourses.length}
                  profile={profile}
                  exams={exams}
                  onMoveUp={() => moveUp(course.id)}
                  onMoveDown={() => moveDown(course.id)}
                  onRemove={() => toggleFavorite(course.id)}
                  isCandidatura={false}
                />
              ))}
            </>
          )}

          {/* Legend */}
          {hasGrades && candidatura.length > 0 && (
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground/60">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald/60" /> Acima do corte (&gt; +0.5 val.)
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-warning/60" /> Próximo do corte (0–0.5 val.)
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-destructive/60" /> Abaixo do corte
              </span>
            </div>
          )}

          <p className="mt-0.5 text-[10px] text-muted-foreground/50">
            Notas de corte referentes à 1ª fase 2025. Usa as setas para reordenar as opções.
          </p>
        </div>
      )}
    </div>
  )
}
