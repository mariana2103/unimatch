

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