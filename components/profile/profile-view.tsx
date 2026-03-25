'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, AlertTriangle } from 'lucide-react'
import { useUser } from '@/lib/user-context'
import { createClient } from '@/lib/supabase/client'
import { ProfileHeader } from './profile-header'
import { ProfileSettings } from './profile-settings'
import { GradesSection } from './grades-section'
import { ExamsSection } from './exams-section'

function DeleteAccountSection() {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { logout } = useUser()
  const router = useRouter()

  const handleDelete = async () => {
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Não autenticado')

      const res = await fetch('/api/delete-account', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const json = await res.json()

      if (!res.ok) {
        // If service role not configured, show contact info
        setError(json.error ?? 'Erro ao eliminar conta.')
        setLoading(false)
        return
      }

      // Success — sign out and redirect
      await logout()
      router.push('/?deleted=1')
    } catch (e: any) {
      setError(e.message ?? 'Erro inesperado.')
      setLoading(false)
    }
  }

  return (
    <div className="mt-8 rounded-xl border border-destructive/20 bg-destructive/3 p-5">
      <div className="flex items-center gap-2 mb-1">
        <AlertTriangle className="h-4 w-4 text-destructive/70" />
        <h3 className="text-sm font-semibold text-destructive/80">Zona de Perigo</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Eliminar a conta apaga permanentemente todos os teus dados (perfil, notas, favoritos). Esta ação não pode ser revertida.
      </p>

      {error && (
        <p className="mb-3 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>
      )}

      {!confirming ? (
        <button
          onClick={() => setConfirming(true)}
          className="flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/5 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Eliminar conta
        </button>
      ) : (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Tens a certeza? Esta ação é irreversível.</span>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="rounded-lg bg-destructive px-3 py-2 text-xs font-semibold text-white hover:bg-destructive/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'A eliminar...' : 'Sim, eliminar tudo'}
          </button>
          <button
            onClick={() => { setConfirming(false); setError(null) }}
            className="rounded-lg border px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  )
}

export function ProfileView() {
  const { isLoggedIn, profile, grades, exams } = useUser()

  if (!isLoggedIn || !profile) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Por favor, faz login para veres o teu perfil.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl py-12 px-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <ProfileHeader profile={profile} />

      <div className="grid gap-8 md:grid-cols-1">
        <ProfileSettings profile={profile} />
        <GradesSection grades={grades} courseGroup={profile.course_group || 'CIENCIAS'} />
        <ExamsSection exams={exams} />
      </div>

      <DeleteAccountSection />
    </div>
  )
}
