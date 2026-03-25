export const maxDuration = 30

import { vectorSearchCourses, type VectorCourseResult } from '@/lib/pgvector-search'

const ENDPOINT   = process.env.IAEDU_ENDPOINT!
const API_KEY    = process.env.IAEDU_API_KEY!
const CHANNEL_ID = process.env.IAEDU_CHANNEL_ID!
const SUPA_URL   = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPA_KEY   = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserProfile {
  media: number                                   // 0-20 scale (CFC)
  exams: { code: string; name: string; grade: number }[]  // grade 0-200
  distrito?: string | null
}

// ─── Stop words ───────────────────────────────────────────────────────────────

const STOP = new Set([
  'com', 'sem', 'para', 'que', 'como', 'qual', 'quais', 'onde', 'quando',
  'nota', 'notas', 'média', 'médias', 'menor', 'maior', 'melhor', 'pior',
  'mais', 'menos', 'tenho', 'quero', 'gosto', 'preciso', 'posso', 'entrar',
  'universidade', 'faculdade', 'instituto', 'escola', 'politécnico',
  'curso', 'cursos', 'acesso', 'candidatura', 'candidaturas',
  'nível', 'área', 'áreas', 'tipo', 'tipos', 'vagas', 'pesos',
])

const COURSE_KEYWORDS = [
  'medicina', 'direito', 'engenharia', 'economia', 'gestão', 'informática',
  'psicologia', 'farmácia', 'enfermagem', 'arquitetura', 'biologia',
  'matemática', 'física', 'química', 'história', 'filosofia', 'educação',
  'veterinária', 'dentária', 'odontologia', 'biomédicas', 'bioquímica',
  'nutrição', 'fisioterapia', 'sociologia', 'antropologia', 'geografia',
  'turismo', 'comunicação', 'jornalismo', 'marketing', 'contabilidade',
  'agronomia', 'desporto', 'teatro', 'música', 'belas',
]

function extractPrimaryTerm(message: string): string | null {
  const q = message.toLowerCase()
  for (const kw of COURSE_KEYWORDS) {
    if (q.includes(kw)) return kw
  }
  const words = q
    .split(/\s+/)
    .map(w => w.replace(/[^a-záéíóúâêôãõàèìòùüïçñ]/gi, ''))
    .filter(w => w.length >= 4 && !STOP.has(w))
  return words[words.length - 1] ?? null
}

// ─── Re-rank by cutoff proximity to user's media ──────────────────────────────
// Courses where the cutoff is closest to the user's grade appear first —
// these are the most actionable (just in reach or just out of reach).

function rerankByCutoffProximity(
  results: VectorCourseResult[],
  userMedia: number,   // 0-20 scale, same as nota_ultimo_colocado in DB
): VectorCourseResult[] {
  const withData    = results.filter(r => r.nota_ultimo_colocado !== null)
  const withoutData = results.filter(r => r.nota_ultimo_colocado === null)
  return [
    ...withData.sort((a, b) =>
      Math.abs(a.nota_ultimo_colocado! - userMedia) -
      Math.abs(b.nota_ultimo_colocado! - userMedia)
    ),
    ...withoutData,
  ]
}

// ─── Format course rows into context block ────────────────────────────────────

function formatContext(data: VectorCourseResult[], userMedia?: number): string {
  if (!data.length) return ''
  const lines = data.map(c => {
    const corte = c.nota_ultimo_colocado != null
      ? (Number(c.nota_ultimo_colocado) * 10).toFixed(2)
      : 'sem dados'
    const inst = c.instituicao_nome ?? c.distrito ?? '?'
    // Add delta vs user's approximate nota when available
    let delta = ''
    if (userMedia != null && c.nota_ultimo_colocado != null) {
      const diff = (userMedia - c.nota_ultimo_colocado).toFixed(1)
      delta = ` | Aluno ${Number(diff) >= 0 ? '+' : ''}${diff} val. vs corte`
    }
    return `• ${c.nome} — ${inst} | Corte 2025 (1ª fase): ${corte}${delta} | Vagas: ${c.vagas ?? '?'}`
  }).join('\n')

  return `[DADOS REAIS UniMatch 2025 — cita APENAS estes valores, nunca uses dados do teu treino:\n${lines}\n]`
}

// ─── Build user profile context ───────────────────────────────────────────────

function buildProfileContext(profile: UserProfile): string {
  const parts: string[] = []

  if (profile.media > 0) {
    parts.push(`Média do secundário (CFC): ${profile.media.toFixed(1)} valores`)
  }
  if (profile.exams.length > 0) {
    const examStr = profile.exams
      .map(e => `${e.name} (${e.code}): ${(e.grade / 10).toFixed(1)} val.`)
      .join(', ')
    parts.push(`Provas de ingresso: ${examStr}`)
  }
  if (profile.distrito) {
    parts.push(`Zona de residência: ${profile.distrito}`)
  }

  if (parts.length === 0) return ''

  return [
    `[PERFIL DO ALUNO:`,
    ...parts.map(p => `• ${p}`),
    `→ Personaliza as tuas respostas a este perfil. Indica claramente se o aluno provavelmente entra (acima do corte) ou não (abaixo do corte) em cada curso que mencionares.]`,
  ].join('\n')
}

