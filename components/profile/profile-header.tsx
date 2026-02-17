'use client'

import { Badge } from '@/components/ui/badge'
import { UserAvatar } from '@/components/user-avatar'
import type { Profile } from '@/lib/types'

interface ProfileHeaderProps {
  profile: Profile
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  return (
    <div className="mb-8 flex flex-col md:flex-row items-center gap-6 p-6 bg-navy rounded-2xl text-white shadow-xl">
      <UserAvatar className="h-24 w-24 border-4 border-white/20" />
      <div className="text-center md:text-left">
        <h1 className="text-3xl font-bold">{profile.full_name}</h1>
        <p className="text-white/70 text-sm">{profile.email}</p>
        <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-2">
          <Badge className="bg-white/20 text-white hover:bg-white/30 border-none">
            {profile.distrito_residencia || 'Distrito não definido'}
          </Badge>
          <Badge className="bg-white/20 text-white hover:bg-white/30 border-none">
            Média: {profile.media_final_calculada || 0} pts
          </Badge>
        </div>
      </div>
    </div>
  )
}
