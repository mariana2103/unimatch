'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/header'
import { ProfileView } from '@/components/profile/profile-view'
import { AICounselor } from '@/components/ai-counselor'
import { BetaBanner, FeedbackButton } from '@/components/beta-banner'
import { MobileTabBar } from '@/components/mobile-tab-bar'

export default function ProfilePage() {
  const [aiOpen, setAiOpen] = useState(false)
  const router = useRouter()

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header
        activeTab="profile"
        onTabChange={(tab) => {
          const paths: Record<string, string> = { explorer: '/', simulador: '/simulador', timeline: '/calendario', bolsas: '/bolsas' }
          router.push(paths[tab] ?? '/')
        }}
        isAISidebarOpen={aiOpen}
        setIsAISidebarOpen={setAiOpen}
      />

      <BetaBanner />

      <main className="flex-1 pb-16 md:pb-0">
        <ProfileView />
      </main>

      <AICounselor isOpen={aiOpen} onClose={() => setAiOpen(false)} />

      <MobileTabBar />

      <footer className="mb-16 border-t border-border/40 bg-card py-6 md:mb-0">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4">
          <p className="text-xs text-muted-foreground">
            © 2026 UniMatch — Dados oficiais baseados na DGES.
          </p>
          <div className="flex items-center gap-3">
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
