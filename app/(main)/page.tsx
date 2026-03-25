'use client'

import { CourseExplorer } from '@/components/course-explorer'
import { useCourseContext } from '@/lib/course-context'

export default function ExplorePage() {
  const { setSelectedCourse, setAllCourses } = useCourseContext()
  
  const handleViewDetails = (course: any) => {
    console.log('Setting selected course:', course.id, course.nome)
    setSelectedCourse(course)
  }
  
  return (
    <CourseExplorer
      onCoursesLoaded={setAllCourses}
      onViewDetails={handleViewDetails}
    />
  )
}
