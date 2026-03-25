import type { Metadata } from 'next'
import { DGESTimeline } from '@/components/dges-timeline'

export const metadata: Metadata = {
  title: 'Calendário DGES 2025/26 — Exames e Candidaturas',
  description: 'Datas dos exames nacionais, fases de candidatura ao ensino superior e prazos DGES 2025/26. Nunca percas um prazo importante.',
  keywords: ['calendário DGES 2025', 'datas exames nacionais', 'fases candidatura ensino superior', 'prazos candidatura universidade', 'exames nacionais 2025'],
}

export default function CalendarioPage() {
  return <DGESTimeline />
}
