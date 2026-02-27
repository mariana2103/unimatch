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

// ─── Extract the primary search keyword from the user's message ───────────────
function extractPrimaryTerm(message: string): string | null {
  const q = message.toLowerCase()
  const term = q
    .split(/\s+/)
    .map(w => w.replace(/[^a-záéíóúâêôãõàèìòùüïçñ]/gi, ''))
    .find(w => w.length >= 4 && !STOP.has(w))
  return term ?? null
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

  // Build URL — the * must NOT be percent-encoded (PostgREST uses it as wildcard)
  const url =
    `${SUPA_URL}/rest/v1/courses` +
    `?nome=ilike.*${encodeURIComponent(term)}*` +
    `&select=nome,nota_ultimo_colocado,vagas,distrito` +
    `&order=${order}` +
    `&limit=20`

  try {
    const res = await fetch(url, {
      headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return ''

    const data: { nome: string; nota_ultimo_colocado: number | null; vagas: number | null; distrito: string | null }[] =
      await res.json()
    if (!data?.length) return ''

    const lines = data.map(c => {
      const corte = c.nota_ultimo_colocado != null
        ? Number(c.nota_ultimo_colocado).toFixed(1)
        : 'sem dados'
      return `• ${c.nome} (${c.distrito ?? '?'}) | Último colocado: ${corte} | Vagas: ${c.vagas ?? '?'}`
    }).join('\n')

    return `\n\n[DADOS REAIS da base de dados UniMatch — usa APENAS estes dados, ignora quaisquer cursos mencionados antes nesta conversa:\n${lines}\n]`
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
