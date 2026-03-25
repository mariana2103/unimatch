'use client'

import { useId, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface HistoricoEntry {
  year: number
  nota_f1: number | null
  nota_f2: number | null
  vagas_f1?: number | null
  vagas_f2?: number | null
}

interface Props {
  historico: HistoricoEntry[]
}

export function GradeEvolutionChart({ historico }: Props) {
  if (!historico || historico.length === 0) return null

  const id = useId()
  const svgRef = useRef<SVGSVGElement>(null)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; year: number; f1: number | null; f2: number | null } | null>(null)

  // Only plot years that have at least a 1ª fase nota, exclude 2026 (no nota yet)
  const data = historico
    .filter(h => h.nota_f1 !== null && h.year < 2026)
    .map(h => ({
      year:  h.year,
      f1:    h.nota_f1! / 10,
      f2:    h.nota_f2 !== null ? h.nota_f2 / 10 : null,
    }))

  if (data.length === 0) return null

  const trend = data[data.length - 1].f1 - data[0].f1

  const W = 280
  const H = 110
  const PAD = { top: 8, right: 12, bottom: 20, left: 32 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom

  const allVals = data.flatMap(d => [d.f1, d.f2].filter((v): v is number => v !== null))
  const minY = Math.floor(Math.min(...allVals) / 0.5) * 0.5 - 0.5
  const maxY = Math.ceil(Math.max(...allVals) / 0.5) * 0.5 + 0.5

  const toX = (i: number) => PAD.left + (i / Math.max(data.length - 1, 1)) * chartW
  const toY = (v: number) => PAD.top + chartH - ((v - minY) / (maxY - minY)) * chartH

  const pts1 = data.map((d, i) => ({ ...d, px: toX(i), py: toY(d.f1) }))
  const pts2 = data.flatMap((d, i) => d.f2 !== null ? [{ ...d, f2: d.f2, px: toX(i), py: toY(d.f2) }] : [])

  const linePath = (pts: { px: number; py: number }[]) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.px},${p.py}`).join(' ')

  const areaPath1 = `${linePath(pts1)} L${pts1[pts1.length - 1].px},${PAD.top + chartH} L${pts1[0].px},${PAD.top + chartH} Z`

  const yTicks = Array.from(
    { length: Math.round((maxY - minY) / 0.5) + 1 },
    (_, i) => minY + i * 0.5,
  )

  // Use CSS variables for theme-aware colors
  const navyColor = 'var(--navy)'
  const f2Color   = 'var(--navy-light)'
  const gridColor = 'var(--border)'
  const textColor = 'var(--muted-foreground)'

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-1">
        <CardTitle className="flex items-center gap-1.5 text-xs text-navy">
          <TrendingUp className="h-3.5 w-3.5" />
          Evolução da Nota do Último Colocado
        </CardTitle>
        <CardDescription className="text-[10px]">
          Histórico 1ª fase{pts2.length > 0 ? ' · 2ª fase' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative w-full" style={{ height: H }}>
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            className="w-full h-full"
            onMouseMove={e => {
              const rect = svgRef.current!.getBoundingClientRect()
              const mx = ((e.clientX - rect.left) / rect.width) * W
              let closest = pts1[0]
              for (const p of pts1) {
                if (Math.abs(p.px - mx) < Math.abs(closest.px - mx)) closest = p
              }
              const f2entry = data.find(d => d.year === closest.year)
              setTooltip({ x: closest.px, y: closest.py, year: closest.year, f1: closest.f1, f2: f2entry?.f2 ?? null })
            }}
            onMouseLeave={() => setTooltip(null)}
          >
            <defs>
              <linearGradient id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={navyColor} stopOpacity={0.15} />
                <stop offset="95%" stopColor={navyColor} stopOpacity={0.01} />
              </linearGradient>
            </defs>

            {/* Y-axis ticks */}
            {yTicks.map(v => (
              <g key={v}>
                <line x1={PAD.left} y1={toY(v)} x2={PAD.left + chartW} y2={toY(v)} stroke={gridColor} strokeWidth={1} opacity={0.3} />
                <text x={PAD.left - 4} y={toY(v)} dy="0.35em" textAnchor="end" fontSize={9} fill={textColor}>
                  {v.toFixed(1)}
                </text>
              </g>
            ))}

            {/* X-axis labels */}
            {pts1.map(p => (
              <text key={p.year} x={p.px} y={H - 5} textAnchor="middle" fontSize={9} fill={textColor}>
                {p.year}
              </text>
            ))}

            {/* Area fill (1ª fase) */}
            <path d={areaPath1} fill={`url(#grad-${id})`} />

            {/* 2ª fase line */}
            {pts2.length > 1 && (
              <path d={linePath(pts2)} fill="none" stroke={f2Color} strokeWidth={1.5} strokeDasharray="4 3" strokeLinejoin="round" strokeLinecap="round" />
            )}

            {/* 1ª fase line */}
            <path d={linePath(pts1)} fill="none" stroke={navyColor} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

            {/* 2ª fase dots */}
            {pts2.map(p => (
              <circle key={`f2-${p.year}`} cx={p.px} cy={p.py} r={2.5} fill={f2Color} />
            ))}

            {/* 1ª fase dots */}
            {pts1.map(p => (
              <circle key={p.year} cx={p.px} cy={p.py} r={3} fill={navyColor} />
            ))}

            {/* Hover indicator */}
            {tooltip && (
              <>
                <line x1={tooltip.x} y1={PAD.top} x2={tooltip.x} y2={PAD.top + chartH} stroke={navyColor} strokeWidth={1} strokeDasharray="3 3" opacity={0.4} />
                <circle cx={tooltip.x} cy={tooltip.y} r={5} fill={navyColor} stroke="#fff" strokeWidth={2} />
              </>
            )}
          </svg>

          {/* Tooltip */}
          {tooltip && (() => {
            const svgRect = svgRef.current?.getBoundingClientRect()
            const scaleX = svgRect ? svgRect.width / W : 1
            const scaleY = svgRect ? svgRect.height / H : 1
            const left = tooltip.x * scaleX
            const top  = tooltip.y * scaleY - 42
            const flipLeft = left > (svgRect?.width ?? W) * 0.7
            return (
              <div
                className="pointer-events-none absolute z-10 rounded bg-popover border border-border px-2 py-1 text-[10px] shadow-md whitespace-nowrap"
                style={{ left, top, transform: `translateX(${flipLeft ? '-100%' : '-50%'})` }}
              >
                <div className="font-semibold text-navy">{tooltip.year}</div>
                <div>1ª fase <span className="font-semibold">{tooltip.f1?.toFixed(2)}</span></div>
                {tooltip.f2 !== null && (
                  <div className="text-muted-foreground">2ª fase <span className="font-semibold">{tooltip.f2?.toFixed(2)}</span></div>
                )}
              </div>
            )
          })()}
        </div>

        <div className="mt-1 flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
          {trend >= 0
            ? <TrendingUp className="h-2.5 w-2.5 text-navy" />
            : <TrendingDown className="h-2.5 w-2.5 text-destructive" />
          }
          {trend >= 0 ? '+' : ''}{trend.toFixed(2)} pts desde {data[0].year}
        </div>

        {pts2.length > 0 && (
          <div className="mt-1 flex items-center justify-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="inline-block h-0.5 w-4 bg-navy rounded" /> 1ª fase</span>
            <span className="flex items-center gap-1"><span className="inline-block h-0.5 w-4 rounded" style={{ background: f2Color, borderStyle: 'dashed' }} /> 2ª fase</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
