import { isAllowed, getIP, rateLimitedResponse } from '@/lib/rate-limit'
import { createClient } from '@/lib/supabase/server'

function randomSlug(len = 8): string {
  const chars = 'abcdefghijkmnpqrstuvwxyz23456789'
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export async function POST(req: Request) {
  // Rate limit: 10 shares per hour per IP
  const ip = getIP(req)
  if (!isAllowed(`share:${ip}`, 10, 60 * 60 * 1000)) return rateLimitedResponse()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Authentication required' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { courseIds, userMedia } = body

  if (!Array.isArray(courseIds) || courseIds.length === 0 || courseIds.length > 6) {
    return Response.json({ error: 'courseIds must be an array of 1–6 UUIDs' }, { status: 400 })
  }

  // Try up to 5 times in case of slug collision (astronomically unlikely)
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = randomSlug()
    const { data, error } = await supabase
      .from('shared_candidaturas')
      .insert({ slug, course_ids: courseIds, user_media: userMedia ?? null })
      .select('slug')
      .single()

    if (!error && data) {
      return Response.json({ slug: data.slug })
    }
    // If it was a unique violation on slug, retry — otherwise bail
    if (error && !error.message.includes('unique')) {
      return Response.json({ error: error.message }, { status: 500 })
    }
  }

  return Response.json({ error: 'Could not generate unique slug' }, { status: 500 })
}
