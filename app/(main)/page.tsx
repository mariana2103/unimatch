import type { Metadata } from 'next'
import HomeClient from './home-client'

export const metadata: Metadata = {
  title: 'Explorador de Cursos e Médias DGES 2025/26',
  description: 'Pesquisa todos os cursos do ensino superior português, consulta médias de entrada, vagas e nota de corte DGES 2025/26. Filtra por área, distrito e tipo de instituição.',
  keywords: [
    'médias entrada universidade', 'vagas curso DGES', 'nota corte universidade',
    'DGES cursos 2025', 'explorador cursos ensino superior', 'média curso portugal',
    'cursos universitários portugal', 'pesquisar cursos DGES',
  ],
}

export default function ExplorePage() {
  return <HomeClient />
}
