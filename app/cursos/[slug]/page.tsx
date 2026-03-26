import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { MapPin, BookOpen, Users, ArrowLeft, ExternalLink, TrendingUp } from 'lucide-react'
import { toCourseSlug } from '@/lib/course-slug'
import { EXAM_SUBJECTS } from '@/lib/constants'

const BASE_URL = 'https://www.unimatch.pt'

// ─── Supabase (server-side only) ──────────────────────────────────────────────

function supabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

const SELECT = `
  id, nome, instituicao_nome, distrito, area, tipo, vagas,
  nota_ultimo_colocado, nota_ultimo_colocado_f2,
  nota_minima_p_ingresso, nota_minima_prova,
  peso_secundario, peso_exames, link_oficial, history,
  course_requirements(exam_code, weight, conjunto_id)
`

// ─── Fetch all courses (used both for params and for lookup) ──────────────────

async function getAllCourses() {
  try {
    const sb = supabase()
    const PAGE = 500
    let from = 0
    const all: any[] = []
    while (true) {
      const { data, error } = await sb
        .from('courses')
        .select(SELECT)
        .order('nome', { ascending: true })
        .range(from, from + PAGE - 1)
      if (error || !data || data.length === 0) break
      all.push(...data)
      if (data.length < PAGE) break
      from += PAGE
    }
    return all
  } catch {
    return []
  }
}

// ─── Allow on-demand rendering for any slug not pre-built ─────────────────────
export const dynamicParams = true

// ─── Static params — pre-render nothing at build time (rely on ISR) ───────────

export async function generateStaticParams() {
  return []
}

// ─── Per-page metadata ────────────────────────────────────────────────────────

