

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

export const COURSE_GROUPS = {
  CIENCIAS: 'Ciências e Tecnologias',
  ECONOMIA: 'Ciências Socioeconómicas',
  HUMANIDADES: 'Línguas e Humanidades',
  ARTES: 'Artes Visuais',
  PROFISSIONAL: 'Ensino Profissional'
} as const;

export const GENERAL_SUBJECTS = ['Português', 'Filosofia', 'Inglês', 'Educação Física'];

export const SUBJECTS_BY_GROUP = {
  CIENCIAS: {
    trienais: ['Matemática A'],
    bienais: ['Física e Química A', 'Biologia e Geologia', 'Geometria Descritiva A'],
    anuais_12: [
      'Biologia', 'Física', 'Química', 'Geologia', 'Antropologia', 
      'Aplicações Informáticas B', 'Ciência Política', 'Clássicos da Literatura', 
      'Direito', 'Economia C', 'Filosofia A', 'Psicologia B', 'Sociologia'
    ]
  },
  ECONOMIA: {
    trienais: ['Matemática A'],
    bienais: ['Economia A', 'Geografia A', 'História da Cultura e das Artes'],
    anuais_12: ['Economia C', 'Sociologia', 'Psicologia B', 'Direito', 'Geografia C']
  },
  HUMANIDADES: {
    trienais: ['História A'],
    bienais: [
      'Geografia A', 'Latim A', 'Literatura Portuguesa', 
      'Matemática Aplicada às Ciências Sociais (MACS)', 'Língua Estrangeira II ou III'
    ],
    anuais_12: ['Filosofia A', 'Psicologia B', 'Sociologia', 'Direito', 'Economia C', 'Clássicos da Literatura']
  },
  ARTES: {
    trienais: ['Desenho A'],
    bienais: ['Geometria Descritiva A', 'Matemática B', 'História da Cultura e das Artes'],
    anuais_12: ['Oficina de Artes', 'Oficina de Multimédia B', 'Materiais e Tecnologias']
  },
  PROFISSIONAL: {
    trienais: [],
    bienais: [],
    anuais_12: []
  }
};


export const EXAM_SUBJECTS = [
  { code: '01', name: 'Alemão' },
  { code: '02', name: 'Biologia e Geologia' },
  { code: '03', name: 'Desenho A' },
  { code: '04', name: 'Grego' },
  { code: '05', name: 'Espanhol' },
  { code: '06', name: 'Filosofia' },
  { code: '07', name: 'Física e Química A' },
  { code: '08', name: 'Francês'  },
  { code: '09', name: 'Geografia' },
  { code: '10', name: 'Geometria Descritiva A' },
  { code: '11', name: 'História A' },
  { code: '12', name: 'Hist. da Cultura e das Artes' },
  { code: '13', name: 'Inglês' },
  { code: '14', name: 'Latim' }, 
  { code: '15', name: 'Literatura Portuguesa' },
  { code: '16', name: 'Matemática' },
  { code: '17', name: 'MACS' },
  { code: '18', name: 'Português' },
  { code: '19', name: 'Matemática A' },
  { code: '20', name: 'Italiano' },
  { code: '21', name: 'Mandarim' }  
]

// ─── Timeline events ──────────────────────────────────────────────────────────
export type TimelineEventType = 'iave' | 'dges'

export interface TimelineEvent {
  id: string
  type: TimelineEventType
  date: string       // ISO "YYYY-MM-DD" (start for ranges)
  endDate?: string   // ISO for multi-day events
  title: string
  subtitle?: string
  examCodes?: string[] // links to EXAM_SUBJECTS codes
}

