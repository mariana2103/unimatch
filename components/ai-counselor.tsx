'use client'

import { useRef, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import { X, Send, GraduationCap, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUser } from '@/lib/user-context'
import { cn } from '@/lib/utils'

interface AICounselorProps {
  isOpen: boolean
  onClose: () => void
}

export function AICounselor({ isOpen, onClose }: AICounselorProps) {
  const endRef = useRef<HTMLDivElement>(null)
  const { isLoggedIn, profile } = useUser()

  // Usamos 'as any' para evitar os erros de tipo das versões do SDK
  const { messages, input, handleInputChange, handleSubmit, append, status } = useChat({
    api: '/api/chat',
  }) as any

  const isLoading = status === 'streaming' || status === 'submitted'

  useEffect(() => {
    if (isOpen) endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isOpen])

  const onFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input?.trim() || isLoading) return

    // Adiciona contexto na primeira mensagem
    if (isLoggedIn && messages.length === 0) {
      const context = `\n\n[Contexto: Media: ${profile?.media_final_calculada || 'N/D'}. Distrito: ${profile?.distrito_residencia || 'N/D'}]`
      append({ role: 'user', content: input + context })
      handleInputChange({ target: { value: '' } } as any)
    } else {
      handleSubmit(e)
    }
  }

  return (
    <aside className={cn(
      "fixed right-0 top-16 h-[calc(100vh-64px)] w-full sm:w-[350px] border-l bg-card transition-transform duration-300 ease-in-out z-40 shadow-2xl",
      isOpen ? "translate-x-0" : "translate-x-full"
    )}>
      <div className="flex flex-col h-full">
        
        {/* Header da Sidebar */}
        <div className="flex items-center justify-between bg-navy px-4 py-3">
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
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white/70 hover:bg-white/10 hover:text-white">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {messages.length === 0 ? (
            <div className="space-y-4">
              <div className="rounded-2xl bg-white border p-4 shadow-sm text-xs text-muted-foreground leading-relaxed">
                Olá! Sou o teu orientador. Como posso ajudar-te na escolha do curso ou no processo da DGES hoje?
              </div>
              <div className="grid gap-2">
                {['Cursos de engenharia?', 'Como funciona a nota?', 'Sugestões para a minha média'].map(s => (
                  <button key={s} onClick={() => handleInputChange({ target: { value: s } } as any)}
                    className="text-left rounded-xl border bg-white px-3 py-2 text-[11px] text-navy hover:bg-navy/5 transition-colors shadow-sm">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m: any, idx: number) => (
              <div key={idx} className={cn("flex", m.role === 'user' ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm",
                  m.role === 'user' ? "bg-navy text-white rounded-tr-none" : "bg-white border text-foreground rounded-tl-none"
                )}>
                  {m.content}
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border rounded-2xl rounded-tl-none px-4 py-2">
                <div className="flex gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-navy/20 animate-bounce" />
                  <span className="h-1.5 w-1.5 rounded-full bg-navy/20 animate-bounce [animation-delay:0.2s]" />
                </div>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t bg-white">
          <form onSubmit={onFormSubmit} className="relative">
            <input 
              value={input}
              onChange={handleInputChange}
              placeholder="Pergunta algo..."
              disabled={isLoading}
              className="w-full rounded-full border bg-slate-50 py-3 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
            />
            <Button type="submit" size="icon" disabled={!(input || "").trim() || isLoading}
              className="absolute right-1.5 top-1.5 h-8 w-8 rounded-full bg-navy hover:bg-navy/90">
              <Send className="h-3.5 w-3.5" />
            </Button>
          </form>
        </div>
      </div>
    </aside>
  )
}