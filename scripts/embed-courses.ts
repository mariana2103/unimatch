/**
 * Embed all courses and store vectors in Supabase.
 * Automatically skips courses that already have embeddings.
 *
 * Run with:
 *   npx tsx --env-file=.env scripts/embed-courses.ts
 */

const VOYAGE_KEY = process.env.VOYAGE_API_KEY!
const SUPA_URL   = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPA_KEY   = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!SUPA_URL || !SUPA_KEY || !VOYAGE_KEY) {
  console.error('Missing VOYAGE_API_KEY, NEXT_PUBLIC_SUPABASE_URL, or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const BATCH_SIZE      = 20    // conservative — well within rate limits
const DELAY_MS        = 1500  // 1.5s between batches → ~40 req/min (free tier allows 60 RPM)
const MAX_RETRIES     = 3
const RETRY_DELAY_MS  = 5000

interface CourseRow {
  id: string
  nome: string
  area: string | null
  instituicao_nome: string | null
  distrito: string | null
}

// Fetch only courses without embeddings
async function fetchUnembedded(): Promise<CourseRow[]> {
  const all: CourseRow[] = []
  let from = 0
  const PAGE = 1000
  while (true) {
    const res = await fetch(
      `${SUPA_URL}/rest/v1/courses` +
      `?select=id,nome,area,instituicao_nome,distrito` +
      `&embedding=is.null` +
      `&offset=${from}&limit=${PAGE}`,
      { headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` } },
    )
    if (!res.ok) throw new Error(`Supabase fetch failed: ${res.status} ${await res.text()}`)
    const page: CourseRow[] = await res.json()
    all.push(...page)
    if (page.length < PAGE) break
    from += PAGE
  }
  return all
}

async function updateEmbedding(id: string, embedding: number[]): Promise<void> {
  const res = await fetch(`${SUPA_URL}/rest/v1/courses?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}`,
      'Content-Type': 'application/json', Prefer: 'return=minimal',
    },
    body: JSON.stringify({ embedding }),
  })
  if (!res.ok) throw new Error(`Update failed for ${id}: ${res.status}`)
}

function courseText(row: CourseRow): string {
  return [row.nome, row.area, row.instituicao_nome, row.distrito]
    .filter(Boolean).join(' | ')
}

async function embedBatchWithRetry(texts: string[]): Promise<number[][] | null> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch('https://api.voyageai.com/v1/embeddings', {
        method: 'POST',
        headers: { Authorization: `Bearer ${VOYAGE_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: texts, model: 'voyage-3' }),
        signal: AbortSignal.timeout(30_000),
      })

      if (res.status === 429) {
        // Rate limited — back off longer
        const backoff = RETRY_DELAY_MS * attempt
        process.stdout.write(`\n  [rate limited] waiting ${backoff / 1000}s...`)
        await new Promise(r => setTimeout(r, backoff))
        continue
      }

      if (!res.ok) {
        const body = await res.text()
        process.stdout.write(`\n  [error ${res.status}] ${body.slice(0, 120)}`)
        if (attempt < MAX_RETRIES) await new Promise(r => setTimeout(r, RETRY_DELAY_MS))
        continue
      }

      const data = await res.json()
      return (data.data as { embedding: number[] }[]).map(d => d.embedding)
    } catch (e) {
      process.stdout.write(`\n  [attempt ${attempt}] ${e}`)
      if (attempt < MAX_RETRIES) await new Promise(r => setTimeout(r, RETRY_DELAY_MS))
    }
  }
  return null
}

async function main() {
  console.log('Fetching courses without embeddings...')
  const courses = await fetchUnembedded()

  if (courses.length === 0) {
    console.log('All courses already embedded!')
    return
  }

  console.log(`Found ${courses.length} to embed (batch size: ${BATCH_SIZE}, delay: ${DELAY_MS}ms)`)

  let done = 0
  let failed = 0

  for (let i = 0; i < courses.length; i += BATCH_SIZE) {
    const batch = courses.slice(i, i + BATCH_SIZE)
    const texts = batch.map(courseText)

    process.stdout.write(`\r${done}/${courses.length} embedded, ${failed} failed`)

    const embeddings = await embedBatchWithRetry(texts)
    if (!embeddings) {
      failed += batch.length
      process.stdout.write(`\n  Skipping batch ${i}–${i + batch.length - 1} after ${MAX_RETRIES} retries`)
      continue
    }

    await Promise.all(batch.map((row, j) => updateEmbedding(row.id, embeddings[j])))
    done += batch.length

    if (i + BATCH_SIZE < courses.length) {
      await new Promise(r => setTimeout(r, DELAY_MS))
    }
  }

  process.stdout.write(`\r${done}/${courses.length} embedded, ${failed} failed\n`)
  console.log(failed === 0 ? 'Done!' : `Finished. Re-run to retry the ${failed} failed courses.`)
}

main().catch(err => { console.error(err); process.exit(1) })
