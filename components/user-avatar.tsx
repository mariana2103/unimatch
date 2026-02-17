'use client'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useUser } from "@/lib/user-context"

interface UserAvatarProps {
  className?: string
}
export function UserAvatar({ className }: UserAvatarProps) {
  const { profile } = useUser()

  // Versão ultra-segura para evitar o crash 'n.name'
  const initials = profile?.full_name
    ? profile.full_name
        .trim()
        .split(/\s+/)
        .filter(Boolean) // Remove espaços vazios que causam o erro 'n'
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U'

  return (
    <Avatar className={className}>
      <AvatarImage 
        src={profile?.avatar_url || undefined} 
        alt={profile?.full_name || "Utilizador"} 
      />
      <AvatarFallback 
        className="bg-navy text-primary-foreground font-bold text-[10px] flex items-center justify-center uppercase tracking-tighter"
      >
        {initials || 'U'}
      </AvatarFallback>
    </Avatar>
  )
}