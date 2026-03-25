'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Header } from '@/components/header'
import { ProfileView } from '@/components/profile/profile-view'
import { AICounselor } from '@/components/ai-counselor'
import { BetaBanner, FeedbackButton } from '@/components/beta-banner'
import { BuyMeCoffee, BuyMeCoffeeMinimal } from '@/components/buy-me-coffee'
import { X } from 'lucide-react'

function WelcomeBanner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (searchParams.get('welcome') === '1') {
      setVisible(true)
      // Remove the param from the URL without navigating
      const url = new URL(window.location.href)
      url.searchParams.delete('welcome')
      window.history.replaceState({}, '', url.toString())
    }
  }, [searchParams])

  if (!visible) return null

  return (
    <div className="mx-auto max-w-2xl mt-6 mb-2">
      <div className="relative rounded-2xl border border-navy/20 bg-navy/5 px-5 py-4">
        <button
          onClick={() => setVisible(false)}
          className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
        <p className="text-sm font-semibold text-foreground mb-3">Bem-vinda ao UniMatch! Começa em 3 passos:</p>
        <ol className="space-y-2">
          {[
            { n: '1', text: 'Adiciona a tua média do secundário e as notas dos exames abaixo' },
            { n: '2', text: 'Vai ao Explorador e marca ♥ nos cursos que te interessam' },
            { n: '3', text: 'Vai ao Simulador para ver onde entras com as tuas notas atuais' },
          ].map(({ n, text }) => (
            <li key={n} className="flex items-start gap-3 text-sm text-muted-foreground">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-navy text-[11px] font-bold text-white">{n}</span>
              {text}
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const [aiOpen, setAiOpen] = useState(false)
  const router = useRouter()

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header
        activeTab="profile"
        onTabChange={(tab) => {
          const paths: Record<string, string> = { explorer: '/', simulador: '/simulador', candidatura: '/candidatura', timeline: '/calendario', bolsas: '/bolsas' }
          router.push(paths[tab] ?? '/')
        }}
        isAISidebarOpen={aiOpen}
        setIsAISidebarOpen={setAiOpen}
      />

      <BetaBanner />

      <main className="flex-1 pb-16 md:pb-0 px-4 sm:px-6">
        <Suspense fallback={null}>
          <WelcomeBanner />
        </Suspense>
        <ProfileView />
      </main>

      <AICounselor isOpen={aiOpen} onClose={() => setAiOpen(false)} />

      <footer className="border-t border-border/40 bg-card py-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4">
          <p className="text-xs text-muted-foreground">
            © 2026 UniMatch — Dados oficiais baseados na DGES.
          </p>
          <div className="flex items-center gap-4">
            <BuyMeCoffee />
            <FeedbackButton />
            <a
              href="https://www.dges.gov.pt"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-navy hover:underline"
            >
              Acesso ao Ensino Superior
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
