-- Shared candidatura snapshots (anonymous, no auth required to view)
CREATE TABLE IF NOT EXISTS shared_candidaturas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT NOT NULL UNIQUE,               -- short random id used in URL
  course_ids  UUID[] NOT NULL,                    -- ordered list (index 0 = 1st option)
  user_media  NUMERIC(5,2) DEFAULT NULL,          -- sharer's grade (0-20 scale) for diff display
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  expires_at  TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days'
);

-- Anyone can insert and read (no login needed)
ALTER TABLE shared_candidaturas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create a shared candidatura"
  ON shared_candidaturas FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view non-expired shared candidaturas"
  ON shared_candidaturas FOR SELECT
  USING (expires_at > NOW());

-- Index for slug lookups
CREATE INDEX IF NOT EXISTS shared_candidaturas_slug_idx ON shared_candidaturas (slug);
