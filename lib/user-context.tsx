'use client'

import { createContext, useContext, useState, useCallback, useMemo, useEffect, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { calculateCFA } from '@/lib/data'
import type { Profile, UserGrade, UserExam } from './types'

interface UserContextType {
  isLoggedIn: boolean
  isNewUser: boolean
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
  clearNewUser: () => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isNewUser, setIsNewUser] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [grades, setGrades] = useState<UserGrade[]>([])
  const [exams, setExams] = useState<UserExam[]>([])
  const [comparisonList, setComparisonList] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()
  const router = useRouter()

  const recalculateCFA = useCallback(async (userId: string, updatedGrades: UserGrade[], courseGroup: string) => {
    const bySubject = updatedGrades.reduce<Record<string, { name: string; grades: { year: number; grade: number }[] }>>(
      (acc, g) => {
        if (!acc[g.subject_name]) acc[g.subject_name] = { name: g.subject_name, grades: [] }
        acc[g.subject_name].grades.push({ year: g.year_level, grade: g.grade })
        return acc
      }, {}
    )
    const cfa = calculateCFA(Object.values(bySubject), courseGroup)
    await supabase.from('profiles').update({ media_final_calculada: cfa }).eq('id', userId)
    setProfile(prev => prev ? { ...prev, media_final_calculada: cfa } : null)
  }, [supabase])

  useEffect(() => {
    let isMounted = true

    const loadUser = async (userId: string, userMeta?: { email?: string | null; full_name?: string | null }) => {
      try {
        let { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle()

        if (!profileData) {
          // Profile missing — try to create it (trigger may have failed)
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              email: userMeta?.email ?? null,
              full_name: userMeta?.full_name ?? null,
              contingente_especial: 'geral',
              media_final_calculada: 0,
              course_group: 'CIENCIAS',
            })
            .select()
            .single()

          if (!insertError && newProfile) {
            profileData = newProfile
            setIsNewUser(true)
          } else {
            // Insert failed (e.g. trigger already created it) — retry fetch
            const { data: retryProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', userId)
              .maybeSingle()
            profileData = retryProfile
          }
        }

        if (!isMounted) return

        // Even if profile is null, still mark user as logged in with a fallback
        const resolvedProfile: Profile = profileData ?? {
          id: userId,
          email: userMeta?.email ?? null,
          full_name: userMeta?.full_name ?? null,
          avatar_url: null,
          username: null,
          distrito_residencia: null,
          contingente_especial: 'geral',
          media_final_calculada: 0,
          course_group: null,
          updated_at: new Date().toISOString(),
        }

        const [{ data: gradesData }, { data: examsData }] = await Promise.all([
          supabase.from('user_grades').select('*').eq('user_id', userId),
          supabase.from('user_exams').select('*').eq('user_id', userId),
        ])

        if (!isMounted) return
        setProfile(resolvedProfile)
        setIsLoggedIn(true)
        setGrades(gradesData ?? [])
        setExams(examsData ?? [])
      } catch (err) {
        console.error('Error loading user:', err)
      }
    }

    const initialize = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          await loadUser(session.user.id, {
            email: session.user.email,
            full_name: session.user.user_metadata?.full_name,
          })
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    initialize()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return

      if (event === 'SIGNED_OUT') {
        setIsLoggedIn(false)
        setIsNewUser(false)
        setProfile(null)
        setGrades([])
        setExams([])
        setComparisonList([])
      } else if (event === 'SIGNED_IN' && session?.user) {
        loadUser(session.user.id, {
          email: session.user.email,
          full_name: session.user.user_metadata?.full_name,
        })
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    setIsLoggedIn(false)
    setProfile(null)
    setGrades([])
    setExams([])
    setComparisonList([])
    router.push('/')
  }, [supabase, router])

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!profile) return
    const { error } = await supabase.from('profiles').update(updates).eq('id', profile.id)
    if (!error) setProfile(prev => prev ? { ...prev, ...updates } : null)
  }, [profile, supabase])

  const addGrade = useCallback(async (subject_name: string, grade: number, year_level: 10 | 11 | 12) => {
    if (!profile) return
    await supabase.from('user_grades').upsert(
      { user_id: profile.id, subject_name, grade, year_level },
      { onConflict: 'user_id,subject_name,year_level' }
    )
    const { data } = await supabase.from('user_grades').select('*').eq('user_id', profile.id)
    const updated = data ?? []
    setGrades(updated)
    await recalculateCFA(profile.id, updated, profile.course_group || 'CIENCIAS')
  }, [profile, supabase, recalculateCFA])

  const removeGrade = useCallback(async (gradeId: string) => {
    if (!profile) return
    await supabase.from('user_grades').delete().eq('id', gradeId)
    const { data } = await supabase.from('user_grades').select('*').eq('user_id', profile.id)
    const updated = data ?? []
    setGrades(updated)
    await recalculateCFA(profile.id, updated, profile.course_group || 'CIENCIAS')
  }, [profile, supabase, recalculateCFA])

  const addExam = useCallback(async (exam: Omit<UserExam, 'id' | 'user_id'>) => {
    if (!profile) return
    await supabase.from('user_exams').upsert(
      { ...exam, user_id: profile.id },
      { onConflict: 'user_id,exam_code,exam_year' }
    )
    const { data } = await supabase.from('user_exams').select('*').eq('user_id', profile.id)
    setExams(data ?? [])
  }, [profile, supabase])

  const removeExam = useCallback(async (examId: string) => {
    if (!profile) return
    await supabase.from('user_exams').delete().eq('id', examId)
    const { data } = await supabase.from('user_exams').select('*').eq('user_id', profile.id)
    setExams(data ?? [])
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
    isNewUser,
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
    clearComparison: () => setComparisonList([]),
    clearNewUser: () => setIsNewUser(false),
  }), [isLoggedIn, isNewUser, profile, grades, exams, comparisonList, logout, updateProfile, addGrade, removeGrade, addExam, removeExam, toggleComparison])

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy"></div>
    </div>
  )

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export const useUser = () => {
  const context = useContext(UserContext)
  if (!context) throw new Error('useUser must be used within a UserProvider')
  return context
}
