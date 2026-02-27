'use client'

import {
  Area, AreaChart, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { TrendingUp } from 'lucide-react'

interface Props {
  historico: { year: number; nota: number }[]
}

export function GradeEvolutionChart({ historico }: Props) {
  if (!historico || historico.length === 0) return null

  const data = historico.map(h => ({ ...h, nota: h.nota / 10 }))
  const trend = data[data.length - 1].nota - data[0].nota
  const minY = Math.floor(Math.min(...data.map(h => h.nota)) / 0.5) * 0.5 - 0.5
  const maxY = Math.ceil(Math.max(...data.map(h => h.nota)) / 0.5) * 0.5 + 0.5

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
        <ChartContainer
          config={{ nota: { label: 'Nota', color: navyColor } }}
          className="h-[160px] w-full"
        >
          <AreaChart data={data} margin={{ top: 8, right: 10, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="gradNota" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={navyColor} stopOpacity={0.15} />
                <stop offset="95%" stopColor={navyColor} stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis domain={[minY, maxY]} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={32} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="monotoneX"
              dataKey="nota"
              stroke={navyColor}
              strokeWidth={2.5}
              fill="url(#gradNota)"
              dot={{ r: 3.5, fill: navyColor, stroke: navyColor, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: navyColor, stroke: '#fff', strokeWidth: 2 }}
              name="Nota"
              isAnimationActive={false}
            />
          </AreaChart>
        </ChartContainer>
        <div className="mt-1 flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
          <TrendingUp className={`h-2.5 w-2.5 ${trend >= 0 ? 'text-navy' : 'text-destructive'}`} />
          {trend >= 0 ? '+' : ''}{trend.toFixed(1)} pts desde {historico[0].year}
        </div>
      </CardContent>
    </Card>
  )
}
