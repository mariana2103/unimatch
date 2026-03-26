'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Search, SlidersHorizontal, CalendarDays, BookMarked, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS = [
  { id: 'explorer',  label: 'Explorar',   icon: Search,             path: '/' },
  { id: 'simulador', label: 'Simulador',  icon: SlidersHorizontal,  path: '/simulador' },
  { id: 'timeline',  label: 'Calendário', icon: CalendarDays,       path: '/calendario' },
  { id: 'bolsas',    label: 'Bolsas',     icon: BookMarked,         path: '/bolsas' },
  { id: 'perfil',    label: 'Perfil',     icon: User,               path: '/profile' },
]

const PATH_TO_TAB: Record<string, string> = {
  '/':           'explorer',
  '/simulador':  'simulador',
  '/calendario': 'timeline',
  '/bolsas':     'bolsas',
  '/profile':    'perfil',
}

export function MobileTabBar() {
  const router = useRouter()
  const pathname = usePathname()
  const activeTab = PATH_TO_TAB[pathname] ?? 'explorer'

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border/40 bg-background/95 backdrop-blur-xl md:hidden">
      <div className="flex items-center justify-around px-1 pb-safe-area-inset-bottom">
        {TABS.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => router.push(tab.path)}
              className={cn(
                'flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors',
                isActive ? 'text-navy' : 'text-muted-foreground',
              )}
            >
              <Icon className={cn('h-5 w-5 transition-all', isActive && 'scale-110')} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
