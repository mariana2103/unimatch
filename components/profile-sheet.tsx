'use client'

import { useState, useCallback } from 'react'
import { Plus, Trash2, GraduationCap, MapPin, FileText, ShieldCheck, Calculator, ChevronDown, BookOpen } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { useUser } from '@/lib/user-context'
import { DISTRICTS, EXAM_SUBJECTS, CONTINGENTES, SUBJECTS_BY_YEAR } from '@/lib/data'
import type { SubjectGrade } from '@/lib/types'

interface ProfileSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function YearGradeEditor({
  year,
  label,
  grades,
  onGradesChange,
}: {
  year: string
  label: string
  grades: SubjectGrade[]
  onGradesChange: (grades: SubjectGrade[]) => void
}) {
  const [isOpen, setIsOpen] = useState(grades.length > 0)
  const subjects = SUBJECTS_BY_YEAR[year] || []
  const [selectedSubject, setSelectedSubject] = useState('')
  const [gradeInput, setGradeInput] = useState('')

  const addSubject = () => {
    const val = parseFloat(gradeInput)
    if (selectedSubject && !isNaN(val) && val >= 0 && val <= 200) {
      onGradesChange([...grades.filter(g => g.subject !== selectedSubject), { subject: selectedSubject, grade: val }])
      setSelectedSubject('')
      setGradeInput('')
    }
  }

  const removeSubject = (subject: string) => {
    onGradesChange(grades.filter(g => g.subject !== subject))
  }

  const average = grades.length > 0
    ? (grades.reduce((s, g) => s + g.grade, 0) / grades.length).toFixed(1)
    : null

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5 text-left transition-colors hover:bg-muted/50">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{label}</span>
          {grades.length > 0 && (
            <Badge variant="secondary" className="text-[10px]">
              {grades.length} disciplina{grades.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {average && <span className="text-xs font-semibold text-navy">{average} pts</span>}
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 flex flex-col gap-2 pl-1">
        {grades.map(g => (
          <div key={g.subject} className="flex items-center justify-between rounded-md border border-border/40 bg-card px-2.5 py-1.5">
            <span className="text-xs text-foreground">{g.subject}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold tabular-nums text-navy">{g.grade.toFixed(0)}</span>
              <button onClick={() => removeSubject(g.subject)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-3 w-3" />
                <span className="sr-only">Remover</span>
              </button>
            </div>
          </div>
        ))}
        <div className="flex items-end gap-2 rounded-md border border-dashed border-border/60 p-2">
          <div className="flex-1">
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Disciplina" />
              </SelectTrigger>
              <SelectContent>
                {subjects.filter(s => !grades.some(g => g.subject === s)).map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Input
            type="number" min={0} max={200} step={1}
            value={gradeInput} onChange={e => setGradeInput(e.target.value)}
            placeholder="0-200" className="h-8 w-20 text-xs"
          />
          <Button size="sm" onClick={addSubject} disabled={!selectedSubject || !gradeInput}
            className="h-8 bg-navy px-2 text-primary-foreground hover:bg-navy-light">
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

export function ProfileSheet({ open, onOpenChange }: ProfileSheetProps) {
  const {
    isLoggedIn, profile, updateProfile,
    setYearGrades, addExam, removeExam, toggleContingente,
  } = useUser()

  const [newExamCode, setNewExamCode] = useState('')
  const [newExamGrade, setNewExamGrade] = useState('')

  const handleAddExam = () => {
    const grade = parseFloat(newExamGrade)
    if (newExamCode && !isNaN(grade) && grade >= 0 && grade <= 200) {
      const subject = EXAM_SUBJECTS.find(s => s.code === newExamCode)
      if (subject) {
        addExam({ subjectCode: subject.code, subjectName: subject.name, grade })
        setNewExamCode('')
        setNewExamGrade('')
      }
    }
  }

  if (!isLoggedIn) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2 text-foreground">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy text-sm font-bold text-primary-foreground">
              {profile.name.charAt(0).toUpperCase()}
            </div>
            {profile.full_name}
          </SheetTitle>
          <SheetDescription>Gere os teus dados para simulacao de candidatura.</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-5 pb-8">
          {/* Distrito */}
          <section className="flex flex-col gap-2">
            <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" /> Distrito
            </Label>
            <Select value={profile.district} onValueChange={v => updateProfile({ district: v })}>
              <SelectTrigger><SelectValue placeholder="Seleciona o teu distrito" /></SelectTrigger>
              <SelectContent>
                {DISTRICTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </section>

          {/* Contingentes */}
          <section className="flex flex-col gap-2">
            <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5" /> Contingentes Especiais
            </Label>
            <div className="flex flex-col gap-1.5">
              {CONTINGENTES.map(c => (
                <label key={c.id} className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border/50 p-2.5 transition-colors hover:bg-muted/30">
                  <Checkbox
                    checked={profile.contingentes.includes(c.id)}
                    onCheckedChange={() => toggleContingente(c.id)}
                    className="mt-0.5"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-foreground">{c.label}</span>
                    <span className="text-[10px] leading-tight text-muted-foreground">{c.description}</span>
                  </div>
                </label>
              ))}
            </div>
          </section>

          {/* Year Grades - Media Calculation */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Calculator className="h-3.5 w-3.5" /> Notas do Secundario
              </Label>
              {profile.mediaSecundario > 0 && (
                <div className="flex items-center gap-1.5 rounded-full bg-navy/10 px-2.5 py-1">
                  <span className="text-[10px] font-medium text-muted-foreground">Media:</span>
                  <span className="text-xs font-bold text-navy">{profile.mediaSecundario.toFixed(1)}</span>
                </div>
              )}
            </div>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Introduz as notas de cada disciplina por ano. A media e calculada automaticamente incluindo o peso dos exames nacionais.
            </p>
            <div className="flex flex-col gap-2">
              <YearGradeEditor
                year="10" label="10.o Ano"
                grades={profile.yearGrades.ano10}
                onGradesChange={g => setYearGrades('ano10', g)}
              />
              <YearGradeEditor
                year="11" label="11.o Ano"
                grades={profile.yearGrades.ano11}
                onGradesChange={g => setYearGrades('ano11', g)}
              />
              <YearGradeEditor
                year="12" label="12.o Ano"
                grades={profile.yearGrades.ano12}
                onGradesChange={g => setYearGrades('ano12', g)}
              />
            </div>
          </section>

          {/* Exam Grades */}
          <section className="flex flex-col gap-3">
            <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <BookOpen className="h-3.5 w-3.5" /> Exames Nacionais
            </Label>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              As 2 melhores notas de exame contam para a media geral do secundario. Sao tambem usadas como provas de ingresso.
            </p>

            {profile.exams.length > 0 && (
              <div className="flex flex-col gap-1.5">
                {profile.exams.map(exam => (
                  <div key={exam.subjectCode} className="flex items-center justify-between rounded-md border border-border/40 bg-card px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-[10px]">{exam.subjectCode}</Badge>
                      <span className="text-xs text-foreground">{exam.subjectName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold tabular-nums text-navy">{exam.grade.toFixed(1)}</span>
                      <button onClick={() => removeExam(exam.subjectCode)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3 w-3" />
                        <span className="sr-only">Remover</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-end gap-2 rounded-lg border border-dashed border-border/60 p-2.5">
              <div className="flex-1">
                <Select value={newExamCode} onValueChange={setNewExamCode}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Exame" /></SelectTrigger>
                  <SelectContent>
                    {EXAM_SUBJECTS.filter(s => !profile.exams.some(e => e.subjectCode === s.code)).map(s => (
                      <SelectItem key={s.code} value={s.code}>{s.code} {s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input type="number" min={0} max={200} step={0.1} value={newExamGrade}
                onChange={e => setNewExamGrade(e.target.value)} placeholder="0-200" className="h-8 w-20 text-xs" />
              <Button size="sm" onClick={handleAddExam} disabled={!newExamCode || !newExamGrade}
                className="h-8 gap-1 bg-navy px-2.5 text-primary-foreground hover:bg-navy-light">
                <Plus className="h-3.5 w-3.5" />
                <span className="text-xs">Adicionar</span>
              </Button>
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  )
}
