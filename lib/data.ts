

interface SubjectGrade {
  name: string;
  grades: { year: number; grade: number }[]; // Ex: [{year: 10, grade: 15}, {year: 11, grade: 17}]
}

/**
 * Calcula a Classificação Final de Curso (CFA) para o Ensino Secundário
 * Baseado no modelo: Média das CFDs (Classificação Final de Disciplina)
 */
export function calculateCFA(
  subjects: SubjectGrade[], 
  courseGroup: string, 
  mediaProfissional?: number
): number {
  if (courseGroup === 'PROFISSIONAL') {
    return mediaProfissional || 0;
  }

  if (subjects.length === 0) return 0;

  // 1. Calcular a CFD de cada disciplina (Média aritmética arredondada às unidades)
  const cfds = subjects.map(subject => {
    const sum = subject.grades.reduce((acc, curr) => acc + curr.grade, 0);
    const avg = sum / subject.grades.length;
    return Math.round(avg); // A DGES arredonda cada disciplina antes da média global
  });

  // 2. Média global das CFDs (Arredondada às décimas para visualização, mas a DGES usa inteiros para CFA)
  const totalSum = cfds.reduce((acc, val) => acc + val, 0);
  const cfa = totalSum / cfds.length;

  // Retornamos com 1 casa decimal para o simulador, mas nota: a DGES converte para escala 0-200
  return Math.round(cfa * 10) / 10;
}

/**
 * Calcula a Nota de Candidatura (0-200)
 */
export function calculateAdmissionGrade(
  mediaSecundario: number, // Escala 0-20 (ex: 16.5)
  userExams: { subjectCode: string; grade: number }[], // Escala 0-200
  course: {
    provasIngresso: { code: string; weight: number }[];
    pesoSecundario: number;
    pesoExame: number;
    notaMinima: number;
  }
): { grade: number; meetsMinimum: boolean; hasRequiredExams: boolean } {
  
  // 1. Encontrar as Provas de Ingresso (PI) exigidas
  let weightedExamSum = 0;
  let foundExamsCount = 0;

  course.provasIngresso.forEach(req => {
    const exam = userExams.find(e => e.subjectCode === req.code);
    if (exam) {
      weightedExamSum += exam.grade * req.weight;
      foundExamsCount++;
    }
  });

  const hasRequiredExams = foundExamsCount === course.provasIngresso.length;
  if (!hasRequiredExams) return { grade: 0, meetsMinimum: false, hasRequiredExams: false };

  // 2. Cálculo da Nota Final (Escala 0-200)
  // Convertemos a média secundária para escala 200 (16.5 -> 165)
  const ms200 = mediaSecundario * 10;
  
  // Média ponderada das Provas de Ingresso
  const totalExamWeight = course.provasIngresso.reduce((acc, p) => acc + p.weight, 1); // Normalmente a soma dos pesos é 1 (ou 100%)
  const avgExamGrade = weightedExamSum; // Se os pesos forem ex: 0.5 e 0.5

  const finalGrade = (ms200 * course.pesoSecundario) + (avgExamGrade * course.pesoExame);
  const roundedFinal = Math.round(finalGrade * 10) / 10;

  // 3. Verificação de Notas Mínimas (Geralmente 95 ou 100 pontos)
  const examsMeetMinimum = userExams
    .filter(e => course.provasIngresso.some(p => p.code === e.subjectCode))
    .every(e => e.grade >= course.notaMinima);

  const secondaryMeetsMinimum = ms200 >= course.notaMinima;

  return { 
    grade: roundedFinal, 
    meetsMinimum: examsMeetMinimum && secondaryMeetsMinimum, 
    hasRequiredExams: true 
  };
}