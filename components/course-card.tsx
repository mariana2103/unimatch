'use client'

import { CheckCircle2, XCircle, AlertCircle, GitCompareArrows, Lock, Heart, ExternalLink } from 'lucide-react'
import { useUser } from '@/lib/user-context'
import { calculateAdmissionGrade, filterValidExams } from '@/lib/data'
import type { CourseUI } from '@/lib/types'

interface CourseCardProps {
  course: CourseUI
  onViewDetails: (course: CourseUI) => void
}

const AREA_BAR: Record<string, string> = {
  'Engenharia e Tecnologia':             'bg-area-eng',
  'Ciências da Vida e Saúde':            'bg-area-saude',
  'Ciências Exatas e da Natureza':       'bg-area-cien',
  'Economia, Gestão e Contabilidade':    'bg-area-econ',
  'Artes e Design':                      'bg-area-artes',
  'Direito, Ciências Sociais e Humanas': 'bg-area-dir',
  'Educação e Desporto':                 'bg-area-edu',
  'Informática e Dados':                 'bg-area-info',
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
      filterValidExams(exams, 1),
      course
    )
    userGrade = result.grade
    meetsMinimum = result.meetsMinimum
    hasRequiredExams = result.hasRequiredExams
    aboveCutoff = notaCorte !== null && userGrade >= notaCorte
  }

  const nearCutoff = hasRequiredExams && meetsMinimum && notaCorte !== null && Math.abs(userGrade - notaCorte) <= 5
  const showUserGrade = isLoggedIn && profile && profile.media_final_calculada > 0 && hasRequiredExams

  // Group exams by conjunto_id to show alternatives properly
  const conjuntos = course.provasIngresso.reduce((acc, p) => {
    const cid = p.conjunto_id ?? 1
    if (!acc.has(cid)) acc.set(cid, [])
    acc.get(cid)!.push(p)
    return acc
  }, new Map<number, typeof course.provasIngresso>())

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
                <Heart className={`h-4 w-4 ${isFavorite ? 'fill-destructive text-destructive' : 'text-muted-foreground/25 hover:text-destructive/60'}`} />
              </button>
            )}
            <button
              onClick={() => toggleComparison(course.id)}
              aria-label={`Comparar ${course.nome}`}
              className={`flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                isComparing
                  ? 'border-navy/40 bg-navy/10 text-navy'
                  : 'border-border/50 text-muted-foreground/50 hover:border-navy/30 hover:text-navy/70'
              }`}
            >
              <GitCompareArrows className="h-3 w-3" />
              Comparar
            </button>
          </div>
        </div>

        {/* Provas — show unique exams only */}
        {course.provasIngresso.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {Array.from(new Map(course.provasIngresso.map(p => [p.code, p])).values())
              .slice(0, 4)
              .map(p => (
                <span
                  key={p.code}
                  className="rounded-md bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                >
                  {abbrevExam(p.code, p.name)}
                </span>
              ))}
            {new Set(course.provasIngresso.map(p => p.code)).size > 4 && (
              <span className="text-[10px] text-muted-foreground/50">+{new Set(course.provasIngresso.map(p => p.code)).size - 4}</span>
            )}
          </div>
        )}

        {/* Bottom: cutoff + user grade — simplified */}
        <div className="flex items-start justify-between border-t border-border/40 pt-3">
          <div>
            <p className="text-[10px] text-muted-foreground mb-0.5">Último Colocado 2025</p>
            <p className="text-xl font-bold tabular-nums text-foreground leading-none">
              {notaCorte !== null ? (notaCorte / 10).toFixed(2) : '—'}
            </p>
            {course.notaUltimoColocadoF2 !== null && (
              <p className="text-[10px] tabular-nums text-muted-foreground/60 mt-0.5">
                2ª fase {(course.notaUltimoColocadoF2 / 10).toFixed(2)}
              </p>
            )}
          </div>

          {showUserGrade ? (
            <div className="text-right">
              <div className="flex items-center justify-end gap-1 mb-0.5">
                {nearCutoff ? (
                  <AlertCircle className="h-3 w-3 text-warning" />
                ) : aboveCutoff && meetsMinimum ? (
                  <CheckCircle2 className="h-3 w-3 text-emerald" />
                ) : (
                  <XCircle className="h-3 w-3 text-destructive" />
                )}
                <p className="text-[10px] text-muted-foreground">A tua nota</p>
              </div>
              <p className={`text-xl font-bold tabular-nums leading-none ${
                nearCutoff ? 'text-warning' :
                aboveCutoff && meetsMinimum ? 'text-emerald' : 'text-foreground'
              }`}>
                {(userGrade / 10).toFixed(2)}
              </p>
            </div>
          ) : (
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground/60 mb-0.5">
                {course.vagas !== null ? `${course.vagas} vagas` : 'Vagas N/D'}
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