// IAVE 2025 secondary national exams
export const IAVE_EVENTS: TimelineEvent[] = [
  // Phase 1
  { id: 'iave-p1-port',  type: 'iave', date: '2025-06-16', title: 'Português', subtitle: 'Fase 1 · 12º ano · 9h30', examCodes: ['18'] },
  { id: 'iave-p1-eco',   type: 'iave', date: '2025-06-16', title: 'Economia A', subtitle: 'Fase 1 · 11º ano · 14h00' },
  { id: 'iave-p1-gd',    type: 'iave', date: '2025-06-17', title: 'Geometria Descritiva A', subtitle: 'Fase 1 · 11º ano · 9h30', examCodes: ['10'] },
  { id: 'iave-p1-langs', type: 'iave', date: '2025-06-17', title: 'Línguas Estrangeiras', subtitle: 'Alemão · Espanhol · Francês · Italiano · Latim A · Mandarim · Fase 1 · 14h00', examCodes: ['01','05','08','14','20','21'] },
  { id: 'iave-p1-biogeo',type: 'iave', date: '2025-06-18', title: 'Biologia e Geologia', subtitle: 'Fase 1 · 11º ano · 9h30', examCodes: ['02'] },
  { id: 'iave-p1-geo',   type: 'iave', date: '2025-06-19', title: 'Geografia A', subtitle: 'Fase 1 · 11º ano · 9h30', examCodes: ['09'] },
  { id: 'iave-p1-hist',  type: 'iave', date: '2025-06-22', title: 'História A', subtitle: 'Fase 1 · 12º/11º ano · 9h30', examCodes: ['11'] },
  { id: 'iave-p1-litport',type:'iave', date: '2025-06-22', title: 'Literatura Portuguesa', subtitle: 'Fase 1 · 11º ano · 14h00', examCodes: ['15'] },
  { id: 'iave-p1-mat',   type: 'iave', date: '2025-06-23', title: 'Matemática A / B / MACS', subtitle: 'Fase 1 · 9h30', examCodes: ['16','17','19'] },
  { id: 'iave-p1-ing',   type: 'iave', date: '2025-06-23', title: 'Inglês', subtitle: 'Fase 1 · 11º ano · 14h00', examCodes: ['13'] },
  { id: 'iave-p1-fqa',   type: 'iave', date: '2025-06-25', title: 'Física e Química A', subtitle: 'Fase 1 · 11º ano · 9h30', examCodes: ['07'] },
  { id: 'iave-p1-des',   type: 'iave', date: '2025-06-26', title: 'Desenho A', subtitle: 'Fase 1 · 12º ano · 9h30', examCodes: ['03'] },
  { id: 'iave-p1-fil',   type: 'iave', date: '2025-06-26', title: 'Filosofia', subtitle: 'Fase 1 · 11º ano · 14h00', examCodes: ['06'] },
  // Phase 2
  { id: 'iave-p2-port',  type: 'iave', date: '2025-07-16', title: 'Português', subtitle: 'Fase 2 · 12º ano · 9h30', examCodes: ['18'] },
  { id: 'iave-p2-geo',   type: 'iave', date: '2025-07-16', title: 'Geografia A', subtitle: 'Fase 2 · 14h00', examCodes: ['09'] },
  { id: 'iave-p2-fqa',   type: 'iave', date: '2025-07-17', title: 'Física e Química A', subtitle: 'Fase 2 · 9h30', examCodes: ['07'] },
  { id: 'iave-p2-mat',   type: 'iave', date: '2025-07-20', title: 'Matemática A / B / MACS', subtitle: 'Fase 2 · 9h30', examCodes: ['16','17','19'] },
  { id: 'iave-p2-fil',   type: 'iave', date: '2025-07-20', title: 'Filosofia', subtitle: 'Fase 2 · 14h00', examCodes: ['06'] },
  { id: 'iave-p2-hist',  type: 'iave', date: '2025-07-21', title: 'História A + Biologia e Geologia', subtitle: 'Fase 2 · 9h30', examCodes: ['11','02'] },
  { id: 'iave-p2-gd',    type: 'iave', date: '2025-07-21', title: 'Geometria Descritiva A + Línguas', subtitle: 'Fase 2 · 14h00', examCodes: ['10','01','05','08','20','21'] },
  { id: 'iave-p2-des',   type: 'iave', date: '2025-07-22', title: 'Desenho A', subtitle: 'Fase 2 · 9h30', examCodes: ['03'] },
  { id: 'iave-p2-ing',   type: 'iave', date: '2025-07-22', title: 'Inglês', subtitle: 'Fase 2 · 14h00', examCodes: ['13'] },
  // Key result dates
  { id: 'iave-res-f1',   type: 'iave', date: '2025-07-14', title: 'Afixação de Pautas — Fase 1', subtitle: 'Resultados dos exames da fase 1' },
  { id: 'iave-res-f2',   type: 'iave', date: '2025-08-05', title: 'Afixação de Pautas — Fase 2', subtitle: 'Resultados dos exames da fase 2' },
]

// DGES 2025 Concurso Nacional de Acesso
export const DGES_EVENTS: TimelineEvent[] = [
  { id: 'dges-def',    type: 'dges', date: '2025-05-02', endDate: '2025-05-30', title: 'Candidatura — Contingente Deficiência', subtitle: 'Incapacidade ≥ 60%' },
  { id: 'dges-1f-cand',type: 'dges', date: '2025-07-21', endDate: '2025-08-04', title: 'Candidatura — 1ª Fase', subtitle: 'Submissão da candidatura online' },
  { id: 'dges-1f-res', type: 'dges', date: '2025-08-24', title: 'Resultados — 1ª Fase', subtitle: 'Divulgação das listas de colocação' },
  { id: 'dges-1f-mat', type: 'dges', date: '2025-08-25', endDate: '2025-08-28', title: 'Matrícula — 1ª Fase', subtitle: 'Inscrição/matrícula dos colocados' },
  { id: 'dges-2f-cand',type: 'dges', date: '2025-08-25', endDate: '2025-09-03', title: 'Candidatura — 2ª Fase', subtitle: 'Submissão da candidatura online' },
  { id: 'dges-2f-res', type: 'dges', date: '2025-09-14', title: 'Resultados — 2ª Fase', subtitle: 'Divulgação das listas de colocação' },
  { id: 'dges-2f-mat', type: 'dges', date: '2025-09-15', endDate: '2025-09-17', title: 'Matrícula — 2ª Fase', subtitle: 'Inscrição/matrícula dos colocados' },
  { id: 'dges-3f-cand',type: 'dges', date: '2025-09-23', endDate: '2025-09-25', title: 'Candidatura — 3ª Fase', subtitle: 'Submissão da candidatura online' },
  { id: 'dges-3f-res', type: 'dges', date: '2025-10-01', title: 'Resultados — 3ª Fase', subtitle: 'Divulgação das listas de colocação' },
  { id: 'dges-3f-mat', type: 'dges', date: '2025-10-01', endDate: '2025-10-03', title: 'Matrícula — 3ª Fase', subtitle: 'Inscrição/matrícula dos colocados' },
]

export const DGES_PHASES = DGES_EVENTS  // backwards compat alias

export const AREAS = [
  'Artes e Design',
  'Ciências da Vida e Saúde',
  'Ciências Exatas e da Natureza',
  'Direito, Ciências Sociais e Humanas',
  'Economia, Gestão e Contabilidade',
  'Educação e Desporto',
  'Engenharia e Tecnologia',
  'Informática e Dados'
]