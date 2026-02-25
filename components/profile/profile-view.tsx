'use client'

import { Construction } from 'lucide-react'
import { useUser } from '@/lib/user-context'
import { ProfileHeader } from './profile-header'
import { ProfileSettings } from './profile-settings'
import { GradesSection } from './grades-section'
import { ExamsSection } from './exams-section'

export function ProfileView() {
  const { isLoggedIn, profile, grades, exams } = useUser()

  if (!isLoggedIn || !profile) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Por favor, faz login para veres o teu perfil.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl py-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <Construction className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          <span className="font-semibold">Em desenvolvimento.</span>{' '}
          Já podes inserir as tuas notas do secundário e exames para calcular a tua média de candidatura.
          Mais funcionalidades em breve.
        </p>
      </div>

      <ProfileHeader profile={profile} />

      <div className="grid gap-8 md:grid-cols-1">
        <ProfileSettings profile={profile} />
        <GradesSection grades={grades} courseGroup={profile.course_group || 'CIENCIAS'} />
        <ExamsSection exams={exams} />
      </div>
    </div>
  )
}
