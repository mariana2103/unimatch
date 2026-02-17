'use client'

import { X, GitCompareArrows, MapPin, BookOpen, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useUser } from '@/lib/user-context'
import { COURSES } from '@/lib/constants'

export function ComparisonPanel() {
  const { comparisonList, clearComparison, toggleComparison, profile } = useUser()

  const selectedCourses = comparisonList
    .map(id => COURSES.find(c => c.id === id))
    .filter(Boolean)

  if (selectedCourses.length === 0) return null

  const getNotaCorte = (course: typeof selectedCourses[0]) => {
    if (!course) return 0
    let nota = course.notaUltimoColocado
    if (profile.contingentes.length > 0 && course.contingentes) {
      for (const cId of profile.contingentes) {
        if (course.contingentes[cId] !== undefined && course.contingentes[cId] < nota) {
          nota = course.contingentes[cId]
        }
      }
    }
    return nota
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
              if (!course) return null
              const nota = getNotaCorte(course)
              return (
                <div key={course.id} className="relative flex flex-col gap-2.5 rounded-lg border border-border/50 bg-card p-3">
                  <button onClick={() => toggleComparison(course.id)}
                    className="absolute right-2 top-2 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label={`Remover ${course.name}`}>
                    <X className="h-3 w-3" />
                  </button>
                  <div>
                    <h4 className="pr-6 text-xs font-semibold text-foreground">{course.name}</h4>
                    <p className="text-[10px] text-muted-foreground">{course.university}</p>
                  </div>
                  <div className="flex flex-col gap-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Ultimo colocado</span>
                      <span className="font-bold tabular-nums text-navy">{nota.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Vagas</span>
                      <span className="font-semibold">{course.vagas}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <MapPin className="h-2.5 w-2.5" />{course.district}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      {course.provasIngresso.map(p => (
                        <span key={p.code} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <BookOpen className="h-2.5 w-2.5" />{p.code} {p.name}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <TrendingUp className="h-2.5 w-2.5" />
                      +{(course.historico[2].nota - course.historico[0].nota).toFixed(1)} pts (3 anos)
                    </div>
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
