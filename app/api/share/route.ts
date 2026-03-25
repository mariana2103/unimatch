import { createClient } from '@supabase/supabase-js'

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPA_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

function randomSlug(len = 8): string {
  const chars = 'abcdefghijkmnpqrstuvwxyz23456789'
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const { courseIds, userMedia } = body

  if (!Array.isArray(courseIds) || courseIds.length === 0 || courseIds.length > 6) {
    return Response.json({ error: 'courseIds must be an array of 1–6 UUIDs' }, { status: 400 })
  }

  const supabase = createClient(SUPA_URL, SUPA_KEY)

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
