'use client'

import { Calculator } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { YearSection } from './year-section'
import type { UserGrade } from '@/lib/types'

interface GradesSectionProps {
  grades: UserGrade[]
  courseGroup?: string
}

const YEAR_LEVELS = [10, 11, 12] as const

export function GradesSection({ grades, courseGroup = 'CIENCIAS' }: GradesSectionProps) {
  return (
    <section className="space-y-4">
      <Label className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
        <Calculator className="h-4 w-4" /> Notas das Disciplinas (Secundário)
      </Label>
      <div className="grid gap-4">
        {YEAR_LEVELS.map((year) => (
          <YearSection
            key={year}
            year={year}
            allGrades={grades}
            courseGroup={courseGroup}
          />
        ))}
      </div>
    </section>
  )
}
