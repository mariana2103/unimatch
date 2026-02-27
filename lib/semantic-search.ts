// Lightweight semantic search using sparse TF-IDF vectors with cosine similarity

const PT_STOPWORDS = new Set([
  'de', 'da', 'do', 'das', 'dos', 'em', 'no', 'na', 'nos', 'nas',
  'e', 'ou', 'o', 'a', 'os', 'as', 'um', 'uma', 'com', 'por',
  'para', 'que', 'se', 'ao', 'à', 'pelo', 'pela', 'num', 'uma',
  'dum', 'duma', 'the', 'and', 'of', 'in', 'to', 'for',
  'licenciatura', 'mestrado', 'bacharel', 'ciencias', 'artes',
])

function stripAccents(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function tokenize(text: string): string[] {
  return stripAccents(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !PT_STOPWORDS.has(w))
}

type SparseVec = Map<string, number>

function toVec(text: string, weight = 1): SparseVec {
  const vec: SparseVec = new Map()
  for (const t of tokenize(text)) {
    vec.set(t, (vec.get(t) ?? 0) + weight)
  }
  return vec
}

function mergeVec(into: SparseVec, from: SparseVec): void {
  for (const [k, v] of from) {
    into.set(k, (into.get(k) ?? 0) + v)
  }
}

function cosine(a: SparseVec, b: SparseVec): number {
  let dot = 0, normA = 0, normB = 0
  for (const [k, v] of a) {
    normA += v * v
    dot += v * (b.get(k) ?? 0)
  }
  for (const [, v] of b) normB += v * v
  const denom = Math.sqrt(normA) * Math.sqrt(normB)
  return denom === 0 ? 0 : dot / denom
}

export interface AIProfile {
  areaWeights: Record<string, number>
  keywords: string[]
  summary?: string
}

export interface RankedCourse {
  id: string
  score: number
}

/**
 * Rank courses by semantic similarity to the user's questionnaire answers.
 *
 * The query is built from all questionnaire answers (combined text), then
 * boosted by AI-generated keywords and area weights.
 *
 * Each course is represented as a sparse TF vector of its name + area tokens.
 * We compute cosine similarity between query and course vectors, then blend
 * with the AI area weight (40% blend).
 */
export function rankCourses(
  answersText: string,
  courses: Array<{ id: string; nome: string; area: string }>,
  profile?: AIProfile,
): RankedCourse[] {
  // Build query vector from the combined answers
  const queryVec = toVec(answersText)

  // Boost with AI-generated keywords (weight 1.5×)
  if (profile?.keywords) {
    for (const kw of profile.keywords) {
      mergeVec(queryVec, toVec(kw, 1.5))
    }
  }

  const scored = courses.map(c => {
    // Course vector: nome (weight 2×) + area (weight 1×)
    const courseVec = toVec(c.nome, 2)
    mergeVec(courseVec, toVec(c.area, 1))

    let score = cosine(queryVec, courseVec)

    // Blend with AI area weight (40%)
    if (profile?.areaWeights) {
      const aw = profile.areaWeights[c.area] ?? 0
      score = score * 0.6 + aw * 0.4
    }

    return { id: c.id, score }
  })

  return scored.sort((a, b) => b.score - a.score)
}
