'use client'

import { Search, X, ChevronDown, Eye, Target, Check, SlidersHorizontal } from 'lucide-react'
import { Input } from '@/components/ui/input'
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
  const isActive = selected.length > 0
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={`inline-flex h-9 items-center gap-2 rounded-xl border px-3.5 text-sm font-medium transition-all ${
            isActive
              ? 'border-navy/40 bg-navy/5 text-navy shadow-sm'
              : 'border-border/60 bg-white text-muted-foreground hover:border-navy/30 hover:text-foreground hover:bg-slate-50'
          }`}
        >
          {label}
          {isActive && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-navy px-1.5 text-[10px] font-bold text-white">
              {selected.length}
            </span>
          )}
          <ChevronDown className="h-3.5 w-3.5 opacity-40" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        <div className="flex max-h-64 flex-col gap-0.5 overflow-y-auto">
          {options.map(opt => {
            const active = selected.includes(opt.value)
            return (
              <button
                key={opt.value}
                onClick={() => onToggle(opt.value)}
                className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
                  active ? 'bg-navy text-white' : 'text-foreground hover:bg-slate-50'
                }`}
              >
                <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                  active ? 'border-white/40 bg-white/20' : 'border-border'
                }`}>
                  {active && <Check className="h-3 w-3" />}
                </div>
                <span className="truncate text-xs">{opt.label}</span>
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
      className={`inline-flex h-9 items-center gap-2 rounded-xl border px-3.5 text-sm font-medium transition-all ${
        active
          ? 'border-navy bg-navy text-white shadow-sm'
          : 'border-border/60 bg-white text-muted-foreground hover:border-navy/30 hover:text-foreground hover:bg-slate-50'
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
    <div className="rounded-2xl border border-border/50 bg-white p-5 shadow-sm flex flex-col gap-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
        <Input
          placeholder="Pesquisar curso ou universidade..."
          value={filters.search}
          onChange={e => update('search', e.target.value)}
          className="h-11 pl-10 rounded-xl border-border/60 bg-slate-50/80 text-sm focus:bg-white transition-colors"
        />
        {filters.search && (
          <button
            onClick={() => update('search', '')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground/70 mr-1">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filtrar por
        </div>

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
          options={EXAM_SUBJECTS.map(e => ({ value: e.code, label: `${e.code} · ${e.name}` }))}
          selected={filters.provasIngresso}
          onToggle={v => toggle('provasIngresso', v)}
        />

        {/* Tipo segmented control */}
        <div className="flex overflow-hidden rounded-xl border border-border/60 bg-slate-50">
          {(['', 'publica', 'privada'] as const).map(t => (
            <button
              key={t || 'all'}
              onClick={() => update('tipo', t)}
              className={`px-3.5 py-2 text-xs font-medium transition-colors ${
                filters.tipo === t
                  ? 'bg-navy text-white shadow-sm'
                  : 'text-muted-foreground hover:bg-white hover:text-foreground'
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
            className="ml-auto h-9 gap-1.5 text-xs text-muted-foreground hover:text-foreground rounded-xl"
          >
            <X className="h-3.5 w-3.5" />
            Limpar ({activeCount})
          </Button>
        )}
      </div>

      {/* Active chips */}
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {chips.map((chip, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 rounded-lg bg-navy/8 px-2.5 py-1 text-[11px] font-medium text-navy"
            >
              {chip.label}
              <button onClick={chip.onRemove} className="hover:opacity-60 transition-opacity">
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
