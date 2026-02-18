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

  useEffect(() => {
    const initialize = async () => {
      try {
        // 1. Pega a sessão
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Erro ao obter sessão:', sessionError)
          setLoading(false)
          return
        }

        if (!session?.user) {
          console.log('Sem sessão ativa')
          setLoading(false)
          return
        }

        console.log('✅ Sessão encontrada:', session.user.id)

        // 2. Espera um pouco para o trigger criar o perfil
        await new Promise(resolve => setTimeout(resolve, 1000))

        // 3. Tenta buscar o perfil - COM .single() e tratamento correto de erros
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        console.log('Profile data:', profileData)
        console.log('Profile error:', profileError)

        // 4. Se não existe perfil (erro PGRST116), cria manualmente
        if (profileError?.code === 'PGRST116' || !profileData) {
          console.log('📝 Criando perfil manualmente...')
          
          const newProfile = {
            id: session.user.id,
            email: session.user.email,
            full_name: session.user.user_metadata?.full_name || 
                      session.user.user_metadata?.name || 
                      session.user.email?.split('@')[0] || 
                      'Utilizador',
            avatar_url: session.user.user_metadata?.avatar_url || null,
            username: null,
            distrito_residencia: null,
            contingente_especial: 'geral',
            media_final_calculada: 0,
            updated_at: new Date().toISOString()
          }

          const { data: insertedProfile, error: insertError } = await supabase
            .from('profiles')
            .insert(newProfile)
            .select()
            .single()

          if (insertError) {
            console.error('❌ Erro ao criar perfil:', insertError)
            // Tenta buscar de novo (pode ter sido criado pelo trigger)
            const { data: retryProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single()
            
            if (retryProfile) {
              setProfile(retryProfile)
              setIsLoggedIn(true)
            } else {
              setLoading(false)
              return
            }
          } else if (insertedProfile) {
            console.log('✅ Perfil criado:', insertedProfile)
            setProfile(insertedProfile)
            setIsLoggedIn(true)
          }
        } else if (profileData) {
          // Perfil existe
          console.log('✅ Perfil encontrado:', profileData)
          setProfile(profileData)
          setIsLoggedIn(true)

          // 5. Busca grades e exams
          const [gradesRes, examsRes] = await Promise.all([
            supabase.from('user_grades').select('*').eq('user_id', session.user.id),
            supabase.from('user_exams').select('*').eq('user_id', session.user.id)
          ])

          setGrades(gradesRes.data || [])
          setExams(examsRes.data || [])
        }
      } catch (err) {
        console.error('💥 Erro na inicialização:', err)
      } finally {
        setLoading(false)
      }
    }

    initialize()

    // Auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔔 Auth event:', event)
      
      if (event === 'SIGNED_IN') {
        // Força reload completo
        window.location.href = '/'
      } else if (event === 'SIGNED_OUT') {
        setIsLoggedIn(false)
        setProfile(null)
        setGrades([])
        setExams([])
        setComparisonList([])
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut()
      setIsLoggedIn(false)
      setProfile(null)
      setGrades([])
      setExams([])
      setComparisonList([])
      router.push('/')
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
    await supabase.from('user_grades').upsert({
      user_id: profile.id,
      subject_name,
      year_level,
      grade
    }, { onConflict: 'user_id,subject_name,year_level' })
    const { data } = await supabase.from('user_grades').select('*').eq('user_id', profile.id)
    setGrades(data || [])
  }, [profile, supabase])

  const removeGrade = useCallback(async (gradeId: string) => {
    if (!profile) return
    await supabase.from('user_grades').delete().eq('id', gradeId)
    const { data } = await supabase.from('user_grades').select('*').eq('user_id', profile.id)
    setGrades(data || [])
  }, [profile, supabase])

  const addExam = useCallback(async (exam: Omit<UserExam, 'id' | 'user_id'>) => {
    if (!profile) return
    await supabase.from('user_exams').insert({ ...exam, user_id: profile.id })
    const { data } = await supabase.from('user_exams').select('*').eq('user_id', profile.id)
    setExams(data || [])
  }, [profile, supabase])

  const removeExam = useCallback(async (examId: string) => {
    if (!profile) return
    await supabase.from('user_exams').delete().eq('id', examId)
    const { data } = await supabase.from('user_exams').select('*').eq('user_id', profile.id)
    setExams(data || [])
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