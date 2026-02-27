'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useChat } from '@ai-sdk/react'
import {
  X, Send, GraduationCap, Sparkles, RotateCcw, RefreshCw,
  ChevronLeft, ChevronRight, MessageSquare, Star, ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUser } from '@/lib/user-context'
import { cn } from '@/lib/utils'
import { rankCourses, type AIProfile } from '@/lib/semantic-search'
import type { CourseUI } from '@/lib/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AICounselorProps {
  isOpen: boolean
  onClose: () => void
  courses?: CourseUI[]
  onViewDetails?: (course: CourseUI) => void
}

type SidebarTab = 'questionnaire' | 'results' | 'chat'

interface QuestionDef {
  id: keyof Answers
  text: string
  chips: string[]
  placeholder: string
}

interface Answers {
  interests: string
  environment: string
  social: string
  subjects: string
  career_values: string
}

interface ConversationMsg {
  role: 'ai' | 'user'
  text: string
}

interface RankedCourse {
  course: CourseUI
  score: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const RESULTS_PER_PAGE = 30

const QUESTIONS: QuestionDef[] = [
  {
    id: 'interests',
    text: 'Olá! Sou o teu conselheiro de orientação. Vou fazer-te 5 perguntas rápidas para encontrar os cursos mais adequados para ti.\n\nPrimeiro — o que te apaixona ou gostas de fazer?',
    chips: ['Tecnologia & computadores', 'Ciências & biologia', 'Matemática & física', 'Artes & design', 'Pessoas & sociedade', 'Economia & negócios', 'Saúde & medicina', 'Desporto & natureza'],
    placeholder: 'Ex: gosto de resolver problemas, fascinam-me os computadores...',
  },
  {
    id: 'environment',
    text: 'Ótimo! Onde te imaginas a trabalhar no futuro?',
    chips: ['Escritório / empresa', 'Hospital / clínica', 'Laboratório', 'Ao ar livre', 'Em casa / remoto', 'Contacto com o público', 'Escola / formação'],
    placeholder: 'Ex: em escritório, ou a trabalhar ao ar livre...',
  },
  {
    id: 'social',
    text: 'Preferes trabalhar muito com outras pessoas ou de forma mais independente?',
    chips: ['Muito em equipa', 'Mix de ambos', 'Principalmente sozinho/a', 'Liderar e gerir equipas'],
    placeholder: '',
  },
  {
    id: 'subjects',
    text: 'Quais as disciplinas em que te destacas ou gostas mais?',
    chips: ['Matemática', 'Física', 'Biologia / Química', 'História / Geo', 'Português / Literatura', 'Inglês / Línguas', 'Informática', 'Artes / Desenho', 'Educação Física'],
    placeholder: 'Ex: sou bom em matemática e física, gosto de inglês...',
  },
  {
    id: 'career_values',
    text: 'Última pergunta! O que mais valorizas numa carreira?',
    chips: ['Bom salário e estabilidade', 'Impacto social', 'Criatividade e inovação', 'Prestígio e reconhecimento', 'Autonomia e empreendedorismo', 'Equilíbrio trabalho-vida'],
    placeholder: 'O que é mais importante para ti...',
  },
]

// ─── Compact course card ───────────────────────────────────────────────────────

function SidebarCourseCard({
  course,
  score,
  rank,
  onViewDetails,
}: {
  course: CourseUI
  score: number
  rank: number
  onViewDetails: (c: CourseUI) => void
}) {
  const matchPct = Math.min(100, Math.round(score * 200))

  return (
    <button
      onClick={() => onViewDetails(course)}
      className="w-full text-left p-3 rounded-xl border bg-white hover:border-navy/30 hover:bg-navy/[0.02] transition-all group"
    >
      <div className="flex items-start gap-2">
        <span className="text-[10px] font-bold text-muted-foreground/50 w-5 shrink-0 mt-0.5">
          {rank}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground leading-tight line-clamp-2">{course.nome}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{course.instituicao}</p>

          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[10px] bg-slate-100 text-muted-foreground px-1.5 py-0.5 rounded-full truncate max-w-[110px]">
              {course.area}
            </span>
            {course.notaUltimoColocado && (
              <span className="text-[10px] font-bold text-navy ml-auto">
                {course.notaUltimoColocado.toFixed(1)}
              </span>
            )}
          </div>

          {/* Match score bar */}
          <div className="mt-1.5 h-1 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-navy/40 rounded-full transition-all"
              style={{ width: `${matchPct}%` }}
            />
          </div>
        </div>
        <ArrowRight className="h-3 w-3 text-muted-foreground/30 group-hover:text-navy/50 shrink-0 mt-1 transition-colors" />
      </div>
    </button>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

export function AICounselor({ isOpen, onClose, courses = [], onViewDetails = () => {} }: AICounselorProps) {
  const { isLoggedIn, profile } = useUser()
  const endRef = useRef<HTMLDivElement>(null)

  // ── Tabs ──
  const [tab, setTab] = useState<SidebarTab>('questionnaire')

  // ── Questionnaire state ──
  const [questionStep, setQuestionStep] = useState(0) // current question index
  const [answers, setAnswers] = useState<Partial<Answers>>({})
  const [inputValue, setInputValue] = useState('')
  const [conversation, setConversation] = useState<ConversationMsg[]>([])

  // ── Results state ──
  const [ranked, setRanked] = useState<RankedCourse[]>([])
  const [resultsPage, setResultsPage] = useState(0)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [aiProfile, setAiProfile] = useState<AIProfile | null>(null)
  const [profileSummary, setProfileSummary] = useState<string>('')

  // ── Free chat ──
  const { messages, input, handleInputChange, handleSubmit, append, status } = (useChat as any)({
    api: '/api/chat',
  })
  const isChatLoading = status === 'streaming' || status === 'submitted'

  // Auto-scroll
  useEffect(() => {
    if (isOpen) endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation, messages, isOpen, ranked, tab])

  // Initialize first question
  useEffect(() => {
    if (isOpen && conversation.length === 0) {
      setConversation([{ role: 'ai', text: QUESTIONS[0].text }])
    }
  }, [isOpen])

  // ── Questionnaire logic ──
  const submitAnswer = useCallback(async (text: string) => {
    if (!text.trim()) return
    const currentQ = QUESTIONS[questionStep]
    const newAnswers = { ...answers, [currentQ.id]: text.trim() }
    setAnswers(newAnswers)

    const updatedConversation: ConversationMsg[] = [
      ...conversation,
      { role: 'user', text: text.trim() },
    ]

    if (questionStep < QUESTIONS.length - 1) {
      const nextQ = QUESTIONS[questionStep + 1]
      updatedConversation.push({ role: 'ai', text: nextQ.text })
      setConversation(updatedConversation)
      setQuestionStep(prev => prev + 1)
    } else {
      // All questions answered — analyze
      updatedConversation.push({
        role: 'ai',
        text: 'Perfeito! A analisar o teu perfil e a pesquisar os melhores cursos para ti...',
      })
      setConversation(updatedConversation)
      setIsAnalyzing(true)

      await analyzeAndRank(newAnswers as Answers)
    }

    setInputValue('')
  }, [questionStep, answers, conversation])

  const analyzeAndRank = useCallback(async (finalAnswers: Answers) => {
    try {
      const res = await fetch('/api/ai-recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: finalAnswers }),
      })

      let profile: AIProfile | undefined
      if (res.ok) {
        const data = await res.json()
        profile = { areaWeights: data.areaWeights ?? {}, keywords: data.keywords ?? [] }
        setAiProfile(profile)
        if (data.summary) setProfileSummary(data.summary)
      }

      // Build combined query text from all answers
      const queryText = Object.values(finalAnswers).join(' ')

      const scoredCourses = rankCourses(queryText, courses, profile)

      const rankedWithCourse: RankedCourse[] = scoredCourses
        .map(({ id, score }) => {
          const course = courses.find(c => c.id === id)
          return course ? { course, score } : null
        })
        .filter((r): r is RankedCourse => r !== null)

      setRanked(rankedWithCourse)
      setResultsPage(0)
      setIsAnalyzing(false)
      setTab('results')
    } catch (err) {
      setIsAnalyzing(false)
      // Fallback: just rank by keyword match without AI profile
      const queryText = Object.values(finalAnswers).join(' ')
      const scoredCourses = rankCourses(queryText, courses)
      const rankedWithCourse: RankedCourse[] = scoredCourses
        .map(({ id, score }) => {
          const course = courses.find(c => c.id === id)
          return course ? { course, score } : null
        })
        .filter((r): r is RankedCourse => r !== null)
      setRanked(rankedWithCourse)
      setResultsPage(0)
      setTab('results')
    }
  }, [courses])

  const resetQuestionnaire = () => {
    setQuestionStep(0)
    setAnswers({})
    setConversation([{ role: 'ai', text: QUESTIONS[0].text }])
    setRanked([])
    setResultsPage(0)
    setAiProfile(null)
    setProfileSummary('')
    setInputValue('')
    setTab('questionnaire')
  }

  const refreshResults = () => {
    setResultsPage(prev => {
      const maxPage = Math.floor((ranked.length - 1) / RESULTS_PER_PAGE)
      return prev >= maxPage ? 0 : prev + 1
    })
  }

  // ── Derived values ──
  const pageStart = resultsPage * RESULTS_PER_PAGE
  const pageEnd = pageStart + RESULTS_PER_PAGE
  const currentPageResults = ranked.slice(pageStart, pageEnd)
  const totalPages = Math.ceil(ranked.length / RESULTS_PER_PAGE)

  const currentQuestion = QUESTIONS[questionStep]
  const isLastQuestion = questionStep === QUESTIONS.length - 1
  const questionnaireComplete = ranked.length > 0 || isAnalyzing

  // ── Render ──
  return (
    <aside
      className={cn(
        'fixed right-0 top-16 h-[calc(100vh-64px)] w-full sm:w-[360px] border-l bg-card transition-transform duration-300 ease-in-out z-40 shadow-2xl flex flex-col',
        isOpen ? 'translate-x-0' : 'translate-x-full',
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between bg-navy px-4 py-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
            <GraduationCap className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white leading-none">Conselheiro IA</h3>
            <div className="flex items-center gap-1 mt-0.5">
              <Sparkles className="h-2 w-2 text-white/60" />
              <span className="text-[10px] text-white/60 uppercase tracking-tight">Orientador Ativo</span>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-white/70 hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b bg-white shrink-0">
        {[
          { id: 'questionnaire' as SidebarTab, label: 'Perfil' },
          { id: 'results' as SidebarTab, label: `Cursos${ranked.length > 0 ? ` (${ranked.length})` : ''}` },
          { id: 'chat' as SidebarTab, label: 'Chat', icon: MessageSquare },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex-1 py-2.5 text-xs font-medium transition-colors border-b-2',
              tab === t.id
                ? 'border-navy text-navy'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── QUESTIONNAIRE TAB ─────────────────────────────────────────────── */}
      {tab === 'questionnaire' && (
        <>
          {/* Progress bar */}
          {!questionnaireComplete && (
            <div className="px-4 pt-3 shrink-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-muted-foreground font-medium">
                  Pergunta {Math.min(questionStep + 1, QUESTIONS.length)} de {QUESTIONS.length}
                </span>
                {ranked.length > 0 && (
                  <button
                    onClick={() => setTab('results')}
                    className="text-[10px] text-navy font-medium hover:underline"
                  >
                    Ver resultados →
                  </button>
                )}
              </div>
              <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-navy rounded-full transition-all duration-500"
                  style={{ width: `${((Math.min(questionStep + 1, QUESTIONS.length)) / QUESTIONS.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Conversation */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
            {conversation.map((msg, i) => (
              <div
                key={i}
                className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                <div
                  className={cn(
                    'max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-sm whitespace-pre-line',
                    msg.role === 'user'
                      ? 'bg-navy text-white rounded-tr-none'
                      : 'bg-white border text-foreground rounded-tl-none',
                  )}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {isAnalyzing && (
              <div className="flex justify-start">
                <div className="bg-white border rounded-2xl rounded-tl-none px-4 py-3">
                  <div className="flex gap-1 items-center">
                    <span className="text-[10px] text-muted-foreground mr-2">A analisar</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-navy/30 animate-bounce" />
                    <span className="h-1.5 w-1.5 rounded-full bg-navy/30 animate-bounce [animation-delay:0.15s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-navy/30 animate-bounce [animation-delay:0.3s]" />
                  </div>
                </div>
              </div>
            )}

            <div ref={endRef} />
          </div>

          {/* Quick-reply chips */}
          {!questionnaireComplete && !isAnalyzing && currentQuestion.chips.length > 0 && (
            <div className="px-3 pb-2 shrink-0">
              <div className="flex flex-wrap gap-1.5">
                {currentQuestion.chips.map(chip => (
                  <button
                    key={chip}
                    onClick={() => submitAnswer(chip)}
                    className="rounded-full border border-navy/20 bg-white px-2.5 py-1 text-[10px] font-medium text-navy hover:bg-navy hover:text-white transition-colors shadow-sm"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t bg-white shrink-0">
            {questionnaireComplete ? (
              <button
                onClick={resetQuestionnaire}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-navy/20 py-2.5 text-xs font-medium text-navy hover:bg-navy/5 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Novo questionário
              </button>
            ) : (
              <form
                onSubmit={e => {
                  e.preventDefault()
                  submitAnswer(inputValue)
                }}
                className="relative"
              >
                <input
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  placeholder={currentQuestion.placeholder || 'Escreve a tua resposta...'}
                  disabled={isAnalyzing}
                  className="w-full rounded-full border bg-slate-50 py-2.5 pl-4 pr-12 text-xs focus:outline-none focus:ring-2 focus:ring-navy/20"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!inputValue.trim() || isAnalyzing}
                  className="absolute right-1.5 top-1.5 h-7 w-7 rounded-full bg-navy hover:bg-navy/90"
                >
                  <Send className="h-3 w-3" />
                </Button>
              </form>
            )}
          </div>
        </>
      )}

      {/* ── RESULTS TAB ──────────────────────────────────────────────────── */}
      {tab === 'results' && (
        <>
          {ranked.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-3">
              <Star className="h-8 w-8 text-muted-foreground/20" />
              <p className="text-sm font-medium text-muted-foreground">Ainda sem recomendações</p>
              <p className="text-xs text-muted-foreground/60">Completa o questionário de perfil para ver os teus cursos sugeridos.</p>
              <button
                onClick={() => setTab('questionnaire')}
                className="mt-2 rounded-xl bg-navy px-4 py-2 text-xs font-medium text-white hover:bg-navy/90 transition-colors"
              >
                Começar questionário
              </button>
            </div>
          ) : (
            <>
              {/* Profile summary */}
              {profileSummary && (
                <div className="px-4 pt-3 pb-2 shrink-0">
                  <div className="rounded-xl bg-navy/5 border border-navy/10 px-3 py-2">
                    <p className="text-[10px] text-navy/80 leading-relaxed">{profileSummary}</p>
                  </div>
                </div>
              )}

              {/* Courses list */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {currentPageResults.map((r, i) => (
                  <SidebarCourseCard
                    key={r.course.id}
                    course={r.course}
                    score={r.score}
                    rank={pageStart + i + 1}
                    onViewDetails={onViewDetails}
                  />
                ))}
                <div ref={endRef} />
              </div>

              {/* Pagination */}
              <div className="border-t bg-white p-3 shrink-0">
                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => setResultsPage(p => Math.max(0, p - 1))}
                    disabled={resultsPage === 0}
                    className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="h-3 w-3" />
                    Anterior
                  </button>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground">
                      {resultsPage + 1} / {totalPages}
                    </span>
                    <button
                      onClick={refreshResults}
                      className="flex items-center gap-1 rounded-lg border border-navy/20 bg-navy/5 px-2.5 py-1.5 text-[11px] font-medium text-navy hover:bg-navy/10 transition-colors"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Mais
                    </button>
                  </div>

                  <button
                    onClick={() => setResultsPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={resultsPage >= totalPages - 1}
                    className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    Seguinte
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>

                <button
                  onClick={resetQuestionnaire}
                  className="mt-2 w-full flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  <RotateCcw className="h-2.5 w-2.5" />
                  Nova pesquisa
                </button>
              </div>
            </>
          )}
        </>
      )}

      {/* ── CHAT TAB ──────────────────────────────────────────────────────── */}
      {tab === 'chat' && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {messages.length === 0 ? (
              <div className="space-y-3">
                <div className="rounded-2xl bg-white border p-4 shadow-sm text-xs text-muted-foreground leading-relaxed">
                  Olá! Sou o teu orientador. Podes fazer-me qualquer pergunta sobre cursos, candidaturas ou o processo da DGES.
                </div>
                <div className="grid gap-1.5">
                  {['Cursos de engenharia?', 'Como funciona a nota?', 'Melhores cursos para medicina?'].map(s => (
                    <button
                      key={s}
                      onClick={() => handleInputChange({ target: { value: s } } as any)}
                      className="text-left rounded-xl border bg-white px-3 py-2 text-[11px] text-navy hover:bg-navy/5 transition-colors shadow-sm"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m: any, idx: number) => (
                <div key={idx} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                  <div
                    className={cn(
                      'max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs shadow-sm leading-relaxed',
                      m.role === 'user'
                        ? 'bg-navy text-white rounded-tr-none'
                        : 'bg-white border text-foreground rounded-tl-none',
                    )}
                  >
                    {m.content}
                  </div>
                </div>
              ))
            )}
            {isChatLoading && (
              <div className="flex justify-start">
                <div className="bg-white border rounded-2xl rounded-tl-none px-4 py-2.5">
                  <div className="flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-navy/20 animate-bounce" />
                    <span className="h-1.5 w-1.5 rounded-full bg-navy/20 animate-bounce [animation-delay:0.2s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-navy/20 animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="p-3 border-t bg-white shrink-0">
            <form
              onSubmit={e => {
                e.preventDefault()
                if (!input?.trim() || isChatLoading) return
                if (isLoggedIn && messages.length === 0) {
                  const ctx = `\n\n[Média: ${profile?.media_final_calculada || 'N/D'}, Distrito: ${profile?.distrito_residencia || 'N/D'}]`
                  append({ role: 'user', content: input + ctx })
                  handleInputChange({ target: { value: '' } } as any)
                } else {
                  handleSubmit(e)
                }
              }}
              className="relative"
            >
              <input
                value={input}
                onChange={handleInputChange}
                placeholder="Pergunta algo..."
                disabled={isChatLoading}
                className="w-full rounded-full border bg-slate-50 py-2.5 pl-4 pr-12 text-xs focus:outline-none focus:ring-2 focus:ring-navy/20"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!(input || '').trim() || isChatLoading}
                className="absolute right-1.5 top-1.5 h-7 w-7 rounded-full bg-navy hover:bg-navy/90"
              >
                <Send className="h-3 w-3" />
              </Button>
            </form>
          </div>
        </>
      )}
    </aside>
  )
}
