'use client'

import { useState } from 'react'
import { Header } from '@/components/header'
import { CourseExplorer } from '@/components/course-explorer'
import { DGESTimeline } from '@/components/dges-timeline'
import { ProfileSheet } from '@/components/profile-sheet'
import { AICounselor } from '@/components/ai-counselor'
import { cn } from '@/lib/utils'

export default function Home() {
  const [activeTab, setActiveTab] = useState('explorer')
  const [profileOpen, setProfileOpen] = useState(false)
  const [aiOpen, setAiOpen] = useState(false) // Estado para controlar a Sidebar da IA

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        onOpenProfile={() => setProfileOpen(true)}
        isAISidebarOpen={aiOpen}
        setIsAISidebarOpen={setAiOpen}
      />

        {/* Sidebar do Conselheiro IA */}
        <AICounselor isOpen={aiOpen} onClose={() => setAiOpen(false)} />


      <footer className="border-t border-border/40 bg-card py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4">
          <p className="text-[10px] text-muted-foreground">
            Simulador de Candidatura - Dados baseados no histórico DGES.
          </p>
          <div className="flex gap-4">
            <a href="https://www.dges.gov.pt" target="_blank" rel="noopener noreferrer"
              className="text-[10px] font-medium text-navy underline-offset-2 hover:underline">
              dges.gov.pt
            </a>
          </div>
        </div>
      </footer>

      <ProfileSheet open={profileOpen} onOpenChange={setProfileOpen} />
    </div>
  )
}