'use client'

import { useId, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface Props {
  historico: { year: number; nota: number }[]
}

export function GradeEvolutionChart({ historico }: Props) {
  if (!historico || historico.length === 0) return null

  const id = useId()
  const svgRef = useRef<SVGSVGElement>(null)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; year: number; nota: number } | null>(null)

  const data = historico.map(h => ({ ...h, nota: h.nota / 10 }))
  const trend = data[data.length - 1].nota - data[0].nota

  const W = 280
  const H = 100
  const PAD = { top: 8, right: 12, bottom: 20, left: 32 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom

  const minY = Math.floor(Math.min(...data.map(d => d.nota)) / 0.5) * 0.5 - 0.5
  const maxY = Math.ceil(Math.max(...data.map(d => d.nota)) / 0.5) * 0.5 + 0.5

  const toX = (i: number) => PAD.left + (i / (data.length - 1)) * chartW
  const toY = (v: number) => PAD.top + chartH - ((v - minY) / (maxY - minY)) * chartH

  const points = data.map((d, i) => ({ ...d, px: toX(i), py: toY(d.nota) }))
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.px},${p.py}`).join(' ')
  const areaPath = `${linePath} L${points[points.length - 1].px},${PAD.top + chartH} L${points[0].px},${PAD.top + chartH} Z`

  const yTicks = Array.from(
    { length: Math.round((maxY - minY) / 0.5) + 1 },
    (_, i) => minY + i * 0.5
  )

  const navyColor = '#1a2e4a'

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-1">
        <CardTitle className="flex items-center gap-1.5 text-xs text-navy">
          <TrendingUp className="h-3.5 w-3.5" />
          Evolução da Nota do Último Colocado
        </CardTitle>
        <CardDescription className="text-[10px]">Histórico de entrada</CardDescription>
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
              let closest = points[0]
              for (const p of points) {
                if (Math.abs(p.px - mx) < Math.abs(closest.px - mx)) closest = p
              }
              setTooltip({ x: closest.px, y: closest.py, year: closest.year, nota: closest.nota })
            }}
            onMouseLeave={() => setTooltip(null)}
          >
            <defs>
              <linearGradient id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={navyColor} stopOpacity={0.15} />
                <stop offset="95%" stopColor={navyColor} stopOpacity={0.01} />
              </linearGradient>
            </defs>

            {/* Y-axis ticks */}
            {yTicks.map(v => (
              <g key={v}>
                <line
                  x1={PAD.left} y1={toY(v)}
                  x2={PAD.left + chartW} y2={toY(v)}
                  stroke="#f0f0f0" strokeWidth={1}
                />
                <text x={PAD.left - 4} y={toY(v)} dy="0.35em" textAnchor="end" fontSize={9} fill="#aaa">
                  {v.toFixed(1)}
                </text>
              </g>
            ))}

            {/* X-axis labels */}
            {points.map(p => (
              <text key={p.year} x={p.px} y={H - 5} textAnchor="middle" fontSize={9} fill="#aaa">
                {p.year}
              </text>
            ))}

            {/* Area fill */}
            <path d={areaPath} fill={`url(#grad-${id})`} />

            {/* Line */}
            <path d={linePath} fill="none" stroke={navyColor} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

            {/* Dots */}
            {points.map(p => (
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
            const top = tooltip.y * scaleY - 36
            const flipLeft = left > (svgRect?.width ?? W) * 0.7
            return (
              <div
                className="pointer-events-none absolute z-10 rounded bg-popover border border-border px-2 py-1 text-[10px] shadow-md whitespace-nowrap"
                style={{ left, top, transform: `translateX(${flipLeft ? '-100%' : '-50%'})` }}
              >
                <span className="font-semibold">{tooltip.nota.toFixed(2)}</span>
                <span className="text-muted-foreground ml-1">{tooltip.year}</span>
              </div>
            )
          })()}
        </div>

        <div className="mt-1 flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
          {trend >= 0
            ? <TrendingUp className="h-2.5 w-2.5 text-navy" />
            : <TrendingDown className="h-2.5 w-2.5 text-destructive" />
          }
          {trend >= 0 ? '+' : ''}{trend.toFixed(1)} pts desde {historico[0].year}
        </div>
      </CardContent>
    </Card>
  )
}
