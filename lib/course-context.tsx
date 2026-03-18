'use client'

import { createContext, useContext } from 'react'
import type { CourseUI } from './types'

interface CourseContextType {
  setSelectedCourse: (course: CourseUI | null) => void
  setAllCourses: (courses: CourseUI[]) => void
}

export const CourseContext = createContext<CourseContextType>({
  setSelectedCourse: () => {},
  setAllCourses: () => {},
})

export function useCourseContext() {
  return useContext(CourseContext)
}
