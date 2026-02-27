'use client'

import { useState, useEffect, useMemo, useDeferredValue } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/lib/user-context'
import { CourseFilters, type Filters } from './course-filters'
import { CourseCard } from './course-card'
import { ComparisonPanel } from './comparison-panel'
import { EXAM_SUBJECTS } from '@/lib/constants'
import { calculateAdmissionGrade } from '@/lib/data'
import type { CourseUI } from '@/lib/types'

type SortOrder = 'none' | 'asc' | 'desc'

const COURSES_PER_PAGE = 99

function transformCourse(row: any, reqs: any[]): CourseUI {
  return {
    id: row.id,
    nome: row.nome,
    instituicao: row.instituicao_nome,
    distrito: row.distrito,
    area: row.area,
    tipo: row.tipo,
    vagas: row.vagas,
    notaUltimoColocado: row.nota_ultimo_colocado,
    pesoSecundario: row.peso_secundario,
    pesoExame: row.peso_exames,
    notaMinima: row.nota_minima_p_ingresso,
    provasIngresso: reqs
      .filter(r => r.course_id === row.id)
      .map(r => ({
        code: r.exam_code,
        name: EXAM_SUBJECTS.find(e => e.code === r.exam_code)?.name ?? r.exam_code,
        weight: r.weight,
        conjunto_id: r.conjunto_id ?? 1,
      })),
    historico: row.history ?? null,
    link_oficial: row.link_oficial,
  }
}

const DEFAULT_FILTERS: Filters = {
  search: '',
  areas: [],
  districts: [],
  provasIngresso: [],
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
        const codes = c.provasIngresso.map(p => p.code)
        if (!f.provasIngresso.some(p => codes.includes(p))) return false
      }
      if (f.onlyQualified) {
        const codes = c.provasIngresso.map(p => p.code)
        if (codes.length > 0 && !codes.every(code => userExamCodes.has(code))) return false
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

  const totalPages = Math.max(1, Math.ceil(filtered.length / COURSES_PER_PAGE))
  const safePage = Math.min(currentPage, totalPages - 1)
  const pageStart = safePage * COURSES_PER_PAGE
  const pageEnd = pageStart + COURSES_PER_PAGE
  const paginated = filtered.slice(pageStart, pageEnd)

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
    <div className="mx-[10%] max-w-7xl px-6 py-8 flex flex-col gap-6">
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
          {filtered.length} {filtered.length === 1 ? 'curso encontrado' : 'cursos encontrados'}
          {totalPages > 1 && (
            <span className="ml-1.5 text-muted-foreground/60">
              · página {safePage + 1} de {totalPages}
            </span>
          )}
        </p>
        <button
          onClick={cycleSortOrder}
          className={`inline-flex h-9 items-center gap-2 rounded-xl border px-3.5 text-sm font-medium transition-all ${
            sortOrder !== 'none'
              ? 'border-navy/40 bg-navy/5 text-navy shadow-sm'
              : 'border-border/60 bg-white text-muted-foreground hover:border-navy/30 hover:text-foreground'
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
                // Show pages around current
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
                      : 'text-muted-foreground hover:bg-slate-100 hover:text-foreground'
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
    </div>
  )
}
