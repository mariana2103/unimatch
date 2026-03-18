'use client'

import { Simulator2Fase } from '@/components/simulator-2fase'
import { useCourseContext } from '@/lib/course-context'

export default function SimuladorPage() {
  const { setSelectedCourse } = useCourseContext()
  return <Simulator2Fase onViewDetails={setSelectedCourse} />
}
