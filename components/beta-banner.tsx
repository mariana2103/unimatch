'use client'

import { useState, useEffect } from 'react'
import { X, MessageSquare, Send, CheckCircle2, Loader2, FlaskConical } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/lib/user-context'
import { cn } from '@/lib/utils'

/*
 * To enable feedback storage, run in Supabase SQL editor:
 *
 * create table if not exists public.feedback (
 *   id uuid default gen_random_uuid() primary key,
 *   message text not null,
 *   category text not null default 'outro',
 *   user_id uuid references public.profiles(id) on delete set null,
 *   created_at timestamptz default now()
 * );
 * alter table public.feedback enable row level security;
 * create policy "Anyone can insert feedback"
 *   on public.feedback for insert with check (true);
 */

const CATEGORIES = [
  { value: 'bug',     label: 'Erro / Bug' },
  { value: 'dados',   label: 'Dados incorretos' },
  { value: 'sugestao', label: 'Sugestão' },
  { value: 'outro',   label: 'Outro' },
]

const DISMISS_KEY = 'unimatch_beta_banner_dismissed'

function FeedbackDialog({ onClose }: { onClose: () => void }) {
  const { profile } = useUser()
  const [message, setMessage] = useState('')
  const [category, setCategory] = useState('sugestao')
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return
    setStatus('sending')
    try {
      const supabase = createClient()
      const { error } = await supabase.from('feedback').insert({
        message: message.trim(),
        category,
        user_id: profile?.id ?? null,
      })
      if (error) throw error
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'done') {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <CheckCircle2 className="h-10 w-10 text-emerald" />
        <div>
          <p className="font-semibold text-foreground">Obrigado pelo feedback!</p>
          <p className="mt-0.5 text-sm text-muted-foreground">Ajudas a melhorar o UniMatch para todos.</p>
        </div>
        <button
          onClick={onClose}
          className="mt-2 rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy/90 transition-colors"
        >
          Fechar
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-foreground">Categoria</label>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map(c => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCategory(c.value)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                category === c.value
                  ? 'bg-navy text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80',
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-foreground">
          Mensagem <span className="text-muted-foreground font-normal">(obrigatória)</span>
        </label>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Descreve o que encontraste ou o que poderíamos melhorar..."
          rows={4}
          className="w-full resize-none rounded-lg border border-border/60 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-navy/30"
        />
      </div>

      {status === 'error' && (
        <p className="text-xs text-destructive">Ocorreu um erro ao enviar. Tenta novamente.</p>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:bg-muted/60 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!message.trim() || status === 'sending'}
          className="flex items-center gap-1.5 rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy/90 transition-colors disabled:opacity-50"
        >
          {status === 'sending'
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <Send className="h-3.5 w-3.5" />
          }
          Enviar
        </button>
      </div>
    </form>
  )
}

export function BetaBanner() {
  const [visible, setVisible] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISS_KEY)
    if (!dismissed) setVisible(true)
  }, [])

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1')
    setVisible(false)
  }

  return (
    <>
      {/* Banner */}
      {visible && (
        <div className="border-b border-border/40 bg-muted/80 dark:bg-card/80 dark:border-border/30 backdrop-blur-sm">
          <div className="mx-auto flex max-w-7xl items-start gap-3 px-4 py-2.5 sm:items-center sm:px-6 lg:px-8">
            <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-navy sm:mt-0" />
            <p className="flex-1 text-xs text-foreground/80">
              <span className="font-semibold">Versão inicial — dados de 2025.</span>{' '}
              Os valores de nota são oficiais (DGES), mas os cálculos e o conselheiro IA podem ter erros pontuais.
              Encontraste algo errado? O teu feedback ajuda.
            </p>
            <div className="flex shrink-0 items-center gap-1">
              <button
                onClick={() => setDialogOpen(true)}
                className="flex items-center gap-1 rounded-md bg-muted px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-muted/80 transition-colors"
              >
                <MessageSquare className="h-3 w-3" />
                Feedback
              </button>
              <button
                onClick={dismiss}
                className="flex h-6 w-6 items-center justify-center rounded text-blue-400 hover:text-blue-600 hover:bg-blue-100 transition-colors dark:text-blue-500 dark:hover:bg-blue-900/40"
                aria-label="Fechar aviso"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback dialog (modal) */}
      {dialogOpen && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setDialogOpen(false)}
          />
          {/* Panel */}
          <div className="relative z-10 w-full max-w-md rounded-t-2xl sm:rounded-2xl border border-border/60 bg-card p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-foreground">Deixar feedback</h2>
                <p className="text-xs text-muted-foreground">Encontraste um erro ou tens uma sugestão?</p>
              </div>
              <button
                onClick={() => setDialogOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/60 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <FeedbackDialog onClose={() => setDialogOpen(false)} />
          </div>
        </div>
      )}
    </>
  )
}

/* Small persistent feedback button for when the banner is dismissed */
export function FeedbackButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 rounded-full border border-border/60 bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground shadow-sm hover:text-foreground hover:border-border transition-colors"
      >
        <MessageSquare className="h-3 w-3" />
        Feedback
      </button>

      {open && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full max-w-md rounded-t-2xl sm:rounded-2xl border border-border/60 bg-card p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-foreground">Deixar feedback</h2>
                <p className="text-xs text-muted-foreground">Encontraste um erro ou tens uma sugestão?</p>
              </div>
              <button onClick={() => setOpen(false)} className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/60 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <FeedbackDialog onClose={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  )
}
