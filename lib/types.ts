export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  username: string | null
  distrito_residencia: string | null
  contingente_especial: string
  media_final_calculada: number
  course_group: string | null
  updated_at: string
}

export interface UserGrade {
  id: string
  user_id: string
  subject_name: string
  year_level: 10 | 11 | 12
  grade: number
  created_at: string
}

export interface UserExam {
  id: string
  user_id: string
  exam_code: string
  grade: number
  exam_year: number
  fase: 1 | 2  // 1 = 1ª fase, 2 = 2ª fase (only fase 1 exams can be used in 1ª fase candidacy)
}

// Raw DB row
export interface Course {
  id: string
  nome: string
  instituicao: string
  distrito: string
  area: string
  tipo: 'publica' | 'privada'
  vagas: number | null
  nota_ultimo_colocado: number | null
  peso_secundario: number | null
  peso_exames: number | null
  link_oficial: string | null
  is_promoted: boolean
  history: any
}

// Enriched course used by all UI components
export interface CourseUI {
  id: string
  nome: string
  instituicao: string       // instituicao_nome in DB
  distrito: string
  area: string
  tipo: 'publica' | 'privada'
  vagas: number | null
  notaUltimoColocado: number | null    // nota_ultimo_colocado (0-200, 1ª fase)
  notaUltimoColocadoF2: number | null // nota_ultimo_colocado_f2 (0-200, 2ª fase)
  pesoSecundario: number | null        // peso_secundario
  pesoExame: number | null             // peso_exames
  notaMinima: number | null            // nota_minima_p_ingresso
  notaMinimProva: number | null        // nota_minima_prova
  provasIngresso: { code: string; name: string; weight: number; conjunto_id: number }[]
  historico: { year: number; nota_f1: number | null; nota_f2: number | null; vagas_f1: number | null; vagas_f2: number | null }[] | null
  link_oficial: string | null
}

export interface CourseRequirement {
  id: string
  course_id: string
  exam_code: string
  weight: number
}

export interface Favorite {
  user_id: string
  course_id: string
  created_at: string
}

export interface CalendarEvent {
  id: string
  title: string
  event_type: 'exame' | 'candidatura' | 'resultados'
  start_date: string
  end_date: string | null
  description: string | null
}