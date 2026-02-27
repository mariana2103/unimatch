'use client'

import { MapPin, BookOpen, TrendingUp, CheckCircle2, XCircle, GitCompareArrows, Lock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { useUser } from '@/lib/user-context'
import { calculateAdmissionGrade } from '@/lib/data'
import type { CourseUI } from '@/lib/types'

interface CourseCardProps {
  course: CourseUI
  onViewDetails: (course: CourseUI) => void
}

const AREA_COLORS: Record<string, { badge: string; accent: string }> = {
  'Engenharia e Tecnologia':            { badge: 'bg-blue-50 text-blue-600 border-blue-100',    accent: 'bg-blue-200' },
  'Ciências da Vida e Saúde':           { badge: 'bg-rose-50 text-rose-600 border-rose-100',    accent: 'bg-rose-200' },
  'Ciências Exatas e da Natureza':      { badge: 'bg-teal-50 text-teal-600 border-teal-100',    accent: 'bg-teal-200' },
  'Economia, Gestão e Contabilidade':   { badge: 'bg-amber-50 text-amber-600 border-amber-100', accent: 'bg-amber-200' },
  'Artes e Design':                     { badge: 'bg-pink-50 text-pink-600 border-pink-100',    accent: 'bg-pink-200' },
  'Direito, Ciências Sociais e Humanas':{ badge: 'bg-indigo-50 text-indigo-600 border-indigo-100', accent: 'bg-indigo-200' },
  'Educação e Desporto':                { badge: 'bg-orange-50 text-orange-600 border-orange-100', accent: 'bg-orange-200' },
  'Informática e Dados':                { badge: 'bg-cyan-50 text-cyan-600 border-cyan-100',    accent: 'bg-cyan-200' },
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

  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-white cursor-pointer shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-navy/20"
      onClick={() => onViewDetails(course)}
    >
      {/* Coloured top accent */}
      <div className={`h-1 w-full shrink-0 ${areaStyle?.accent ?? 'bg-navy'}`} />

      <div className="flex flex-col gap-4 p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-semibold leading-snug text-foreground line-clamp-2">{course.nome}</h3>
              {course.tipo === 'privada' && <Lock className="h-3 w-3 shrink-0 text-muted-foreground/60 mt-0.5" />}
            </div>
            <p className="mt-1 truncate text-xs text-muted-foreground">{course.instituicao}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 pt-0.5" onClick={e => e.stopPropagation()}>
            <Checkbox
              checked={isComparing}
              onCheckedChange={() => toggleComparison(course.id)}
              aria-label={`Comparar ${course.nome}`}
              className="h-4 w-4 border-border data-[state=checked]:bg-navy data-[state=checked]:text-primary-foreground"
            />
            <GitCompareArrows className="h-3.5 w-3.5 text-muted-foreground/60" />
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline" className={`text-[10px] py-0.5 px-2 font-medium ${areaStyle?.badge ?? ''}`}>
            {course.area}
          </Badge>
          <Badge variant="outline" className="gap-1 text-[10px] py-0.5 px-2 text-muted-foreground">
            <MapPin className="h-2.5 w-2.5" />
            {course.distrito}
          </Badge>
          <Badge variant="outline" className="text-[10px] py-0.5 px-2 text-muted-foreground">
            {course.tipo === 'publica' ? 'Pública' : 'Privada'}
          </Badge>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center rounded-xl bg-slate-50 px-2 py-2.5">
            <span className="text-[10px] font-medium text-muted-foreground">Último corte</span>
            <span className="mt-0.5 text-lg font-bold tabular-nums text-navy leading-none">
              {notaCorte !== null ? (notaCorte / 10).toFixed(1) : '—'}
            </span>
          </div>
          <div className="flex flex-col items-center rounded-xl bg-slate-50 px-2 py-2.5">
            <span className="text-[10px] font-medium text-muted-foreground">Vagas</span>
            <span className="mt-0.5 text-lg font-bold tabular-nums text-foreground leading-none">
              {course.vagas ?? '—'}
            </span>
          </div>
          <div className="flex flex-col items-center rounded-xl bg-slate-50 px-2 py-2.5">
            <span className="text-[10px] font-medium text-muted-foreground">Pesos</span>
            <span className="mt-0.5 text-sm font-bold tabular-nums text-foreground leading-none">
              {course.pesoSecundario !== null && course.pesoExame !== null
                ? `${(course.pesoSecundario * 100).toFixed(0)}/${(course.pesoExame * 100).toFixed(0)}`
                : '—'}
            </span>
          </div>
        </div>

        {/* Provas grouped by conjunto */}
        {course.provasIngresso.length > 0 && (() => {
          const conjuntoMap = new Map<number, typeof course.provasIngresso>()
          for (const p of course.provasIngresso) {
            const cid = p.conjunto_id ?? 1
            if (!conjuntoMap.has(cid)) conjuntoMap.set(cid, [])
            conjuntoMap.get(cid)!.push(p)
          }
          const groups = Array.from(conjuntoMap.values())
          return (
            <div className="flex flex-col gap-1">
              {groups.map((exams, i) => (
                <div key={i} className="flex items-center flex-wrap gap-1">
                  {i > 0 && (
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40 px-0.5">ou</span>
                  )}
                  {exams.map(p => (
                    <span
                      key={p.code}
                      className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500"
                    >
                      <BookOpen className="h-2.5 w-2.5 shrink-0" />
                      {p.code} · {p.name}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          )
        })()}

        {/* User grade result */}
        {isLoggedIn && profile && profile.media_final_calculada > 0 && notaCorte !== null && (
          <div className={`rounded-xl border px-3.5 py-3 ${
            !hasRequiredExams
              ? 'border-border/40 bg-muted/20'
              : aboveCutoff && meetsMinimum
                ? 'border-emerald-200 bg-emerald-50'
                : 'border-red-200 bg-red-50'
          }`}>
            {hasRequiredExams ? (
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-medium text-muted-foreground">A tua nota</span>
                  <div className="text-xl font-bold tabular-nums leading-tight">{(userGrade / 10).toFixed(1)}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {aboveCutoff && meetsMinimum ? (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Acima do corte
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-red-600">
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
