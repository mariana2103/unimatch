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

  // Inicialização - corre UMA VEZ
  useEffect(() => {
    let cancelled = false

    const init = async () => {
      try {
        // 1. Pega a sessão
        const { data: { session } } = await supabase.auth.getSession()
        
        if (cancelled) return

        // 2. Se não há sessão, termina
        if (!session?.user) {
          setLoading(false)
          return
        }

        // 3. Tenta buscar o perfil
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (cancelled) return

        // 4. Se não existe perfil, cria um
        if (error?.code === 'PGRST116') {
          const { error: insertError } = await supabase.from('profiles').insert({
            id: session.user.id,
            email: session.user.email,
            full_name: session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'Utilizador'
          })

          if (!insertError) {
            // Busca novamente
            const { data: newProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single()
            
            if (newProfile && !cancelled) {
              setProfile(newProfile)
              setIsLoggedIn(true)
            }
          }
        } else if (profileData && !cancelled) {
          setProfile(profileData)
          setIsLoggedIn(true)

          // 5. Busca grades e exams
          const [gradesRes, examsRes] = await Promise.all([
            supabase.from('user_grades').select('*').eq('user_id', session.user.id),
            supabase.from('user_exams').select('*').eq('user_id', session.user.id)
          ])

          if (!cancelled) {
            setGrades(gradesRes.data || [])
            setExams(examsRes.data || [])
          }
        }
      } catch (err) {
        console.error('Erro na inicialização:', err)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    init()

    // Auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event)

      if (event === 'SIGNED_IN' && session?.user) {
        // Recarrega a página para reinicializar tudo
        window.location.reload()
      } else if (event === 'SIGNED_OUT') {
        setIsLoggedIn(false)
        setProfile(null)
        setGrades([])
        setExams([])
        setComparisonList([])
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, []) // Array vazio = corre UMA VEZ

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut()
      setIsLoggedIn(false)
      setProfile(null)
      setGrades([])
      setExams([])
      setComparisonList([])
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Erro no logout:', error)
    }
  }, [supabase, router])

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!profile) return
    const { error } = await supabase.from('profiles').update(updates).eq('id', profile.id)
    if (!error) setProfile(prev => prev ? { ...prev, ...updates } : null)
  }, [profile, supabase])

  const addGrade = useCallback(async (subject_name: string, grade: number, year_level: 10 | 11 | 12) => {
    if (!profile) return
    const { error } = await supabase.from('user_grades').upsert({
      user_id: profile.id,
      subject_name,
      year_level,
      grade
    }, { onConflict: 'user_id,subject_name,year_level' })
    
    if (!error) {
      const { data } = await supabase.from('user_grades').select('*').eq('user_id', profile.id)
      setGrades(data || [])
    }
  }, [profile, supabase])

  const removeGrade = useCallback(async (gradeId: string) => {
    if (!profile) return
    const { error } = await supabase.from('user_grades').delete().eq('id', gradeId)
    if (!error) {
      const { data } = await supabase.from('user_grades').select('*').eq('user_id', profile.id)
      setGrades(data || [])
    }
  }, [profile, supabase])

  const addExam = useCallback(async (exam: Omit<UserExam, 'id' | 'user_id'>) => {
    if (!profile) return
    const { error } = await supabase.from('user_exams').insert({ ...exam, user_id: profile.id })
    if (!error) {
      const { data } = await supabase.from('user_exams').select('*').eq('user_id', profile.id)
      setExams(data || [])
    }
  }, [profile, supabase])

  const removeExam = useCallback(async (examId: string) => {
    if (!profile) return
    const { error } = await supabase.from('user_exams').delete().eq('id', examId)
    if (!error) {
      const { data } = await supabase.from('user_exams').select('*').eq('user_id', profile.id)
      setExams(data || [])
    }
  }, [profile, supabase])

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy"></div>
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