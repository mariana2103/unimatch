'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Heart, ChevronUp, ChevronDown, AlertCircle, GraduationCap,
  ExternalLink, Plus, X, CheckCircle2, XCircle, LogIn, Share2, Check, Loader2,
} from 'lucide-react'
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

// ─── Subcomponents ────────────────────────────────────────────────────────────

function PlacementBanner({ placement, marginal }: { placement: number; marginal: boolean }) {
  if (placement === 0) {
    return (
      <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3">
        <XCircle className="h-4 w-4 shrink-0 text-destructive" />
        <div>
          <p className="text-xs font-semibold text-destructive">Nenhuma opção acessível</p>
          <p className="text-[11px] text-muted-foreground">Com as tuas notas atuais, não estarias colocado em nenhuma das opções.</p>
        </div>
      </div>
    )
  }
  if (marginal) {
    return (
      <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-warning/25 bg-warning/5 px-4 py-3">
        <AlertCircle className="h-4 w-4 shrink-0 text-warning" />
        <div>
          <p className="text-xs font-semibold text-warning">
            Próximo do corte na {OPTION_LABELS[placement - 1]}
          </p>
          <p className="text-[11px] text-muted-foreground">
            A tua nota está dentro de 0,5 valores do corte — entrada possível mas não garantida.
          </p>
        </div>
      </div>
    )
  }
  return (
    <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-emerald/25 bg-emerald/5 px-4 py-3">
      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald" />
      <div>
        <p className="text-xs font-semibold text-emerald">
          Serias colocado na {OPTION_LABELS[placement - 1]}
        </p>
        <p className="text-[11px] text-muted-foreground">
          Primeira opção onde a tua nota de candidatura supera o corte.
        </p>
      </div>
    </div>
  )
}

function EmptySlot({ index, onAdd }: { index: number; onAdd: () => void }) {
  return (
    <button
      onClick={onAdd}
      className="flex w-full items-center gap-2.5 rounded-xl border border-dashed border-border/50 px-3 py-2.5 text-left transition-colors hover:border-navy/40 hover:bg-muted/30"
    >
      <div className="flex h-6 min-w-13 shrink-0 items-center justify-center rounded-md bg-muted/60 text-[9px] font-bold uppercase tracking-wide text-muted-foreground/60">
        {OPTION_LABELS[index]}
      </div>
      <div className="flex flex-1 items-center gap-1.5 text-xs text-muted-foreground/50">
        <Plus className="h-3.5 w-3.5" />
        Adicionar curso
      </div>
    </button>
  )
}

interface SlotProps {
  course: CourseUI
  index: number
  total: number
  profile: any
  exams: any[]
  onMoveUp: () => void
  onMoveDown: () => void
  onRemove: () => void
}

