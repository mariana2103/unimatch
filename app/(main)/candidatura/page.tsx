import type { Metadata } from 'next'
import { SavedCoursesSection } from '@/components/saved-courses-section'

export const metadata: Metadata = {
  title: 'Minha Candidatura — Organiza as Tuas 6 Opções',
  description: 'Organiza as tuas 6 opções de candidatura ao ensino superior por ordem de preferência. O DGES coloca-te na primeira opção onde és elegível.',
  keywords: ['candidatura ensino superior', 'opções candidatura DGES', 'organizar candidatura universidade', 'candidatura 2025'],
}

export default function CandidaturaPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-foreground">Minha Candidatura</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Organiza as tuas 6 opções por ordem de preferência. O DGES coloca-te na primeira opção onde elegível.
        </p>
      </div>
      
      <SavedCoursesSection />
    </div>
  )
}