export async function generateMetadata(
  { params }: { params: { slug: string } },
): Promise<Metadata> {
  const courses = await getAllCourses()
  const row = courses.find(c => toCourseSlug(c.nome, c.instituicao_nome) === params.slug)
  if (!row) return { title: 'Curso não encontrado' }

  const corte = row.nota_ultimo_colocado != null
    ? (row.nota_ultimo_colocado * 10).toFixed(2)
    : null

  const title = corte
    ? `${row.nome} — ${row.instituicao_nome} | Nota de Entrada ${corte} | UniMatch`
    : `${row.nome} — ${row.instituicao_nome} | UniMatch`

  const reqs: any[] = row.course_requirements ?? []
  const examNames = reqs
    .map((r: any) => EXAM_SUBJECTS.find(e => e.code === r.exam_code)?.name ?? r.exam_code)
    .join(', ')

  const description = [
    `${row.nome} na ${row.instituicao_nome}.`,
    corte ? `Nota de entrada 2025 (1ª fase, último colocado): ${corte} valores.` : null,
    row.vagas ? `${row.vagas} vagas.` : null,
    examNames ? `Provas de ingresso: ${examNames}.` : null,
    `Histórico de médias, simulador de candidatura e mais no UniMatch.`,
  ].filter(Boolean).join(' ')

  const pageUrl = `${BASE_URL}/cursos/${params.slug}`

  return {
    title,
    description,
    keywords: [
      row.nome,
      row.instituicao_nome,
      'nota de corte',
      'média entrada',
      'DGES',
      row.area,
      row.distrito,
      'candidatura ensino superior',
    ],
    alternates: { canonical: pageUrl },
    openGraph: {
      title,
      description,
      url: pageUrl,
      type: 'website',
      locale: 'pt_PT',
      siteName: 'UniMatch',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CursoPage({ params }: { params: { slug: string } }) {
  const courses = await getAllCourses()
  const row = courses.find(c => toCourseSlug(c.nome, c.instituicao_nome) === params.slug)
  if (!row) notFound()

  const corte1 = row.nota_ultimo_colocado != null ? (row.nota_ultimo_colocado * 10).toFixed(2) : null
  const corte2 = row.nota_ultimo_colocado_f2 != null ? (row.nota_ultimo_colocado_f2 * 10).toFixed(2) : null
  const notaMin = row.nota_minima_p_ingresso != null ? (row.nota_minima_p_ingresso * 10).toFixed(2) : null
  const pesos = row.peso_secundario != null && row.peso_exames != null
    ? `${(row.peso_secundario * 100).toFixed(0)}% sec. / ${(row.peso_exames * 100).toFixed(0)}% exames`
    : null

  const reqs: any[] = row.course_requirements ?? []
  // Group by conjunto_id
  const conjuntos = new Map<number, any[]>()
  for (const r of reqs) {
    const cid = r.conjunto_id ?? 1
    if (!conjuntos.has(cid)) conjuntos.set(cid, [])
    conjuntos.get(cid)!.push(r)
  }
  const examGroups = Array.from(conjuntos.values())

  const history: any[] = row.history
    ? [...row.history]
        .filter((h: any) => h.nota_f1 != null || h.vagas_f1 != null)
        .sort((a: any, b: any) => b.year - a.year)
        .slice(0, 8)
    : []

  const hasF2 = history.some((h: any) => h.nota_f2 != null || h.vagas_f2 != null)

  // Trend: last year vs first year in history
  const trend = history.length >= 2
    ? (history[0].nota_f1 ?? 0) - (history[history.length - 1].nota_f1 ?? 0)
    : null

  // ── JSON-LD structured data ──────────────────────────────────────────────────
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: row.nome,
    provider: {
      '@type': 'EducationalOrganization',
      name: row.instituicao_nome,
      address: { '@type': 'PostalAddress', addressRegion: row.distrito, addressCountry: 'PT' },
    },
    description: `${row.nome} na ${row.instituicao_nome}. ${corte1 ? `Nota de corte 2025: ${corte1} valores.` : ''} ${row.vagas ? `${row.vagas} vagas disponíveis.` : ''}`.trim(),
    url: `${BASE_URL}/cursos/${params.slug}`,
    inLanguage: 'pt-PT',
    educationalLevel: 'Licenciatura',
    ...(row.vagas ? { numberOfCredits: row.vagas } : {}),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-background">
        {/* Nav bar */}
        <nav className="sticky top-0 z-10 border-b border-border/40 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-navy hover:opacity-80 transition-opacity">
              <span className="text-lg font-bold">UniMatch</span>
            </Link>
            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-lg border border-border/50 px-3 py-1.5 text-xs text-muted-foreground hover:border-navy/30 hover:text-navy transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Explorador
            </Link>
          </div>
        </nav>

        <main className="mx-auto max-w-3xl px-4 py-8 pb-16">

          {/* Header */}
          <div className="mb-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {row.nome}
                </h1>
                <p className="mt-1 text-base text-muted-foreground">{row.instituicao_nome}</p>
              </div>
              {row.link_oficial && (
                <a
                  href={row.link_oficial}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium text-muted-foreground hover:border-navy/40 hover:text-navy transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Ver no DGES
                </a>
              )}
            </div>

            {/* Badges */}
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-navy px-3 py-1 text-xs font-medium text-white">{row.area}</span>
              <span className="flex items-center gap-1 rounded-full border px-3 py-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />{row.distrito}
              </span>
              {row.vagas != null && (
                <span className="flex items-center gap-1 rounded-full border px-3 py-1 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />{row.vagas} vagas
                </span>
              )}
              <span className="rounded-full border px-3 py-1 text-xs text-muted-foreground">
                {row.tipo === 'publica' ? 'Ensino Público' : 'Ensino Privado'}
              </span>
            </div>
          </div>

          {/* Key stats */}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Últ. Colocado 1ª F. 2025', value: corte1 ?? '—', highlight: true },
              { label: 'Últ. Colocado 2ª F. 2025', value: corte2 ?? '—', highlight: false },
              { label: 'Nota Mínima', value: notaMin ?? '—', highlight: false },
              { label: 'Ponderação', value: pesos ?? '—', highlight: false, small: true },
            ].map(s => (
              <div key={s.label} className="flex flex-col gap-1 rounded-xl border bg-card p-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground leading-tight">{s.label}</span>
                <span className={`font-bold tabular-nums ${'small' in s && s.small ? 'text-base' : 'text-xl'} ${s.highlight ? 'text-navy' : 'text-foreground'}`}>
                  {s.value}
                </span>
              </div>
            ))}
          </div>

          {/* Trend callout */}
          {trend !== null && (
            <div className="mb-6 flex items-center gap-2 rounded-xl border border-border/40 bg-muted/30 px-4 py-3 text-sm">
              <TrendingUp className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">
                Evolução histórica da nota:
                <span className={`ml-1 font-semibold ${trend > 0 ? 'text-emerald-600' : trend < 0 ? 'text-destructive' : 'text-foreground'}`}>
                  {trend > 0 ? '+' : ''}{(trend / 10).toFixed(2)} valores
                </span>
                <span className="text-muted-foreground/60"> nos últimos {history.length} anos</span>
              </span>
            </div>
          )}

          {/* Provas de ingresso */}
          {examGroups.length > 0 && (
            <div className="mb-6">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Provas de Ingresso
              </h2>
              <div className="flex flex-col gap-2">
                {examGroups.map((group, i) => (
                  <div key={i}>
                    {i > 0 && (
                      <div className="my-2 flex items-center gap-2">
                        <div className="h-px flex-1 bg-border/40" />
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">ou</span>
                        <div className="h-px flex-1 bg-border/40" />
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {group.map((r: any) => {
                        const name = EXAM_SUBJECTS.find(e => e.code === r.exam_code)?.name ?? r.exam_code
                        return (
                          <span key={r.exam_code} className="flex items-center gap-1.5 rounded-lg border bg-muted/40 px-3 py-1.5 text-xs">
                            <BookOpen className="h-3 w-3 text-muted-foreground" />
                            <span className="font-medium text-navy">{r.exam_code}</span>
                            <span className="text-muted-foreground">· {name}</span>
                          </span>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Historical table */}
          {history.length > 0 && (
            <div className="mb-6">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Histórico de Notas
              </h2>
              <div className="overflow-x-auto rounded-xl border border-border/40">
                <table className="w-full text-sm tabular-nums">
                  <thead>
                    <tr className="border-b border-border/40 bg-muted/30">
                      <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">Ano</th>
                      <th className="px-4 py-2.5 text-right font-semibold text-muted-foreground">Ult. Colocado 1ª</th>
                      <th className="px-4 py-2.5 text-right font-semibold text-muted-foreground">Vagas</th>
                      {hasF2 && <th className="px-4 py-2.5 text-right font-semibold text-muted-foreground">Ult. Colocado 2ª</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((h: any) => (
                      <tr key={h.year} className="border-b border-border/20 last:border-0 hover:bg-muted/20">
                        <td className="px-4 py-2.5 font-medium text-foreground">{h.year}</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-navy">
                          {h.nota_f1 != null ? (h.nota_f1 * 10).toFixed(2) : '—'}
                        </td>
                        <td className="px-4 py-2.5 text-right text-muted-foreground">
                          {h.vagas_f1 ?? '—'}
                        </td>
                        {hasF2 && (
                          <td className="px-4 py-2.5 text-right text-muted-foreground">
                            {h.nota_f2 != null ? (h.nota_f2 * 10).toFixed(2) : '—'}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="rounded-2xl border border-navy/15 bg-navy/5 p-6 text-center">
            <h2 className="text-base font-bold text-foreground">
              Qual é a tua nota de candidatura para {row.nome}?
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Simula a tua nota, compara com a nota do último colocado e descobre as tuas hipóteses.
            </p>
            <Link
              href="/"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy/90 transition-colors"
            >
              Abrir Simulador no UniMatch
            </Link>
          </div>

        </main>

        <footer className="border-t border-border/40 py-6">
          <div className="mx-auto max-w-3xl px-4 text-center text-xs text-muted-foreground">
            Dados oficiais baseados na DGES · © 2026 UniMatch
          </div>
        </footer>
      </div>
    </>
  )
}
