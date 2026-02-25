'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Header } from '@/components/header'
import { ProfileView } from '@/components/profile/profile-view'
import { AICounselor } from '@/components/ai-counselor'
import { AlertCircle, X } from 'lucide-react'

function AuthErrorBanner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const msg = searchParams.get('authError')
    if (msg) {
      setError(decodeURIComponent(msg))
      // Clean the URL without triggering a navigation
      const url = new URL(window.location.href)
      url.searchParams.delete('authError')
      window.history.replaceState({}, '', url.toString())
    }
  }, [searchParams])

  if (!error) return null

  return (
    <div className="mx-auto max-w-7xl px-4 pt-4">
      <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <span className="flex-1">{error}</span>
        <button onClick={() => setError(null)} className="shrink-0 hover:opacity-70">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export default function Home() {
  const [activeTab, setActiveTab] = useState('explorer')
  const [aiOpen, setAiOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/50">
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenProfile={() => setActiveTab('profile')}
        isAISidebarOpen={aiOpen}
        setIsAISidebarOpen={setAiOpen}
      />

      <Suspense fallback={null}>
        <AuthErrorBanner />
      </Suspense>

      <main className="flex-1">
        {activeTab === 'explorer' && (
          <div className="mx-auto max-w-7xl px-4 py-8 text-center">
            <h2 className="text-2xl font-bold">Explorar Cursos</h2>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="mx-auto max-w-7xl px-4 py-8 text-center">
            <h2 className="text-2xl font-bold">Calendário 2025</h2>
          </div>
        )}

        {activeTab === 'profile' && (
          <ProfileView />
        )}
      </main>

      <AICounselor isOpen={aiOpen} onClose={() => setAiOpen(false)} />

      <footer className="border-t border-border/40 bg-white py-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4">
          <p className="text-xs text-muted-foreground">
            © 2026 UniMatch - Dados oficiais baseados na DGES.
          </p>
          <div className="flex gap-4">
            <a href="https://www.dges.gov.pt" target="_blank" rel="noopener noreferrer"
              className="text-xs font-medium text-navy hover:underline">
              Acesso ao Ensino Superior
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
