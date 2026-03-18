'use client'

import { MapPin, BookOpen, GitCompareArrows, Lock, Heart, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { useUser } from '@/lib/user-context'
import { calculateAdmissionGrade } from '@/lib/data'
import type { CourseUI } from '@/lib/types'

interface CourseCardProps {
  course: CourseUI
  onViewDetails: (course: CourseUI) => void
}

const AREA_COLORS: Record<string, { dot: string; text: string; bar: string }> = {
  'Engenharia e Tecnologia':             { dot: 'bg-blue-500',   text: 'text-blue-600 dark:text-blue-400',   bar: 'bg-blue-500' },
  'Ciências da Vida e Saúde':            { dot: 'bg-rose-500',   text: 'text-rose-600 dark:text-rose-400',   bar: 'bg-rose-500' },
  'Ciências Exatas e da Natureza':       { dot: 'bg-teal-500',   text: 'text-teal-600 dark:text-teal-400',   bar: 'bg-teal-500' },
  'Economia, Gestão e Contabilidade':    { dot: 'bg-amber-500',  text: 'text-amber-600 dark:text-amber-400', bar: 'bg-amber-500' },
  'Artes e Design':                      { dot: 'bg-pink-500',   text: 'text-pink-600 dark:text-pink-400',   bar: 'bg-pink-500' },
  'Direito, Ciências Sociais e Humanas': { dot: 'bg-indigo-500', text: 'text-indigo-600 dark:text-indigo-400', bar: 'bg-indigo-500' },
  'Educação e Desporto':                 { dot: 'bg-orange-500', text: 'text-orange-600 dark:text-orange-400', bar: 'bg-orange-500' },
  'Informática e Dados':                 { dot: 'bg-cyan-500',   text: 'text-cyan-600 dark:text-cyan-400',   bar: 'bg-cyan-500' },
}

export function CourseCard({ course, onViewDetails }: CourseCardProps) {
  const { isLoggedIn, profile, exams, favorites, comparisonList, toggleComparison, toggleFavorite } = useUser()
  const isComparing = comparisonList.includes(course.id)
  const isFavorite  = favorites.includes(course.id)

  const notaCorte = course.notaUltimoColocado
  const areaStyle = AREA_COLORS[course.area]

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
  const showUserGrade = isLoggedIn && profile && profile.media_final_calculada > 0 && hasRequiredExams && notaCorte !== null

  // Deduplicate exam codes for display
  const uniqueExamCodes = Array.from(new Set(course.provasIngresso.map(p => p.code)))

  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-xl border border-border/50 bg-card cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-border"
      onClick={() => onViewDetails(course)}
    >
      {/* Top accent bar */}
      <div className={`h-0.5 w-full shrink-0 ${areaStyle?.bar ?? 'bg-navy'}`} />

      <div className="flex flex-col gap-3 p-4">

        {/* Header: name + actions */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-semibold leading-snug text-foreground line-clamp-2">{course.nome}</h3>
              {course.tipo === 'privada' && <Lock className="h-3 w-3 shrink-0 text-muted-foreground/40 mt-0.5" />}
            </div>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{course.instituicao}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2 pt-0.5" onClick={e => e.stopPropagation()}>
            {isLoggedIn && (
              <button
                onClick={() => toggleFavorite(course.id)}
                aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                className="transition-colors"
              >
                <Heart className={`h-4 w-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-muted-foreground/30 hover:text-rose-400'}`} />
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

        {/* Area + location */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`flex items-center gap-1.5 text-[11px] font-medium ${areaStyle?.text ?? 'text-navy'}`}>
            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${areaStyle?.dot ?? 'bg-navy'}`} />
            {course.area}
          </span>
          <span className="h-3 w-px bg-border/60" />
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <MapPin className="h-2.5 w-2.5" />
            {course.distrito}
          </span>
        </div>

        {/* Cutoff + user grade inline */}
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
                nearCutoff        ? 'text-amber-600 dark:text-amber-400' :
                aboveCutoff && meetsMinimum ? 'text-emerald-600 dark:text-emerald-400' :
                                  'text-foreground'
              }`}>
                {(userGrade / 10).toFixed(1)}
              </p>
              <p className={`text-[10px] tabular-nums mt-0.5 ${
                (userGrade - (notaCorte ?? 0)) >= 0 ? 'text-emerald-500' : 'text-rose-500'
              }`}>
                {(userGrade - (notaCorte ?? 0)) >= 0 ? '+' : ''}{((userGrade - (notaCorte ?? 0)) / 10).toFixed(1)} val.
              </p>
            </div>
          ) : uniqueExamCodes.length > 0 ? (
            <div className="flex items-center gap-1 flex-wrap justify-end">
              <BookOpen className="h-3 w-3 text-muted-foreground/40 shrink-0" />
              {uniqueExamCodes.map(code => (
                <span
                  key={code}
                  className="rounded bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground tabular-nums"
                >
                  {code}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {/* Provas — only shown when user grade IS displayed (so codes stay visible) */}
        {showUserGrade && uniqueExamCodes.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            <BookOpen className="h-3 w-3 text-muted-foreground/40 shrink-0" />
            {uniqueExamCodes.map(code => (
              <span
                key={code}
                className="rounded bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground tabular-nums"
              >
                {code}
              </span>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
