'use client'

import { useState } from 'react'
import { Plus, Trash2, MapPin, ShieldCheck, Calculator, ChevronDown, BookOpen } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useUser } from '@/lib/user-context'
import { DISTRICTS, EXAM_SUBJECTS, CONTINGENTES, SUBJECTS_BY_YEAR } from '@/lib/data'
import { UserAvatar } from './user-avatar'

function YearSection({ year, label, grades, onAdd, onRemove }: any) {
  const [isOpen, setIsOpen] = useState(true)
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

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-xl border border-border/40 bg-card p-4 hover:bg-muted/30 transition-all">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy/10 text-navy font-bold text-xs">{year}º</div>
          <span className="font-semibold text-foreground">{label}</span>
          {yearGrades.length > 0 && <Badge className="bg-navy text-white text-[10px]">{yearGrades.length}</Badge>}
        </div>
        <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </CollapsibleTrigger>
      
      <CollapsibleContent className="mt-3 space-y-3 px-2">
        <div className="grid gap-2 sm:grid-cols-2">
          {yearGrades.map((g: any) => (
            <div key={g.id} className="flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm">
              <span className="text-sm font-medium">{g.subject_name}</span>
              <div className="flex items-center gap-4">
                <span className="font-bold text-navy">{g.grade}</span>
                <button onClick={() => onRemove(g.id)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex flex-wrap gap-2 pt-2 bg-muted/20 p-3 rounded-lg border border-dashed">
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="h-9 w-full sm:flex-1 bg-white text-xs"><SelectValue placeholder="Disciplina" /></SelectTrigger>
            <SelectContent>{availableSubjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
          <Input type="number" placeholder="0-20" className="h-9 w-24 bg-white text-xs" value={gradeInput} onChange={e => setGradeInput(e.target.value)} />
          <Button onClick={handleAdd} className="h-9 bg-navy px-4 flex-1 sm:flex-none"><Plus className="h-4 w-4 mr-2" /> Adicionar</Button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

export function ProfileView() {
  const { isLoggedIn, profile, grades, exams, updateProfile, addGrade, removeGrade, addExam, removeExam } = useUser()
  const [newExamCode, setNewExamCode] = useState('')
  const [newExamGrade, setNewExamGrade] = useState('')

  if (!isLoggedIn || !profile) return (
    <div className="flex h-[60vh] items-center justify-center">
      <p className="text-muted-foreground">Por favor, faz login para veres o teu perfil.</p>
    </div>
  )

  return (
    <div className="mx-auto max-w-4xl py-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 flex flex-col md:flex-row items-center gap-6 p-6 bg-navy rounded-2xl text-white shadow-xl">
        <UserAvatar className="h-24 w-24 border-4 border-white/20" />
        <div className="text-center md:text-left">
          <h1 className="text-3xl font-bold">{profile.full_name}</h1>
          <p className="text-white/70 text-sm">{profile.email}</p>
          <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-2">
             <Badge className="bg-white/20 text-white hover:bg-white/30 border-none">{profile.distrito_residencia || 'Distrito não definido'}</Badge>
             <Badge className="bg-white/20 text-white hover:bg-white/30 border-none">Média: {profile.media_final_calculada || 0} pts</Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-1">
        {/* CONFIGURAÇÕES GERAIS */}
        <div className="grid gap-6 sm:grid-cols-2">
          <section className="space-y-3">
            <Label className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground"><MapPin className="h-4 w-4" /> Distrito de Residência</Label>
            <Select value={profile.distrito_residencia || ""} onValueChange={v => updateProfile({ distrito_residencia: v })}>
              <SelectTrigger className="h-11 shadow-sm"><SelectValue placeholder="Onde vives?" /></SelectTrigger>
              <SelectContent>{DISTRICTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
            </Select>
          </section>

          <section className="space-y-3">
            <Label className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground"><ShieldCheck className="h-4 w-4" /> Contingente Especial</Label>
            <Select value={profile.contingente_especial || "geral"} onValueChange={v => updateProfile({ contingente_especial: v })}>
              <SelectTrigger className="h-11 shadow-sm"><SelectValue /></SelectTrigger>
              <SelectContent>{CONTINGENTES.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}</SelectContent>
            </Select>
          </section>
        </div>

        {/* NOTAS INTERNAS */}
        <section className="space-y-4">
          <Label className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground"><Calculator className="h-4 w-4" /> Notas das Disciplinas (Secundário)</Label>
          <div className="grid gap-4">
            {[10, 11, 12].map((y) => (
              <YearSection key={y} year={y} label={`${y}.º Ano`} grades={grades} 
                onAdd={(s: string, g: number, yr: 10|11|12) => addGrade(s, g, yr)} 
                onRemove={(id: string) => removeGrade(id)} 
              />
            ))}
          </div>
        </section>

        {/* EXAMES NACIONAIS */}
        <section className="space-y-4 bg-muted/30 p-6 rounded-2xl border">
          <Label className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground"><BookOpen className="h-4 w-4" /> Exames e Provas de Ingresso</Label>
          <div className="grid gap-3 sm:grid-cols-2">
            {exams.map((e: any) => (
              <div key={e.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-border/40 shadow-sm">
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono text-muted-foreground">{e.exam_code}</span>
                  <span className="text-sm font-semibold">{EXAM_SUBJECTS.find(s => s.code === e.exam_code)?.name || e.exam_code}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-lg font-bold text-navy">{e.grade}</span>
                  <button onClick={() => removeExam(e.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-4 bg-white rounded-xl border-2 border-dashed flex flex-col sm:flex-row gap-3">
            <Select value={newExamCode} onValueChange={setNewExamCode}>
              <SelectTrigger className="h-10 flex-1"><SelectValue placeholder="Escolher Exame..." /></SelectTrigger>
              <SelectContent>{EXAM_SUBJECTS.map(s => <SelectItem key={s.code} value={s.code}>{s.name} ({s.code})</SelectItem>)}</SelectContent>
            </Select>
            <Input type="number" placeholder="Nota (0-200)" className="h-10 w-full sm:w-32" value={newExamGrade} onChange={ev => setNewExamGrade(ev.target.value)} />
            <Button onClick={() => {
              const g = parseFloat(newExamGrade);
              if (newExamCode && !isNaN(g)) { addExam({ exam_code: newExamCode, grade: g, exam_year: 2025 }); setNewExamCode(''); setNewExamGrade(''); }
            }} className="bg-navy h-10 px-6">Adicionar</Button>
          </div>
        </section>
      </div>
    </div>
  )
}