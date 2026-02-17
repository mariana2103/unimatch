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
  
  const supabase = createClient()
  const router = useRouter()

  const fetchAllUserData = useCallback(async (userId: string) => {
    const [p, g, e] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      supabase.from('user_grades').select('*').eq('user_id', userId),
      supabase.from('user_exams').select('*').eq('user_id', userId)
    ])

    // Se o perfil não existir na DB mas a sessão existe, faz logout
    if (!p.data) {
      console.warn('Perfil não encontrado - a fazer logout automático')
      await supabase.auth.signOut()
      setIsLoggedIn(false)
      setProfile(null)
      setGrades([])
      setExams([])
      setComparisonList([])
      return
    }

    setProfile(p.data)
    if (g.data) setGrades(g.data || [])
    if (e.data) setExams(e.data || [])
  }, [supabase])

  // Limpa sessões antigas de contas apagadas (pode remover depois de alguns dias)
  useEffect(() => {
    const clearOldSessions = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', session.user.id)
          .maybeSingle()
        
        if (!profile) {
          console.log('Sessão inválida detetada - a limpar')
          await supabase.auth.signOut()
          window.location.reload()
        }
      }
    }
    clearOldSessions()
  }, [supabase])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        setIsLoggedIn(true)
        await fetchAllUserData(session.user.id)
      } else {
        setIsLoggedIn(false)
        setProfile(null)
        setGrades([])
        setExams([])
        setComparisonList([])
      }
    })
    return () => subscription.unsubscribe()
  }, [supabase, fetchAllUserData])

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut()
      // Limpa tudo imediatamente
      setIsLoggedIn(false)
      setProfile(null)
      setGrades([])
      setExams([])
      setComparisonList([])
      // Redireciona para a home
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Erro no logout:', error)
    }
  }, [supabase, router])

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!profile) return
    const { error } = await supabase.from('profiles').update(updates).eq('id', profile.id)
    if (!error) setProfile(prev => prev ? { ...prev, ...updates } : null)
  }

  const addGrade = async (subject_name: string, grade: number, year_level: 10 | 11 | 12) => {
    if (!profile) return
    const { error } = await supabase.from('user_grades').upsert({
      user_id: profile.id,
      subject_name,
      year_level,
      grade
    }, {
      onConflict: 'user_id,subject_name,year_level'
    })
    if (!error) await fetchAllUserData(profile.id)
  }

  const removeGrade = async (gradeId: string) => {
    const { error } = await supabase.from('user_grades').delete().eq('id', gradeId)
    if (!error && profile) await fetchAllUserData(profile.id)
  }

  const addExam = async (exam: Omit<UserExam, 'id' | 'user_id'>) => {
    if (!profile) return
    const { error } = await supabase.from('user_exams').insert({ ...exam, user_id: profile.id })
    if (!error) await fetchAllUserData(profile.id)
  }

  const removeExam = async (examId: string) => {
    const { error } = await supabase.from('user_exams').delete().eq('id', examId)
    if (!error && profile) await fetchAllUserData(profile.id)
  }

  const toggleComparison = useCallback((courseId: string) => {
    setComparisonList(prev => {
      if (prev.includes(courseId)) return prev.filter(id => id !== courseId)
      if (prev.length >= 2) return [prev[1], courseId]
      return [...prev, courseId]
    })
  }, [])

  const value = useMemo(() => ({
    isLoggedIn, profile, grades, exams, comparisonList,
    logout, updateProfile, addGrade, removeGrade, addExam, removeExam,
    toggleComparison, clearComparison: () => setComparisonList([])
  }), [isLoggedIn, profile, grades, exams, comparisonList, logout, toggleComparison])

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export const useUser = () => {
  const context = useContext(UserContext)
  if (!context) throw new Error('useUser must be used within a UserProvider')
  return context
}