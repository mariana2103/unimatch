'use client'

import { MapPin, BookOpen, Users, CheckCircle2, XCircle, AlertCircle, ExternalLink, Link2 } from 'lucide-react'
import Link from 'next/link'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { GradeEvolutionChart } from './grade-evolution-chart'
import { useUser } from '@/lib/user-context'
import { calculateAdmissionGrade, filterValidExams } from '@/lib/data'
import { toCourseSlug } from '@/lib/course-slug'
import type { CourseUI } from '@/lib/types'

interface CourseDetailDialogProps {
  course: CourseUI | null
  onClose: () => void
}

export function CourseDetailDialog({ course, onClose }: CourseDetailDialogProps) {
  const { isLoggedIn, profile, exams } = useUser()

  // Move all course-dependent calculations after the Dialog check
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
      <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-base text-foreground">{course.nome}</DialogTitle>
              <DialogDescription>{course.instituicao}</DialogDescription>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <Link
                href={`/cursos/${toCourseSlug(course.nome, course.instituicao)}`}
                className="flex items-center gap-1 rounded-lg border border-border/50 bg-muted/40 px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground hover:border-navy/40 hover:text-navy transition-colors"
                title="Página permanente"
              >
                <Link2 className="h-3 w-3" />
              </Link>
              {course.link_oficial && (
                <a
                  href={course.link_oficial}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 rounded-lg border border-border/50 bg-muted/40 px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground hover:border-navy/40 hover:text-navy transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                  Ver no DGES
                </a>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-1.5">
            <Badge className="bg-navy text-primary-foreground text-[10px]">{course.area}</Badge>
            <Badge variant="outline" className="gap-1 text-[10px]"><MapPin className="h-2.5 w-2.5" />{course.distrito}</Badge>
            {course.vagas !== null && (
              <Badge variant="outline" className="gap-1 text-[10px]"><Users className="h-2.5 w-2.5" />{course.vagas} vagas</Badge>
            )}
            <Badge variant="outline" className="text-[10px]">{course.tipo === 'publica' ? 'Pública' : 'Privada'}</Badge>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: 'Últ. Colocado 1ª F.', value: notaCorte !== null ? (notaCorte / 10).toFixed(2) : '—', highlight: true },
              { label: 'Últ. Colocado 2ª F.', value: course.notaUltimoColocadoF2 !== null ? (course.notaUltimoColocadoF2 / 10).toFixed(2) : '—', highlight: false },
              { label: 'Nota Mínima', value: course.notaMinima !== null ? (course.notaMinima / 10).toFixed(2) : '—', highlight: false },
              { label: 'Sec. / Exam.', value: course.pesoSecundario !== null && course.pesoExame !== null
                  ? `${(course.pesoSecundario * 100).toFixed(0)}% / ${(course.pesoExame * 100).toFixed(0)}%`
                  : '—', highlight: false },
            ].map(s => (
              <div key={s.label} className="flex flex-col items-center gap-0.5 rounded-lg bg-muted/40 p-2.5">
                <span className="text-center text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">{s.label}</span>
                <span className={`text-lg font-bold tabular-nums ${s.highlight ? 'text-navy' : 'text-foreground'}`}>{s.value}</span>
              </div>
            ))}
          </div>

          {course.provasIngresso.length > 0 && (() => {
            const conjuntoMap = new Map<number, typeof course.provasIngresso>()
            for (const p of course.provasIngresso) {
              const cid = p.conjunto_id ?? 1
              if (!conjuntoMap.has(cid)) conjuntoMap.set(cid, [])
              conjuntoMap.get(cid)!.push(p)
            }
            const groups = Array.from(conjuntoMap.values())
            return (
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Provas de Ingresso</span>
                {groups.map((exams, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    {i > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="h-px flex-1 bg-border/40" />
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">ou</span>
                        <div className="h-px flex-1 bg-border/40" />
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      {exams.map(p => (
                        <Badge key={p.code} variant="secondary" className="gap-1.5 py-1 px-2.5 text-[10px]">
                          <BookOpen className="h-3 w-3" />
                          {p.code} · {p.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )
          })()}

          {isLoggedIn && profile && profile.media_final_calculada > 0 && notaCorte !== null && (
            <div className={`rounded-lg border p-3 ${
              !hasRequiredExams
                ? 'border-border/40 bg-muted/20'
                : nearCutoff
                  ? 'border-warning/30 bg-warning/10'
                  : userGrade >= (notaCorte ?? 0) && meetsMinimum
                    ? 'border-emerald/20 bg-emerald/[0.04]'
                    : 'border-destructive/20 bg-destructive/[0.04]'
            }`}>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Nota de Candidatura</span>
              {hasRequiredExams ? (
                <div className="mt-1 flex items-center justify-between">
                  <div>
                    <div className="text-xl font-bold tabular-nums">{(userGrade / 10).toFixed(2)}</div>
                    <div className="text-[10px] text-muted-foreground">
                      ({profile.media_final_calculada.toFixed(1)} x {course.pesoSecundario !== null ? (course.pesoSecundario * 100).toFixed(0) : '?'}%) + (Exames x {course.pesoExame !== null ? (course.pesoExame * 100).toFixed(0) : '?'}%)
                    </div>
                  </div>
                  {nearCutoff ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-warning">
                      <AlertCircle className="h-4 w-4" /> Próximo da nota de entrada
                    </span>
                  ) : userGrade >= (notaCorte ?? 0) && meetsMinimum ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-emerald">
                      <CheckCircle2 className="h-4 w-4" /> Acima da nota de entrada
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-semibold text-destructive">
                      <XCircle className="h-4 w-4" /> {!meetsMinimum ? 'Nota mínima' : 'Abaixo da nota de entrada'}
                    </span>
                  )}
                </div>
              ) : (
                <p className="mt-1 text-[10px] text-muted-foreground">Adiciona as provas necessárias no teu perfil.</p>
              )}
            </div>
          )}

          {course.historico && <GradeEvolutionChart historico={course.historico} />}

          {course.historico && course.historico.length > 0 && (() => {
            const rows = [...course.historico]
              .filter(h => h.nota_f1 !== null || h.vagas_f1 !== null)
              .sort((a, b) => b.year - a.year)
              .slice(0, 6)
            if (rows.length === 0) return null
            const hasF2 = rows.some(h => h.nota_f2 !== null || h.vagas_f2 !== null)
            return (
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Histórico</p>
                <div className="overflow-x-auto rounded-lg border border-border/40">
                  <table className="w-full text-[11px] tabular-nums">
                    <thead>
                      <tr className="border-b border-border/40 bg-muted/30">
                        <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Ano</th>
                        <th className="px-3 py-2 text-right font-semibold text-muted-foreground">Ult. Col. 1ª</th>
                        <th className="px-3 py-2 text-right font-semibold text-muted-foreground">Vagas 1ª</th>
                        {hasF2 && <th className="px-3 py-2 text-right font-semibold text-muted-foreground">Ult. Col. 2ª</th>}
                        {hasF2 && <th className="px-3 py-2 text-right font-semibold text-muted-foreground">Vagas 2ª</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map(h => (
                        <tr key={h.year} className="border-b border-border/20 last:border-0 hover:bg-muted/20">
                          <td className="px-3 py-2 font-medium text-foreground">{h.year}</td>
                          <td className="px-3 py-2 text-right text-foreground">
                            {h.nota_f1 !== null ? (h.nota_f1 / 10).toFixed(2) : '—'}
                          </td>
                          <td className="px-3 py-2 text-right text-muted-foreground">
                            {h.vagas_f1 ?? '—'}
                          </td>
                          {hasF2 && (
                            <td className="px-3 py-2 text-right text-muted-foreground">
                              {h.nota_f2 !== null ? (h.nota_f2 / 10).toFixed(2) : '—'}
                            </td>
                          )}
                          {hasF2 && (
                            <td className="px-3 py-2 text-right text-muted-foreground">
                              {h.vagas_f2 ?? '—'}
                            </td>
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
