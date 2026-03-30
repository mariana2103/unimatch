
import type { UserExam, ExamTipo } from './types'

/**
 * Returns the best valid exam grade per exam code for the given candidacy phase/year.
 *
 * Validity rules (Guia Geral de Exames 2025 / Deliberação 1043/2021):
 *  - 1ª fase candidacy: only fase 1 exams; valid for 4 years (candidacyYear − 3 to candidacyYear)
 *  - 2ª fase candidacy: fase 1 exams (4-year window) + fase 2 exams (5-year window: candidacyYear − 4)
 * When a student has multiple valid entries for the same exam code, the highest grade is used (p. 38).
 */
export function filterValidExams(
  userExams: UserExam[],
  candidacyPhase: 1 | 2,
  candidacyYear = new Date().getFullYear(),
): { subjectCode: string; grade: number }[] {
  const valid = userExams.filter(e => {
    if (candidacyPhase === 1 && e.fase === 2) return false
    const minYear = e.fase === 2 ? candidacyYear - 4 : candidacyYear - 3
    return e.exam_year >= minYear && e.exam_year <= candidacyYear
  })

  // Group by exam code — keep only the best (highest) grade
  const bestByCode = new Map<string, number>()
  for (const e of valid) {
    const cur = bestByCode.get(e.exam_code) ?? -1
    if (e.grade > cur) bestByCode.set(e.exam_code, e.grade)
  }

  return Array.from(bestByCode.entries()).map(([subjectCode, grade]) => ({ subjectCode, grade }))
}

// Mapping: exam code → subject name as stored in user_grades
// 2026 rule: all mandatory exams use CFD = (7.5 × CIF + 2.5 × CE) / 10  (75% / 25%)
const EXAM_TO_SUBJECT: Record<string, string> = {
  '01': 'Alemão',
  '02': 'Biologia e Geologia',
  '03': 'Desenho A',
  '04': 'Grego',
  '05': 'Espanhol',
  '06': 'Filosofia',
  '07': 'Física e Química A',
  '08': 'Francês',
  '09': 'Geografia A',
  '10': 'Geometria Descritiva A',
  '11': 'História A',
  '12': 'História da Cultura e das Artes',
  '13': 'Inglês',
  '14': 'Latim A',
  '15': 'Literatura Portuguesa',
  '17': 'Matemática Aplicada às Ciências Sociais (MACS)',
  '18': 'Português',
  '19': 'Matemática A',
  '20': 'Italiano',
  '21': 'Mandarim',
}

interface SubjectGrade {
  name: string;
  grades: { year: number; grade: number }[];
}

export function calculateCFA(
  subjects: SubjectGrade[] = [],
  courseGroup: string,
  mediaProfissional?: number,
  examGrades?: { examCode: string; grade: number; tipo?: ExamTipo }[] // grade on 0–200 scale
): number {
  if (courseGroup === 'PROFISSIONAL') {
    return mediaProfissional || 0;
  }

  if (!subjects || subjects.length === 0) return 0;

  // Only obrigatorio and melhoria exams affect the CFC.
  // prova_ingresso exams are excluded — they're used only for admission, not for the school average.
  // For each subject, take the best CE among its obrigatorio + melhoria entries.
  const examBySubject: Record<string, number> = {} // subject name → best CE on 0-20 scale
  if (examGrades) {
    for (const eg of examGrades) {
      if (eg.tipo === 'prova_ingresso') continue
      const subjectName = EXAM_TO_SUBJECT[eg.examCode]
      if (!subjectName) continue
      const ce = eg.grade / 10
      if (examBySubject[subjectName] === undefined || ce > examBySubject[subjectName]) {
        examBySubject[subjectName] = ce
      }
    }
  }

  const cfds = subjects.map(subject => {
    const validGrades = subject.grades || [];
    if (validGrades.length === 0) return 0;

    // CIF = average of internal year grades (0-20 scale, kept as float)
    const cif = validGrades.reduce((acc, curr) => acc + curr.grade, 0) / validGrades.length;

    const ce = examBySubject[subject.name]
    if (ce !== undefined) {
      // 2026 rule: CFD = 75% CIF + 25% CE for all mandatory exams
      return (7.5 * cif + 2.5 * ce) / 10
    }

    return cif;
  });

  const validCfds = cfds.filter(v => v > 0);
  if (validCfds.length === 0) return 0;

  const totalSum = validCfds.reduce((acc, val) => acc + val, 0);
  return Math.round((totalSum / validCfds.length) * 10) / 10;
}

export function calculateAdmissionGrade(
  mediaSecundario: number,
  userExams: { subjectCode: string; grade: number }[] = [],
  course: any
): { grade: number; meetsMinimum: boolean; hasRequiredExams: boolean } {
  const safeUserExams = userExams || []
  const safeProvas: Array<{ code: string; weight: number; conjunto_id: number }> =
    course?.provasIngresso || []

  const ms200    = (mediaSecundario || 0) * 10
  const pesoSec  = course.pesoSecundario ?? 0.5
  const notaMin  = course.notaMinima     ?? 95

  // No exam requirements — grade is purely based on média
  if (safeProvas.length === 0) {
    return { grade: ms200, meetsMinimum: ms200 >= notaMin, hasRequiredExams: true }
  }

  const pesoExam = course.pesoExame ?? 0.5

  // Group exams by conjunto_id (each conjunto is one valid alternative)
  const conjuntoMap = new Map<number, Array<{ code: string; weight: number }>>()
  for (const p of safeProvas) {
    const cid = p.conjunto_id ?? 1
    if (!conjuntoMap.has(cid)) conjuntoMap.set(cid, [])
    conjuntoMap.get(cid)!.push({ code: p.code, weight: p.weight })
  }

  let bestGrade        = -1
  let bestMeetsMin     = false
  let hasRequiredExams = false

  for (const exams of conjuntoMap.values()) {
    // User must hold every exam in this conjunto
    const userHasAll = exams.every(e =>
      safeUserExams.some(u => u.subjectCode === e.code)
    )
    if (!userHasAll) continue

    hasRequiredExams = true

    // Normalize weights within this conjunto (guards against absolute vs relative storage)
    const totalWeight = exams.reduce((s, e) => s + e.weight, 0) || 1
    const examComponent = exams.reduce((sum, e) => {
      // Pick highest grade if multiple entries share the same code
      const candidates = safeUserExams.filter(u => u.subjectCode === e.code)
      const best = candidates.reduce((hi, u) => u.grade > hi.grade ? u : hi)
      return sum + best.grade * (e.weight / totalWeight)
    }, 0)

    const finalGrade = Math.round((ms200 * pesoSec + examComponent * pesoExam) * 10) / 10

    const meetsMin =
      ms200 >= notaMin &&
      exams.every(e => {
        const u = safeUserExams.find(u => u.subjectCode === e.code)!
        return u.grade >= notaMin
      })

    if (finalGrade > bestGrade) {
      bestGrade    = finalGrade
      bestMeetsMin = meetsMin
    }
  }

  if (!hasRequiredExams) {
    return { grade: 0, meetsMinimum: false, hasRequiredExams: false }
  }

  return { grade: bestGrade, meetsMinimum: bestMeetsMin, hasRequiredExams: true }
}
