import type { Course, DGESPhase } from './types'

export const DISTRICTS = [
  'Aveiro', 'Beja', 'Braga', 'Braganca', 'Castelo Branco',
  'Coimbra', 'Evora', 'Faro', 'Guarda', 'Leiria',
  'Lisboa', 'Portalegre', 'Porto', 'Santarem',
  'Setubal', 'Viana do Castelo', 'Vila Real', 'Viseu',
  'Acores', 'Madeira'
]

export const CONTINGENTES = [
  { id: 'acores', label: 'Acores', description: 'Residente na Regiao Autonoma dos Acores' },
  { id: 'madeira', label: 'Madeira', description: 'Residente na Regiao Autonoma da Madeira' },
  { id: 'pref_regional', label: 'Preferencia Regional', description: 'Candidatos com preferencia regional ao distrito da instituicao' },
  { id: 'atleta', label: 'Atleta de Alta Competicao', description: 'Praticante desportivo de alta competicao reconhecido pelo IPDJ' },
  { id: 'militar', label: 'Militar', description: 'Militares em regime de contrato ou voluntariado' },
  { id: 'emigrante', label: 'Emigrante', description: 'Candidatos emigrantes ou filhos de emigrantes portugueses' },
  { id: 'deficiente', label: 'Portador de Deficiencia', description: 'Candidatos portadores de deficiencia fisica ou sensorial' },
  { id: 'stp', label: 'S. Tome e Principe / Timor-Leste', description: 'Naturais e nacionais de S. Tome e Principe ou Timor-Leste' },
]

export const EXAM_SUBJECTS = [
  { code: '01', name: 'Alemao' },
  { code: '02', name: 'Biologia e Geologia' },
  { code: '06', name: 'Desenho A' },
  { code: '07', name: 'Economia A' },
  { code: '09', name: 'Filosofia' },
  { code: '11', name: 'Fisica e Quimica A' },
  { code: '12', name: 'Frances' },
  { code: '14', name: 'Geografia A' },
  { code: '15', name: 'Geometria Descritiva A' },
  { code: '16', name: 'Historia A' },
  { code: '17', name: 'Hist. da Cultura e das Artes' },
  { code: '18', name: 'Ingles' },
  { code: '19', name: 'Matematica A' },
  { code: '20', name: 'MACS' },
  { code: '24', name: 'Portugues' },
]

export const AREAS = [
  'Engenharia',
  'Saude',
  'Ciencias',
  'Economia e Gestao',
  'Artes',
  'Direito e Ciencias Sociais',
  'Educacao',
  'Informatica',
]

export const SUBJECTS_BY_YEAR: Record<string, string[]> = {
  '10': [
    'Portugues', 'Matematica A', 'Filosofia', 'Educacao Fisica',
    'Fisica e Quimica A', 'Biologia e Geologia', 'Economia A',
    'Historia A', 'Geografia A', 'Ingles', 'Desenho A',
    'Geometria Descritiva A', 'Historia da Cultura e das Artes',
  ],
  '11': [
    'Portugues', 'Matematica A', 'Filosofia', 'Educacao Fisica',
    'Fisica e Quimica A', 'Biologia e Geologia', 'Economia A',
    'Historia A', 'Geografia A', 'Ingles', 'Desenho A',
    'Geometria Descritiva A', 'Historia da Cultura e das Artes',
  ],
  '12': [
    'Portugues', 'Matematica A', 'Educacao Fisica',
    'Biologia', 'Fisica', 'Quimica', 'Geologia',
    'Aplicacoes Informaticas B', 'Sociologia', 'Psicologia B',
    'Direito', 'Economia C',
  ],
}

