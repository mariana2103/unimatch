

interface SubjectGrade {
  name: string;
  grades: { year: number; grade: number }[]; // Ex: [{year: 10, grade: 15}, {year: 11, grade: 17}]
}

export function calculateCFA(
  subjects: SubjectGrade[] = [], // Garantir array vazio por defeito
  courseGroup: string, 
  mediaProfissional?: number
): number {
  if (courseGroup === 'PROFISSIONAL') {
    return mediaProfissional || 0;
  }

  // Se subjects for undefined ou vazio, retorna 0
  if (!subjects || subjects.length === 0) return 0;

  const cfds = subjects.map(subject => {
    // Verificar se subject.grades existe antes de usar o reduce
    const validGrades = subject.grades || [];
    if (validGrades.length === 0) return 0;

    const sum = validGrades.reduce((acc, curr) => acc + curr.grade, 0);
    const avg = sum / validGrades.length;
    return Math.round(avg);
  });

  const validCfds = cfds.filter(v => v > 0);
  if (validCfds.length === 0) return 0;

  const totalSum = validCfds.reduce((acc, val) => acc + val, 0);
  return Math.round((totalSum / validCfds.length) * 10) / 10;
}

export function calculateAdmissionGrade(
  mediaSecundario: number,
  userExams: { subjectCode: string; grade: number }[] = [], // Safety check aqui
  course: any // Usamos any temporariamente para evitar erros de tipos no acesso
): { grade: number; meetsMinimum: boolean; hasRequiredExams: boolean } {
  
  // Garantir que arrays existem antes de filtrar ou iterar
  const safeUserExams = userExams || [];
  const safeProvasIngresso = course?.provasIngresso || [];

  if (safeProvasIngresso.length === 0) {
     return { grade: 0, meetsMinimum: false, hasRequiredExams: false };
  }

  let weightedExamSum = 0;
  let foundExamsCount = 0;

  safeProvasIngresso.forEach((req: any) => {
    // .find() é seguro se safeUserExams for um array
    const exam = safeUserExams.find(e => e.subjectCode === req.code);
    if (exam) {
      weightedExamSum += exam.grade * (req.weight || 0.5);
      foundExamsCount++;
    }
  });

  const hasRequiredExams = foundExamsCount === safeProvasIngresso.length;
  if (!hasRequiredExams) return { grade: 0, meetsMinimum: false, hasRequiredExams: false };

  const ms200 = (mediaSecundario || 0) * 10;
  const finalGrade = (ms200 * (course.pesoSecundario || 0.5)) + (weightedExamSum * (course.pesoExame || 0.5));
  
  const roundedFinal = Math.round(finalGrade * 10) / 10;

  // AQUI estava o provável erro (r.filter no código minificado)
  // safeUserExams.filter é seguro agora
  const examsMeetMinimum = safeUserExams
    .filter(e => safeProvasIngresso.some((p: any) => p.code === e.subjectCode))
    .every(e => e.grade >= (course.notaMinima || 95));

  return { 
    grade: roundedFinal, 
    meetsMinimum: examsMeetMinimum && (ms200 >= (course.notaMinima || 95)), 
    hasRequiredExams: true 
  };
}