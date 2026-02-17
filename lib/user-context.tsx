'use client'

import { createContext, useContext, useState, useCallback, useMemo, useEffect, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Profile, UserGrade, UserExam } from './types'

interface UserContextType {
  isLoggedIn: boolean
  profile: Profile | null
  grades: UserGrade[]
  exams: UserExam[]
  comparisonList: string[]
  logout: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
  addGrade: (subject_name: string, grade: number, year_level: 10 | 11 | 12) => Promise<void>
  removeGrade: (gradeId: string) => Promise<void>
  addExam: (exam: Omit<UserExam, 'id' | 'user_id'>) => Promise<void>
  removeExam: (examId: string) => Promise<void>
  toggleComparison: (courseId: string) => void
  clearComparison: () => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [grades, setGrades] = useState<UserGrade[]>([])
  const [exams, setExams] = useState<UserExam[]>([])
  const [comparisonList, setComparisonList] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  
  const supabase = createClient()
  const router = useRouter()

  const clearUserData = useCallback(() => {
    setIsLoggedIn(false)
    setProfile(null)
    setGrades([])
    setExams([])
    setComparisonList([])
  }, [])

  const fetchAllUserData = useCallback(async (userId: string) => {
    try {
      const [profileRes, gradesRes, examsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('user_grades').select('*').eq('user_id', userId),
        supabase.from('user_exams').select('*').eq('user_id', userId)
      ])

      if (profileRes.error) {
        console.error('Erro ao carregar perfil:', profileRes.error)
        
        // Se o perfil não existir, tenta criá-lo
        if (profileRes.error.code === 'PGRST116') {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            const { error: insertError } = await supabase.from('profiles').insert({
              id: user.id,
              email: user.email,
              full_name: user.user_metadata.full_name || user.email?.split('@')[0] || 'Utilizador'
            })
            
            if (!insertError) {
              const { data: newProfile } = await supabase.from('profiles').select('*').eq('id', userId).single()
              if (newProfile) {
                setProfile(newProfile)
                setIsLoggedIn(true)
              }
            }
          }
        }
        return
      }

      setProfile(profileRes.data)
      setGrades(gradesRes.data || [])
      setExams(examsRes.data || [])
      setIsLoggedIn(true)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      clearUserData()
    }
  }, [supabase, clearUserData])

  // Verifica sessão inicial - SÓ CORRE UMA VEZ
  useEffect(() => {
    let mounted = true
    
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (mounted) {
          if (session?.user) {
            await fetchAllUserData(session.user.id)
          }
          setLoading(false) // ← SEMPRE termina o loading
        }
      } catch (error) {
        console.error('Erro ao inicializar sessão:', error)
        if (mounted) {
          setLoading(false) // ← SEMPRE termina o loading mesmo com erro
        }
      }
    }
    
    initSession()
    
    return () => {
      mounted = false
    }
  }, []) // ← Array vazio = só corre uma vez

  // Listener de mudanças de auth
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event)
      
      if (event === 'SIGNED_IN' && session?.user) {
        await fetchAllUserData(session.user.id)
      } else if (event === 'SIGNED_OUT') {
        clearUserData()
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        // Não precisa fazer nada, o token foi renovado automaticamente
      }
    })
    
    return () => subscription.unsubscribe()
  }, [supabase, fetchAllUserData, clearUserData])

  const logout = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      clearUserData()
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Erro no logout:', error)
      alert('Erro ao fazer logout. Tenta novamente.')
    }
  }, [supabase, router, clearUserData])

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!profile) return
    try {
      const { error } = await supabase.from('profiles').update(updates).eq('id', profile.id)
      if (error) throw error
      setProfile(prev => prev ? { ...prev, ...updates } : null)
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error)
      alert('Erro ao atualizar perfil')
    }
  }, [profile, supabase])

  const addGrade = useCallback(async (subject_name: string, grade: number, year_level: 10 | 11 | 12) => {
    if (!profile) return
    try {
      const { error } = await supabase.from('user_grades').upsert({
        user_id: profile.id,
        subject_name,
        year_level,
        grade
      }, {
        onConflict: 'user_id,subject_name,year_level'
      })
      if (error) throw error
      await fetchAllUserData(profile.id)
    } catch (error) {
      console.error('Erro ao adicionar nota:', error)
    }
  }, [profile, supabase, fetchAllUserData])

  const removeGrade = useCallback(async (gradeId: string) => {
    if (!profile) return
    try {
      const { error } = await supabase.from('user_grades').delete().eq('id', gradeId)
      if (error) throw error
      await fetchAllUserData(profile.id)
    } catch (error) {
      console.error('Erro ao remover nota:', error)
    }
  }, [profile, supabase, fetchAllUserData])

  const addExam = useCallback(async (exam: Omit<UserExam, 'id' | 'user_id'>) => {
    if (!profile) return
    try {
      const { error } = await supabase.from('user_exams').insert({ ...exam, user_id: profile.id })
      if (error) throw error
      await fetchAllUserData(profile.id)
    } catch (error) {
      console.error('Erro ao adicionar exame:', error)
    }
  }, [profile, supabase, fetchAllUserData])

  const removeExam = useCallback(async (examId: string) => {
    if (!profile) return
    try {
      const { error } = await supabase.from('user_exams').delete().eq('id', examId)
      if (error) throw error
      await fetchAllUserData(profile.id)
    } catch (error) {
      console.error('Erro ao remover exame:', error)
    }
  }, [profile, supabase, fetchAllUserData])

  const toggleComparison = useCallback((courseId: string) => {
    setComparisonList(prev => {
      if (prev.includes(courseId)) return prev.filter(id => id !== courseId)
      if (prev.length >= 2) return [prev[1], courseId]
      return [...prev, courseId]
    })
  }, [])

  const value = useMemo(() => ({
    isLoggedIn,
    profile,
    grades,
    exams,
    comparisonList,
    logout,
    updateProfile,
    addGrade,
    removeGrade,
    addExam,
    removeExam,
    toggleComparison,
    clearComparison: () => setComparisonList([])
  }), [isLoggedIn, profile, grades, exams, comparisonList, logout, updateProfile, addGrade, removeGrade, addExam, removeExam, toggleComparison])

  // Mostra loading só no primeiro carregamento
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">A carregar...</p>
        </div>
      </div>
    )
  }

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export const useUser = () => {
  const context = useContext(UserContext)
  if (!context) throw new Error('useUser must be used within a UserProvider')
  return context
}