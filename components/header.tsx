'use client'

import { GraduationCap, LogOut, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUser } from '@/lib/user-context'
import { AuthDialog } from './auth-dialog'
import { cn } from '@/lib/utils' // Utilitário comum em projetos shadcn

interface HeaderProps {
  activeTab: string
  onTabChange: (tab: string) => void
  onOpenProfile: () => void
}

export function Header({ activeTab, onTabChange, onOpenProfile }: HeaderProps) {
  const { isLoggedIn, profile, logout } = useUser()

  const tabs = [
    { id: 'explorer', label: 'Explorar Cursos', icon: null },
    { id: 'timeline', label: 'Calendário', icon: CalendarDays },
  ]

  // Função para pegar a inicial do nome com segurança
  const userInitial = profile?.name?.charAt(0).toUpperCase() ?? 'U'

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-card/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        
        {/* Logo / Home */}
        <button 
          onClick={() => onTabChange('explorer')} 
          className="flex items-center gap-2 transition-opacity hover:opacity-80"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy shadow-sm">
            <GraduationCap className="h-4.5 w-4.5 text-primary-foreground" />
          </div>
          <div className="hidden flex-col items-start sm:flex text-left">
            <span className="text-sm font-semibold leading-none text-foreground">UniMatch</span>
            <span className="text-[10px] leading-tight text-muted-foreground uppercase tracking-wider">Simulador de Acesso ao Ensino Superior</span>
          </div>
        </button>

        {/* Navegação Central */}
        <nav>
          <ul className="flex items-center gap-1">
            {tabs.map((tab) => (
              <li key={tab.id}>
                <button
                  onClick={() => onTabChange(tab.id)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
                    activeTab === tab.id
                      ? "bg-foreground/[0.06] text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {tab.icon && <tab.icon className="h-3.5 w-3.5" />}
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Lado Direito: Perfil ou Login */}
        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <div className="flex items-center gap-1">
              <button
                onClick={onOpenProfile}
                className="flex items-center gap-2 rounded-full border border-border/60 bg-background pl-1 pr-3 py-1 text-sm font-medium transition-colors hover:bg-muted"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-navy text-[10px] font-bold text-primary-foreground">
                  {userInitial}
                </div>
                <span className="hidden max-w-[100px] truncate sm:inline">
                  {profile.name}
                </span>
              </button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={logout} 
                className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                title="Sair"
              >
                <LogOut className="h-4 w-4" />
                <span className="sr-only">Sair</span>
              </Button>
            </div>
          ) : (
            <AuthDialog />
          )}
        </div>
      </div>
    </header>
  )
}