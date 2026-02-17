'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { MessageCircle, X, Send, GraduationCap, Minus, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUser } from '@/lib/user-context'

export function AICounselor() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [input, setInput] = useState('')
  const endRef = useRef<HTMLDivElement>(null)
  const { isLoggedIn, profile } = useUser()

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    let text = input
    if (isLoggedIn && profile.mediaSecundario > 0 && messages.length === 0) {
      text += `\n\n[Contexto: Media: ${profile.mediaSecundario}. Exames: ${
        profile.exams.map(e => `${e.subjectName}: ${e.grade}`).join(', ') || 'nenhum'
      }. Distrito: ${profile.district || 'N/D'}]`
    }
    sendMessage({ text })
    setInput('')
  }

  const suggestions = [
    'Gosto de resolver problemas e biologia',
    'Cursos de engenharia com boa saida?',
    'Como funciona a nota de candidatura?',
  ]

  if (!isOpen) {
    return (
      <button onClick={() => setIsOpen(true)}
        className="fixed bottom-5 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-navy shadow-lg transition-all hover:bg-navy-light hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-navy/50 focus:ring-offset-2"
        aria-label="Abrir orientador de carreira">
        <MessageCircle className="h-5 w-5 text-primary-foreground" />
      </button>
    )
  }

  return (
    <div className={`fixed bottom-5 right-5 z-50 flex w-[360px] flex-col overflow-hidden rounded-xl border border-border/50 bg-card shadow-2xl transition-all ${isMinimized ? 'h-12' : 'h-[480px]'}`}>
      <div className="flex items-center justify-between bg-navy px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-foreground/10">
            <GraduationCap className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-primary-foreground">Orientador de Carreira</h3>
            <span className="flex items-center gap-0.5 text-[9px] text-primary-foreground/50">
              <Sparkles className="h-2 w-2" /> IA
            </span>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          <button onClick={() => setIsMinimized(!isMinimized)}
            className="rounded p-1 text-primary-foreground/50 hover:bg-primary-foreground/10 hover:text-primary-foreground"
            aria-label={isMinimized ? 'Maximizar' : 'Minimizar'}>
            <Minus className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => setIsOpen(false)}
            className="rounded p-1 text-primary-foreground/50 hover:bg-primary-foreground/10 hover:text-primary-foreground"
            aria-label="Fechar">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <div className="flex-1 overflow-y-auto px-3 py-2.5">
            {messages.length === 0 ? (
              <div className="flex flex-col gap-2.5">
                <div className="rounded-lg bg-muted/40 p-2.5">
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    Ola! Sou o teu orientador. Posso ajudar-te a escolher o curso ideal com base nos teus interesses e notas.
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {suggestions.map(s => (
                    <button key={s} onClick={() => setInput(s)}
                      className="rounded-full border border-navy/10 bg-navy/[0.03] px-2 py-0.5 text-[10px] text-navy hover:bg-navy/10">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-xl px-3 py-2 text-[12px] leading-relaxed ${
                      msg.role === 'user'
                        ? 'rounded-br-sm bg-navy text-primary-foreground'
                        : 'rounded-bl-sm bg-muted/60 text-foreground'
                    }`}>
                      {msg.parts.map((part, i) => part.type === 'text' ? (
                        <span key={i} className="whitespace-pre-wrap">{part.text}</span>
                      ) : null)}
                    </div>
                  </div>
                ))}
                {isLoading && messages[messages.length - 1]?.role === 'user' && (
                  <div className="flex justify-start">
                    <div className="rounded-xl rounded-bl-sm bg-muted/60 px-3 py-2">
                      <div className="flex gap-1">
                        <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-navy/40" />
                        <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-navy/40 [animation-delay:200ms]" />
                        <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-navy/40 [animation-delay:400ms]" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={endRef} />
              </div>
            )}
          </div>
          <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-border/50 px-3 py-2">
            <input type="text" value={input} onChange={e => setInput(e.target.value)}
              placeholder="Faz a tua pergunta..." disabled={isLoading}
              className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none" />
            <Button type="submit" size="icon" disabled={!input.trim() || isLoading}
              className="h-7 w-7 shrink-0 rounded-full bg-navy text-primary-foreground hover:bg-navy-light">
              <Send className="h-3 w-3" />
              <span className="sr-only">Enviar</span>
            </Button>
          </form>
        </>
      )}
    </div>
  )
}
