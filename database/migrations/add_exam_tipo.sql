-- Migration: add tipo + fase columns to user_exams, fix unique constraint
-- Run this in the Supabase SQL editor

-- 1. Add fase column if missing (was added outside schema.sql)
ALTER TABLE user_exams ADD COLUMN IF NOT EXISTS fase INTEGER
  CHECK (fase IN (1, 2)) DEFAULT 1 NOT NULL;

-- 2. Add tipo column
ALTER TABLE user_exams ADD COLUMN IF NOT EXISTS tipo TEXT
  CHECK (tipo IN ('obrigatorio', 'melhoria', 'prova_ingresso'))
  DEFAULT 'obrigatorio' NOT NULL;

-- 3. Fix unique constraint to include fase
--    (allows one obrigatorio + one melhoria for the same exam in the same year)
ALTER TABLE user_exams DROP CONSTRAINT IF EXISTS user_exams_user_id_exam_code_exam_year_key;
ALTER TABLE user_exams DROP CONSTRAINT IF EXISTS user_exams_unique_per_year;

ALTER TABLE user_exams
  ADD CONSTRAINT user_exams_unique_per_year
  UNIQUE (user_id, exam_code, exam_year, fase);
