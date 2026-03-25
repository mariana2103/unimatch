
import type { UserExam } from './types'

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

// Mapping: exam code → subject name as stored in user_grades + exam year
// Year 11 exams use: CFD = (7.5 × CIF + 2.5 × CE) / 10  (Despacho normativo n.º 14-A/2023)
// Year 12 exams use: CFD = (7 × CIF + 3 × CE) / 10
const EXAM_TO_SUBJECT: Record<string, { subjectName: string; examYear: 11 | 12 }> = {
  '01': { subjectName: 'Alemão',                                         examYear: 11 },
  '02': { subjectName: 'Biologia e Geologia',                            examYear: 11 },
  '03': { subjectName: 'Desenho A',                                      examYear: 12 },
  '05': { subjectName: 'Espanhol',                                       examYear: 11 },
  '06': { subjectName: 'Filosofia',                                      examYear: 11 },
  '07': { subjectName: 'Física e Química A',                             examYear: 11 },
  '08': { subjectName: 'Francês',                                        examYear: 11 },
  '09': { subjectName: 'Geografia A',                                    examYear: 11 },
  '10': { subjectName: 'Geometria Descritiva A',                         examYear: 11 },
  '11': { subjectName: 'História A',                                     examYear: 12 },
  '12': { subjectName: 'História da Cultura e das Artes',                examYear: 11 },
  '13': { subjectName: 'Inglês',                                         examYear: 11 },
  '14': { subjectName: 'Latim A',                                        examYear: 11 },
  '15': { subjectName: 'Literatura Portuguesa',                          examYear: 11 },
  '17': { subjectName: 'Matemática Aplicada às Ciências Sociais (MACS)', examYear: 11 },
  '18': { subjectName: 'Português',                                      examYear: 12 },
  '19': { subjectName: 'Matemática A',                                   examYear: 12 },
  '20': { subjectName: 'Italiano',                                       examYear: 11 },
  '21': { subjectName: 'Mandarim',                                       examYear: 11 },
}

interface SubjectGrade {
  name: string;
  grades: { year: number; grade: number }[];
}

export function calculateCFA(
  subjects: SubjectGrade[] = [],
  courseGroup: string,
  mediaProfissional?: number,
  examGrades?: { examCode: string; grade: number }[] // grade on 0–200 scale
): number {
  if (courseGroup === 'PROFISSIONAL') {
    return mediaProfissional || 0;
  }

  if (!subjects || subjects.length === 0) return 0;

  // Build lookup: subject name → { ce on 0-20 scale, examYear }
  // If the same subject has multiple entries (different fase), use the highest grade
  const examBySubject: Record<string, { ce: number; examYear: 11 | 12 }> = {}
  if (examGrades) {
    for (const eg of examGrades) {
      const mapping = EXAM_TO_SUBJECT[eg.examCode]
      if (mapping) {
        const ce = eg.grade / 10
        const existing = examBySubject[mapping.subjectName]
        if (!existing || ce > existing.ce) {
          examBySubject[mapping.subjectName] = { ce, examYear: mapping.examYear }
        }
      }
    }
  }

  const cfds = subjects.map(subject => {
    const validGrades = subject.grades || [];
    if (validGrades.length === 0) return 0;

    // CIF = average of internal year grades (0-20 scale, kept as float)
    const cif = validGrades.reduce((acc, curr) => acc + curr.grade, 0) / validGrades.length;

    // Apply CFD formula if exam grade is available for this subject
    const examInfo = examBySubject[subject.name]
    if (examInfo) {
      const ce = examInfo.ce
      if (examInfo.examYear === 11) {
        // 11th year exam: CFD = (7.5 × CIF + 2.5 × CE) / 10
        return (7.5 * cif + 2.5 * ce) / 10
      } else {
        // 12th year exam: CFD = (7 × CIF + 3 × CE) / 10
        return (7 * cif + 3 * ce) / 10
      }
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
