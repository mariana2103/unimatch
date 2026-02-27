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
  const [isPending, startTransition] = useTransition()

  const handleAdd = () => {
    const grade = parseFloat(newExamGrade)
    if (!newExamCode || isNaN(grade) || grade < 0 || grade > 200) return
    startTransition(async () => {
      await addExam({ exam_code: newExamCode, grade, exam_year: new Date().getFullYear() })
      setNewExamCode('')
      setNewExamGrade('')
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
            className="flex items-center justify-between p-4 bg-white rounded-xl border border-border/40 shadow-sm"
          >
            <div className="flex flex-col">
              <span className="text-[10px] font-mono text-muted-foreground">{e.exam_code}</span>
              <span className="text-sm font-semibold">
                {EXAM_SUBJECTS.find((s) => s.code === e.exam_code)?.name || e.exam_code}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-lg font-bold text-navy">{e.grade}</span>
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

      <div className="mt-4 p-4 bg-white rounded-xl border-2 border-dashed flex flex-col sm:flex-row gap-3">
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
        <Input
          type="number"
          placeholder="Nota (0-200)"
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
