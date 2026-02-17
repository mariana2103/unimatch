'use client'

import { useState } from 'react'
import { GraduationCap, User, LogOut, LogIn, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUser } from '@/lib/user-context'

interface HeaderProps {
  activeTab: string
  onTabChange: (tab: string) => void
  onOpenProfile: () => void
}

export function Header({ activeTab, onTabChange, onOpenProfile }: HeaderProps) {
  const { isLoggedIn, profile, login, logout } = useUser()
  const [loginName, setLoginName] = useState('')
  const [loginOpen, setLoginOpen] = useState(false)

  const handleLogin = () => {
    if (loginName.trim()) {
      login(loginName.trim())
      setLoginOpen(false)
      setLoginName('')
    }
  }

  const tabs = [
    { id: 'explorer', label: 'Explorar Cursos' },
    { id: 'timeline', label: 'Calendario', icon: CalendarDays },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-card/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <button onClick={() => onTabChange('explorer')} className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy">
            <GraduationCap className="h-4.5 w-4.5 text-primary-foreground" />
          </div>
          <div className="hidden flex-col sm:flex">
            <span className="text-sm font-semibold leading-none text-foreground">EnsinoSuperior</span>
            <span className="text-[10px] leading-tight text-muted-foreground">Simulador DGES</span>
          </div>
        </button>

        <nav className="flex items-center gap-0.5">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-foreground/[0.06] text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.icon && <tab.icon className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <>
              <button
                onClick={onOpenProfile}
                className="flex items-center gap-2 rounded-lg border border-border/60 px-2.5 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-navy text-[10px] font-bold text-primary-foreground">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
                <span className="hidden max-w-[100px] truncate sm:inline">{profile.name}</span>
              </button>
              <Button variant="ghost" size="icon" onClick={logout} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <LogOut className="h-4 w-4" />
                <span className="sr-only">Sair</span>
              </Button>
            </>
          ) : (
            <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8 gap-1.5 bg-navy text-primary-foreground hover:bg-navy-light">
                  <LogIn className="h-3.5 w-3.5" />
                  Entrar
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                  <DialogTitle>Iniciar Sessao</DialogTitle>
                  <DialogDescription>
                    Introduz o teu nome para acederes ao simulador.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={(e) => { e.preventDefault(); handleLogin() }} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="login-name">Nome</Label>
                    <Input id="login-name" value={loginName} onChange={e => setLoginName(e.target.value)} placeholder="O teu nome" autoFocus />
                  </div>
                  <Button type="submit" disabled={!loginName.trim()} className="bg-navy text-primary-foreground hover:bg-navy-light">
                    Entrar
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </header>
  )
}
