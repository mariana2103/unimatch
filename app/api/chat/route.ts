export const maxDuration = 30

const ENDPOINT = process.env.IAEDU_ENDPOINT!
const API_KEY = process.env.IAEDU_API_KEY!
const CHANNEL_ID = process.env.IAEDU_CHANNEL_ID!
const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPA_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// ─── Stop words — common Portuguese question words that are not course names ──
const STOP = new Set([
  'com', 'sem', 'para', 'que', 'como', 'qual', 'quais', 'onde', 'quando',
  'nota', 'notas', 'média', 'médias', 'menor', 'maior', 'melhor', 'pior',
  'mais', 'menos', 'tenho', 'quero', 'gosto', 'preciso', 'posso', 'entrar',
  'universidade', 'faculdade', 'instituto', 'escola', 'politécnico',
  'curso', 'cursos', 'acesso', 'candidatura', 'candidaturas',
  'nível', 'área', 'áreas', 'tipo', 'tipos', 'vagas', 'pesos',
])

// ─── Known course/field keywords — checked before generic extraction ──────────
const COURSE_KEYWORDS = [
  'medicina', 'direito', 'engenharia', 'economia', 'gestão', 'informática',
  'psicologia', 'farmácia', 'enfermagem', 'arquitetura', 'biologia',
  'matemática', 'física', 'química', 'história', 'filosofia', 'educação',
  'veterinária', 'dentária', 'odontologia', 'biomédicas', 'bioquímica',
  'nutrição', 'fisioterapia', 'sociologia', 'antropologia', 'geografia',
  'turismo', 'comunicação', 'jornalismo', 'marketing', 'contabilidade',
  'agronomia', 'desporto', 'teatro', 'música', 'belas',
]

// ─── Extract the primary search keyword from the user's message ───────────────
function extractPrimaryTerm(message: string): string | null {
  const q = message.toLowerCase()

  // 1. Prefer an explicit course/field name if present
  for (const kw of COURSE_KEYWORDS) {
    if (q.includes(kw)) return kw
  }

  // 2. Fallback: use the LAST meaningful token (not the first) — in Portuguese
  //    questions the subject ("Açores", "Porto") tends to come at the end.
  const words = q
    .split(/\s+/)
    .map(w => w.replace(/[^a-záéíóúâêôãõàèìòùüïçñ]/gi, ''))
    .filter(w => w.length >= 4 && !STOP.has(w))

  return words[words.length - 1] ?? null
}

// ─── Query Supabase and return a formatted context block ──────────────────────
async function fetchCourseContext(message: string): Promise<string> {
  if (!SUPA_URL || !SUPA_KEY) return ''

  const term = extractPrimaryTerm(message)
  if (!term) return ''

  const q = message.toLowerCase()
  const wantsLowest = /baixa|menor|mínima|mínimo|fácil|acessível/.test(q)
  const order = wantsLowest
    ? 'nota_ultimo_colocado.asc.nullslast'
    : 'nota_ultimo_colocado.desc.nullslast'

  const encoded = encodeURIComponent(term)

  // Search across nome, distrito AND instituicao_nome so that location-based
  // queries like "Açores" or "Porto" actually return results from the DB.
  const url =
    `${SUPA_URL}/rest/v1/courses` +
    `?or=(nome.ilike.*${encoded}*,distrito.ilike.*${encoded}*,instituicao_nome.ilike.*${encoded}*)` +
    `&select=nome,instituicao_nome,nota_ultimo_colocado,vagas,distrito,history` +
    `&order=${order}` +
    `&limit=20`

  try {
    const res = await fetch(url, {
      headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return ''

    const data: {
      nome: string
      instituicao_nome: string | null
      nota_ultimo_colocado: number | null
      vagas: number | null
      distrito: string | null
      history: Record<string, { nota_ultimo_colocado?: number }> | null
    }[] = await res.json()
    if (!data?.length) return ''

    // Determine the most recent year stored in history (or label as "mais recente")
    const allYears = data.flatMap(c =>
      c.history ? Object.keys(c.history).map(Number).filter(Boolean) : []
    )
    const latestYear = allYears.length ? Math.max(...allYears) : null
    const yearLabel = latestYear ? `${latestYear}` : 'mais recente'

    const lines = data.map(c => {
      const corte = c.nota_ultimo_colocado != null
        ? Number(c.nota_ultimo_colocado).toFixed(1)
        : 'sem dados'
      const inst = c.instituicao_nome ?? c.distrito ?? '?'
      return `• ${c.nome} — ${inst} | Último colocado (${yearLabel}): ${corte} | Vagas: ${c.vagas ?? '?'}`
    }).join('\n')

    return `\n\n[DADOS REAIS da base de dados UniMatch (edição ${yearLabel}) — usa APENAS estes dados, não uses dados de anos anteriores nem conhecimento do teu treino:\n${lines}\n]`
  } catch {
    return ''
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const { message, thread_id } = body

  if (!message || typeof message !== 'string') {
    return Response.json({ error: 'Message is required' }, { status: 400 })
  }

  // Query real DB data and inject it before sending to the AI
  const dbContext = await fetchCourseContext(message)
  const enrichedMessage = message + dbContext

  const formData = new FormData()
  formData.append('channel_id', CHANNEL_ID)
  formData.append('thread_id', thread_id ?? 'default-thread')
  formData.append('user_info', '{}')
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

  // Transform upstream newline-delimited JSON into SSE.
  // iaedu format: {"run_id":"...","type":"token","content":"text chunk"}
  //               {"run_id":"...","type":"done","content":"..."}
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
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  })
}
