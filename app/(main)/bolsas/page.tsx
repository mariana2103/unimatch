import type { Metadata } from 'next'
import { ScholarshipCalendar } from '@/components/scholarship-calendar'

export const metadata: Metadata = {
  title: 'Bolsas de Estudo — Ensino Superior Portugal',
  description: 'Calendário de bolsas de estudo para o ensino superior em Portugal. Datas de candidatura, requisitos e informação sobre apoios financeiros para estudantes.',
  keywords: ['bolsas estudo ensino superior', 'bolsas universitárias portugal', 'apoios financeiros estudantes', 'bolsas DGES 2025'],
}

export default function BolsasPage() {
  return <ScholarshipCalendar />
}
