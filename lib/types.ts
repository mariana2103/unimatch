export interface SubjectGrade {
  subject: string
  grade: number
}

export interface YearGrades {
  ano10: SubjectGrade[]
  ano11: SubjectGrade[]
  ano12: SubjectGrade[]
}

export interface ExamGrade {
  subjectCode: string
  subjectName: string
  grade: number
}

export interface UserProfile {
  name: string
  yearGrades: YearGrades
  mediaSecundario: number
  exams: ExamGrade[]
  district: string
  contingentes: string[]
}

export interface Course {
  id: string
  name: string
  university: string
  district: string
  area: string
  tipo: 'publica' | 'privada'
  provasIngresso: { code: string; name: string; weight: number }[]
  pesoSecundario: number
  pesoExame: number
  notaMinima: number
  notaUltimoColocado: number
  vagas: number
  historico: { year: number; nota: number }[]
  contingentes?: Record<string, number>
}

export interface ComparisonPair {
  courseA: Course | null
  courseB: Course | null
}

export interface DGESPhase {
  phase: string
  title: string
  startDate: string
  endDate: string
  description: string
}
