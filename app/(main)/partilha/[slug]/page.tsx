import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import { MapPin, GraduationCap, ExternalLink } from 'lucide-react'

const OPTION_LABELS = ['1ª Opção', '2ª Opção', '3ª Opção', '4ª Opção', '5ª Opção', '6ª Opção']

export default async function PartilhaPage({ params }: { params: { slug: string } }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  // Fetch snapshot
  const { data: snapshot } = await supabase
    .from('shared_candidaturas')
    .select('course_ids, user_media, created_at, expires_at')
    .eq('slug', params.slug)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (!snapshot) notFound()

  const courseIds: string[] = snapshot.course_ids ?? []
  const userMedia: number | null = snapshot.user_media ?? null

  // Fetch courses preserving order
  const { data: rows } = await supabase
    .from('courses')
    .select('id, nome, instituicao_nome, distrito, nota_ultimo_colocado, vagas, link_oficial')
    .in('id', courseIds)

  // Re-order to match saved order
  const courseMap = new Map((rows ?? []).map((r: any) => [r.id, r]))
  const courses = courseIds.map(id => courseMap.get(id)).filter(Boolean)

  const expiresAt = new Date(snapshot.expires_at)
  const daysLeft = Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 86_400_000))

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy text-white">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Candidatura Partilhada</h1>
          <p className="text-xs text-muted-foreground">
            Expira em {daysLeft} {daysLeft === 1 ? 'dia' : 'dias'}
          </p>
        </div>
      </div>

      {userMedia != null && (
        <div className="mb-4 rounded-xl border border-navy/15 bg-navy/5 px-4 py-2.5 text-sm text-navy">
          Média do aluno: <span className="font-bold">{userMedia.toFixed(1)} valores</span>
        </div>
      )}

      <ol className="space-y-3">
        {courses.map((course: any, i) => {
          const cutoff = course.nota_ultimo_colocado != null
            ? (course.nota_ultimo_colocado * 10).toFixed(2)
            : null
          // diff on 0-20 scale → multiply by 10 for display alongside the 0-200 cutoff
          const diff = userMedia != null && course.nota_ultimo_colocado != null
            ? (userMedia - course.nota_ultimo_colocado) * 10
            : null
          const accessible = diff != null && diff >= 0
          const marginal = diff != null && diff < 0 && diff >= -5

          return (
            <li
              key={course.id}
              className={[
                'rounded-xl border bg-card p-4',
                accessible ? 'border-emerald/30 bg-emerald/3' : marginal ? 'border-warning/30 bg-warning/3' : 'border-border',
              ].join(' ')}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 text-xs font-bold text-muted-foreground/50 w-16 shrink-0">
                    {OPTION_LABELS[i]}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground leading-snug">{course.nome}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{course.instituicao_nome}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {course.distrito}
                      </span>
                      {course.vagas != null && (
                        <span>{course.vagas} vagas</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  {cutoff != null && (
                    <p className="text-base font-bold text-navy tabular-nums">{cutoff}</p>
                  )}
                  {diff != null && (
                    <p className={['text-xs font-semibold', accessible ? 'text-emerald-600' : marginal ? 'text-amber-600' : 'text-muted-foreground'].join(' ')}>
                      {diff >= 0 ? '+' : ''}{diff.toFixed(1)} val.
                    </p>
                  )}
                  {course.link_oficial && (
                    <a
                      href={course.link_oficial}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-0.5 text-[10px] text-navy/60 hover:text-navy"
                    >
                      DGES <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ol>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        Criado com <span className="font-medium text-navy">UniMatch</span>
      </p>
    </div>
  )
}
