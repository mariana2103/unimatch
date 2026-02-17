'use client'

import { useState } from 'react'
import { Header } from '@/components/header'
import { CourseExplorer } from '@/components/course-explorer'
import { DGESTimeline } from '@/components/dges-timeline'
import { ProfileSheet } from '@/components/profile-sheet'
import { AICounselor } from '@/components/ai-counselor'

export default function Home() {
  const [activeTab, setActiveTab] = useState('explorer')
  const [profileOpen, setProfileOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header activeTab={activeTab} onTabChange={setActiveTab} onOpenProfile={() => setProfileOpen(true)} />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-5">
        {activeTab === 'explorer' && <CourseExplorer />}
        {activeTab === 'timeline' && <DGESTimeline />}
      </main>

      <footer className="border-t border-border/40 bg-card py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4">
          <p className="text-[10px] text-muted-foreground">
            Simulador de Candidatura - Dados ilustrativos. Confirma no site da DGES.
          </p>
          <a href="https://www.dges.gov.pt" target="_blank" rel="noopener noreferrer"
            className="text-[10px] font-medium text-navy underline-offset-2 hover:underline">
            dges.gov.pt
          </a>
        </div>
      </footer>

      <ProfileSheet open={profileOpen} onOpenChange={setProfileOpen} />
      <AICounselor />
    </div>
  )
}
