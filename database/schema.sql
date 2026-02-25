-- ============================================================
-- SCHEMA LIMPO E IDEMPOTENTE
-- Pode ser executado múltiplas vezes sem erros.
-- ============================================================

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. DROP DE TUDO (ordem inversa das dependências)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

DROP TABLE IF EXISTS favorites          CASCADE;
DROP TABLE IF EXISTS calendar_events    CASCADE;
DROP TABLE IF EXISTS course_requirements CASCADE;
DROP TABLE IF EXISTS user_exams         CASCADE;
DROP TABLE IF EXISTS user_grades        CASCADE;
DROP TABLE IF EXISTS courses            CASCADE;
DROP TABLE IF EXISTS profiles           CASCADE;

-- 3. PERFIS
CREATE TABLE profiles (
  id                    UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email                 TEXT,
  full_name             TEXT,
  avatar_url            TEXT,
  username              TEXT UNIQUE,
  distrito_residencia   TEXT,
  contingente_especial  TEXT DEFAULT 'geral',
  course_group          TEXT CHECK (course_group IN ('CIENCIAS', 'ECONOMIA', 'HUMANIDADES', 'ARTES', 'PROFISSIONAL')),
  media_final_calculada DECIMAL(5,2) DEFAULT 0,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- 4. NOTAS DE CADEIRAS
CREATE TABLE user_grades (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id      UUID REFERENCES profiles(id) ON DELETE CASCADE,
  subject_name TEXT NOT NULL,
  year_level   INTEGER CHECK (year_level IN (10, 11, 12)),
  grade        INTEGER CHECK (grade BETWEEN 0 AND 20),
  is_annual    BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, subject_name, year_level)
);

-- 5. EXAMES NACIONAIS (escala 0-200)
CREATE TABLE user_exams (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  exam_code  TEXT NOT NULL,
  grade      DECIMAL(5,2) NOT NULL CHECK (grade BETWEEN 0 AND 200),
  exam_year  INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CURSOS
CREATE TABLE courses (
  id                      TEXT PRIMARY KEY,
  nome                    TEXT NOT NULL,
  instituicao_nome        TEXT NOT NULL,
  distrito                TEXT NOT NULL,
  area                    TEXT NOT NULL,
  tipo                    TEXT CHECK (tipo IN ('publica', 'privada')),
  vagas                   INTEGER,
  nota_ultimo_colocado    DECIMAL(5,2),
  peso_secundario         DECIMAL(3,2),
  peso_exames             DECIMAL(3,2),
  nota_minima_candidatura DECIMAL(5,2) DEFAULT 95.0,
  nota_minima_p_ingresso  DECIMAL(5,2) DEFAULT 95.0,
  descricao_ia            TEXT,
  embedding               vector(1536),
  link_oficial            TEXT,
  is_promoted             BOOLEAN DEFAULT false,
  history                 JSONB,
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- 7. REQUISITOS DE EXAMES
CREATE TABLE course_requirements (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  course_id   TEXT REFERENCES courses(id) ON DELETE CASCADE,
  exam_code   TEXT NOT NULL,
  conjunto_id INTEGER DEFAULT 1,
  weight      DECIMAL(3,2) NOT NULL DEFAULT 0.50
);

-- 8. FAVORITOS
CREATE TABLE favorites (
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  course_id  TEXT REFERENCES courses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, course_id)
);

-- 9. CALENDÁRIO
CREATE TABLE calendar_events (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title       TEXT NOT NULL,
  event_type  TEXT CHECK (event_type IN ('exame', 'candidatura', 'resultados', 'evento_uni')),
  start_date  DATE NOT NULL,
  end_date    DATE,
  description TEXT
);

-- 10. TRIGGER PARA NOVOS UTILIZADORES
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      SPLIT_PART(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 11. RLS
ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_grades       ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_exams        ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses           ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites         ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "profiles_select_policy" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert_policy" ON profiles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "profiles_update_policy" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_delete_policy" ON profiles FOR DELETE TO authenticated USING (auth.uid() = id);

-- user_grades / user_exams
CREATE POLICY "Users manage own grades" ON user_grades FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own exams"  ON user_exams  FOR ALL USING (auth.uid() = user_id);

-- courses / requirements (públicos)
CREATE POLICY "Courses are public"      ON courses             FOR SELECT USING (true);
CREATE POLICY "Requirements are public" ON course_requirements FOR SELECT USING (true);

-- favorites
CREATE POLICY "Users manage own favorites" ON favorites FOR ALL USING (auth.uid() = user_id);
