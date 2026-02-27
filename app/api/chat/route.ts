export const maxDuration = 30

const ENDPOINT = process.env.IAEDU_ENDPOINT!
const API_KEY = process.env.IAEDU_API_KEY!
const CHANNEL_ID = process.env.IAEDU_CHANNEL_ID!

export async function POST(req: Request) {
  const { message, thread_id } = await req.json()

  const formData = new FormData()
  formData.append('channel_id', CHANNEL_ID)
  formData.append('thread_id', thread_id ?? 'default-thread')
  formData.append('user_info', '{}')
  formData.append('message', message)

  const upstream = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'x-api-key': API_KEY },
    body: formData,
    signal: req.signal,
  })

  if (!upstream.ok) {
    return Response.json({ error: 'AI service error' }, { status: 500 })
  }

  // Transform upstream SSE into our own SSE stream
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const reader = upstream.body!.getReader()
      const decoder = new TextDecoder()

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          for (const line of chunk.split('\n')) {
            const trimmed = line.trim()
            if (!trimmed.startsWith('data:')) continue

            const raw = trimmed.slice(5).trim()
            if (!raw || raw === '[DONE]') continue

            // iaedu may return plain text or JSON — normalise to { text }
            let text = raw
            try {
              const parsed = JSON.parse(raw)
              text = parsed.text ?? parsed.content ?? parsed.message ?? parsed.delta ?? raw
            } catch { /* plain text chunk */ }

            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
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
