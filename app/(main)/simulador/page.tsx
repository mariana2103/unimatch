import type { Metadata } from 'next'
import SimuladorClient from './client'

export const metadata: Metadata = {
  title: 'Simulador de Nota de Candidatura',
  description: 'Calcula a tua nota de candidatura ao ensino superior. Simula a tua média com as tuas notas de exame e secundário e descobre em que cursos DGES podes entrar.',
  keywords: [
    'calcular média candidatura', 'simulador nota candidatura', 'cálculo nota acesso',
    'simular candidatura DGES', 'calcular média curso', 'calculadora nota ensino superior',
    'calcular nota entrada universidade', 'média candidatura 2025',
  ],
}

export default function SimuladorPage() {
  return <SimuladorClient />
}
