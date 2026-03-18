'use client'

import { CheckCircle2, XCircle, AlertCircle, GitCompareArrows, Lock, Heart } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { useUser } from '@/lib/user-context'
import { calculateAdmissionGrade } from '@/lib/data'
import type { CourseUI } from '@/lib/types'

interface CourseCardProps {
  course: CourseUI
  onViewDetails: (course: CourseUI) => void
}

const AREA_BAR: Record<string, string> = {
  'Engenharia e Tecnologia':             'bg-blue-500',
  'Ciências da Vida e Saúde':            'bg-rose-500',
  'Ciências Exatas e da Natureza':       'bg-teal-500',
  'Economia, Gestão e Contabilidade':    'bg-amber-500',
  'Artes e Design':                      'bg-pink-500',
  'Direito, Ciências Sociais e Humanas': 'bg-indigo-500',
  'Educação e Desporto':                 'bg-orange-500',
  'Informática e Dados':                 'bg-cyan-500',
}

// Abbreviated exam names for compact display
const EXAM_ABBREV: Record<string, string> = {
  '02': 'Bio. e Geologia',
  '07': 'Física e Química',
  '10': 'Geom. Descritiva',
  '12': 'Hist. Cult. e Artes',
  '15': 'Lit. Portuguesa',
  '19': 'Matemática A',
}

function abbrevExam(code: string, name: string): string {
  return EXAM_ABBREV[code] ?? name
}

export function CourseCard({ course, onViewDetails }: CourseCardProps) {
  const { isLoggedIn, profile, exams, favorites, comparisonList, toggleComparison, toggleFavorite } = useUser()
  const isComparing = comparisonList.includes(course.id)
  const isFavorite  = favorites.includes(course.id)

  const notaCorte = course.notaUltimoColocado

  let userGrade = 0
  let meetsMinimum = false
  let hasRequiredExams = false
  let aboveCutoff = false

  if (isLoggedIn && profile && profile.media_final_calculada > 0) {
    const result = calculateAdmissionGrade(
      profile.media_final_calculada,
      exams.map(e => ({ subjectCode: e.exam_code, grade: e.grade })),
      course
    )
    userGrade = result.grade
    meetsMinimum = result.meetsMinimum
    hasRequiredExams = result.hasRequiredExams
    aboveCutoff = notaCorte !== null && userGrade >= notaCorte
  }

  const nearCutoff = hasRequiredExams && meetsMinimum && notaCorte !== null && Math.abs(userGrade - notaCorte) <= 5
  const showUserGrade = isLoggedIn && profile && profile.media_final_calculada > 0 && hasRequiredExams

  const uniqueExams = Array.from(
    new Map(course.provasIngresso.map(p => [p.code, p])).values()
  )

  return (
    <div
      className="group flex flex-col overflow-hidden rounded-xl border border-border/50 bg-card cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-border"
      onClick={() => onViewDetails(course)}
    >
      {/* Area colour bar */}
      <div className={`h-0.5 w-full shrink-0 ${AREA_BAR[course.area] ?? 'bg-navy'}`} />

      <div className="flex flex-col gap-3 p-4">

        {/* Name + actions */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-semibold leading-snug text-foreground line-clamp-2">{course.nome}</h3>
              {course.tipo === 'privada' && <Lock className="h-3 w-3 shrink-0 text-muted-foreground/40 mt-0.5" />}
            </div>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{course.instituicao}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 pt-0.5" onClick={e => e.stopPropagation()}>
            {isLoggedIn && (
              <button
                onClick={() => toggleFavorite(course.id)}
                aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                className="transition-colors"
              >
                <Heart className={`h-4 w-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-muted-foreground/25 hover:text-rose-400'}`} />
              </button>
            )}
            <Checkbox
              checked={isComparing}
              onCheckedChange={() => toggleComparison(course.id)}
              aria-label={`Comparar ${course.nome}`}
              className="h-4 w-4 border-border data-[state=checked]:bg-navy data-[state=checked]:text-primary-foreground"
            />
          </div>
        </div>

        {/* Provas chips — abbreviated */}
        {uniqueExams.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {uniqueExams.map(p => (
              <span
                key={p.code}
                className="rounded-md bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
              >
                {abbrevExam(p.code, p.name)}
              </span>
            ))}
          </div>
        )}

        {/* Bottom: cutoff + user grade */}
        <div className="flex items-end justify-between border-t border-border/40 pt-3">
          <div>
            <p className="text-[10px] text-muted-foreground mb-0.5">Último Colocado</p>
            <p className="text-xl font-bold tabular-nums text-foreground leading-none">
              {notaCorte !== null ? (notaCorte / 10).toFixed(1) : '—'}
            </p>
          </div>

          {showUserGrade ? (
            <div className="text-right">
              <div className="flex items-center justify-end gap-1 mb-0.5">
                {nearCutoff ? (
                  <AlertCircle className="h-3 w-3 text-amber-500" />
                ) : aboveCutoff && meetsMinimum ? (
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                ) : (
                  <XCircle className="h-3 w-3 text-red-400" />
                )}
                <p className="text-[10px] text-muted-foreground">A tua nota</p>
              </div>
              <p className={`text-xl font-bold tabular-nums leading-none ${
                nearCutoff                    ? 'text-amber-600 dark:text-amber-400' :
                aboveCutoff && meetsMinimum   ? 'text-emerald-600 dark:text-emerald-400' :
                                                'text-foreground'
              }`}>
                {(userGrade / 10).toFixed(1)}
              </p>
              {notaCorte !== null && (
                <p className={`text-[10px] tabular-nums mt-0.5 ${
                  (userGrade - notaCorte) >= 0 ? 'text-emerald-500' : 'text-rose-500'
                }`}>
                  {(userGrade - notaCorte) >= 0 ? '+' : ''}{((userGrade - notaCorte) / 10).toFixed(1)} val.
                </p>
              )}
            </div>
          ) : null}
        </div>

      </div>
    </div>
  )
}
