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
        {/* Header — clean hierarchy */}
        <div className="px-5 pt-5 pb-4 border-b border-border/40">
          {/* Course name */}
          <h2 className="text-lg font-bold text-foreground leading-tight pr-8">{course.nome}</h2>
          {/* Institution */}
          <p className="text-sm text-muted-foreground mt-0.5">{course.instituicao}</p>

          {/* Tags row */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            <Badge className="bg-navy text-primary-foreground text-[11px] font-medium">{course.area}</Badge>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2.5 py-0.5 text-[11px] text-muted-foreground">
              <MapPin className="h-2.5 w-2.5" />{course.distrito}
            </span>
            {course.vagas !== null && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2.5 py-0.5 text-[11px] text-muted-foreground">
                <Users className="h-2.5 w-2.5" />{course.vagas} vagas
              </span>
            )}
            <Badge variant="outline" className="text-[11px]">{course.tipo === 'publica' ? 'Pública' : 'Privada'}</Badge>
          </div>
        </div>

        {/* DGES link — separate, bottom of header area */}
        {course.link_oficial && (
          <div className="px-5 pt-3 pb-0">
            <a
              href={course.link_oficial}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-navy hover:underline font-medium"
            >
              <ExternalLink className="h-3 w-3" />
              Ver na DGES
            </a>
          </div>
        )}

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

          {/* Provas de ingresso — grouped by conjunto */}
          {course.provasIngresso.length > 0 && (() => {
            // Group by conjunto_id
            const grupos = new Map<number, typeof course.provasIngresso>()
            for (const p of course.provasIngresso) {
              const cid = p.conjunto_id ?? 1
              if (!grupos.has(cid)) grupos.set(cid, [])
              grupos.get(cid)!.push(p)
            }
            const gruposList = Array.from(grupos.entries())
            return (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
                  Provas de Ingresso
                  <span className="ml-1.5 font-normal normal-case tracking-normal text-muted-foreground/60">
                    ({gruposList.length} {gruposList.length === 1 ? 'conjunto' : 'conjuntos'})
                  </span>
                </p>
                <div className="flex flex-col gap-2">
                  {gruposList.map(([cid, exams]) => (
                    <div
                      key={cid}
                      className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border/40 bg-muted/30 px-3 py-2"
                    >
                      {exams.length === 1 ? (
                        // Single exam — show inline
                        <>
                          <span className="font-mono text-[11px] font-bold text-navy shrink-0">{exams[0].code}</span>
                          <span className="text-[11px] text-foreground leading-tight">{exams[0].name}</span>
                        </>
                      ) : (
                        // Bundle of 2+ exams — show each with +
                        <>
                          {exams.map((exam, i) => (
                            <span key={exam.code} className="flex items-center gap-1">
                              <span className="font-mono text-[11px] font-bold text-navy shrink-0">{exam.code}</span>
                              <span className="text-[11px] text-foreground leading-tight">{exam.name}</span>
                              {i < exams.length - 1 && (
                                <span className="text-muted-foreground/50 font-bold text-[11px] mx-0.5">+</span>
                              )}
                            </span>
                          ))}
                        </>
                      )}
                    </div>
                  ))}
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
