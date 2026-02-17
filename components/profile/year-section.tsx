'use client'

import { useState, useTransition } from 'react'
import { Plus, Trash2, ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { SUBJECTS_BY_YEAR } from '@/lib/constants'
import { addGradeAction, removeGradeAction } from '@/app/actions/grade-actions'
import type { UserGrade } from '@/lib/types'

interface YearSectionProps {
  year: 10 | 11 | 12
  userId: string
  grades: UserGrade[]
}

export function YearSection({ year, userId, grades }: YearSectionProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [selectedSubject, setSelectedSubject] = useState('')
  const [gradeInput, setGradeInput] = useState('')
  const [isPending, startTransition] = useTransition()

  const yearGrades = grades.filter((g) => g.year_level === year)
  const availableSubjects = (SUBJECTS_BY_YEAR[year] || []).filter(
    (s) => !yearGrades.some((g) => g.subject_name === s)
  )

  const handleAdd = () => {
    const val = parseFloat(gradeInput)
    if (!selectedSubject || isNaN(val)) return

    startTransition(async () => {
      await addGradeAction({ userId, subject: selectedSubject, year, grade: val })
      setSelectedSubject('')
      setGradeInput('')
    })
  }

  const handleRemove = (gradeId: string) => {
    startTransition(async () => {
      await removeGradeAction(gradeId, userId)
    })
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-xl border border-border/40 bg-card p-4 hover:bg-muted/30 transition-all">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy/10 text-navy font-bold text-xs">
            {year}º
          </div>
          <span className="font-semibold text-foreground">{year}.º Ano</span>
          {yearGrades.length > 0 && (
            <Badge className="bg-navy text-white text-[10px]">{yearGrades.length}</Badge>
          )}
        </div>
        <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-3 space-y-3 px-2">
        <div className="grid gap-2 sm:grid-cols-2">
          {yearGrades.map((g) => (
            <div key={g.id} className="flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm">
              <span className="text-sm font-medium">{g.subject_name}</span>
              <div className="flex items-center gap-4">
                <span className="font-bold text-navy">{g.grade}</span>
                <button
                  onClick={() => handleRemove(g.id)}
                  disabled={isPending}
                  className="text-muted-foreground hover:text-destructive disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 pt-2 bg-muted/20 p-3 rounded-lg border border-dashed">
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="h-9 w-full sm:flex-1 bg-white text-xs">
              <SelectValue placeholder="Disciplina" />
            </SelectTrigger>
            <SelectContent>
              {availableSubjects.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            placeholder="0-20"
            className="h-9 w-24 bg-white text-xs"
            value={gradeInput}
            onChange={(e) => setGradeInput(e.target.value)}
          />
          <Button
            onClick={handleAdd}
            disabled={isPending || !selectedSubject || !gradeInput}
            className="h-9 bg-navy px-4 flex-1 sm:flex-none"
          >
            <Plus className="h-4 w-4 mr-2" /> Adicionar
          </Button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
