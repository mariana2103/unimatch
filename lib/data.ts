

interface SubjectGrade {
  name: string;
  grades: { year: number; grade: number }[];
}

export function calculateCFA(
  subjects: SubjectGrade[] = [],
  courseGroup: string,
  mediaProfissional?: number
): number {
  if (courseGroup === 'PROFISSIONAL') {
    return mediaProfissional || 0;
  }

  if (!subjects || subjects.length === 0) return 0;

  const cfds = subjects.map(subject => {
    const validGrades = subject.grades || [];
    if (validGrades.length === 0) return 0;
    const sum = validGrades.reduce((acc, curr) => acc + curr.grade, 0);
    return Math.round(sum / validGrades.length);
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

  if (safeProvas.length === 0) {
    return { grade: 0, meetsMinimum: false, hasRequiredExams: false }
  }

  const ms200    = (mediaSecundario || 0) * 10
  const pesoSec  = course.pesoSecundario ?? 0.5
  const pesoExam = course.pesoExame      ?? 0.5
  const notaMin  = course.notaMinima     ?? 95

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

    // Grades are on 0-200 scale; weights sum to 1 within a conjunto
    const examComponent = exams.reduce((sum, e) => {
      const u = safeUserExams.find(u => u.subjectCode === e.code)!
      return sum + u.grade * e.weight
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
