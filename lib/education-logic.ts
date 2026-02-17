import { SUBJECTS_BY_GROUP, GENERAL_SUBJECTS } from './constants';

export const getSubjectsByYear = (year: string, group: string) => {
  if (group === 'PROFISSIONAL') return [];
  
  const data = SUBJECTS_BY_GROUP[group as keyof typeof SUBJECTS_BY_GROUP];
  if (!data) return [];

  const map = {
    '10': [...GENERAL_SUBJECTS, ...data.trienais, ...data.bienais],
    '11': [...GENERAL_SUBJECTS, ...data.trienais, ...data.bienais],
    '12': ['Português', 'Educação Física', ...data.trienais, ...data.anuais_12]
  };

  return map[year as keyof typeof map] || [];
};