'use client'

import { LogOut, User } from 'lucide-react'
import { useUser } from '@/lib/user-context'
import { UserAvatar } from './user-avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface UserMenuProps {
  onOpenProfile: () => void
}

export function UserMenu({ onOpenProfile }: UserMenuProps) {
  const { profile, logout } = useUser()
  const firstName = profile?.full_name?.trim().split(' ')[0] || 'Utilizador'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full border border-border/60 bg-background pl-1 pr-3 py-1 text-sm font-medium transition-colors hover:bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <UserAvatar className="h-6 w-6" />
          <span className="hidden max-w-[100px] truncate sm:inline">
            {firstName}
          </span>
        </button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-48 mt-1">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{profile?.full_name}</p>
            <p className="text-xs leading-none text-muted-foreground truncate">
              {profile?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Item Perfil: Mudamos para fundo Navy e texto/ícone Branco no hover */}
        <DropdownMenuItem 
          onClick={onOpenProfile} 
          className="cursor-pointer gap-2 transition-colors focus:bg-navy focus:text-white group"
        >
          <User className="h-4 w-4 text-muted-foreground group-focus:text-white" />
          <span>Perfil</span>
        </DropdownMenuItem>
        
        {/* Item Sair: Mantemos o estilo Destructive mas garantimos o ícone branco no focus */}
        <DropdownMenuItem 
          onClick={logout} 
          className="cursor-pointer gap-2 text-destructive focus:bg-destructive focus:text-white group"
        >
          <LogOut className="h-4 w-4 text-destructive group-focus:text-white" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}