// ─── Fetch course context (vector → ilike fallback, always ≥ 5 results) ──────

async function fetchCourseContext(
  message: string,
  profile?: UserProfile | null,
): Promise<string> {
  if (!SUPA_URL || !SUPA_KEY) return ''

  const q = message.toLowerCase()
  const wantsLowest = /baixa|menor|mínima|mínimo|fácil|acessível/.test(q)

  let results: VectorCourseResult[] | null = null

  // 1. Try semantic vector search
  results = await vectorSearchCourses(message, 20, wantsLowest)

  // 2. If vector search returned nothing, fall back to ilike
  if (!results || results.length === 0) {
    const term = extractPrimaryTerm(message)
    if (term) {
      const order = wantsLowest
        ? 'nota_ultimo_colocado.asc.nullslast'
        : 'nota_ultimo_colocado.desc.nullslast'
      try {
        const res = await fetch(
          `${SUPA_URL}/rest/v1/courses` +
          `?or=(nome.ilike.*${encodeURIComponent(term)}*,distrito.ilike.*${encodeURIComponent(term)}*,instituicao_nome.ilike.*${encodeURIComponent(term)}*)` +
          `&select=nome,instituicao_nome,nota_ultimo_colocado,vagas,distrito` +
          `&order=${order}&limit=20`,
          { headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` }, signal: AbortSignal.timeout(5000) },
        )
        if (res.ok) results = await res.json()
      } catch { /* ignore */ }
    }
  }

  // 3. If still nothing, inject at least 5 courses sorted by nota
  //    so the AI always has some real data to reference
  if (!results || results.length === 0) {
    try {
      const res = await fetch(
        `${SUPA_URL}/rest/v1/courses` +
        `?select=nome,instituicao_nome,nota_ultimo_colocado,vagas,distrito` +
        `&nota_ultimo_colocado=not.is.null` +
        `&order=nota_ultimo_colocado.desc.nullslast&limit=5`,
        { headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` }, signal: AbortSignal.timeout(5000) },
      )
      if (res.ok) results = await res.json()
    } catch { /* ignore */ }
  }

  if (!results || results.length === 0) return ''

  // 4. Re-rank by cutoff proximity when user profile is available
  const finalResults = profile && profile.media > 0
    ? rerankByCutoffProximity(results, profile.media)
    : results

  // Always show top 5 minimum, up to 20
  const toShow = finalResults.slice(0, 20)
  return formatContext(toShow, profile?.media)
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const { message, thread_id, userProfile } = body

  if (!message || typeof message !== 'string') {
    return Response.json({ error: 'Message is required' }, { status: 400 })
  }

  const profile: UserProfile | null = userProfile ?? null

  // Build system directive — injected before the user's message
  const systemDirective = [
    `[SISTEMA UNIMATCH — REGRAS OBRIGATÓRIAS:`,
    `1. Usa APENAS os valores de corte e vagas dos blocos [DADOS REAIS] abaixo — NUNCA os do teu treino`,
    `2. Cita sempre o nome EXATO do curso e da instituição como aparecem nos dados`,
    `3. Se o aluno tem perfil definido, diz explicitamente se entra ou não em cada curso que mencionas`,
    `4. Responde em português europeu, de forma clara e direta`,
    `5. Se não houver dados suficientes para responder, diz-o claramente]`,
  ].join('\n')

  // Fetch real DB context (with profile re-ranking)
  const [profileContext, courseContext] = await Promise.all([
    Promise.resolve(profile ? buildProfileContext(profile) : ''),
    fetchCourseContext(message, profile),
  ])

  // Assemble enriched message: directive → profile → user message → course data
  const enrichedMessage = [
    systemDirective,
    profileContext,
    message,
    courseContext,
  ].filter(Boolean).join('\n\n')

  const formData = new FormData()
  formData.append('channel_id', CHANNEL_ID)
  formData.append('thread_id', thread_id ?? 'default-thread')
  formData.append('user_info', profile ? JSON.stringify({ media: profile.media, distrito: profile.distrito }) : '{}')
  formData.append('message', enrichedMessage)

  const upstream = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'x-api-key': API_KEY },
    body: formData,
    signal: req.signal,
  })

  if (!upstream.ok) {
    return Response.json({ error: 'AI service error' }, { status: 500 })
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const reader = upstream.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed) continue
            try {
              const parsed = JSON.parse(trimmed)
              if (parsed.type === 'token' && parsed.content) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: parsed.content })}\n\n`))
              } else if (parsed.type === 'done') {
                return
              }
            } catch { /* skip malformed lines */ }
          }
        }
      } finally {
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
  })
}
