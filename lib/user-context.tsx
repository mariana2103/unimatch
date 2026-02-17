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
  updateSubjectGrade: (subject_name: string, year_level: 10 | 11 | 12, grade: number) => Promise<void>
  removeSubjectGrade: (gradeId: string) => Promise<void>
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

  // Função centralizada para carregar todos os dados do utilizador
  const fetchAllUserData = useCallback(async (userId: string) => {
    const [p, g, e] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('user_grades').select('*').eq('user_id', userId),
      supabase.from('user_exams').select('*').eq('user_id', userId)
    ])

    if (p.data) setProfile(p.data)
    if (g.data) setGrades(g.data || [])
    if (e.data) setExams(e.data || [])
  }, [supabase])

  // Escuta mudanças de autenticação (Login/Logout)
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
    await supabase.auth.signOut()
    router.refresh()
  }, [supabase, router])

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!profile) return
    const { error } = await supabase.from('profiles').update(updates).eq('id', profile.id)
    if (!error) setProfile(prev => prev ? { ...prev, ...updates } : null)
  }

  // Lógica "Cadeira por Cadeira" usando Upsert
  const updateSubjectGrade = async (subject_name: string, year_level: 10 | 11 | 12, grade: number) => {
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

  const removeSubjectGrade = async (gradeId: string) => {
    const { error } = await supabase.from('user_grades').delete().eq('id', gradeId)
    if (!error && profile) await fetchAllUserData(profile.id)
  }

  const addExam = async (exam: Omit<UserExam, 'id' | 'user_id'>) => {
    if (!profile) return
    const { error } = await supabase.from('user_exams').insert({
      ...exam,
      user_id: profile.id
    })
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
    isLoggedIn,
    profile,
    grades,
    exams,
    comparisonList,
    logout,
    updateProfile,
    updateSubjectGrade,
    removeSubjectGrade,
    addExam,
    removeExam,
    toggleComparison,
    clearComparison: () => setComparisonList([])
  }), [isLoggedIn, profile, grades, exams, comparisonList, logout, toggleComparison])

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export const useUser = () => {
  const context = useContext(UserContext)
  if (!context) throw new Error('useUser must be used within a UserProvider')
  return context
}