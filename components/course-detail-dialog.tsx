'use client'

import { MapPin, BookOpen, Users, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { GradeEvolutionChart } from './grade-evolution-chart'
import { useUser } from '@/lib/user-context'
import { calculateAdmissionGrade } from '@/lib/data'
import type { CourseUI } from '@/lib/types'

interface CourseDetailDialogProps {
  course: CourseUI | null
  onClose: () => void
}

export function CourseDetailDialog({ course, onClose }: CourseDetailDialogProps) {
  const { isLoggedIn, profile, exams } = useUser()

  if (!course) return null

  const notaCorte = course.notaUltimoColocado

  let userGrade = 0
  let meetsMinimum = false
  let hasRequiredExams = false

  if (isLoggedIn && profile && profile.media_final_calculada > 0) {
    const result = calculateAdmissionGrade(
      profile.media_final_calculada,
      exams.map(e => ({ subjectCode: e.exam_code, grade: e.grade })),
      course
    )
    userGrade = result.grade
    meetsMinimum = result.meetsMinimum
    hasRequiredExams = result.hasRequiredExams
  }

  const nearCutoff = hasRequiredExams && meetsMinimum && notaCorte !== null && Math.abs(userGrade - notaCorte) <= 5

  return (
    <Dialog open={!!course} onOpenChange={open => { if (!open) onClose() }}>
      <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base text-foreground">{course.nome}</DialogTitle>
          <DialogDescription>{course.instituicao}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-1.5">
            <Badge className="bg-navy text-primary-foreground text-[10px]">{course.area}</Badge>
            <Badge variant="outline" className="gap-1 text-[10px]"><MapPin className="h-2.5 w-2.5" />{course.distrito}</Badge>
            {course.vagas !== null && (
              <Badge variant="outline" className="gap-1 text-[10px]"><Users className="h-2.5 w-2.5" />{course.vagas} vagas</Badge>
            )}
            <Badge variant="outline" className="text-[10px]">{course.tipo === 'publica' ? 'Publica' : 'Privada'}</Badge>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Ultimo Colocado', value: notaCorte !== null ? (notaCorte / 10).toFixed(1) : '—', highlight: true },
              { label: 'Nota Minima', value: course.notaMinima !== null ? (course.notaMinima / 10).toFixed(1) : '—', highlight: false },
              { label: 'Pesos Sec/Exam', value: course.pesoSecundario !== null && course.pesoExame !== null
                  ? `${(course.pesoSecundario * 100).toFixed(0)}/${(course.pesoExame * 100).toFixed(0)}`
                  : '—', highlight: false },
            ].map(s => (
              <div key={s.label} className="flex flex-col items-center gap-0.5 rounded-lg bg-muted/40 p-2.5">
                <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">{s.label}</span>
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
                  ? 'border-yellow-200 bg-yellow-50'
                  : userGrade >= (notaCorte ?? 0) && meetsMinimum
                    ? 'border-emerald/20 bg-emerald/[0.04]'
                    : 'border-destructive/20 bg-destructive/[0.04]'
            }`}>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">A tua candidatura</span>
              {hasRequiredExams ? (
                <div className="mt-1 flex items-center justify-between">
                  <div>
                    <div className="text-xl font-bold tabular-nums">{(userGrade / 10).toFixed(1)}</div>
                    <div className="text-[10px] text-muted-foreground">
                      ({profile.media_final_calculada.toFixed(1)} x {course.pesoSecundario !== null ? (course.pesoSecundario * 100).toFixed(0) : '?'}%) + (Exames x {course.pesoExame !== null ? (course.pesoExame * 100).toFixed(0) : '?'}%)
                    </div>
                  </div>
                  {nearCutoff ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-yellow-600">
                      <AlertCircle className="h-4 w-4" /> Próximo ao corte
                    </span>
                  ) : userGrade >= (notaCorte ?? 0) && meetsMinimum ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-emerald">
                      <CheckCircle2 className="h-4 w-4" /> Acima do corte
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-semibold text-destructive">
                      <XCircle className="h-4 w-4" /> {!meetsMinimum ? 'Nota mínima' : 'Abaixo do corte'}
                    </span>
                  )}
                </div>
              ) : (
                <p className="mt-1 text-[10px] text-muted-foreground">Adiciona as provas necessárias no teu perfil.</p>
              )}
            </div>
          )}

          {course.historico && <GradeEvolutionChart historico={course.historico} />}
        </div>
      </DialogContent>
    </Dialog>
  )
}
