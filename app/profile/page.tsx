'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/header'
import { ProfileView } from '@/components/profile/profile-view'
import { AICounselor } from '@/components/ai-counselor'

export default function ProfilePage() {
  const [aiOpen, setAiOpen] = useState(false)
  const router = useRouter()

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/50">
      <Header
        activeTab="profile"
        onTabChange={(tab) => router.push(tab === 'explorer' ? '/' : `/${tab}`)}
        isAISidebarOpen={aiOpen}
        setIsAISidebarOpen={setAiOpen}
      />

      <main className="flex-1">
        <ProfileView />
      </main>

      <AICounselor isOpen={aiOpen} onClose={() => setAiOpen(false)} />

      <footer className="border-t border-border/40 bg-white py-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4">
          <p className="text-xs text-muted-foreground">
            © 2026 UniMatch - Dados oficiais baseados na DGES.
          </p>
          <div className="flex gap-4">
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
