'use client'

import { MapPin, BookOpen, Users, TrendingUp, CheckCircle2, XCircle, GitCompareArrows, Building2, Lock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { useUser } from '@/lib/user-context'
import { calculateAdmissionGrade } from '@/lib/data'
import type { Course } from '@/lib/types'

interface CourseCardProps {
  course: Course
  onViewDetails: (course: Course) => void
}

const AREA_COLORS: Record<string, string> = {
  'Engenharia': 'bg-blue-50 text-blue-700 border-blue-200',
  'Saude': 'bg-rose-50 text-rose-700 border-rose-200',
  'Ciencias': 'bg-teal-50 text-teal-700 border-teal-200',
  'Economia e Gestao': 'bg-amber-50 text-amber-700 border-amber-200',
  'Artes': 'bg-pink-50 text-pink-700 border-pink-200',
  'Direito e Ciencias Sociais': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Educacao': 'bg-orange-50 text-orange-700 border-orange-200',
  'Informatica': 'bg-cyan-50 text-cyan-700 border-cyan-200',
}

export function CourseCard({ course, onViewDetails }: CourseCardProps) {
  const { isLoggedIn, profile, comparisonList, toggleComparison } = useUser()
  const isComparing = comparisonList.includes(course.id)

  // Determine nota de corte based on user contingentes
  let notaCorte = course.notaUltimoColocado
  let contingentLabel = ''
  if (profile.contingentes.length > 0 && course.contingentes) {
    for (const cId of profile.contingentes) {
      if (course.contingentes[cId] !== undefined && course.contingentes[cId] < notaCorte) {
        notaCorte = course.contingentes[cId]
        contingentLabel = cId
      }
    }
  }

  let userGrade = 0
  let meetsMinimum = false
  let hasRequiredExams = false
  let aboveCutoff = false

  if (isLoggedIn && profile.mediaSecundario > 0) {
    const result = calculateAdmissionGrade(
      profile.mediaSecundario,
      profile.exams.map(e => ({ subjectCode: e.subjectCode, grade: e.grade })),
      course
    )
    userGrade = result.grade
    meetsMinimum = result.meetsMinimum
    hasRequiredExams = result.hasRequiredExams
    aboveCutoff = userGrade >= notaCorte
  }

  return (
    <Card
      className="group relative cursor-pointer overflow-hidden border-border/50 transition-all hover:border-navy/20 hover:shadow-md"
      onClick={() => onViewDetails(course)}
    >
      <CardContent className="flex flex-col gap-3 p-4">
        {/* Top row */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate text-sm font-semibold text-foreground">{course.name}</h3>
              {course.tipo === 'privada' && <Lock className="h-3 w-3 shrink-0 text-muted-foreground" />}
            </div>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{course.university}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1" onClick={e => e.stopPropagation()}>
            <Checkbox
              checked={isComparing}
              onCheckedChange={() => toggleComparison(course.id)}
              aria-label={`Comparar ${course.name}`}
              className="h-4 w-4 border-border data-[state=checked]:bg-navy data-[state=checked]:text-primary-foreground"
            />
            <GitCompareArrows className="h-3 w-3 text-muted-foreground" />
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          <Badge variant="outline" className={`text-[10px] py-0 px-1.5 ${AREA_COLORS[course.area] || ''}`}>
            {course.area}
          </Badge>
          <Badge variant="outline" className="gap-0.5 text-[10px] py-0 px-1.5">
            <MapPin className="h-2.5 w-2.5" />
            {course.district}
          </Badge>
          <Badge variant="outline" className="text-[10px] py-0 px-1.5">
            {course.tipo === 'publica' ? 'Publica' : 'Privada'}
          </Badge>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground">Ultimo colocado</span>
            <span className="text-base font-bold tabular-nums text-navy">{notaCorte.toFixed(1)}</span>
            {contingentLabel && <span className="text-[9px] text-muted-foreground">cont. {contingentLabel}</span>}
          </div>
          <div className="h-8 w-px bg-border/60" />
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground">Vagas</span>
            <span className="text-base font-bold tabular-nums text-foreground">{course.vagas}</span>
          </div>
          <div className="h-8 w-px bg-border/60" />
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground">Pesos</span>
            <span className="text-xs font-semibold text-foreground">
              {(course.pesoSecundario * 100).toFixed(0)}/{(course.pesoExame * 100).toFixed(0)}
            </span>
          </div>
        </div>

        {/* Provas */}
        <div className="flex flex-wrap gap-1">
          {course.provasIngresso.map(p => (
            <span key={p.code} className="inline-flex items-center gap-0.5 rounded bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">
              <BookOpen className="h-2.5 w-2.5" />
              {p.code} {p.name} ({(p.weight * 100).toFixed(0)}%)
            </span>
          ))}
        </div>

        {/* User grade result */}
        {isLoggedIn && profile.mediaSecundario > 0 && (
          <div className={`rounded-lg border p-2.5 ${
            !hasRequiredExams
              ? 'border-border/40 bg-muted/20'
              : aboveCutoff && meetsMinimum
                ? 'border-emerald/20 bg-emerald/[0.04]'
                : 'border-destructive/20 bg-destructive/[0.04]'
          }`}>
            {hasRequiredExams ? (
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-muted-foreground">A tua nota</span>
                  <div className="text-lg font-bold tabular-nums leading-tight">{userGrade.toFixed(1)}</div>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  {aboveCutoff && meetsMinimum ? (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Acima do corte
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-destructive">
                      <XCircle className="h-3.5 w-3.5" />
                      {!meetsMinimum ? 'Nota minima' : 'Abaixo do corte'}
                    </span>
                  )}
                  <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                    <TrendingUp className="h-2.5 w-2.5" />
                    {(userGrade - notaCorte) >= 0 ? '+' : ''}{(userGrade - notaCorte).toFixed(1)} pts
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-center text-[10px] text-muted-foreground">
                Faltam provas de ingresso no perfil.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