function CourseSlot({ course, index, total, profile, exams, onMoveUp, onMoveDown, onRemove }: SlotProps) {
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

  return (
    <div className={cn(
      'flex items-start gap-2.5 rounded-xl border px-3 py-2.5 transition-colors',
      isAbove ? 'border-emerald/30 bg-emerald/5'
      : isNear ? 'border-warning/30 bg-warning/5'
      : isBelow ? 'border-destructive/20 bg-destructive/5'
      : 'border-border/50 bg-card',
    )}>
      {/* Slot badge */}
      <div className="flex h-6 min-w-13 shrink-0 items-center justify-center rounded-md bg-navy/10 text-[9px] font-bold uppercase tracking-wide text-navy dark:bg-navy/20">
        {OPTION_LABELS[index]}
      </div>

      {/* Course info */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-snug text-foreground line-clamp-1">{course.nome}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {course.instituicao} · {course.distrito}
        </p>

        {hasGrades && (
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            {admissionGrade !== null && (
              <span className="text-[10px] tabular-nums text-muted-foreground">
                Nota: <span className="font-semibold text-foreground">{(admissionGrade / 10).toFixed(2)}</span>
              </span>
            )}
            {diff !== null && (
              <span className={cn('text-[10px] tabular-nums font-semibold',
                isAbove ? 'text-emerald' : isNear ? 'text-warning' : 'text-destructive'
              )}>
                {diff >= 0 ? '+' : ''}{(diff / 10).toFixed(2)} val.
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

      {/* Right actions */}
      <div className="flex shrink-0 flex-col items-end gap-1">
        {cutoff !== null && (
          <p className="text-[10px] tabular-nums text-muted-foreground">
            Corte: <span className="font-medium">{(cutoff / 10).toFixed(2)}</span>
          </p>
        )}
        {course.link_oficial && (
          <a
            href={course.link_oficial}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="flex items-center gap-1 text-[10px] text-navy hover:underline"
          >
            <ExternalLink className="h-3 w-3" />DGES
          </a>
        )}
        <div className="flex items-center gap-0.5">
          <button
            onClick={onMoveUp}
            disabled={index === 0}
            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-25 transition-colors"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <button
            onClick={onMoveDown}
            disabled={index === total - 1}
            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-25 transition-colors"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
          <button
            onClick={onRemove}
            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground/40 hover:text-destructive hover:bg-destructive/5 transition-colors"
            aria-label="Remover"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Course Picker ─────────────────────────────────────────────────────────────

function CoursePicker({
  available,
  onPick,
  onClose,
}: {
  available: CourseUI[]
  onPick: (id: string) => void
  onClose: () => void
}) {
  const [search, setSearch] = useState('')
  const filtered = available.filter(c =>
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    (c.instituicao ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-card shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
          <p className="text-sm font-semibold text-foreground">Adicionar curso à candidatura</p>
          <button onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-3">
          <input
            type="text"
            placeholder="Pesquisar favoritos..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border/50 bg-muted/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-navy/40 focus:ring-0"
            autoFocus
          />
        </div>
        <div className="max-h-64 overflow-y-auto px-2 pb-2">
          {filtered.length === 0 ? (
            <div className="py-8 text-center">
              <Heart className="mx-auto mb-2 h-6 w-6 text-muted-foreground/20" />
              <p className="text-xs text-muted-foreground">
                {available.length === 0
                  ? 'Guarda cursos com ♥ no explorador primeiro.'
                  : 'Nenhum favorito corresponde à pesquisa.'}
              </p>
            </div>
          ) : (
            filtered.map(c => (
              <button
                key={c.id}
                onClick={() => { onPick(c.id); onClose() }}
                className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted/60"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground line-clamp-1">{c.nome}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{c.instituicao} · {c.distrito}</p>
                </div>
                {c.notaUltimoColocado !== null && (
                  <span className="shrink-0 text-xs font-semibold tabular-nums text-muted-foreground">
                    {(c.notaUltimoColocado / 10).toFixed(1)}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function SavedCoursesSection() {
  const { favorites, profile, exams, isLoggedIn, toggleFavorite } = useUser()
  const [courses, setCourses] = useState<CourseUI[]>([])
  const [order, setOrder] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [shareState, setShareState] = useState<'idle' | 'loading' | 'copied' | 'error'>('idle')

  // Load saved order from localStorage (keyed per user)
  useEffect(() => {
    if (!profile?.id || favorites.length === 0) { setOrder([]); return }
    const stored = localStorage.getItem(`candidatura_order_${profile.id}`)
    if (stored) {
      try {
        const parsed: string[] = JSON.parse(stored)
        const valid = parsed.filter(id => favorites.includes(id))
        const newFavs = favorites.filter(id => !valid.includes(id))
        setOrder([...valid, ...newFavs])
        return
      } catch { /* fall through */ }
    }
    setOrder([...favorites])
  }, [profile?.id, favorites])

  // Persist order
  useEffect(() => {
    if (!profile?.id || order.length === 0) return
    localStorage.setItem(`candidatura_order_${profile.id}`, JSON.stringify(order))
  }, [order, profile?.id])

  // Fetch full course data for all favorites
  useEffect(() => {
    if (favorites.length === 0) { setCourses([]); return }
    let cancelled = false
    setLoading(true)
    createClient()
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
      .then(({ data }) => {
        if (!cancelled && data) {
          setCourses(data.map((row: any) => transformCourse(row, row.course_requirements ?? [])))
        }
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [favorites])

  const moveUp = useCallback((id: string) => {
    setOrder(prev => {
      const idx = prev.indexOf(id)
      if (idx <= 0) return prev
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
      return next
    })
  }, [])

  const moveDown = useCallback((id: string) => {
    setOrder(prev => {
      const idx = prev.indexOf(id)
      if (idx < 0 || idx >= prev.length - 1) return prev
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
      return next
    })
  }, [])

  const addCourse = useCallback((courseId: string) => {
    setOrder(prev => prev.includes(courseId) ? prev : [...prev, courseId])
  }, [])

  const removeCourse = useCallback((courseId: string) => {
    setOrder(prev => prev.filter(id => id !== courseId))
    toggleFavorite(courseId)
  }, [toggleFavorite])

  const shareCandidatura = useCallback(async () => {
    const ids = order.slice(0, MAX_CANDIDATURA)
    if (ids.length === 0) return
    setShareState('loading')
    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseIds: ids,
          userMedia: profile?.media_final_calculada ?? null,
        }),
      })
      if (!res.ok) { setShareState('error'); setTimeout(() => setShareState('idle'), 3000); return }
      const { slug } = await res.json()
      if (!slug) { setShareState('error'); setTimeout(() => setShareState('idle'), 3000); return }
      const url = `${window.location.origin}/partilha/${slug}`
      window.open(url, '_blank')
      setShareState('copied')
      setTimeout(() => setShareState('idle'), 3000)
    } catch {
      setShareState('error')
      setTimeout(() => setShareState('idle'), 3000)
    }
  }, [order, profile])

  const orderedCourses = useMemo(
    () => order.map(id => courses.find(c => c.id === id)).filter(Boolean) as CourseUI[],
    [order, courses],
  )
  const candidatura = orderedCourses.slice(0, MAX_CANDIDATURA)
  const extra = orderedCourses.slice(MAX_CANDIDATURA)
  const available = useMemo(
    () => courses.filter(c => !order.slice(0, MAX_CANDIDATURA).includes(c.id)),
    [courses, order],
  )

  const hasGrades = !!(profile && profile.media_final_calculada > 0)
  const validExams = useMemo(() => filterValidExams(exams, 1), [exams])

  // Placement prediction: first slot where user is above cutoff
  const placement = useMemo((): { index: number; marginal: boolean } | null => {
    if (!hasGrades || candidatura.length === 0) return null
    for (let i = 0; i < candidatura.length; i++) {
      const course = candidatura[i]
      const result = calculateAdmissionGrade(profile!.media_final_calculada, validExams, course)
      const cutoff = course.notaUltimoColocado
      if (result.hasRequiredExams && result.meetsMinimum && cutoff !== null && result.grade >= cutoff) {
        return { index: i + 1, marginal: result.grade - cutoff <= 5 }
      }
    }
    return { index: 0, marginal: false }
  }, [candidatura, hasGrades, profile, validExams])

  // ── Not logged in ────────────────────────────────────────────────────────────
  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
          <GraduationCap className="h-8 w-8 text-muted-foreground/30" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">Faz login para gerir a tua candidatura</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Ordena até 6 opções por preferência e vê a probabilidade de entrada em cada uma.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-sm font-medium text-navy">
          <LogIn className="h-4 w-4" />
          Inicia sessão no canto superior direito
        </div>
      </div>
    )
  }

  // ── Main view ────────────────────────────────────────────────────────────────
  return (
    <div>
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-navy border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Placement prediction */}
          {placement !== null && (
            <PlacementBanner placement={placement.index} marginal={placement.marginal} />
          )}

          {/* No grades warning */}
          {!hasGrades && favorites.length > 0 && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-border/40 bg-muted/40 px-4 py-3 text-[11px] text-muted-foreground">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              Adiciona as tuas notas e exames no{' '}
              <a href="/profile" className="font-semibold text-navy hover:underline">perfil</a>{' '}
              para ver a probabilidade de entrada.
            </div>
          )}

          {/* 6 slots — always visible */}
          <div className="flex flex-col gap-2">
            {Array.from({ length: MAX_CANDIDATURA }, (_, i) => {
              const course = candidatura[i]
              if (course) {
                return (
                  <CourseSlot
                    key={course.id}
                    course={course}
                    index={i}
                    total={candidatura.length}
                    profile={profile}
                    exams={exams}
                    onMoveUp={() => moveUp(course.id)}
                    onMoveDown={() => moveDown(course.id)}
                    onRemove={() => removeCourse(course.id)}
                  />
                )
              }
              return (
                <EmptySlot
                  key={`empty-${i}`}
                  index={i}
                  onAdd={() => setPickerOpen(true)}
                />
              )
            })}
          </div>

          {/* Extra saved courses beyond 6 */}
          {extra.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                Outros guardados (fora da candidatura)
              </p>
              <div className="flex flex-col gap-2">
                {extra.map((course, i) => (
                  <CourseSlot
                    key={course.id}
                    course={course}
                    index={MAX_CANDIDATURA + i}
                    total={orderedCourses.length}
                    profile={profile}
                    exams={exams}
                    onMoveUp={() => moveUp(course.id)}
                    onMoveDown={() => moveDown(course.id)}
                    onRemove={() => removeCourse(course.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Legend */}
          {hasGrades && candidatura.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-muted-foreground/60">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald/70" /> Acima do corte (&gt;+0.5 val.)</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-warning/70" /> Próximo (0–0.5 val.)</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-destructive/70" /> Abaixo do corte</span>
            </div>
          )}

          <p className="mt-2 text-[10px] text-muted-foreground/40">
            Cortes da 1ª fase 2025. Usa as setas para reordenar. A ordem é guardada localmente.
          </p>

          {candidatura.length > 0 && (
            <button
              onClick={shareCandidatura}
              disabled={shareState === 'loading'}
              className={cn(
                'mt-3 flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors disabled:opacity-60',
                shareState === 'error'
                  ? 'border-destructive/30 bg-destructive/5 text-destructive'
                  : shareState === 'copied'
                    ? 'border-emerald/30 bg-emerald/5 text-emerald-700'
                    : 'border-navy/20 bg-navy/5 text-navy hover:bg-navy/10',
              )}
            >
              {shareState === 'loading' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {shareState === 'copied'  && <Check className="h-3.5 w-3.5" />}
              {shareState === 'error'   && <X className="h-3.5 w-3.5" />}
              {shareState === 'idle'    && <Share2 className="h-3.5 w-3.5" />}
              {shareState === 'copied' ? 'Link copiado!' : shareState === 'error' ? 'Erro — tenta novamente' : 'Partilhar candidatura'}
            </button>
          )}
        </>
      )}

      {/* Course picker modal */}
      {pickerOpen && (
        <CoursePicker
          available={available}
          onPick={addCourse}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  )
}
