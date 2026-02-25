'use client'

import { useTransition } from 'react'
import { MapPin, ShieldCheck, BookOpen } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DISTRICTS, CONTINGENTES, COURSE_GROUPS } from '@/lib/constants'
import { useUser } from '@/lib/user-context'
import type { Profile } from '@/lib/types'

interface ProfileSettingsProps {
  profile: Profile
}

export function ProfileSettings({ profile }: ProfileSettingsProps) {
  const { updateProfile } = useUser()
  const [isPending, startTransition] = useTransition()

  const handleDistrictChange = (value: string) => {
    startTransition(async () => {
      await updateProfile({ distrito_residencia: value })
    })
  }

  const handleContingentChange = (value: string) => {
    startTransition(async () => {
      await updateProfile({ contingente_especial: value })
    })
  }

  const handleCourseGroupChange = (value: string) => {
    startTransition(async () => {
      await updateProfile({ course_group: value })
    })
  }

  return (
    <div className="grid gap-6 sm:grid-cols-3">
      <section className="space-y-3">
        <Label className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
          <MapPin className="h-4 w-4" /> Distrito de Residência
        </Label>
        <Select
          value={profile.distrito_residencia || ''}
          onValueChange={handleDistrictChange}
          disabled={isPending}
        >
          <SelectTrigger className="h-11 shadow-sm">
            <SelectValue placeholder="Onde vives?" />
          </SelectTrigger>
          <SelectContent>
            {DISTRICTS.map((d) => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>

      <section className="space-y-3">
        <Label className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
          <ShieldCheck className="h-4 w-4" /> Contingente Especial
        </Label>
        <Select
          value={profile.contingente_especial || 'geral'}
          onValueChange={handleContingentChange}
          disabled={isPending}
        >
          <SelectTrigger className="h-11 shadow-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CONTINGENTES.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>

      <section className="space-y-3">
        <Label className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
          <BookOpen className="h-4 w-4" /> Área de Estudos
        </Label>
        <Select
          value={profile.course_group || 'CIENCIAS'}
          onValueChange={handleCourseGroupChange}
          disabled={isPending}
        >
          <SelectTrigger className="h-11 shadow-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(COURSE_GROUPS).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>
    </div>
  )
}
