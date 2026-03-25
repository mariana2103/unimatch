import { SavedCoursesSection } from '@/components/saved-courses-section'

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
