'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/lib/user-context'
import { CourseFilters, type Filters } from './course-filters'
import { CourseCard } from './course-card'
import { CourseDetailDialog } from './course-detail-dialog'
import { ComparisonPanel } from './comparison-panel'
import { EXAM_SUBJECTS } from '@/lib/constants'
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
}

export function CourseExplorer() {
  const { isLoggedIn, exams, comparisonList } = useUser()
  const [courses, setCourses] = useState<CourseUI[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [selectedCourse, setSelectedCourse] = useState<CourseUI | null>(null)

  useEffect(() => {
    const fetchCourses = async () => {
      const supabase = createClient()
      const [{ data: courseRows }, { data: reqRows }] = await Promise.all([
        supabase.from('courses').select('*').order('nome'),
        supabase.from('course_requirements').select('*'),
      ])
      const reqs = reqRows ?? []
      setCourses((courseRows ?? []).map(row => transformCourse(row, reqs)))
      setLoading(false)
    }
    fetchCourses()
  }, [])

  const userExamCodes = useMemo(() => new Set(exams.map(e => e.exam_code)), [exams])

  const filtered = useMemo(() => {
    return courses.filter(c => {
      if (filters.search) {
        const q = filters.search.toLowerCase()
        if (!c.nome.toLowerCase().includes(q) && !c.instituicao.toLowerCase().includes(q)) return false
      }
      if (filters.areas.length > 0 && !filters.areas.includes(c.area)) return false
      if (filters.districts.length > 0 && !filters.districts.includes(c.distrito)) return false
      if (filters.tipo && c.tipo !== filters.tipo) return false
      if (filters.provasIngresso.length > 0) {
        const codes = c.provasIngresso.map(p => p.code)
        if (!filters.provasIngresso.some(p => codes.includes(p))) return false
      }
      if (filters.onlyQualified) {
        const codes = c.provasIngresso.map(p => p.code)
        if (!codes.every(code => userExamCodes.has(code))) return false
      }
      return true
    })
  }, [courses, filters, userExamCodes])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 flex flex-col gap-6">
      <CourseFilters
        filters={filters}
        onFiltersChange={setFilters}
        isLoggedIn={isLoggedIn}
      />

      {comparisonList.length > 0 && (
        <ComparisonPanel courses={courses} />
      )}

      <p className="text-sm text-muted-foreground">
        {filtered.length} {filtered.length === 1 ? 'curso encontrado' : 'cursos encontrados'}
      </p>

      {filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(course => (
            <CourseCard
              key={course.id}
              course={course}
              onViewDetails={setSelectedCourse}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground">Nenhum curso encontrado com os filtros selecionados.</p>
        </div>
      )}

      <CourseDetailDialog
        course={selectedCourse}
        onClose={() => setSelectedCourse(null)}
      />
    </div>
  )
}
