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
}

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