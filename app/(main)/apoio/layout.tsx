import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Apoiar o UniMatch',
  description: 'O UniMatch é feito por um estudante. Se te ajudou, qualquer valor faz diferença.',
}

export default function ApoioLayout({ children }: { children: React.ReactNode }) {
  return children
}
