import type { Metadata } from 'next'
import { SavedCoursesSection } from '@/components/saved-courses-section'

export const metadata: Metadata = {
  title: 'Minha Candidatura — Organiza as Tuas 6 Opções',
  description: 'Organiza as tuas 6 opções de candidatura ao ensino superior por ordem de preferência. O DGES coloca-te na primeira opção onde és elegível.',
  keywords: ['candidatura ensino superior', 'opções candidatura DGES', 'organizar candidatura universidade', 'candidatura 2025'],
}

export default function CandidaturaPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Minha Candidatura</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Organiza as tuas 6 opções por ordem de preferência. O DGES coloca-te na primeira opção onde elegível.
        </p>
      </div>
      
      <SavedCoursesSection />
    </div>
  )
}
