'use client'

import { Search, X, Filter, Eye } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { DISTRICTS, AREAS, EXAM_SUBJECTS } from '@/lib/constants'

export interface Filters {
  search: string
  areas: string[]
  districts: string[]
  provasIngresso: string[]
  tipo: '' | 'publica' | 'privada'
  onlyQualified: boolean
  onlyGoodOptions: boolean
}

interface CourseFiltersProps {
  filters: Filters
  onFiltersChange: (filters: Filters) => void
  isLoggedIn: boolean
}

function MultiChipSelect({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string
  options: { value: string; label: string }[]
  selected: string[]
  onToggle: (value: string) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map(opt => {
          const isActive = selected.includes(opt.value)
          return (
            <button
              key={opt.value}
              onClick={() => onToggle(opt.value)}
              className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all ${
                isActive
                  ? 'border-navy bg-navy text-primary-foreground'
                  : 'border-border/60 bg-card text-muted-foreground hover:border-navy/40 hover:text-foreground'
              }`}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function CourseFilters({ filters, onFiltersChange, isLoggedIn }: CourseFiltersProps) {
  const update = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const toggleArrayItem = (key: 'areas' | 'districts' | 'provasIngresso', value: string) => {
    const arr = filters[key]
    update(key, arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value])
  }

  const activeCount = filters.areas.length + filters.districts.length + filters.provasIngresso.length +
    (filters.tipo ? 1 : 0) + (filters.onlyQualified ? 1 : 0)

  const clearAll = () => {
    onFiltersChange({ search: '', areas: [], districts: [], provasIngresso: [], tipo: '', onlyQualified: false })
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border/50 bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Filter className="h-4 w-4 text-navy" />
          Filtros
          {activeCount > 0 && (
            <Badge className="bg-navy text-primary-foreground text-[10px] px-1.5">{activeCount}</Badge>
          )}
        </div>
        {activeCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearAll} className="h-7 gap-1 text-xs text-muted-foreground">
            <X className="h-3 w-3" /> Limpar
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Pesquisar curso ou universidade..."
          value={filters.search}
          onChange={e => update('search', e.target.value)}
          className="pl-9"
        />
      </div>

      <MultiChipSelect
        label="Area"
        options={AREAS.map(a => ({ value: a, label: a }))}
        selected={filters.areas}
        onToggle={v => toggleArrayItem('areas', v)}
      />

      <MultiChipSelect
        label="Distrito"
        options={DISTRICTS.map(d => ({ value: d, label: d }))}
        selected={filters.districts}
        onToggle={v => toggleArrayItem('districts', v)}
      />

      <MultiChipSelect
        label="Provas de Ingresso"
        options={EXAM_SUBJECTS.map(e => ({ value: e.code, label: `${e.code} ${e.name}` }))}
        selected={filters.provasIngresso}
        onToggle={v => toggleArrayItem('provasIngresso', v)}
      />

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Tipo:</span>
          {(['', 'publica', 'privada'] as const).map(t => (
            <button
              key={t || 'all'}
              onClick={() => update('tipo', t)}
              className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all ${
                filters.tipo === t
                  ? 'border-navy bg-navy text-primary-foreground'
                  : 'border-border/60 bg-card text-muted-foreground hover:border-navy/40 hover:text-foreground'
              }`}
            >
              {t === '' ? 'Todas' : t === 'publica' ? 'Publica' : 'Privada'}
            </button>
          ))}
        </div>

        {isLoggedIn && (
          <div className="flex items-center gap-2">
            <Switch
              id="only-qualified"
              checked={filters.onlyQualified}
              onCheckedChange={v => update('onlyQualified', v)}
            />
            <Label htmlFor="only-qualified" className="flex cursor-pointer items-center gap-1 text-xs text-foreground">
              <Eye className="h-3.5 w-3.5 text-navy" />
              So cursos com provas completas
            </Label>
          </div>
        )}
      </div>
    </div>
  )
}
