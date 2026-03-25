// Simple in-memory rate limiter.
// Works well for a single-instance deployment (Vercel serverless warm instances).
// For high-traffic multi-instance deployments, swap for @upstash/ratelimit + Redis.

const store = new Map<string, { count: number; resetAt: number }>()

// Prune stale entries every 5 minutes to avoid unbounded memory growth
let lastPrune = Date.now()
function maybePrune() {
  const now = Date.now()
  if (now - lastPrune < 5 * 60 * 1000) return
  lastPrune = now
  for (const [key, val] of store) {
    if (val.resetAt < now) store.delete(key)
  }
}

/**
 * Returns true if the request is allowed, false if rate-limited.
 * @param key      Unique key per client (IP + optional route suffix)
 * @param limit    Max requests allowed in the window
 * @param windowMs Window duration in milliseconds
 */
export function isAllowed(key: string, limit: number, windowMs: number): boolean {
  maybePrune()
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= limit) return false

  entry.count++
  return true
}

/** Extract the real client IP from Next.js request headers. */
export function getIP(req: Request): string {
  const forwarded = (req.headers as Headers).get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return 'unknown'
}

/** Pre-built 429 response. */
export function rateLimitedResponse(): Response {
  return Response.json(
    { error: 'Too many requests. Tenta novamente em breve.' },
    { status: 429, headers: { 'Retry-After': '60' } },
  )
}
