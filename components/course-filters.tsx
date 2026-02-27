'use client'

import { Search, X, ChevronDown, Eye, Target, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { DISTRICTS, AREAS, EXAM_SUBJECTS } from '@/lib/constants'

export interface Filters {
  search: string
  areas: string[]
  districts: string[]
  provasIngresso: string[]
  tipo: '' | 'publica' | 'privada'
  onlyQualified: boolean
  onlyGoodOptions: boolean
  withinRange: boolean
}

interface CourseFiltersProps {
  filters: Filters
  onFiltersChange: (filters: Filters) => void
  isLoggedIn: boolean
  hasProfile: boolean
}

function MultiSelectPopover({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string
  options: { value: string; label: string }[]
  selected: string[]
  onToggle: (v: string) => void
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors ${
            selected.length > 0
              ? 'border-navy/40 bg-navy/5 text-navy'
              : 'border-border/60 text-muted-foreground hover:border-navy/30 hover:text-foreground'
          }`}
        >
          {label}
          {selected.length > 0 && (
            <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-navy px-1 text-[10px] font-semibold text-white">
              {selected.length}
            </span>
          )}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-1.5" align="start">
        <div className="flex max-h-60 flex-col gap-0.5 overflow-y-auto">
          {options.map(opt => {
            const active = selected.includes(opt.value)
            return (
              <button
                key={opt.value}
                onClick={() => onToggle(opt.value)}
                className={`flex items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors ${
                  active ? 'bg-navy text-white' : 'text-foreground hover:bg-muted'
                }`}
              >
                <div className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border ${
                  active ? 'border-white/50 bg-white/20' : 'border-border'
                }`}>
                  {active && <Check className="h-2.5 w-2.5" />}
                </div>
                <span className="truncate">{opt.label}</span>
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function SmartFilterButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ElementType
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors ${
        active
          ? 'border-navy bg-navy text-white'
          : 'border-border/60 text-muted-foreground hover:border-navy/30 hover:text-foreground'
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  )
}

export function CourseFilters({ filters, onFiltersChange, isLoggedIn, hasProfile }: CourseFiltersProps) {
  const update = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    onFiltersChange({ ...filters, [key]: value })

  const toggle = (key: 'areas' | 'districts' | 'provasIngresso', value: string) => {
    const arr = filters[key]
    update(key, arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value])
  }

  const activeCount =
    filters.areas.length +
    filters.districts.length +
    filters.provasIngresso.length +
    (filters.tipo ? 1 : 0) +
    (filters.onlyQualified ? 1 : 0) +
    (filters.withinRange ? 1 : 0)

  const clearAll = () =>
    onFiltersChange({
      search: '',
      areas: [],
      districts: [],
      provasIngresso: [],
      tipo: '',
      onlyQualified: false,
      onlyGoodOptions: false,
      withinRange: false,
    })

  // Active chips for quick removal
  const chips: { label: string; onRemove: () => void }[] = [
    ...filters.areas.map(a => ({ label: a, onRemove: () => toggle('areas', a) })),
    ...filters.districts.map(d => ({ label: d, onRemove: () => toggle('districts', d) })),
    ...filters.provasIngresso.map(p => ({
      label: EXAM_SUBJECTS.find(e => e.code === p)?.name ?? p,
      onRemove: () => toggle('provasIngresso', p),
    })),
    ...(filters.tipo
      ? [{ label: filters.tipo === 'publica' ? 'Pública' : 'Privada', onRemove: () => update('tipo', '') }]
      : []),
    ...(filters.onlyQualified
      ? [{ label: 'Com provas', onRemove: () => update('onlyQualified', false) }]
      : []),
    ...(filters.withinRange
      ? [{ label: '≤ 20 pts', onRemove: () => update('withinRange', false) }]
      : []),
  ]

  return (
    <div className="flex flex-col gap-2">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Pesquisar curso ou universidade..."
          value={filters.search}
          onChange={e => update('search', e.target.value)}
          className="h-9 pl-9"
        />
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-2">
        <MultiSelectPopover
          label="Área"
          options={AREAS.map(a => ({ value: a, label: a }))}
          selected={filters.areas}
          onToggle={v => toggle('areas', v)}
        />

        <MultiSelectPopover
          label="Distrito"
          options={DISTRICTS.map(d => ({ value: d, label: d }))}
          selected={filters.districts}
          onToggle={v => toggle('districts', v)}
        />

        <MultiSelectPopover
          label="Provas"
          options={EXAM_SUBJECTS.map(e => ({ value: e.code, label: `${e.code} ${e.name}` }))}
          selected={filters.provasIngresso}
          onToggle={v => toggle('provasIngresso', v)}
        />

        {/* Tipo inline toggle */}
        <div className="flex overflow-hidden rounded-md border border-border/60">
          {(['', 'publica', 'privada'] as const).map(t => (
            <button
              key={t || 'all'}
              onClick={() => update('tipo', t)}
              className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                filters.tipo === t
                  ? 'bg-navy text-white'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              {t === '' ? 'Todas' : t === 'publica' ? 'Pública' : 'Privada'}
            </button>
          ))}
        </div>

        {/* Smart filters — only when logged in with grades */}
        {isLoggedIn && hasProfile && (
          <>
            <SmartFilterButton
              active={filters.onlyQualified}
              onClick={() => update('onlyQualified', !filters.onlyQualified)}
              icon={Eye}
              label="Tenho as provas"
            />
            <SmartFilterButton
              active={filters.withinRange}
              onClick={() => update('withinRange', !filters.withinRange)}
              icon={Target}
              label="≤ 20 pts de mim"
            />
          </>
        )}

        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="ml-auto h-8 gap-1 text-xs text-muted-foreground"
          >
            <X className="h-3 w-3" />
            Limpar ({activeCount})
          </Button>
        )}
      </div>

      {/* Active filter chips */}
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {chips.map((chip, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 rounded-full bg-navy/10 px-2 py-0.5 text-[11px] font-medium text-navy"
            >
              {chip.label}
              <button onClick={chip.onRemove} className="hover:opacity-70">
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
