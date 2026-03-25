'use client'

import { useState, Suspense, useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Header } from '@/components/header'
import { AICounselor } from '@/components/ai-counselor'
import { CourseDetailDialog } from '@/components/course-detail-dialog'
import { CourseContext } from '@/lib/course-context'
import { useUser } from '@/lib/user-context'
import { AlertCircle, X, Sparkles } from 'lucide-react'
import { BetaBanner, FeedbackButton } from '@/components/beta-banner'
import { SupportButtonMinimal } from '@/components/support-button'
import type { CourseUI } from '@/lib/types'

const TAB_TO_PATH: Record<string, string> = {
  explorer:    '/',
  simulador:   '/simulador',
  candidatura: '/candidatura',
  timeline:    '/calendario',
  bolsas:      '/bolsas',
}

const PATH_TO_TAB: Record<string, string> = {
  '/':             'explorer',
  '/simulador':    'simulador',
  '/candidatura':  'candidatura',
  '/calendario':   'timeline',
  '/bolsas':       'bolsas',
}

function AuthErrorBanner() {
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const msg = searchParams.get('authError')
    if (msg) {
      setError(decodeURIComponent(msg))
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

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isNewUser, clearNewUser } = useUser()

  const [allCourses, setAllCourses] = useState<CourseUI[]>([])
  const [selectedCourse, setSelectedCourse] = useState<CourseUI | null>(null)
  const [aiOpen, setAiOpen] = useState(false)

  useEffect(() => {
    if (isNewUser) {
      clearNewUser()
      router.push('/profile?welcome=1')
    }
  }, [isNewUser, clearNewUser, router])

  const activeTab = PATH_TO_TAB[pathname] ?? 'explorer'

  const handleTabChange = (tab: string) => {
    router.push(TAB_TO_PATH[tab] ?? '/')
  }

  return (
    <CourseContext.Provider value={{ setSelectedCourse, setAllCourses }}>
      <div className="flex min-h-screen flex-col bg-background">
        <Header
          activeTab={activeTab}
          onTabChange={handleTabChange}
          isAISidebarOpen={aiOpen}
          setIsAISidebarOpen={setAiOpen}
        />

        <BetaBanner />

        <Suspense fallback={null}>
          <AuthErrorBanner />
        </Suspense>

        <main className="flex-1 pb-16 md:pb-0">
          {children}
        </main>

        <AICounselor
          isOpen={aiOpen}
          onClose={() => setAiOpen(false)}
          courses={allCourses}
          onViewDetails={course => {
            setSelectedCourse(course)
            setAiOpen(false)
          }}
        />

        {/* Floating AI button — mobile only, hidden when AI panel is open */}
        {!aiOpen && (
          <button
            onClick={() => setAiOpen(true)}
            className="fixed bottom-20 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-navy text-white shadow-lg shadow-navy/40 transition-all hover:scale-105 active:scale-95 sm:hidden"
            aria-label="Abrir Conselheiro IA"
          >
            <Sparkles className="h-5 w-5" />
          </button>
        )}

        <CourseDetailDialog
          course={selectedCourse}
          onClose={() => setSelectedCourse(null)}
        />

        <footer className="mb-16 border-t border-border/40 bg-card py-6 md:mb-0">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                © 2026 UniMatch — Dados para fins informativos, baseados na{' '}
                <a href="https://www.dges.gov.pt" target="_blank" rel="noopener noreferrer" className="font-medium text-navy hover:underline">DGES</a>.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <SupportButtonMinimal />
                <FeedbackButton />
                <a href="/privacidade" className="text-xs text-muted-foreground/70 hover:text-foreground transition-colors">Privacidade</a>
                <a href="/termos" className="text-xs text-muted-foreground/70 hover:text-foreground transition-colors">Termos</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </CourseContext.Provider>
  )
}
