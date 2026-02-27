'use client'

import { X, GitCompareArrows, MapPin, BookOpen, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useUser } from '@/lib/user-context'
import type { CourseUI } from '@/lib/types'

interface ComparisonPanelProps {
  courses: CourseUI[]
}

export function ComparisonPanel({ courses }: ComparisonPanelProps) {
  const { comparisonList, clearComparison, toggleComparison } = useUser()

  const selectedCourses = comparisonList
    .map(id => courses.find(c => c.id === id))
    .filter((c): c is CourseUI => c !== undefined)

  if (selectedCourses.length === 0) return null

  const trend = (course: CourseUI) => {
    if (!course.historico || course.historico.length < 2) return null
    const first = course.historico[0].nota
    const last = course.historico[course.historico.length - 1].nota
    return last - first
  }

  return (
    <Card className="border-navy/15 bg-navy/[0.01]">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm text-navy">
            <GitCompareArrows className="h-4 w-4" />
            Comparacao
            <Badge variant="secondary" className="text-[10px]">{selectedCourses.length}/2</Badge>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={clearComparison} className="h-7 gap-1 text-xs text-muted-foreground">
            <X className="h-3 w-3" /> Limpar
          </Button>
        </div>
      </CardHeader>
      {selectedCourses.length === 2 ? (
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {selectedCourses.map(course => {
              const delta = trend(course)
              return (
                <div key={course.id} className="relative flex flex-col gap-2.5 rounded-lg border border-border/50 bg-card p-3">
                  <button
                    onClick={() => toggleComparison(course.id)}
                    className="absolute right-2 top-2 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label={`Remover ${course.nome}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <div>
                    <h4 className="pr-6 text-sm font-semibold text-foreground leading-snug">{course.nome}</h4>
                    <p className="text-xs text-muted-foreground">{course.instituicao}</p>
                  </div>
                  <div className="flex flex-col gap-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Ultimo colocado</span>
                      <span className="font-bold tabular-nums text-navy text-base">
                        {course.notaUltimoColocado !== null ? (course.notaUltimoColocado / 10).toFixed(1) : '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Vagas</span>
                      <span className="font-semibold">{course.vagas ?? '—'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />{course.distrito}
                    </div>
                    <div className="flex flex-col gap-1">
                      {course.provasIngresso.map(p => (
                        <span key={p.code} className="flex items-center gap-1 text-xs text-muted-foreground">
                          <BookOpen className="h-3 w-3" />{p.code} {p.name}
                        </span>
                      ))}
                    </div>
                    {delta !== null && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <TrendingUp className="h-3 w-3" />
                        {delta >= 0 ? '+' : ''}{delta.toFixed(1)} pts (histórico)
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      ) : (
        <CardContent>
          <p className="text-center text-xs text-muted-foreground">Seleciona mais 1 curso para comparar.</p>
        </CardContent>
      )}
    </Card>
  )
}
