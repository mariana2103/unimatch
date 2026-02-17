'use client'

import { useState } from 'react'
import { Plus, Trash2, MapPin, ShieldCheck, Calculator, ChevronDown, BookOpen } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useUser } from '@/lib/user-context'
import { DISTRICTS, EXAM_SUBJECTS, CONTINGENTES, SUBJECTS_BY_YEAR } from '@/lib/data'
import { UserAvatar } from './user-avatar'

function YearSection({ year, label, grades, onAdd, onRemove }: any) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState('')
  const [gradeInput, setGradeInput] = useState('')

  const yearGrades = grades.filter((g: any) => g.year_level === year)
  const availableSubjects = (SUBJECTS_BY_YEAR[year] || []).filter(s => !yearGrades.some((g: any) => g.subject_name === s))

  const handleAdd = () => {
    const val = parseFloat(gradeInput)
    if (selectedSubject && !isNaN(val)) {
      onAdd(selectedSubject, val, year)
      setSelectedSubject('')
      setGradeInput('')
    }
  }

  const average = yearGrades.length > 0
    ? (yearGrades.reduce((s: number, g: any) => s + g.grade, 0) / yearGrades.length).toFixed(1)
    : null

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5 hover:bg-muted/50 transition-all">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{label}</span>
          {yearGrades.length > 0 && <Badge className="bg-navy/10 text-navy hover:bg-navy/10 text-[10px]">{yearGrades.length}</Badge>}
        </div>
        <div className="flex items-center gap-2">
          {average && <span className="text-xs font-bold text-navy">{average} pts</span>}
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 space-y-2 pl-4 border-l-2 border-muted">
        {yearGrades.map((g: any) => (
          <div key={g.id} className="flex items-center justify-between text-xs p-2 bg-card border rounded-md">
            <span>{g.subject_name}</span>
            <div className="flex items-center gap-3">
              <span className="font-bold text-navy">{g.grade}</span>
              <button onClick={() => onRemove(g.id)}><Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" /></button>
            </div>
          </div>
        ))}
        <div className="flex gap-2 pt-1">
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="h-8 text-[11px]"><SelectValue placeholder="Disciplina" /></SelectTrigger>
            <SelectContent>{availableSubjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
          <Input type="number" placeholder="0-20" className="h-8 w-16 text-xs" value={gradeInput} onChange={e => setGradeInput(e.target.value)} />
          <Button size="sm" onClick={handleAdd} className="h-8 bg-navy px-2"><Plus className="h-4 w-4" /></Button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

export function ProfileSheet({ open, onOpenChange }: { open: boolean, onOpenChange: (o: boolean) => void }) {
  const { isLoggedIn, profile, grades, exams, updateProfile, addGrade, removeGrade, addExam, removeExam } = useUser()
  const [newExamCode, setNewExamCode] = useState('')
  const [newExamGrade, setNewExamGrade] = useState('')

  if (!isLoggedIn || !profile) return null
  const firstName = profile.full_name?.split(' ')[0] || 'Utilizador'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader className="flex flex-row items-center gap-4 pb-6 border-b">
          <UserAvatar className="h-12 w-12 border-2 border-navy/10" />
          <div className="text-left">
            <SheetTitle className="text-xl font-bold text-navy">{firstName}</SheetTitle>
            <SheetDescription className="text-xs">Gere o teu perfil e notas.</SheetDescription>
          </div>
        </SheetHeader>

        <div className="flex flex-col gap-8 py-6">
          <section className="space-y-3">
            <Label className="flex items-center gap-2 text-[10px] font-bold uppercase text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> Distrito</Label>
            <Select value={profile.distrito_residencia || ""} onValueChange={v => updateProfile({ distrito_residencia: v })}>
              <SelectTrigger><SelectValue placeholder="Seleciona o teu distrito" /></SelectTrigger>
              <SelectContent>{DISTRICTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
            </Select>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-[10px] font-bold uppercase text-muted-foreground"><Calculator className="h-3.5 w-3.5" /> Notas Internas</Label>
              <Badge className="bg-navy font-bold">{profile.media_final_calculada || 0} pts</Badge>
            </div>
            <div className="grid gap-2">
              {[10, 11, 12].map((y) => (
                <YearSection key={y} year={y} label={`${y}.º Ano`} grades={grades} 
                  onAdd={(s: string, g: number, yr: 10|11|12) => addGrade(s, g, yr)} 
                  onRemove={(id: string) => removeGrade(id)} 
                />
              ))}
            </div>
          </section>

          <section className="space-y-4 pb-10">
            <Label className="flex items-center gap-2 text-[10px] font-bold uppercase text-muted-foreground"><BookOpen className="h-3.5 w-3.5" /> Exames</Label>
            <div className="grid gap-2">
              {exams.map((e: any) => (
                <div key={e.id} className="flex items-center justify-between p-2.5 bg-muted/30 rounded-lg border border-border/40">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono text-muted-foreground">{e.exam_code}</span>
                    <span className="text-xs font-medium">{EXAM_SUBJECTS.find(s => s.code === e.exam_code)?.name || e.exam_code}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-navy">{e.grade}</span>
                    <button onClick={() => removeExam(e.id)}><Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" /></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-2 border-dashed rounded-xl space-y-3">
              <Select value={newExamCode} onValueChange={setNewExamCode}>
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Escolher Exame..." /></SelectTrigger>
                <SelectContent>{EXAM_SUBJECTS.map(s => <SelectItem key={s.code} value={s.code}>{s.name} ({s.code})</SelectItem>)}</SelectContent>
              </Select>
              <div className="flex gap-2">
                <Input type="number" placeholder="Nota (0-200)" className="h-9 text-xs" value={newExamGrade} onChange={ev => setNewExamGrade(ev.target.value)} />
                <Button onClick={() => {
                  const g = parseFloat(newExamGrade);
                  if (newExamCode && !isNaN(g)) { addExam({ exam_code: newExamCode, grade: g, exam_year: 2025 }); setNewExamCode(''); setNewExamGrade(''); }
                }} className="bg-navy h-9 px-4 gap-2 flex-1"><Plus className="h-4 w-4" /> Adicionar</Button>
              </div>
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  )
}