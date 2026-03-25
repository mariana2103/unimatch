import type { Metadata, Viewport } from 'next'
import { Inter, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { UserProvider } from '@/lib/user-context'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

const _inter = Inter({ subsets: ['latin'] })
const _geistMono = Geist_Mono({ subsets: ['latin'] })


export const metadata: Metadata = {
  metadataBase: new URL("https://www.unimatch.pt"),
  title: {
    default: "UniMatch — Simulador de Nota de Candidatura e Médias DGES",
    template: "%s | UniMatch"
  },
  description: "Calcula a tua nota de candidatura ao ensino superior, consulta médias de entrada e vagas de todos os cursos DGES 2025/26. Simulador gratuito para estudantes portugueses.",
  keywords: [
    "calcular média candidatura", "simulador nota candidatura", "médias entrada universidade",
    "vagas curso", "nota corte DGES", "DGES cursos 2025", "candidatura ensino superior",
    "cálculo nota acesso", "média curso universidade", "provas ingresso ensino superior",
    "ensino superior portugal", "acesso universidade portugal", "nota mínima candidatura",
    "DGES 2025 2026", "simulador DGES", "média entrada curso", "calcular média curso"
  ],
  openGraph: {
    type: "website",
    locale: "pt_PT",
    url: "https://www.unimatch.pt",
    siteName: "UniMatch",
    title: "UniMatch — Simulador de Nota de Candidatura e Médias DGES",
    description: "Calcula a tua nota de candidatura ao ensino superior, consulta médias de entrada e vagas de todos os cursos DGES 2025/26.",
  },
  twitter: {
    card: "summary_large_image",
    title: "UniMatch — Simulador de Nota de Candidatura e Médias DGES",
    description: "Calcula a tua nota de candidatura ao ensino superior, consulta médias de entrada e vagas de todos os cursos DGES 2025/26.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
}

export const viewport: Viewport = {
  themeColor: '#1e3a5f',
  userScalable: true,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'UniMatch',
    url: 'https://www.unimatch.pt',
    description: 'Simulador de nota de candidatura ao ensino superior português e explorador de cursos DGES.',
    inLanguage: 'pt-PT',
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: 'https://www.unimatch.pt/?q={search_term_string}' },
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <html lang="pt-PT" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <UserProvider>
            {children}
          </UserProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
