'use client'

import { useState, useMemo } from 'react'
import { BookOpen } from 'lucide-react'
import { CourseCard } from './course-card'
import { CourseFilters, type Filters } from './course-filters'
import { CourseDetailDialog } from './course-detail-dialog'
import { ComparisonPanel } from './comparison-panel'
import { useUser } from '@/lib/user-context'
import { COURSES, calculateAdmissionGrade } from '@/lib/data'
import type { Course } from '@/lib/types'

export function CourseExplorer() {
  const { isLoggedIn, profile, comparisonList } = useUser()
  const [filters, setFilters] = useState<Filters>({
    search: '', areas: [], districts: [], provasIngresso: [], tipo: '', onlyQualified: false,
  })
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)

  const filteredCourses = useMemo(() => {
    return COURSES.filter(course => {
      if (filters.search) {
        const q = filters.search.toLowerCase()
        if (!course.name.toLowerCase().includes(q) && !course.university.toLowerCase().includes(q)) return false
      }
      if (filters.areas.length > 0 && !filters.areas.includes(course.area)) return false
      if (filters.districts.length > 0 && !filters.districts.includes(course.district)) return false
      if (filters.provasIngresso.length > 0) {
        const courseProvaCodes = course.provasIngresso.map(p => p.code)
        if (!filters.provasIngresso.some(f => courseProvaCodes.includes(f))) return false
      }
      if (filters.tipo && course.tipo !== filters.tipo) return false
      if (filters.onlyQualified && isLoggedIn) {
        const result = calculateAdmissionGrade(
          profile.mediaSecundario,
          profile.exams.map(e => ({ subjectCode: e.subjectCode, grade: e.grade })),
          course
        )
        if (!result.hasRequiredExams) return false
      }
      return true
    })
  }, [filters, isLoggedIn, profile])

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Explorar Cursos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pesquisa e filtra cursos do ensino superior. Abre o teu perfil para ver notas calculadas.
        </p>
      </div>

      <CourseFilters filters={filters} onFiltersChange={setFilters} isLoggedIn={isLoggedIn} />

      {comparisonList.length > 0 && <ComparisonPanel />}

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {filteredCourses.length} curso{filteredCourses.length !== 1 ? 's' : ''} encontrado{filteredCourses.length !== 1 ? 's' : ''}
        </p>
      </div>

      {filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filteredCourses.map(course => (
            <CourseCard key={course.id} course={course} onViewDetails={setSelectedCourse} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-16">
          <BookOpen className="h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">Nenhum curso encontrado.</p>
        </div>
      )}

      <CourseDetailDialog course={selectedCourse} onClose={() => setSelectedCourse(null)} />
    </div>
  )
}
