'use client'

import { GraduationCap, CalendarDays } from 'lucide-react'
import { useUser } from '@/lib/user-context'
import { AuthDialog } from './auth-dialog'
import { UserMenu } from './user-menu'
import { cn } from '@/lib/utils' 

interface HeaderProps {
  activeTab: string
  onTabChange: (tab: string) => void
  onOpenProfile: () => void
}

export function Header({ activeTab, onTabChange, onOpenProfile }: HeaderProps) {
  const { isLoggedIn } = useUser()

  const tabs = [
    { id: 'explorer', label: 'Explorar Cursos', icon: null },
    { id: 'timeline', label: 'Calendário', icon: CalendarDays },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-card/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        
        {/* Logo */}
        <button onClick={() => onTabChange('explorer')} className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy shadow-sm">
            <GraduationCap className="h-4.5 w-4.5 text-primary-foreground" />
          </div>
          <div className="hidden flex-col items-start sm:flex text-left">
            <span className="text-sm font-semibold leading-none">UniMatch</span>
            <span className="text-[10px] leading-tight text-muted-foreground uppercase tracking-wider">Simulador DGES</span>
          </div>
        </button>

        {/* Navegação */}
        <nav>
          <ul className="flex items-center gap-1">
            {tabs.map((tab) => (
              <li key={tab.id}>
                <button
                  onClick={() => onTabChange(tab.id)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
                    activeTab === tab.id ? "bg-foreground/[0.06] text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {tab.icon && <tab.icon className="h-3.5 w-3.5" />}
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Auth Section */}
        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <UserMenu onOpenProfile={onOpenProfile} />
          ) : (
            <AuthDialog />
          )}
        </div>
      </div>
    </header>
  )
}