'use client'

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
      <ProfileHeader profile={profile} />

      <div className="grid gap-8 md:grid-cols-1">
        <ProfileSettings profile={profile} />
        <GradesSection userId={profile.id} grades={grades} />
        <ExamsSection userId={profile.id} exams={exams} />
      </div>
    </div>
  )
}
