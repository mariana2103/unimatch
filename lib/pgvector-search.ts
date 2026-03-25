/**
 * Semantic course search via Voyage AI embeddings + Supabase pgvector.
 *
 * Prerequisites (run once in Supabase SQL editor):
 *
 *   create extension if not exists vector;
 *
 *   -- The embedding column already exists.
 *   -- Create IVFFlat index for fast ANN search:
 *   create index if not exists courses_embedding_idx
 *     on courses using ivfflat (embedding vector_cosine_ops) with (lists = 100);
 *
 *   -- RPC function used by this module:
 *   create or replace function search_courses_by_embedding(
 *     query_embedding vector,
 *     match_count     int default 20,
 *     order_by_cutoff boolean default false
 *   )
 *   returns table (
 *     nome                  text,
 *     instituicao_nome      text,
 *     nota_ultimo_colocado  numeric,
 *     vagas                 int,
 *     distrito              text
 *   )
 *   language sql stable as $$
 *     select
 *       nome,
 *       instituicao_nome,
 *       nota_ultimo_colocado,
 *       vagas,
 *       distrito
 *     from courses
 *     where embedding is not null
 *     order by
 *       case when order_by_cutoff then nota_ultimo_colocado end asc nulls last,
 *       embedding <=> query_embedding
 *     limit match_count;
 *   $$;
 */

const VOYAGE_KEY = process.env.VOYAGE_API_KEY
const SUPA_URL   = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPA_KEY   = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Voyage voyage-3 outputs 1024 dimensions — matches common pgvector setup.
// voyage-3-lite outputs 512 dims (cheaper, slightly less accurate).
const VOYAGE_MODEL = 'voyage-3'

export interface VectorCourseResult {
  nome: string
  instituicao_nome: string | null
  nota_ultimo_colocado: number | null
  vagas: number | null
  distrito: string | null
}

/** Embed a single string with Voyage AI. Returns null if key is missing or request fails. */
export async function embedText(text: string): Promise<number[] | null> {
  if (!VOYAGE_KEY) return null
  try {
    const res = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        Authorization:  `Bearer ${VOYAGE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input: [text], model: VOYAGE_MODEL }),
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    const data = await res.json()
    return (data.data?.[0]?.embedding as number[]) ?? null
  } catch {
    return null
  }
}

/** Embed a batch of strings (for the population script). */
export async function embedBatch(texts: string[]): Promise<number[][] | null> {
  if (!VOYAGE_KEY || texts.length === 0) return null
  try {
    const res = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        Authorization:  `Bearer ${VOYAGE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input: texts, model: VOYAGE_MODEL }),
      signal: AbortSignal.timeout(30_000),
    })
    if (!res.ok) return null
    const data = await res.json()
    return (data.data as { embedding: number[] }[]).map(d => d.embedding)
  } catch {
    return null
  }
}

/**
 * Search courses semantically by cosine similarity.
 * Returns null if Voyage key is absent or any request fails (caller should fall back to ilike).
 */
export async function vectorSearchCourses(
  query: string,
  matchCount = 20,
  orderByCutoff = false,
): Promise<VectorCourseResult[] | null> {
  const embedding = await embedText(query)
  if (!embedding) return null

  try {
    const res = await fetch(`${SUPA_URL}/rest/v1/rpc/search_courses_by_embedding`, {
      method: 'POST',
      headers: {
        apikey:          SUPA_KEY,
        Authorization:   `Bearer ${SUPA_KEY}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        query_embedding: embedding,
        match_count:     matchCount,
        order_by_cutoff: orderByCutoff,
      }),
      signal: AbortSignal.timeout(6000),
    })
    if (!res.ok) return null
    const data = await res.json()
    return Array.isArray(data) ? data : null
  } catch {
    return null
  }
}
