'use client'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useUser } from "@/lib/user-context"

interface UserAvatarProps {
  className?: string
}
export function UserAvatar({ className }: UserAvatarProps) {
  const { profile } = useUser()

  // Versão ultra-segura para evitar o crash 'n.name'
  const initials = 'U';

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