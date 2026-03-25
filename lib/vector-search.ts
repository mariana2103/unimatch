/**
 * Vector semantic search for courses using pgvector + OpenAI embeddings
 * Replaces TF-IDF with proper vector similarity
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Embedding model: text-embedding-3-small (1536 dimensions, ~$0.02 per 1M tokens)
// Alternative: text-embedding-3-large (3072 dimensions, ~$0.13 per 1M tokens)
// Alternative: Voyage AI (if you prefer)

interface VectorSearchResult {
  id: string
  nome: string
  instituicao_nome: string
  area: string
  tipo: string
  similarity: number
}

/**
 * Generate embedding for query text using OpenAI
 */
async function generateEmbedding(text: string): Promise<number[] | null> {
  if (!OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY not set')
    return null
  }

  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: text,
        model: 'text-embedding-3-small',
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    return data.data[0].embedding as number[]
  } catch (error) {
    console.error('Error generating embedding:', error)
    return null
  }
}

/**
 * Search courses by semantic similarity using pgvector
 */
export async function vectorSearchCourses(
  query: string,
  limit: number = 10,
  threshold: number = 0.5
): Promise<VectorSearchResult[]> {
  // Generate embedding for query
  const embedding = await generateEmbedding(query)
  if (!embedding) {
    console.warn('Failed to generate embedding, falling back to text search')
    return []
  }

  // Call Supabase RPC function
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/rpc/search_courses_by_embedding`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY!,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({
          query_embedding: embedding,
          match_threshold: threshold,
          match_count: limit,
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`Supabase RPC error: ${response.status}`)
    }

    const results: VectorSearchResult[] = await response.json()
    return results
  } catch (error) {
    console.error('Error in vector search:', error)
    return []
  }
}

/**
 * Hybrid search: combines vector similarity with keyword matching
 * Falls back to TF-IDF if vector search fails
 */
export async function hybridSearchCourses(
  query: string,
  limit: number = 20,
  courses?: any[]
): Promise<any[]> {
  // Try vector search first
  const vectorResults = await vectorSearchCourses(query, limit, 0.3)
  
  if (vectorResults.length > 0) {
    return vectorResults.map(r => ({
      id: r.id,
      nome: r.nome,
      instituicao: r.instituicao_nome,
      area: r.area,
      tipo: r.tipo,
      score: r.similarity,
    }))
  }

  // Fallback to client-side TF-IDF if provided
  if (courses && courses.length > 0) {
    const { rankCourses } = await import('./semantic-search')
    const ranked = rankCourses(query, courses, { areaWeights: {}, keywords: [] })
    return ranked.slice(0, limit)
  }

  return []
}

/**
 * Generate embeddings for all courses (batch job)
 * Run this once to populate the embedding column
 */
export async function generateCourseEmbeddings(courses: any[]): Promise<void> {
  if (!OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY not set')
    return
  }

  const BATCH_SIZE = 100
  const DELAY_MS = 200 // Rate limiting

  for (let i = 0; i < courses.length; i += BATCH_SIZE) {
    const batch = courses.slice(i, i + BATCH_SIZE)
    
    // Prepare texts
    const texts = batch.map(c => 
      `${c.nome} | ${c.instituicao} | ${c.area} | ${c.distrito}`
    )

    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: texts,
          model: 'text-embedding-3-small',
        }),
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`)
      }

      const data = await response.json()
      const embeddings = data.data.map((d: any) => d.embedding)

      // Update Supabase
      await Promise.all(
        batch.map((course, j) => 
          fetch(`${SUPABASE_URL}/rest/v1/courses?id=eq.${course.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_KEY!,
              'Authorization': `Bearer ${SUPABASE_KEY}`,
              'Prefer': 'return=minimal',
            },
            body: JSON.stringify({ embedding: embeddings[j] }),
          })
        )
      )

      console.log(`Embedded batch ${i/BATCH_SIZE + 1}/${Math.ceil(courses.length/BATCH_SIZE)}`)
      
      if (i + BATCH_SIZE < courses.length) {
        await new Promise(r => setTimeout(r, DELAY_MS))
      }
    } catch (error) {
      console.error(`Error embedding batch ${i}:`, error)
    }
  }
}