export const COURSES: Course[] = [
  {
    id: 'eng-info-up',
    name: 'Engenharia Informatica e Computacao',
    university: 'Universidade do Porto - FEUP',
    district: 'Porto',
    area: 'Engenharia',
    tipo: 'publica',
    provasIngresso: [
      { code: '19', name: 'Matematica A', weight: 0.5 },
      { code: '11', name: 'Fisica e Quimica A', weight: 0.5 },
    ],
    pesoSecundario: 0.50,
    pesoExame: 0.50,
    notaMinima: 95,
    notaUltimoColocado: 178.5,
    vagas: 195,
    historico: [
      { year: 2023, nota: 175.2 },
      { year: 2024, nota: 176.8 },
      { year: 2025, nota: 178.5 },
    ],
    contingentes: { acores: 170.0, madeira: 172.3, pref_regional: 174.0, atleta: 160.0 },
  },
  {
    id: 'medicina-ul',
    name: 'Medicina',
    university: 'Universidade de Lisboa - FMUL',
    district: 'Lisboa',
    area: 'Saude',
    tipo: 'publica',
    provasIngresso: [
      { code: '02', name: 'Biologia e Geologia', weight: 0.5 },
      { code: '11', name: 'Fisica e Quimica A', weight: 0.5 },
    ],
    pesoSecundario: 0.50,
    pesoExame: 0.50,
    notaMinima: 95,
    notaUltimoColocado: 190.2,
    vagas: 340,
    historico: [
      { year: 2023, nota: 188.5 },
      { year: 2024, nota: 189.1 },
      { year: 2025, nota: 190.2 },
    ],
    contingentes: { acores: 183.0, madeira: 185.5, pref_regional: 186.0, atleta: 175.0 },
  },
  {
    id: 'arq-uc',
    name: 'Arquitectura',
    university: 'Universidade de Coimbra - FCTUC',
    district: 'Coimbra',
    area: 'Artes',
    tipo: 'publica',
    provasIngresso: [
      { code: '06', name: 'Desenho A', weight: 0.5 },
      { code: '19', name: 'Matematica A', weight: 0.5 },
    ],
    pesoSecundario: 0.65,
    pesoExame: 0.35,
    notaMinima: 95,
    notaUltimoColocado: 156.3,
    vagas: 60,
    historico: [
      { year: 2023, nota: 152.1 },
      { year: 2024, nota: 154.7 },
      { year: 2025, nota: 156.3 },
    ],
    contingentes: { acores: 148.0, madeira: 150.2, pref_regional: 151.0, atleta: 140.0 },
  },
  {
    id: 'direito-ul',
    name: 'Direito',
    university: 'Universidade de Lisboa - FDUL',
    district: 'Lisboa',
    area: 'Direito e Ciencias Sociais',
    tipo: 'publica',
    provasIngresso: [
      { code: '16', name: 'Historia A', weight: 0.5 },
      { code: '24', name: 'Portugues', weight: 0.5 },
    ],
    pesoSecundario: 0.50,
    pesoExame: 0.50,
    notaMinima: 95,
    notaUltimoColocado: 172.8,
    vagas: 480,
    historico: [
      { year: 2023, nota: 170.1 },
      { year: 2024, nota: 171.5 },
      { year: 2025, nota: 172.8 },
    ],
    contingentes: { acores: 165.0, madeira: 167.3, pref_regional: 168.0, atleta: 155.0 },
  },
  {
    id: 'econ-nova',
    name: 'Economia',
    university: 'Universidade Nova de Lisboa - Nova SBE',
    district: 'Lisboa',
    area: 'Economia e Gestao',
    tipo: 'publica',
    provasIngresso: [
      { code: '19', name: 'Matematica A', weight: 0.7 },
      { code: '07', name: 'Economia A', weight: 0.3 },
    ],
    pesoSecundario: 0.50,
    pesoExame: 0.50,
    notaMinima: 95,
    notaUltimoColocado: 175.0,
    vagas: 250,
    historico: [
      { year: 2023, nota: 172.3 },
      { year: 2024, nota: 173.8 },
      { year: 2025, nota: 175.0 },
    ],
    contingentes: { acores: 168.0, madeira: 170.5, pref_regional: 171.0, atleta: 158.0 },
  },
  {
    id: 'eng-civil-ist',
    name: 'Engenharia Civil',
    university: 'Instituto Superior Tecnico - ULisboa',
    district: 'Lisboa',
    area: 'Engenharia',
    tipo: 'publica',
    provasIngresso: [
      { code: '19', name: 'Matematica A', weight: 0.5 },
      { code: '11', name: 'Fisica e Quimica A', weight: 0.5 },
    ],
    pesoSecundario: 0.50,
    pesoExame: 0.50,
    notaMinima: 95,
    notaUltimoColocado: 155.7,
    vagas: 150,
    historico: [
      { year: 2023, nota: 150.2 },
      { year: 2024, nota: 153.1 },
      { year: 2025, nota: 155.7 },
    ],
    contingentes: { acores: 147.0, madeira: 149.8, pref_regional: 150.0, atleta: 138.0 },
  },
  {
    id: 'bio-ua',
    name: 'Biologia',
    university: 'Universidade de Aveiro',
    district: 'Aveiro',
    area: 'Ciencias',
    tipo: 'publica',
    provasIngresso: [
      { code: '02', name: 'Biologia e Geologia', weight: 1.0 },
    ],
    pesoSecundario: 0.65,
    pesoExame: 0.35,
    notaMinima: 95,
    notaUltimoColocado: 142.5,
    vagas: 45,
    historico: [
      { year: 2023, nota: 138.0 },
      { year: 2024, nota: 140.2 },
      { year: 2025, nota: 142.5 },
    ],
    contingentes: { acores: 134.0, madeira: 136.5, pref_regional: 137.0, atleta: 125.0 },
  },
  {
    id: 'eng-mec-um',
    name: 'Engenharia Mecanica',
    university: 'Universidade do Minho',
    district: 'Braga',
    area: 'Engenharia',
    tipo: 'publica',
    provasIngresso: [
      { code: '19', name: 'Matematica A', weight: 0.5 },
      { code: '11', name: 'Fisica e Quimica A', weight: 0.5 },
    ],
    pesoSecundario: 0.50,
    pesoExame: 0.50,
    notaMinima: 95,
    notaUltimoColocado: 152.0,
    vagas: 80,
    historico: [
      { year: 2023, nota: 148.5 },
      { year: 2024, nota: 150.3 },
      { year: 2025, nota: 152.0 },
    ],
    contingentes: { acores: 144.0, madeira: 146.5, pref_regional: 147.0, atleta: 135.0 },
  },
  {
    id: 'psicologia-up',
    name: 'Psicologia',
    university: 'Universidade do Porto - FPCEUP',
    district: 'Porto',
    area: 'Ciencias',
    tipo: 'publica',
    provasIngresso: [
      { code: '02', name: 'Biologia e Geologia', weight: 0.5 },
      { code: '19', name: 'Matematica A', weight: 0.5 },
    ],
    pesoSecundario: 0.50,
    pesoExame: 0.50,
    notaMinima: 95,
    notaUltimoColocado: 165.0,
    vagas: 120,
    historico: [
      { year: 2023, nota: 161.5 },
      { year: 2024, nota: 163.2 },
      { year: 2025, nota: 165.0 },
    ],
    contingentes: { acores: 158.0, madeira: 160.5, pref_regional: 161.0, atleta: 148.0 },
  },
  {
    id: 'gestao-iseg',
    name: 'Gestao',
    university: 'ISEG - Universidade de Lisboa',
    district: 'Lisboa',
    area: 'Economia e Gestao',
    tipo: 'publica',
    provasIngresso: [
      { code: '19', name: 'Matematica A', weight: 0.5 },
      { code: '07', name: 'Economia A', weight: 0.5 },
    ],
    pesoSecundario: 0.50,
    pesoExame: 0.50,
    notaMinima: 95,
    notaUltimoColocado: 162.3,
    vagas: 200,
    historico: [
      { year: 2023, nota: 158.7 },
      { year: 2024, nota: 160.5 },
      { year: 2025, nota: 162.3 },
    ],
    contingentes: { acores: 155.0, madeira: 157.3, pref_regional: 158.0, atleta: 145.0 },
  },
  {
    id: 'educ-basica-uc',
    name: 'Educacao Basica',
    university: 'Universidade de Coimbra - FPCEUC',
    district: 'Coimbra',
    area: 'Educacao',
    tipo: 'publica',
    provasIngresso: [
      { code: '24', name: 'Portugues', weight: 0.5 },
      { code: '19', name: 'Matematica A', weight: 0.5 },
    ],
    pesoSecundario: 0.65,
    pesoExame: 0.35,
    notaMinima: 95,
    notaUltimoColocado: 138.0,
    vagas: 55,
    historico: [
      { year: 2023, nota: 133.5 },
      { year: 2024, nota: 135.8 },
      { year: 2025, nota: 138.0 },
    ],
    contingentes: { acores: 130.0, madeira: 132.5, pref_regional: 133.0, atleta: 120.0 },
  },
  {
    id: 'eng-elet-ist',
    name: 'Eng. Eletrotecnica e de Computadores',
    university: 'Instituto Superior Tecnico - ULisboa',
    district: 'Lisboa',
    area: 'Engenharia',
    tipo: 'publica',
    provasIngresso: [
      { code: '19', name: 'Matematica A', weight: 0.5 },
      { code: '11', name: 'Fisica e Quimica A', weight: 0.5 },
    ],
    pesoSecundario: 0.50,
    pesoExame: 0.50,
    notaMinima: 95,
    notaUltimoColocado: 168.3,
    vagas: 180,
    historico: [
      { year: 2023, nota: 164.0 },
      { year: 2024, nota: 166.2 },
      { year: 2025, nota: 168.3 },
    ],
    contingentes: { acores: 160.0, madeira: 162.5, pref_regional: 163.0, atleta: 150.0 },
  },
  {
    id: 'cs-info-um',
    name: 'Ciencias da Computacao',
    university: 'Universidade do Minho',
    district: 'Braga',
    area: 'Informatica',
    tipo: 'publica',
    provasIngresso: [
      { code: '19', name: 'Matematica A', weight: 1.0 },
    ],
    pesoSecundario: 0.50,
    pesoExame: 0.50,
    notaMinima: 95,
    notaUltimoColocado: 165.5,
    vagas: 75,
    historico: [
      { year: 2023, nota: 161.0 },
      { year: 2024, nota: 163.5 },
      { year: 2025, nota: 165.5 },
    ],
    contingentes: { acores: 158.0, madeira: 160.0, pref_regional: 161.0, atleta: 148.0 },
  },
  {
    id: 'enfermagem-uc',
    name: 'Enfermagem',
    university: 'Escola Superior de Enfermagem de Coimbra',
    district: 'Coimbra',
    area: 'Saude',
    tipo: 'publica',
    provasIngresso: [
      { code: '02', name: 'Biologia e Geologia', weight: 0.5 },
      { code: '11', name: 'Fisica e Quimica A', weight: 0.5 },
    ],
    pesoSecundario: 0.60,
    pesoExame: 0.40,
    notaMinima: 95,
    notaUltimoColocado: 163.8,
    vagas: 90,
    historico: [
      { year: 2023, nota: 159.2 },
      { year: 2024, nota: 161.5 },
      { year: 2025, nota: 163.8 },
    ],
    contingentes: { acores: 156.0, madeira: 158.3, pref_regional: 159.0, atleta: 146.0 },
  },
  {
    id: 'design-com-uba',
    name: 'Design de Comunicacao',
    university: 'Universidade de Belas Artes de Lisboa',
    district: 'Lisboa',
    area: 'Artes',
    tipo: 'publica',
    provasIngresso: [
      { code: '06', name: 'Desenho A', weight: 0.7 },
      { code: '17', name: 'Hist. da Cultura e das Artes', weight: 0.3 },
    ],
    pesoSecundario: 0.60,
    pesoExame: 0.40,
    notaMinima: 95,
    notaUltimoColocado: 158.5,
    vagas: 40,
    historico: [
      { year: 2023, nota: 153.0 },
      { year: 2024, nota: 155.8 },
      { year: 2025, nota: 158.5 },
    ],
    contingentes: { acores: 150.0, madeira: 152.5, pref_regional: 153.0, atleta: 140.0 },
  },
  {
    id: 'ciencias-pol-ul',
    name: 'Ciencia Politica',
    university: 'Universidade de Lisboa - ISCSP',
    district: 'Lisboa',
    area: 'Direito e Ciencias Sociais',
    tipo: 'publica',
    provasIngresso: [
      { code: '16', name: 'Historia A', weight: 0.5 },
      { code: '24', name: 'Portugues', weight: 0.5 },
    ],
    pesoSecundario: 0.50,
    pesoExame: 0.50,
    notaMinima: 95,
    notaUltimoColocado: 158.0,
    vagas: 70,
    historico: [
      { year: 2023, nota: 153.5 },
      { year: 2024, nota: 155.8 },
      { year: 2025, nota: 158.0 },
    ],
    contingentes: { acores: 150.0, madeira: 152.5, pref_regional: 153.0, atleta: 140.0 },
  },
  {
    id: 'gestao-privada-ucp',
    name: 'Gestao',
    university: 'Universidade Catolica Portuguesa',
    district: 'Lisboa',
    area: 'Economia e Gestao',
    tipo: 'privada',
    provasIngresso: [
      { code: '19', name: 'Matematica A', weight: 0.5 },
      { code: '07', name: 'Economia A', weight: 0.5 },
    ],
    pesoSecundario: 0.50,
    pesoExame: 0.50,
    notaMinima: 95,
    notaUltimoColocado: 155.0,
    vagas: 120,
    historico: [
      { year: 2023, nota: 150.0 },
      { year: 2024, nota: 152.5 },
      { year: 2025, nota: 155.0 },
    ],
    contingentes: {},
  },
  {
    id: 'medicina-dentaria-priv',
    name: 'Medicina Dentaria',
    university: 'Instituto Universitario Egas Moniz',
    district: 'Setubal',
    area: 'Saude',
    tipo: 'privada',
    provasIngresso: [
      { code: '02', name: 'Biologia e Geologia', weight: 0.5 },
      { code: '11', name: 'Fisica e Quimica A', weight: 0.5 },
    ],
    pesoSecundario: 0.55,
    pesoExame: 0.45,
    notaMinima: 95,
    notaUltimoColocado: 148.0,
    vagas: 80,
    historico: [
      { year: 2023, nota: 142.0 },
      { year: 2024, nota: 145.0 },
      { year: 2025, nota: 148.0 },
    ],
    contingentes: {},
  },
]

