'use client'

import {
  Area, AreaChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { TrendingUp } from 'lucide-react'

interface Props {
  historico: { year: number; nota: number }[]
  courseName: string
}

export function GradeEvolutionChart({ historico, courseName }: Props) {
  if (!historico || historico.length === 0) return null

  const trend = historico[historico.length - 1].nota - historico[0].nota
  const minY = Math.floor(Math.min(...historico.map(h => h.nota)) / 5) * 5 - 5
  const maxY = Math.ceil(Math.max(...historico.map(h => h.nota)) / 5) * 5 + 5

  const navyColor = '#1a2e4a'
  const emeraldColor = '#10b981'

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-1">
        <CardTitle className="flex items-center gap-1.5 text-xs text-navy">
          <TrendingUp className="h-3.5 w-3.5" />
          Evolucao da Nota do Ultimo Colocado
        </CardTitle>
        <CardDescription className="text-[10px]">Ultimos 3 anos</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{ nota: { label: 'Nota', color: navyColor } }}
          className="h-[160px] w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={historico} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="gradNota" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={navyColor} stopOpacity={0.12} />
                  <stop offset="95%" stopColor={navyColor} stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis domain={[minY, maxY]} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone" dataKey="nota" stroke={navyColor} strokeWidth={2}
                fill="url(#gradNota)"
                dot={{ r: 4, fill: navyColor, stroke: '#fff', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: emeraldColor, stroke: '#fff', strokeWidth: 2 }}
                name="Nota"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
        <div className="mt-1 flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
          <TrendingUp className={`h-2.5 w-2.5 ${trend >= 0 ? 'text-emerald' : 'text-destructive'}`} />
          {trend >= 0 ? '+' : ''}{trend.toFixed(1)} pontos em 3 anos
        </div>
      </CardContent>
    </Card>
  )
}
