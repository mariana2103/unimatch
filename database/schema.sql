-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. PERFIS (União Google + Email)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  username TEXT UNIQUE,
  distrito_residencia TEXT,
  contingente_especial TEXT DEFAULT 'geral', -- Ex: 'madeira', 'acores', 'deficiente'
  media_final_calculada DECIMAL(5,2) DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. NOTAS DE CADEIRAS (Para gerar a média do secundário)
CREATE TABLE user_grades (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  subject_name TEXT NOT NULL, -- Ex: 'Matemática A'
  year_level INTEGER CHECK (year_level IN (10, 11, 12)), -- O ano a que a nota se refere
  grade INTEGER CHECK (grade BETWEEN 0 AND 20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Isto impede que um utilizador tenha duas notas para o 10º ano da mesma disciplina
  UNIQUE(user_id, subject_name, year_level)
);


-- 4. EXAMES NACIONAIS (Validade de 5 anos controlada no código)
CREATE TABLE user_exams (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  exam_code TEXT NOT NULL, 
  grade DECIMAL(5,2) NOT NULL, -- 0 a 200
  exam_year INTEGER NOT NULL -- Importante para filtrar > (ano_atual - 5)
);

-- 5. CURSOS (Inclui campos para Privadas e Públicas)
CREATE TABLE courses (
  id TEXT PRIMARY KEY, 
  nome TEXT NOT NULL,
  instituicao TEXT NOT NULL,
  distrito TEXT NOT NULL,
  area TEXT NOT NULL,
  tipo TEXT CHECK (tipo IN ('publica', 'privada')),
  vagas INTEGER,
  nota_ultimo_colocado DECIMAL(5,2),
  peso_secundario DECIMAL(3,2), -- Ex: 0.60
  peso_exames DECIMAL(3,2),     -- Ex: 0.40
  link_oficial TEXT,            -- Link DGES ou site da Privada (Monetização)
  is_promoted BOOLEAN DEFAULT false, -- Se a faculdade pagou para estar no topo
  history JSONB                 -- Notas de anos anteriores
);

-- 6. REQUISITOS DE EXAMES POR CURSO (O encaixe do puzzle)
CREATE TABLE course_requirements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  course_id TEXT REFERENCES courses(id) ON DELETE CASCADE,
  exam_code TEXT NOT NULL,
  weight DECIMAL(3,2) NOT NULL
);

-- 7. FAVORITOS
CREATE TABLE favorites (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  course_id TEXT REFERENCES courses(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, course_id)
);

-- 8. CALENDÁRIO (Exames e Candidaturas)
CREATE TABLE calendar_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  event_type TEXT CHECK (event_type IN ('exame', 'candidatura', 'resultados')),
  start_date DATE NOT NULL,
  end_date DATE,
  description TEXT
);

-- 9. TRIGGER AUTOMÁTICO (Unir Auth -> Profile)
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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 10. SEGURANÇA (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users edit own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users manage own grades" ON user_grades FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own exams" ON user_exams FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Courses public" ON courses FOR SELECT USING (true);
CREATE POLICY "Favorites by user" ON favorites FOR ALL USING (auth.uid() = user_id);
