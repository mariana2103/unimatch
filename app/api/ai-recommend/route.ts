export const maxDuration = 30

const ENDPOINT = process.env.IAEDU_ENDPOINT!
const API_KEY = process.env.IAEDU_API_KEY!
const CHANNEL_ID = process.env.IAEDU_CHANNEL_ID!

const AREAS = [
  'Artes e Design',
  'Ciências da Vida e Saúde',
  'Ciências Exatas e da Natureza',
  'Direito, Ciências Sociais e Humanas',
  'Economia, Gestão e Contabilidade',
  'Educação e Desporto',
  'Engenharia e Tecnologia',
  'Informática e Dados',
]

// iaedu returns newline-delimited JSON: {"type":"token","content":"..."} per line
async function readStream(body: ReadableStream<Uint8Array>): Promise<string> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let full = ''
  let buffer = ''
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
          full += parsed.content
        } else if (parsed.type === 'done') {
          return full
        }
      } catch { /* skip malformed lines */ }
    }
  }
  return full
}

export async function POST(req: Request) {
  try {
    const { answers } = await req.json() as {
      answers: {
        interests: string
        environment: string
        social: string
        subjects: string
        career_values: string
      }
    }

    const prompt = `Analisa o perfil deste estudante português e responde APENAS com um objeto JSON válido (sem markdown, sem explicações).

RESPOSTAS DO QUESTIONÁRIO:
1. Interesses: "${answers.interests}"
2. Ambiente de trabalho: "${answers.environment}"
3. Preferência social: "${answers.social}"
4. Disciplinas: "${answers.subjects}"
5. Valores de carreira: "${answers.career_values}"

ÁREAS DISPONÍVEIS: ${AREAS.join(', ')}

Responde com este JSON exato:
{"areaWeights":{"Engenharia e Tecnologia":0.8,"Informática e Dados":0.6},"keywords":["engenharia","programação"],"summary":"Uma frase sobre o perfil do estudante."}`

    const formData = new FormData()
    formData.append('channel_id', CHANNEL_ID)
    formData.append('thread_id', `recommend-${Date.now()}`)
    formData.append('user_info', '{}')
    formData.append('message', prompt)

    const upstream = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'x-api-key': API_KEY },
      body: formData,
    })

    if (!upstream.ok) throw new Error('API error')

    const text = await readStream(upstream.body!)

    // Extract JSON object from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in response')

    const data = JSON.parse(jsonMatch[0])
    return Response.json({
      areaWeights: data.areaWeights ?? {},
      keywords: data.keywords ?? [],
      summary: data.summary ?? '',
    })
  } catch (error) {
    console.error('ai-recommend error:', error)
    return Response.json({ areaWeights: {}, keywords: [], summary: '' })
  }
}
