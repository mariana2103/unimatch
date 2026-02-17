'use client'

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react'
import type { UserProfile, ExamGrade, SubjectGrade, YearGrades } from './types'
import { calculateMediaSecundario } from './data'

interface UserContextType {
  isLoggedIn: boolean
  profile: UserProfile
  comparisonList: string[]
  login: (name: string) => void
  logout: () => void
  updateProfile: (updates: Partial<UserProfile>) => void
  setYearGrades: (year: keyof YearGrades, grades: SubjectGrade[]) => void
  addExam: (exam: ExamGrade) => void
  removeExam: (subjectCode: string) => void
  toggleContingente: (id: string) => void
  toggleComparison: (courseId: string) => void
  clearComparison: () => void
}

const defaultYearGrades: YearGrades = { ano10: [], ano11: [], ano12: [] }

const defaultProfile: UserProfile = {
  name: '',
  yearGrades: defaultYearGrades,
  mediaSecundario: 0,
  exams: [],
  district: '',
  contingentes: [],
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [profile, setProfile] = useState<UserProfile>(defaultProfile)
  const [comparisonList, setComparisonList] = useState<string[]>([])

  const login = useCallback((name: string) => {
    setIsLoggedIn(true)
    setProfile(prev => ({ ...prev, name }))
  }, [])

  const logout = useCallback(() => {
    setIsLoggedIn(false)
    setProfile(defaultProfile)
    setComparisonList([])
  }, [])

  const recalcMedia = useCallback((yg: YearGrades, exams: ExamGrade[]) => {
    return calculateMediaSecundario(yg, exams)
  }, [])

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }))
  }, [])

  const setYearGrades = useCallback((year: keyof YearGrades, grades: SubjectGrade[]) => {
    setProfile(prev => {
      const newYearGrades = { ...prev.yearGrades, [year]: grades }
      const newMedia = calculateMediaSecundario(newYearGrades, prev.exams)
      return { ...prev, yearGrades: newYearGrades, mediaSecundario: newMedia }
    })
  }, [])

  const addExam = useCallback((exam: ExamGrade) => {
    setProfile(prev => {
      const newExams = [...prev.exams.filter(e => e.subjectCode !== exam.subjectCode), exam]
      const newMedia = calculateMediaSecundario(prev.yearGrades, newExams)
      return { ...prev, exams: newExams, mediaSecundario: newMedia }
    })
  }, [])

  const removeExam = useCallback((subjectCode: string) => {
    setProfile(prev => {
      const newExams = prev.exams.filter(e => e.subjectCode !== subjectCode)
      const newMedia = calculateMediaSecundario(prev.yearGrades, newExams)
      return { ...prev, exams: newExams, mediaSecundario: newMedia }
    })
  }, [])

  const toggleContingente = useCallback((id: string) => {
    setProfile(prev => ({
      ...prev,
      contingentes: prev.contingentes.includes(id)
        ? prev.contingentes.filter(c => c !== id)
        : [...prev.contingentes, id],
    }))
  }, [])

  const toggleComparison = useCallback((courseId: string) => {
    setComparisonList(prev => {
      if (prev.includes(courseId)) return prev.filter(id => id !== courseId)
      if (prev.length >= 2) return [prev[1], courseId]
      return [...prev, courseId]
    })
  }, [])

  const clearComparison = useCallback(() => setComparisonList([]), [])

  const value = useMemo(() => ({
    isLoggedIn, profile, comparisonList,
    login, logout, updateProfile, setYearGrades,
    addExam, removeExam, toggleContingente,
    toggleComparison, clearComparison,
  }), [isLoggedIn, profile, comparisonList, login, logout, updateProfile, setYearGrades, addExam, removeExam, toggleContingente, toggleComparison, clearComparison])

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (!context) throw new Error('useUser must be used within a UserProvider')
  return context
}
