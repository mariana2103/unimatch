'use client'

import { useState, useTransition, useMemo } from 'react'
import { Plus, Trash2, ChevronDown, TrendingUp, AlertCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { getSubjectsByYear } from '@/lib/education-logic'
import { calculateCFA } from '@/lib/data'
import { useUser } from '@/lib/user-context'
import type { UserGrade } from '@/lib/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface YearSectionProps {
  year: 10 | 11 | 12
  /** All grades for ALL years – the component filters by year internally */
  allGrades: UserGrade[]
  /** Course group drives which subjects are available (e.g. 'CIENCIAS') */
  courseGroup: string
  /** Optional: read-only mode (e.g. when viewing another user's profile) */
  readOnly?: boolean
}

// ─── Grade pill ───────────────────────────────────────────────────────────────

function GradePill({ grade }: { grade: number }) {
  const color = grade < 10
    ? 'bg-red-50 text-red-700 border-red-200'
    : 'bg-muted text-foreground border-border/60'

  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-sm font-bold ${color}`}>
      {grade}
    </span>
  )
}

// ─── Single grade row ─────────────────────────────────────────────────────────

interface GradeRowProps {
  grade: UserGrade
  onRemove: (id: string) => void
  isPending: boolean
  readOnly: boolean
}

function GradeRow({ grade, onRemove, isPending, readOnly }: GradeRowProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-white border border-border/40 rounded-lg shadow-sm">
      <span className="text-sm font-medium text-foreground truncate pr-2">
        {grade.subject_name}
      </span>
      <div className="flex items-center gap-3 shrink-0">
        <GradePill grade={grade.grade} />
        {!readOnly && (
          <button
            onClick={() => onRemove(grade.id)}
            disabled={isPending}
            aria-label={`Remover ${grade.subject_name}`}
            className="text-muted-foreground hover:text-destructive disabled:opacity-40 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}

// ─── CFA summary badge ────────────────────────────────────────────────────────

function CFASummary({ allGrades, courseGroup }: { allGrades: UserGrade[]; courseGroup: string }) {
  const cfa = useMemo(() => {
    if (!allGrades || allGrades.length === 0) return null

    const bySubject = allGrades.reduce<Record<string, { name: string; grades: { year: number; grade: number }[] }>>(
      (acc, g) => {
        if (!acc[g.subject_name]) {
          acc[g.subject_name] = { name: g.subject_name, grades: [] }
        }
        acc[g.subject_name].grades.push({ year: g.year_level, grade: g.grade })
        return acc
      },
      {}
    )

    return calculateCFA(Object.values(bySubject), courseGroup)
  }, [allGrades, courseGroup])

  if (cfa === null || cfa === 0) return null

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 rounded-full bg-navy/10 px-3 py-1 text-navy cursor-default">
            <TrendingUp className="h-3.5 w-3.5" />
            <span className="text-xs font-bold">CFA {cfa.toFixed(1)}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs">
          Classificação Final de Curso (média aritmética das CFDs arredondadas)
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// ─── Add grade form ───────────────────────────────────────────────────────────

interface AddGradeFormProps {
  availableSubjects: string[]
  isPending: boolean
  onAdd: (subject: string, grade: number) => void
}

function AddGradeForm({ availableSubjects, isPending, onAdd }: AddGradeFormProps) {
  const [selectedSubject, setSelectedSubject] = useState('')
  const [gradeInput, setGradeInput] = useState('')

  const gradeValue = parseFloat(gradeInput)
  const isGradeValid = !isNaN(gradeValue) && gradeValue >= 0 && gradeValue <= 20
  const canSubmit = selectedSubject && isGradeValid && !isPending

  const handleAdd = () => {
    if (!canSubmit) return
    onAdd(selectedSubject, gradeValue)
    setSelectedSubject('')
    setGradeInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd()
  }

  return (
    <div className="flex flex-wrap gap-2 p-3 bg-muted/20 rounded-lg border border-dashed">
      <Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={isPending}>
        <SelectTrigger className="h-9 w-full sm:flex-1 bg-white text-xs">
          <SelectValue placeholder="Disciplina..." />
        </SelectTrigger>
        <SelectContent>
          {availableSubjects.length === 0 ? (
            <div className="py-3 px-2 text-center text-xs text-muted-foreground">
              Todas as disciplinas adicionadas
            </div>
          ) : (
            availableSubjects.map((s) => (
              <SelectItem key={s} value={s} className="text-sm">{s}</SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      <div className="relative">
        <Input
          type="number"
          placeholder="0–20"
          min={0}
          max={20}
          step={0.1}
          className="h-9 w-24 bg-white text-xs pr-1"
          value={gradeInput}
          onChange={(e) => setGradeInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isPending}
        />
        {gradeInput && !isGradeValid && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertCircle className="absolute right-2 top-2.5 h-4 w-4 text-destructive" />
              </TooltipTrigger>
              <TooltipContent className="text-xs">Nota deve ser entre 0 e 20</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      <Button
        onClick={handleAdd}
        disabled={!canSubmit}
        className="h-9 bg-navy px-4 flex-1 sm:flex-none disabled:opacity-50"
      >
        <Plus className="h-4 w-4 mr-2" />
        Adicionar
      </Button>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function YearSection({
  year,
  allGrades,
  courseGroup,
  readOnly = false,
}: YearSectionProps) {
  const { addGrade, removeGrade } = useUser()
  const [isOpen, setIsOpen] = useState(true)
  const [isPending, startTransition] = useTransition()

  const yearGrades = useMemo(
    () => (allGrades ?? []).filter((g) => g.year_level === year),
    [allGrades, year]
  )

  const availableSubjects = useMemo(() => {
    const all = getSubjectsByYear(String(year), courseGroup)
    const added = new Set(yearGrades.map((g) => g.subject_name))
    return all.filter((s) => !added.has(s))
  }, [year, courseGroup, yearGrades])

  const yearAvg = useMemo(() => {
    if (yearGrades.length === 0) return null
    const sum = yearGrades.reduce((acc, g) => acc + g.grade, 0)
    return Math.round((sum / yearGrades.length) * 10) / 10
  }, [yearGrades])

  const handleAdd = (subject: string, grade: number) => {
    startTransition(async () => {
      await addGrade(subject, grade, year)
    })
  }

  const handleRemove = (gradeId: string) => {
    startTransition(async () => {
      await removeGrade(gradeId)
    })
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      {/* ── Header ── */}
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-xl border border-border/40 bg-card p-4 hover:bg-muted/30 transition-all">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy/10 text-navy font-bold text-xs">
            {year}º
          </div>
          <span className="font-semibold text-foreground">{year}.º Ano</span>

          {yearGrades.length > 0 && (
            <Badge className="bg-navy/10 text-navy border-none text-[10px] font-semibold">
              {yearGrades.length} disc.
            </Badge>
          )}

          {yearAvg !== null && (
            <Badge
              className={`border-none text-[10px] font-bold ${
                yearAvg < 10
                  ? 'bg-red-100 text-red-700'
                  : 'bg-navy text-white'
              }`}
            >
              Média {yearAvg}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {year === 12 && <CFASummary allGrades={allGrades} courseGroup={courseGroup} />}
          <ChevronDown
            className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </CollapsibleTrigger>

      {/* ── Content ── */}
      <CollapsibleContent className="mt-3 space-y-3 px-2">
        {yearGrades.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-4">
            Nenhuma disciplina adicionada para o {year}.º ano.
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {yearGrades.map((g) => (
              <GradeRow
                key={g.id}
                grade={g}
                onRemove={handleRemove}
                isPending={isPending}
                readOnly={readOnly}
              />
            ))}
          </div>
        )}

        {!readOnly && (
          <AddGradeForm
            availableSubjects={availableSubjects}
            isPending={isPending}
            onAdd={handleAdd}
          />
        )}
      </CollapsibleContent>
    </Collapsible>
  )
}
