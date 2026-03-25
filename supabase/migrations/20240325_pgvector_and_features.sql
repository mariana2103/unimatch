-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to courses
ALTER TABLE courses
ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create index for fast similarity search
CREATE INDEX IF NOT EXISTS courses_embedding_idx
ON courses USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Add sobras para 2ª fase columns
ALTER TABLE courses
ADD COLUMN IF NOT EXISTS sobras_2fase_2024 INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS sobras_2fase_2025 INTEGER DEFAULT NULL;

-- Add taxa de desemprego (employment rate) per course
-- Source: DGEEC/GGP data on graduate employment surveys
ALTER TABLE courses
ADD COLUMN IF NOT EXISTS taxa_empregabilidade_1ano DECIMAL(5,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS taxa_empregabilidade_2anos DECIMAL(5,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS salario_medio_1ano DECIMAL(8,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS area_cnap_code VARCHAR(20) DEFAULT NULL;

-- Function to search courses by vector similarity
CREATE OR REPLACE FUNCTION search_courses_by_embedding(
  query_embedding vector,
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  nome TEXT,
  instituicao_nome TEXT,
  area TEXT,
  tipo TEXT,
  similarity float
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.nome,
    c.instituicao_nome,
    c.area,
    c.tipo,
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM courses c
  WHERE c.embedding IS NOT NULL
    AND 1 - (c.embedding <=> query_embedding) > match_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS for new function (public read-only access)
GRANT EXECUTE ON FUNCTION search_courses_by_embedding(vector, float, int) TO anon, authenticated;

-- Add candidatura_order table for persistent ordering
CREATE TABLE IF NOT EXISTS user_candidatura_order (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  position INTEGER NOT NULL CHECK (position BETWEEN 1 AND 6),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id),
  UNIQUE(user_id, position)
);

-- Enable RLS
ALTER TABLE user_candidatura_order ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own candidatura order"
  ON user_candidatura_order FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can modify their own candidatura order"
  ON user_candidatura_order FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to reorder candidatura positions
CREATE OR REPLACE FUNCTION reorder_candidatura(
  p_user_id UUID,
  p_course_id UUID,
  p_new_position INTEGER
)
RETURNS VOID AS $$
DECLARE
  v_old_position INTEGER;
BEGIN
  -- Get current position
  SELECT position INTO v_old_position
  FROM user_candidatura_order
  WHERE user_id = p_user_id AND course_id = p_course_id;
  
  IF v_old_position IS NULL THEN
    -- Insert new if not exists
    INSERT INTO user_candidatura_order (user_id, course_id, position)
    VALUES (p_user_id, p_course_id, p_new_position)
    ON CONFLICT (user_id, course_id) DO UPDATE SET position = p_new_position;
  ELSIF v_old_position < p_new_position THEN
    -- Moving down: shift others up
    UPDATE user_candidatura_order
    SET position = position - 1
    WHERE user_id = p_user_id 
      AND position > v_old_position 
      AND position <= p_new_position;
    -- Update target
    UPDATE user_candidatura_order SET position = p_new_position
    WHERE user_id = p_user_id AND course_id = p_course_id;
  ELSIF v_old_position > p_new_position THEN
    -- Moving up: shift others down
    UPDATE user_candidatura_order
    SET position = position + 1
    WHERE user_id = p_user_id 
      AND position >= p_new_position 
      AND position < v_old_position;
    -- Update target
    UPDATE user_candidatura_order SET position = p_new_position
    WHERE user_id = p_user_id AND course_id = p_course_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE user_candidatura_order IS 'Stores the ordered list of up to 6 courses for DGES candidatura';
COMMENT ON COLUMN courses.taxa_empregabilidade_1ano IS 'Employment rate 1 year after graduation (%) from DGEEC data';
COMMENT ON COLUMN courses.sobras_2fase_2025 IS 'Spots available for 2nd phase candidacy (calculated from vagas - colocados)';
