'use client'

import { useState } from 'react'
import { GraduationCap, CalendarDays, Search, Sparkles, Sun, Moon, BookMarked, SlidersHorizontal, Menu } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useUser } from '@/lib/user-context'
import { AuthDialog } from './auth-dialog'
import { UserMenu } from './user-menu'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'

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
  const { resolvedTheme, setTheme } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)

  const tabs = [
    { id: 'explorer',   label: 'Explorar',   icon: Search },
    { id: 'simulador',  label: 'Simulador',  icon: SlidersHorizontal },
    { id: 'timeline',   label: 'Calendário', icon: CalendarDays },
    { id: 'bolsas',     label: 'Bolsas',     icon: BookMarked },
  ]

  const handleTabChange = (tab: string) => {
    onTabChange(tab)
    setMobileOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/30 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        <div className="flex items-center gap-4">
          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMobileOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors md:hidden"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Logo */}
          <button
            onClick={() => handleTabChange('explorer')}
            className="group flex items-center gap-2.5 outline-none"
          >
            <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-navy to-navy-dark text-white shadow-md shadow-navy/30 transition-all group-hover:shadow-navy/50 group-hover:scale-105">
              <GraduationCap className="h-4 w-4" />
            </div>
            <span className="text-base font-bold tracking-tight text-foreground">
              Uni<span className="text-navy">Match</span>
            </span>
          </button>

          {/* Desktop Nav */}
          <nav className="hidden md:block">
            <ul className="flex items-center gap-0.5">
              {tabs.map((tab) => (
                <li key={tab.id}>
                  <button
                    onClick={() => onTabChange(tab.id)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-all',
                      activeTab === tab.id
                        ? 'bg-navy/10 text-navy dark:bg-navy/20'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                    )}
                  >
                    <tab.icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {/* AI Counselor */}
          <button
            onClick={() => setIsAISidebarOpen(!isAISidebarOpen)}
            className={cn(
              'hidden sm:inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all',
              isAISidebarOpen
                ? 'bg-navy text-white shadow-sm shadow-navy/30'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
            )}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden lg:block">Conselheiro IA</span>
          </button>

          <button
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            aria-label="Alternar tema"
          >
            {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <div className="h-5 w-px bg-border/60 hidden sm:block" />

          {isLoggedIn ? <UserMenu /> : <AuthDialog />}
        </div>
      </div>

      {/* Mobile nav sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Navegação</SheetTitle>

          <div className="flex items-center gap-2.5 border-b border-border/30 px-5 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-navy to-navy-dark text-white shadow-md shadow-navy/30">
              <GraduationCap className="h-4 w-4" />
            </div>
            <span className="text-base font-bold tracking-tight text-foreground">
              Uni<span className="text-navy">Match</span>
            </span>
          </div>

          <nav className="flex flex-col gap-1 px-3 py-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-all text-left',
                  activeTab === tab.id
                    ? 'bg-navy/10 text-navy dark:bg-navy/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                )}
              >
                <tab.icon className="h-4 w-4 shrink-0" />
                {tab.label}
              </button>
            ))}

            <div className="my-2 h-px bg-border/40" />

            <button
              onClick={() => { setIsAISidebarOpen(!isAISidebarOpen); setMobileOpen(false) }}
              className={cn(
                'flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-all text-left',
                isAISidebarOpen
                  ? 'bg-navy/10 text-navy dark:bg-navy/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
              )}
            >
              <Sparkles className="h-4 w-4 shrink-0" />
              Conselheiro IA
            </button>
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  )
}