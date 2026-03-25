'use client'

import { useState, useTransition } from 'react'
import { Trash2, BookOpen } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EXAM_SUBJECTS } from '@/lib/constants'
import { useUser } from '@/lib/user-context'
import type { UserExam } from '@/lib/types'

interface ExamsSectionProps {
  exams: UserExam[]
}

export function ExamsSection({ exams }: ExamsSectionProps) {
  const { addExam, removeExam } = useUser()
  const [newExamCode, setNewExamCode] = useState('')
  const [newExamGrade, setNewExamGrade] = useState('')
  const [newExamFase, setNewExamFase] = useState<'1' | '2'>('1')
  const [isPending, startTransition] = useTransition()

  const handleAdd = () => {
    const grade = parseFloat(newExamGrade)
    if (!newExamCode || isNaN(grade) || grade < 0 || grade > 20) return
    startTransition(async () => {
      // Store on 0–200 scale to match calculateAdmissionGrade expectations
      await addExam({
        exam_code: newExamCode,
        grade: Math.round(grade * 10),
        exam_year: new Date().getFullYear(),
        fase: Number(newExamFase) as 1 | 2,
      })
      setNewExamCode('')
      setNewExamGrade('')
      setNewExamFase('1')
    })
  }

  const handleRemove = (examId: string) => {
    startTransition(async () => {
      await removeExam(examId)
    })
  }

  return (
    <section className="space-y-4 bg-muted/30 p-6 rounded-2xl border">
      <Label className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
        <BookOpen className="h-4 w-4" /> Exames e Provas de Ingresso
      </Label>

      <div className="grid gap-3 sm:grid-cols-2">
        {exams.map((e) => (
          <div
            key={e.id}
            className="flex items-center justify-between p-4 bg-card rounded-xl border border-border/40 shadow-sm"
          >
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono text-muted-foreground">{e.exam_code}</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                  (e.fase ?? 1) === 2
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    : 'bg-navy/10 text-navy'
                }`}>
                  {(e.fase ?? 1)}ª fase
                </span>
              </div>
              <span className="text-sm font-semibold">
                {EXAM_SUBJECTS.find((s) => s.code === e.exam_code)?.name || e.exam_code}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-lg font-bold text-navy">{(e.grade / 10).toFixed(1)}</span>
              <button
                onClick={() => handleRemove(e.id)}
                disabled={isPending}
                className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-4 bg-card rounded-xl border-2 border-dashed flex flex-col sm:flex-row gap-3">
        <Select value={newExamCode} onValueChange={setNewExamCode}>
          <SelectTrigger className="h-10 flex-1">
            <SelectValue placeholder="Escolher Exame..." />
          </SelectTrigger>
          <SelectContent>
            {EXAM_SUBJECTS.map((s) => (
              <SelectItem key={s.code} value={s.code}>
                {s.name} ({s.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={newExamFase} onValueChange={(v) => setNewExamFase(v as '1' | '2')}>
          <SelectTrigger className="h-10 w-full sm:w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1ª Fase</SelectItem>
            <SelectItem value="2">2ª Fase</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="number"
          placeholder="Nota (0–20)"
          min={0}
          max={20}
          step={0.1}
          className="h-10 w-full sm:w-32"
          value={newExamGrade}
          onChange={(e) => setNewExamGrade(e.target.value)}
        />
        <Button
          onClick={handleAdd}
          disabled={isPending || !newExamCode || !newExamGrade}
          className="bg-navy h-10 px-6"
        >
          Adicionar
        </Button>
      </div>
    </section>
  )
}
