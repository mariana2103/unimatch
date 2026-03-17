'use client'

import { MapPin, BookOpen, TrendingUp, CheckCircle2, XCircle, AlertCircle, GitCompareArrows, Lock } from 'lucide-react'
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
  const { isLoggedIn, profile, exams, comparisonList, toggleComparison } = useUser()
  const isComparing = comparisonList.includes(course.id)

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

  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-xl border border-border/50 bg-card cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-border"
      onClick={() => onViewDetails(course)}
    >
      {/* Top accent bar */}
      <div className={`h-[3px] w-full shrink-0 ${areaStyle?.bar ?? 'bg-navy'}`} />

      <div className="flex flex-col gap-3 p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-semibold leading-snug text-foreground line-clamp-2">{course.nome}</h3>
              {course.tipo === 'privada' && <Lock className="h-3 w-3 shrink-0 text-muted-foreground/40 mt-0.5" />}
            </div>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{course.instituicao}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 pt-0.5" onClick={e => e.stopPropagation()}>
            <Checkbox
              checked={isComparing}
              onCheckedChange={() => toggleComparison(course.id)}
              aria-label={`Comparar ${course.nome}`}
              className="h-4 w-4 border-border data-[state=checked]:bg-navy data-[state=checked]:text-primary-foreground"
            />
            <GitCompareArrows className="h-3.5 w-3.5 text-muted-foreground/40" />
          </div>
        </div>

        {/* Area + location */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className={`flex items-center gap-1.5 text-[11px] font-medium ${areaStyle?.text ?? 'text-navy'}`}>
            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${areaStyle?.dot ?? 'bg-navy'}`} />
            {course.area}
          </span>
          <span className="h-3 w-px bg-border/60" />
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <MapPin className="h-2.5 w-2.5" />
            {course.distrito}
          </span>
          {course.tipo === 'privada' && (
            <>
              <span className="h-3 w-px bg-border/60" />
              <span className="text-[11px] text-muted-foreground">Privada</span>
            </>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-0 divide-x divide-border/40 border-t border-border/40 pt-3">
          <div className="flex-1 pr-3">
            <p className="text-[10px] text-muted-foreground">Último corte</p>
            <p className="mt-0.5 text-base font-bold tabular-nums text-foreground leading-none">
              {notaCorte !== null ? (notaCorte / 10).toFixed(1) : '—'}
            </p>
          </div>
          <div className="flex-1 px-3">
            <p className="text-[10px] text-muted-foreground">Vagas</p>
            <p className="mt-0.5 text-base font-bold tabular-nums text-foreground leading-none">
              {course.vagas ?? '—'}
            </p>
          </div>
          <div className="flex-1 pl-3">
            <p className="text-[10px] text-muted-foreground">Pesos</p>
            <p className="mt-0.5 text-base font-bold tabular-nums text-foreground leading-none">
              {course.pesoSecundario !== null && course.pesoExame !== null
                ? `${(course.pesoSecundario * 100).toFixed(0)}/${(course.pesoExame * 100).toFixed(0)}`
                : '—'}
            </p>
          </div>
        </div>

        {/* Provas de ingresso */}
        {course.provasIngresso.length > 0 && (() => {
          const unique = Array.from(
            new Map(course.provasIngresso.map(p => [p.code, p])).values()
          )
          return (
            <div className="flex flex-wrap gap-1">
              {unique.map(p => (
                <span
                  key={p.code}
                  className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-0.5 text-[10px] text-muted-foreground"
                >
                  <BookOpen className="h-2.5 w-2.5 shrink-0" />
                  {p.name}
                </span>
              ))}
            </div>
          )
        })()}

        {/* User grade result */}
        {isLoggedIn && profile && profile.media_final_calculada > 0 && notaCorte !== null && (
          <div className={`rounded-lg border px-3 py-2.5 ${
            !hasRequiredExams
              ? 'border-border/40 bg-muted/20'
              : nearCutoff
                ? 'border-yellow-300/50 bg-yellow-50/70 dark:border-yellow-700/30 dark:bg-yellow-950/20'
                : aboveCutoff && meetsMinimum
                  ? 'border-emerald-300/50 bg-emerald-50/70 dark:border-emerald-700/30 dark:bg-emerald-950/20'
                  : 'border-red-300/50 bg-red-50/70 dark:border-red-700/30 dark:bg-red-950/20'
          }`}>
            {hasRequiredExams ? (
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-muted-foreground">A tua nota</span>
                  <div className="text-xl font-bold tabular-nums leading-tight">{(userGrade / 10).toFixed(1)}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {nearCutoff ? (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-yellow-600 dark:text-yellow-500">
                      <AlertCircle className="h-3.5 w-3.5" /> Próximo ao corte
                    </span>
                  ) : aboveCutoff && meetsMinimum ? (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-500">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Acima do corte
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-red-600 dark:text-red-400">
                      <XCircle className="h-3.5 w-3.5" />
                      {!meetsMinimum ? 'Nota mínima' : 'Abaixo do corte'}
                    </span>
                  )}
                  {notaCorte !== null && (
                    <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                      <TrendingUp className="h-2.5 w-2.5" />
                      {(userGrade - notaCorte) >= 0 ? '+' : ''}{((userGrade - notaCorte) / 10).toFixed(1)} pts
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-center text-[10px] text-muted-foreground">
                Faltam provas de ingresso no perfil.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
