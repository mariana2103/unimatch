-- 1. EXTENSÕES (UUID + IA Vector)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector; -- Essencial para o AICounselor

-- 2. PERFIS
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  username TEXT UNIQUE,
  distrito_residencia TEXT,
  contingente_especial TEXT DEFAULT 'geral',
  
  -- Campos de Agrupamento
  course_group TEXT CHECK (course_group IN ('CIENCIAS', 'ECONOMIA', 'HUMANIDADES', 'ARTES', 'PROFISSIONAL')),
  
  -- Média final fixa (usada para Profissional ou se o user quiser inserir manualmente)
  media_fixa DECIMAL(5,2), 
  
  -- Média calculada automaticamente pelo sistema (Científico-Humanístico)
  media_interna_calculada DECIMAL(5,2) DEFAULT 0,
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. NOTAS DE CADEIRAS (Organizado para cálculo por CFD - Classificação Final de Disciplina)
CREATE TABLE user_grades (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  subject_name TEXT NOT NULL, 
  year_level INTEGER CHECK (year_level IN (10, 11, 12)), 
  grade INTEGER CHECK (grade BETWEEN 0 AND 20),
  is_annual BOOLEAN DEFAULT false, -- Para disciplinas que só existem num ano (Ex: Psicologia B)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, subject_name, year_level)
);

-- 4. EXAMES NACIONAIS (Escala 0-200 conforme a DGES)
CREATE TABLE user_exams (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  exam_code TEXT NOT NULL, -- IDs de 2 dígitos: '19', '02', '07', etc.
  grade DECIMAL(5,2) NOT NULL CHECK (grade BETWEEN 0 AND 200),
  exam_year INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. CURSOS (Evoluído para IA e Monetização)
CREATE TABLE courses (
  id TEXT PRIMARY KEY, -- Código DGES
  nome TEXT NOT NULL,
  instituicao_nome TEXT NOT NULL,
  distrito TEXT NOT NULL,
  area TEXT NOT NULL, -- Ex: 'Saúde', 'Engenharia'
  tipo TEXT CHECK (tipo IN ('publica', 'privada')),
  vagas INTEGER,
  nota_ultimo_colocado DECIMAL(5,2), -- Escala 0-200
  
  -- Pesos das Faculdades
  peso_secundario DECIMAL(3,2), -- Ex: 0.65
  peso_exames DECIMAL(3,2),     -- Ex: 0.35
  nota_minima_candidatura DECIMAL(5,2) DEFAULT 95.0,
  nota_minima_p_ingresso DECIMAL(5,2) DEFAULT 95.0,

  -- Campos de IA
  descricao_ia TEXT, -- Texto para o embedding
  embedding vector(1536), -- Vector similarity search
  
  link_oficial TEXT,
  is_promoted BOOLEAN DEFAULT false,
  history JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. REQUISITOS DE EXAMES (Lógica de Conjuntos)
-- Permite gerir cursos que aceitam várias combinações de exames
CREATE TABLE course_requirements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  course_id TEXT REFERENCES courses(id) ON DELETE CASCADE,
  exam_code TEXT NOT NULL, -- ID de 2 dígitos
  conjunto_id INTEGER DEFAULT 1, -- Para lógica: (Exame A E Exame B) OU (Exame C)
  weight DECIMAL(3,2) NOT NULL DEFAULT 0.50
);

-- 7. FAVORITOS
CREATE TABLE favorites (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  course_id TEXT REFERENCES courses(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, course_id)
);

-- 8. CALENDÁRIO
CREATE TABLE calendar_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  event_type TEXT CHECK (event_type IN ('exame', 'candidatura', 'resultados', 'evento_uni')),
  start_date DATE NOT NULL,
  end_date DATE,
  description TEXT
);

-- 9. TRIGGER PARA NOVOS UTILIZADORES
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 10. POLÍTICAS DE SEGURANÇA (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users edit own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users manage own grades" ON user_grades FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own exams" ON user_exams FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Courses and requirements are public" ON courses FOR SELECT USING (true);
CREATE POLICY "Requirements are public" ON course_requirements FOR SELECT USING (true);
CREATE POLICY "Users manage own favorites" ON favorites FOR ALL USING (auth.uid() = user_id);



-- Cria a função que vai inserir o perfil
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove o trigger antigo se existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Cria o trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();



-- Verifica/adiciona colunas em falta
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();


-- Remove políticas antigas
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Permite que qualquer utilizador autenticado veja o seu próprio perfil
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Permite que qualquer utilizador autenticado atualize o seu próprio perfil
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);


  -- Apaga tudo e recomeça
TRUNCATE TABLE profiles CASCADE;
TRUNCATE TABLE user_grades CASCADE;
TRUNCATE TABLE user_exams CASCADE;

-- Garante que a tabela profiles tem a estrutura certa
ALTER TABLE profiles 
  DROP CONSTRAINT IF EXISTS profiles_pkey CASCADE;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Remove trigger antigo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Cria trigger novo que SEMPRE funciona
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      SPLIT_PART(NEW.email, '@', 1)
    ),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Políticas RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Utilizadores podem ver o próprio perfil" ON profiles;
DROP POLICY IF EXISTS "Utilizadores podem atualizar o próprio perfil" ON profiles;
DROP POLICY IF EXISTS "Inserção automática via trigger" ON profiles;

CREATE POLICY "Utilizadores podem ver o próprio perfil"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Utilizadores podem atualizar o próprio perfil"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Inserção automática via trigger"
  ON profiles FOR INSERT
  WITH CHECK (true);


-- Remove todas as políticas
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON profiles;

-- Políticas mais permissivas para debug
CREATE POLICY "profiles_select_policy"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "profiles_insert_policy"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "profiles_update_policy"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "profiles_delete_policy"
  ON profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

ALTER TABLE profiles
DROP COLUMN IF EXISTS media_fixa,
DROP COLUMN IF EXISTS media_interna_calculada;

ALTER TABLE profiles
ADD COLUMN media_final_calculada DECIMAL(5,2) DEFAULT 0;
