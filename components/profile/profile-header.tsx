'use client'

import { Badge } from '@/components/ui/badge'
import { UserAvatar } from '@/components/user-avatar'
import type { Profile } from '@/lib/types'

interface ProfileHeaderProps {
  profile: Profile
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  const media = profile.media_final_calculada
    ? (profile.media_final_calculada / 10).toFixed(1)
    : null

  return (
    <div className="mb-8 flex flex-col sm:flex-row items-center sm:items-start gap-5 rounded-2xl border border-border/50 bg-card p-6">
      <UserAvatar className="h-16 w-16 shrink-0" />
      <div className="flex-1 text-center sm:text-left min-w-0">
        <h1 className="text-xl font-bold text-foreground truncate">{profile.full_name}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{profile.email}</p>
        <div className="mt-3 flex flex-wrap justify-center sm:justify-start gap-2">
          {profile.distrito_residencia && (
            <Badge variant="secondary" className="text-xs font-medium">
              {profile.distrito_residencia}
            </Badge>
          )}
          {media && (
            <Badge className="bg-navy/10 text-navy border-none text-xs font-semibold dark:bg-navy/20">
              Nota candidatura: {media} val.
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}
