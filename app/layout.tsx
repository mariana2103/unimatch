import type { Metadata, Viewport } from 'next'
import { Inter, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { UserProvider } from '@/lib/user-context'
import './globals.css'

const _inter = Inter({ subsets: ['latin'] })
const _geistMono = Geist_Mono({ subsets: ['latin'] })


export const metadata: Metadata = {
  metadataBase: new URL("https://www.unimatch.pt"),
  title: {
    default: "Unimatch | Candidatura ao Ensino Superior em Portugal",
    template: "%s | Unimatch"
  },
  description: "Consulta médias de entrada, simula a tua nota de candidatura e encontra o curso certo para ti.",
  keywords: ["ensino superior", "candidatura universidade", "médias entrada", "DGES", "nota candidatura"],
  openGraph: {
    type: "website",
    locale: "pt_PT",
    url: "https://www.unimatch.pt",
    siteName: "Unimatch",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  }
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
  return (
    <html lang="pt-PT">
      <body className="font-sans antialiased">
        <UserProvider>
          {children}
        </UserProvider>
        <Analytics />
      </body>
    </html>
  )
}
