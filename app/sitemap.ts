import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'
import { toCourseSlug } from '@/lib/course-slug'

const BASE_URL = 'https://www.unimatch.pt'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const static_pages: MetadataRoute.Sitemap = [
    { url: BASE_URL,                        lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
    { url: `${BASE_URL}/simulador`,         lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/candidatura`,       lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/calendario`,        lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/bolsas`,            lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
  ]

  // One page per course
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const PAGE = 500
  let from = 0
  const coursePages: MetadataRoute.Sitemap = []

  while (true) {
    const { data, error } = await supabase
      .from('courses')
      .select('nome, instituicao_nome')
      .order('nome', { ascending: true })
      .range(from, from + PAGE - 1)

    if (error || !data || data.length === 0) break

    for (const c of data) {
      coursePages.push({
        url: `${BASE_URL}/cursos/${toCourseSlug(c.nome, c.instituicao_nome)}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.7,
      })
    }

    if (data.length < PAGE) break
    from += PAGE
  }

  return [...static_pages, ...coursePages]
}
