-- Shared candidatura snapshots (anonymous, no auth required to view)
CREATE TABLE IF NOT EXISTS shared_candidaturas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT NOT NULL UNIQUE,               -- short random id used in URL
  course_ids  UUID[] NOT NULL                     -- ordered list (index 0 = 1st option)
                CHECK (array_length(course_ids, 1) BETWEEN 1 AND 6),
  user_media  NUMERIC(5,2) DEFAULT NULL           -- sharer's secondary average (0-20 scale)
                CHECK (user_media IS NULL OR (user_media >= 0 AND user_media <= 20)),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  expires_at  TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days'
);

-- Anyone can insert and read (no login needed)
ALTER TABLE shared_candidaturas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can create a shared candidatura" ON shared_candidaturas;
CREATE POLICY "Anyone can create a shared candidatura"
  ON shared_candidaturas FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view non-expired shared candidaturas" ON shared_candidaturas;
CREATE POLICY "Anyone can view non-expired shared candidaturas"
  ON shared_candidaturas FOR SELECT
  USING (expires_at > NOW());

-- Index for slug lookups
CREATE INDEX IF NOT EXISTS shared_candidaturas_slug_idx ON shared_candidaturas (slug);

-- Index for expires_at — used in every SELECT (RLS policy + API filter)
CREATE INDEX IF NOT EXISTS shared_candidaturas_expires_idx ON shared_candidaturas (expires_at);
