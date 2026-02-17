'use client'

import { useState } from 'react'
import { Header } from '@/components/header'
import { ProfileView } from '@/components/profile/profile-view' // Importamos o novo View
import { AICounselor } from '@/components/ai-counselor'
import { cn } from '@/lib/utils'

export default function Home() {
  const [activeTab, setActiveTab] = useState('explorer')
  const [aiOpen, setAiOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/50">
      <Header 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        onOpenProfile={() => setActiveTab('profile')} // Agora muda a aba em vez de abrir sheet
        isAISidebarOpen={aiOpen}
        setIsAISidebarOpen={setAiOpen}
      />

      <main className="flex-1">
        {activeTab === 'explorer' && (
          <div className="mx-auto max-w-7xl px-4 py-8 text-center">
            {/* O teu componente de Explorar Cursos vai aqui */}
            <h2 className="text-2xl font-bold">Explorar Cursos</h2>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="mx-auto max-w-7xl px-4 py-8 text-center">
            {/* O teu componente de Calendário vai aqui */}
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