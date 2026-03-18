'use client'

import { CourseExplorer } from '@/components/course-explorer'
import { useCourseContext } from '@/lib/course-context'

export default function ExplorePage() {
  const { setSelectedCourse, setAllCourses } = useCourseContext()
  return (
    <CourseExplorer
      onCoursesLoaded={setAllCourses}
      onViewDetails={setSelectedCourse}
    />
  )
}
