'use client'

import { useState, useEffect, useMemo, useDeferredValue } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, ChevronDown, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/lib/user-context'
import { CourseFilters, type Filters } from './course-filters'
import { CourseCard } from './course-card'
import { ComparisonPanel } from './comparison-panel'
import { EXAM_SUBJECTS } from '@/lib/constants'
import { calculateAdmissionGrade } from '@/lib/data'
import type { CourseUI } from '@/lib/types'

type SortOrder = 'none' | 'asc' | 'desc'

function PrivadaSection({
  courses,
  onViewDetails,
}: {
  courses: CourseUI[]
  onViewDetails: (c: CourseUI) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-2xl border border-border/40 bg-muted/20">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-2.5">
          <Lock className="h-4 w-4 text-muted-foreground/50" />
          <span className="text-sm font-semibold text-foreground">Ensino Privado</span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {courses.length}
          </span>
        </div>
        <ChevronDown className={`h-4 w-4 text-muted-foreground/60 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="border-t border-border/30 px-5 pb-5 pt-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map(course => (
              <CourseCard key={course.id} course={course} onViewDetails={onViewDetails} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const COURSES_PER_PAGE = 48

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
      .filter(r => r.course_id === row.id)
      .map(r => ({
        code: r.exam_code,
        name: EXAM_SUBJECTS.find(e => e.code === r.exam_code)?.name ?? r.exam_code,
        weight: r.weight,
        conjunto_id: r.conjunto_id ?? 1,
      })),
    historico: row.history
      ? row.history.map((h: { year: number; nota: number }) => ({ year: h.year, nota: Math.round(h.nota * 10) }))
      : null,
    link_oficial: row.link_oficial,
  }
}

const DEFAULT_FILTERS: Filters = {
  search: '',
  areas: [],
  districts: [],
  provasIngresso: [],
  provasMode: 'any',
  tipo: '',
  onlyQualified: false,
  onlyGoodOptions: false,
  withinRange: false,
}

const WITHIN_RANGE_PTS = 20 // 0-200 scale

const SORT_LABELS: Record<SortOrder, { label: string; icon: typeof ArrowUpDown }> = {
  none: { label: 'Ordenar', icon: ArrowUpDown },
  asc: { label: 'Nota ↑', icon: ArrowUp },
  desc: { label: 'Nota ↓', icon: ArrowDown },
}

interface CourseExplorerProps {
  onCoursesLoaded?: (courses: CourseUI[]) => void
  onViewDetails?: (course: CourseUI) => void
}

export function CourseExplorer({ onCoursesLoaded, onViewDetails }: CourseExplorerProps) {
  const { isLoggedIn, profile, exams, comparisonList } = useUser()
  const [courses, setCourses] = useState<CourseUI[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [sortOrder, setSortOrder] = useState<SortOrder>('none')
  const [currentPage, setCurrentPage] = useState(0)

  // Defer the filter state so typing in search doesn't block the UI
  const deferredFilters = useDeferredValue(filters)

  // Reset to page 0 when filters change
  useEffect(() => {
    setCurrentPage(0)
  }, [deferredFilters, sortOrder])

  useEffect(() => {
    const fetchAll = async (table: string, supabase: ReturnType<typeof createClient>) => {
      const PAGE = 1000
      const all: any[] = []
      let from = 0
      while (true) {
        const { data, error } = await supabase.from(table).select('*').range(from, from + PAGE - 1)
        if (error || !data || data.length === 0) break
        all.push(...data)
        if (data.length < PAGE) break
        from += PAGE
      }
      return all
    }

    const fetchCourses = async () => {
      const supabase = createClient()
      const [courseRows, reqs] = await Promise.all([
        fetchAll('courses', supabase),
        fetchAll('course_requirements', supabase),
      ])
      const transformed = courseRows
        .sort((a, b) => a.nome.localeCompare(b.nome, 'pt'))
        .map(row => transformCourse(row, reqs))
      setCourses(transformed)
      onCoursesLoaded?.(transformed)
      setLoading(false)
    }
    fetchCourses()
  }, [])

  const userExamCodes = useMemo(() => new Set(exams.map(e => e.exam_code)), [exams])

  // Pre-compute user admission grade for every course (used by withinRange filter)
  const userGradeMap = useMemo(() => {
    if (!isLoggedIn || !profile || profile.media_final_calculada <= 0) return new Map<string, number>()
    const userExams = exams.map(e => ({ subjectCode: e.exam_code, grade: e.grade }))
    const map = new Map<string, number>()
    for (const c of courses) {
      const { grade, hasRequiredExams } = calculateAdmissionGrade(
        profile.media_final_calculada,
        userExams,
        c,
      )
      if (hasRequiredExams) map.set(c.id, grade)
    }
    return map
  }, [courses, isLoggedIn, profile, exams])

  const hasProfile = isLoggedIn && !!profile && profile.media_final_calculada > 0

  const filtered = useMemo(() => {
    const f = deferredFilters
    const result = courses.filter(c => {
      if (f.search) {
        const q = f.search.toLowerCase()
        if (!c.nome.toLowerCase().includes(q) && !c.instituicao.toLowerCase().includes(q)) return false
      }
      if (f.areas.length > 0 && !f.areas.includes(c.area)) return false
      if (f.districts.length > 0 && !f.districts.includes(c.distrito)) return false
      if (f.tipo && c.tipo !== f.tipo) return false
      if (f.provasIngresso.length > 0) {
        const uniqueCodes = [...new Set(c.provasIngresso.map(p => p.code))]
        if (f.provasMode === 'any') {
          // Course has at least one of the selected provas
          if (!f.provasIngresso.some(p => uniqueCodes.includes(p))) return false
        } else if (f.provasMode === 'all') {
          // Course requires all selected provas (possibly others too)
          if (!f.provasIngresso.every(p => uniqueCodes.includes(p))) return false
        } else {
          // 'exact' — course requires exactly these provas, nothing more
          const filterSet = new Set(f.provasIngresso)
          const codeSet   = new Set(uniqueCodes)
          if (filterSet.size !== codeSet.size) return false
          if (![...filterSet].every(p => codeSet.has(p))) return false
        }
      }
      if (f.onlyQualified) {
        // Group provas by conjunto_id — user needs all provas in at least one conjunto
        const conjuntos = new Map<number, string[]>()
        for (const p of c.provasIngresso) {
          const cid = p.conjunto_id ?? 1
          if (!conjuntos.has(cid)) conjuntos.set(cid, [])
          conjuntos.get(cid)!.push(p.code)
        }
        if (conjuntos.size === 0) {
          // No provas required — anyone qualifies
        } else {
          const qualifies = [...conjuntos.values()].some(
            codes => codes.every(code => userExamCodes.has(code)),
          )
          if (!qualifies) return false
        }
      }
      if (f.withinRange) {
        const userGrade = userGradeMap.get(c.id)
        if (userGrade === undefined) return false
        if (c.notaUltimoColocado === null) return false
        if (c.notaUltimoColocado - userGrade > WITHIN_RANGE_PTS) return false
      }
      return true
    })

    if (sortOrder === 'asc') {
      result.sort((a, b) => (a.notaUltimoColocado ?? 0) - (b.notaUltimoColocado ?? 0))
    } else if (sortOrder === 'desc') {
      result.sort((a, b) => (b.notaUltimoColocado ?? 0) - (a.notaUltimoColocado ?? 0))
    }

    return result
  }, [courses, deferredFilters, userExamCodes, userGradeMap, sortOrder])

  // Split públicas / privadas — privadas go in their own collapsible section
  const showingAll = deferredFilters.tipo === ''
  const publicaCourses = showingAll ? filtered.filter(c => c.tipo === 'publica') : (deferredFilters.tipo === 'publica' ? filtered : [])
  const privataCourses = showingAll ? filtered.filter(c => c.tipo === 'privada') : (deferredFilters.tipo === 'privada' ? filtered : [])
  const mainCourses    = deferredFilters.tipo === 'privada' ? privataCourses : publicaCourses
  const sideCourses    = showingAll ? privataCourses : []

  const totalPages = Math.max(1, Math.ceil(mainCourses.length / COURSES_PER_PAGE))
  const safePage = Math.min(currentPage, totalPages - 1)
  const pageStart = safePage * COURSES_PER_PAGE
  const pageEnd = pageStart + COURSES_PER_PAGE
  const paginated = mainCourses.slice(pageStart, pageEnd)

  const cycleSortOrder = () => {
    setSortOrder(prev => prev === 'none' ? 'desc' : prev === 'desc' ? 'asc' : 'none')
  }

  const SortIcon = SORT_LABELS[sortOrder].icon

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy" />
      </div>
    )
  }

  return (
    <div className="mx-[6%] max-w-7xl px-6 pt-10 pb-8 flex flex-col gap-6">

      {/* Hero */}
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Encontra o teu <span className="text-navy">curso ideal</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          {courses.length > 0
            ? `${courses.filter(c => c.tipo === 'publica').length} cursos públicos · dados oficiais DGES`
            : 'Todos os cursos do Ensino Superior português · dados oficiais DGES'}
        </p>
      </div>

      <CourseFilters
        filters={filters}
        onFiltersChange={setFilters}
        isLoggedIn={isLoggedIn}
        hasProfile={hasProfile}
      />

      {comparisonList.length > 0 && (
        <ComparisonPanel courses={courses} />
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">
          {mainCourses.length} {deferredFilters.tipo === 'privada' ? 'privad' : 'público'}
          {mainCourses.length === 1 ? (deferredFilters.tipo === 'privada' ? 'a' : 'o') : (deferredFilters.tipo === 'privada' ? 'as' : 'os')}
          {showingAll && sideCourses.length > 0 && (
            <span className="ml-1 text-muted-foreground/60">+ {sideCourses.length} privad{sideCourses.length === 1 ? 'a' : 'as'}</span>
          )}
          {totalPages > 1 && (
            <span className="ml-1.5 text-muted-foreground/60">
              · pág. {safePage + 1}/{totalPages}
            </span>
          )}
        </p>
        <button
          onClick={cycleSortOrder}
          className={`inline-flex h-9 items-center gap-2 rounded-xl border px-3.5 text-sm font-medium transition-all ${
            sortOrder !== 'none'
              ? 'border-navy/40 bg-navy/5 text-navy shadow-sm'
              : 'border-border/60 bg-card text-muted-foreground hover:border-navy/30 hover:text-foreground'
          }`}
        >
          <SortIcon className="h-3.5 w-3.5" />
          {SORT_LABELS[sortOrder].label}
        </button>
      </div>

      {paginated.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {paginated.map(course => (
            <CourseCard
              key={course.id}
              course={course}
              onViewDetails={onViewDetails ?? (() => {})}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-base font-medium text-muted-foreground">Nenhum curso encontrado.</p>
          <p className="mt-1 text-sm text-muted-foreground/60">Tenta ajustar os filtros.</p>
        </div>
      )}

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
            disabled={safePage === 0}
            className="inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-navy/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let page = i
              if (totalPages > 7) {
                const half = 3
                let start = Math.max(0, safePage - half)
                const end = Math.min(totalPages - 1, start + 6)
                start = Math.max(0, end - 6)
                page = start + i
              }
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`h-8 w-8 rounded-lg text-sm font-medium transition-all ${
                    page === safePage
                      ? 'bg-navy text-white shadow-sm'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  }`}
                >
                  {page + 1}
                </button>
              )
            })}
          </div>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={safePage >= totalPages - 1}
            className="inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-navy/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Seguinte
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Privadas section — only when showing all types ───────────────── */}
      {sideCourses.length > 0 && (
        <PrivadaSection courses={sideCourses} onViewDetails={onViewDetails ?? (() => {})} />
      )}
    </div>
  )
}
