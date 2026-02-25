'use client'

import { GraduationCap, CalendarDays, Search } from 'lucide-react'
import { useUser } from '@/lib/user-context'
import { AuthDialog } from './auth-dialog'
import { UserMenu } from './user-menu'
import { cn } from '@/lib/utils'

interface HeaderProps {
  activeTab: string
  onTabChange: (tab: string) => void
  isAISidebarOpen: boolean
  setIsAISidebarOpen: (open: boolean) => void
}

export function Header({
  activeTab,
  onTabChange,
  isAISidebarOpen,
  setIsAISidebarOpen,
}: HeaderProps) {
  const { isLoggedIn } = useUser()

  const tabs = [
    { id: 'explorer', label: 'Explorar', icon: Search },
    { id: 'timeline', label: 'Calendário', icon: CalendarDays },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        <div className="flex items-center gap-8">
          {/* Logo / Home */}
          <button 
            onClick={() => onTabChange('explorer')} 
            className="group flex items-center gap-2.5 transition-all outline-none"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy text-white shadow-lg shadow-navy/20 transition-transform group-hover:scale-105">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="hidden flex-col items-start leading-none sm:flex text-left">
              <span className="text-lg font-bold tracking-tight text-foreground">UniMatch</span>
              <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground/80">Simulador Universitário</span>
            </div>
          </button>

          {/* Navegação Principal */}
          <nav className="hidden md:block">
            <ul className="flex items-center gap-1">
              {tabs.map((tab) => (
                <li key={tab.id} className="relative">
                  <button
                    onClick={() => onTabChange(tab.id)}
                    className={cn(
                      "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors relative z-10",
                      activeTab === tab.id ? "text-navy" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <tab.icon className={cn("h-4 w-4", activeTab === tab.id ? "text-navy" : "")} />
                    {tab.label}
                  </button>
                  {activeTab === tab.id && (
                    <div className="absolute inset-0 bg-navy/5 rounded-full -z-0 border border-navy/10" />
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="h-6 w-px bg-border/60 mx-1 hidden sm:block" />

          <div className="flex items-center">
            {isLoggedIn ? (
              <UserMenu />
            ) : (
              <AuthDialog />
            )}
          </div>
        </div>
      </div>
    </header>
  )
}