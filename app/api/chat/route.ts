export const maxDuration = 30

const ENDPOINT = process.env.IAEDU_ENDPOINT!
const API_KEY = process.env.IAEDU_API_KEY!
const CHANNEL_ID = process.env.IAEDU_CHANNEL_ID!

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const { message, thread_id } = body

  if (!message || typeof message !== 'string') {
    return Response.json({ error: 'Message is required' }, { status: 400 })
  }

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

  // Transform upstream newline-delimited JSON into our own SSE stream.
  // iaedu format: {"run_id":"...","type":"token","content":"text chunk"}
  //               {"run_id":"...","type":"message","content":{...}}
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
          // Keep the last (potentially incomplete) line in the buffer
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed) continue

            try {
              const parsed = JSON.parse(trimmed)

              if (parsed.type === 'token' && parsed.content) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: parsed.content })}\n\n`))
              } else if (parsed.type === 'done') {
                // Stream finished cleanly
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