export const DGES_PHASES: DGESPhase[] = [
  {
    phase: '1.a Fase',
    title: 'Primeira Fase de Candidatura',
    startDate: '2026-07-20',
    endDate: '2026-08-07',
    description: 'Periodo principal de candidatura. Apresentacao de candidaturas e documentos necessarios.',
  },
  {
    phase: '2.a Fase',
    title: 'Segunda Fase de Candidatura',
    startDate: '2026-09-08',
    endDate: '2026-09-18',
    description: 'Candidaturas para vagas sobrantes e reclamacoes da 1.a fase.',
  },
  {
    phase: '3.a Fase',
    title: 'Terceira Fase de Candidatura',
    startDate: '2026-10-06',
    endDate: '2026-10-16',
    description: 'Ultima fase de candidatura para vagas remanescentes.',
  },
]

export function calculateMediaSecundario(
  yearGrades: { ano10: { grade: number }[]; ano11: { grade: number }[]; ano12: { grade: number }[] },
  exams: { grade: number }[]
): number {
  const allGrades = [
    ...yearGrades.ano10.map(g => g.grade),
    ...yearGrades.ano11.map(g => g.grade),
    ...yearGrades.ano12.map(g => g.grade),
  ]
  if (allGrades.length === 0) return 0

  const internalAvg = allGrades.reduce((sum, g) => sum + g, 0) / allGrades.length

  // 2 best exam grades count toward the general average
  if (exams.length >= 2) {
    const sorted = [...exams].sort((a, b) => b.grade - a.grade)
    const top2 = sorted.slice(0, 2)
    const examAvg = top2.reduce((sum, e) => sum + e.grade, 0) / 2
    // The general formula: 75% internal + 25% exams (simplified model)
    return Math.round((internalAvg * 0.7 + examAvg * 0.3) * 10) / 10
  }
  if (exams.length === 1) {
    return Math.round((internalAvg * 0.85 + exams[0].grade * 0.15) * 10) / 10
  }
  return Math.round(internalAvg * 10) / 10
}

export function calculateAdmissionGrade(
  mediaSecundario: number,
  exams: { subjectCode: string; grade: number }[],
  course: Course
): { grade: number; meetsMinimum: boolean; hasRequiredExams: boolean } {
  let examScore = 0
  let matchedExams = 0

  for (const prova of course.provasIngresso) {
    const userExam = exams.find(e => e.subjectCode === prova.code)
    if (userExam) {
      examScore += userExam.grade * prova.weight
      matchedExams++
    }
  }

  const hasRequiredExams = matchedExams === course.provasIngresso.length

  if (!hasRequiredExams) {
    return { grade: 0, meetsMinimum: false, hasRequiredExams: false }
  }

  const grade = (mediaSecundario * course.pesoSecundario) + (examScore * course.pesoExame)
  const roundedGrade = Math.round(grade * 10) / 10

  const meetsMinimum = mediaSecundario >= course.notaMinima &&
    exams.every(e => {
      const isRequired = course.provasIngresso.some(p => p.code === e.subjectCode)
      return !isRequired || e.grade >= course.notaMinima
    })

  return { grade: roundedGrade, meetsMinimum, hasRequiredExams }
}
