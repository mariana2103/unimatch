/**
 * Deterministic slug for a course.
 * Used for /cursos/[slug] pages and sitemap generation.
 */
export function toCourseSlug(nome: string, instituicao: string): string {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // strip accents
      .replace(/[^a-z0-9\s]/g, '')     // keep only alphanum + spaces
      .trim()
      .replace(/\s+/g, '-')            // spaces → dashes
      .replace(/-+/g, '-')             // collapse consecutive dashes

  return `${normalize(nome)}-${normalize(instituicao)}`
}
