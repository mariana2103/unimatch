'use client'

import { MapPin, BookOpen, Users, CheckCircle2, XCircle, AlertCircle, ExternalLink } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { GradeEvolutionChart } from './grade-evolution-chart'
import { useUser } from '@/lib/user-context'
import { calculateAdmissionGrade, filterValidExams } from '@/lib/data'
import type { CourseUI } from '@/lib/types'

interface CourseDetailDialogProps {
  course: CourseUI | null
  onClose: () => void
}

export function CourseDetailDialog({ course, onClose }: CourseDetailDialogProps) {
  const { isLoggedIn, profile, exams } = useUser()

  const notaCorte = course?.notaUltimoColocado ?? null

  let userGrade = 0
  let meetsMinimum = false
  let hasRequiredExams = false

  if (course && isLoggedIn && profile && profile.media_final_calculada > 0) {
    const result = calculateAdmissionGrade(
      profile.media_final_calculada,
      filterValidExams(exams, 1),
      course
    )
    userGrade = result.grade
    meetsMinimum = result.meetsMinimum
    hasRequiredExams = result.hasRequiredExams
  }

  const nearCutoff = hasRequiredExams && meetsMinimum && notaCorte !== null && Math.abs(userGrade - notaCorte) <= 5

  return (
    <Dialog open={!!course} onOpenChange={open => { if (!open) onClose() }}>
      {course && (
      <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto p-0">
        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-border/40">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-base font-bold text-foreground leading-tight">{course.nome}</DialogTitle>
              <DialogDescription className="mt-1 text-sm text-muted-foreground">{course.instituicao}</DialogDescription>
            </div>
            {course.link_oficial && (
              <a
                href={course.link_oficial}
                target="_blank"
                rel="noopener noreferrer"
                className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border/50 bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-navy/40 hover:text-navy transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                Ver na DGES
              </a>
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge className="bg-navy text-primary-foreground text-[11px] font-medium">{course.area}</Badge>
            <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] text-muted-foreground border-border/50">
              <MapPin className="h-2.5 w-2.5" />{course.distrito}
            </span>
            {course.vagas !== null && (
              <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] text-muted-foreground border-border/50">
                <Users className="h-2.5 w-2.5" />{course.vagas} vagas
              </span>
            )}
            <Badge variant="outline" className="text-[11px]">{course.tipo === 'publica' ? 'Pública' : 'Privada'}</Badge>
          </div>
        </DialogHeader>

        <div className="px-5 pb-5 flex flex-col gap-5">

          {/* Nota de corte — hero number */}
          <div className="flex items-end gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Último Colocado · 1ª Fase</p>
              <p className="text-4xl font-bold tabular-nums text-navy mt-0.5">
                {notaCorte !== null ? (notaCorte / 10).toFixed(1) : '—'}
              </p>
            </div>
            {course.notaUltimoColocadoF2 !== null && (
              <div className="pb-1">
                <p className="text-[11px] text-muted-foreground">2ª fase</p>
                <p className="text-xl font-bold tabular-nums text-muted-foreground">{(course.notaUltimoColocadoF2 / 10).toFixed(1)}</p>
              </div>
            )}
            {course.pesoSecundario !== null && course.pesoExame !== null && (
              <div className="pb-1 ml-auto text-right">
                <p className="text-[11px] text-muted-foreground">Pesos</p>
                <p className="text-sm font-semibold tabular-nums text-muted-foreground">
                  {(course.pesoSecundario * 100).toFixed(0)}% sec. · {(course.pesoExame * 100).toFixed(0)}% provas
                </p>
              </div>
            )}
          </div>

          {/* Nota de candidatura do utilizador */}
          {isLoggedIn && profile && profile.media_final_calculada > 0 && notaCorte !== null && (
            <div className={`rounded-xl border p-4 ${
              !hasRequiredExams
                ? 'border-border/40 bg-muted/20'
                : nearCutoff
                  ? 'border-warning/30 bg-warning/10'
                  : userGrade >= notaCorte && meetsMinimum
                    ? 'border-emerald/30 bg-emerald/5'
                    : 'border-destructive/30 bg-destructive/5'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">A tua nota de candidatura</p>
                  {hasRequiredExams ? (
                    <p className="text-2xl font-bold tabular-nums mt-0.5">{(userGrade / 10).toFixed(2)}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-0.5">Sem as provas corretas</p>
                  )}
                </div>
                {hasRequiredExams && (
                  nearCutoff ? (
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-warning">
                      <AlertCircle className="h-4 w-4" /> Próximo
                    </span>
                  ) : userGrade >= notaCorte && meetsMinimum ? (
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald">
                      <CheckCircle2 className="h-4 w-4" /> Acessível
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-destructive">
                      <XCircle className="h-4 w-4" /> {meetsMinimum ? 'Abaixo' : 'Nota mínima'}
                    </span>
                  )
                )}
              </div>
            </div>
          )}

          {/* Provas de ingresso — simple text rows */}
          {course.provasIngresso.length > 0 && (() => {
            const uniqueCodes = [...new Set(course.provasIngresso.map(p => p.code))]
            const displayed = uniqueCodes.slice(0, 5)
            const remaining = uniqueCodes.length - displayed.length
            return (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Provas de Ingresso</p>
                <div className="flex flex-col gap-1.5">
                  {displayed.map(code => {
                    const p = course.provasIngresso.find(x => x.code === code)
                    return (
                      <div key={code} className="flex items-center gap-2.5 text-sm">
                        <BookOpen className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                        <span className="font-mono text-[11px] text-navy/70 w-5 shrink-0">{code}</span>
                        <span className="text-foreground">{p?.name ?? code}</span>
                      </div>
                    )
                  })}
                  {remaining > 0 && (
                    <p className="text-[11px] text-muted-foreground/60 pl-8.5">+{remaining} mais</p>
                  )}
                </div>
              </div>
            )
          })()}

          {/* Chart */}
          {course.historico && course.historico.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Evolução</p>
              <GradeEvolutionChart historico={course.historico} />
            </div>
          )}

          {/* Histórico table */}
          {course.historico && course.historico.length > 0 && (() => {
            const rows = [...course.historico]
              .filter(h => h.nota_f1 !== null || h.vagas_f1 !== null)
              .sort((a, b) => b.year - a.year)
              .slice(0, 5)
            if (rows.length === 0) return null
            const hasF2 = rows.some(h => h.nota_f2 !== null || h.vagas_f2 !== null)
            return (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Histórico</p>
                <div className="rounded-lg border border-border/40 overflow-hidden">
                  <table className="w-full text-[11px] tabular-nums">
                    <thead>
                      <tr className="border-b border-border/40 bg-muted/30">
                        <th className="py-2 pl-3 text-left font-semibold text-muted-foreground">Ano</th>
                        <th className="py-2 pr-3 text-right font-semibold text-muted-foreground">1ª Fase</th>
                        <th className="py-2 pr-3 text-right font-semibold text-muted-foreground">Vagas</th>
                        {hasF2 && <th className="py-2 pr-3 text-right font-semibold text-muted-foreground">2ª Fase</th>}
                        {hasF2 && <th className="py-2 pr-3 text-right font-semibold text-muted-foreground">Vagas</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map(h => (
                        <tr key={h.year} className="border-b border-border/20 last:border-0 hover:bg-muted/20">
                          <td className="py-1.5 pl-3 font-medium text-foreground">{h.year}</td>
                          <td className="py-1.5 pr-3 text-right font-semibold text-navy">
                            {h.nota_f1 !== null ? (h.nota_f1 * 10).toFixed(1) : '—'}
                          </td>
                          <td className="py-1.5 pr-3 text-right text-muted-foreground">{h.vagas_f1 ?? '—'}</td>
                          {hasF2 && (
                            <td className="py-1.5 pr-3 text-right text-muted-foreground">
                              {h.nota_f2 !== null ? (h.nota_f2 * 10).toFixed(1) : '—'}
                            </td>
                          )}
                          {hasF2 && (
                            <td className="py-1.5 pr-3 text-right text-muted-foreground">{h.vagas_f2 ?? '—'}</td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })()}
        </div>
      </DialogContent>
      )}
    </Dialog>
  )
}
