import type { Metadata } from 'next'
import { Heart, Copy, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Apoiar o UniMatch',
  description: 'O UniMatch é feito por um estudante. Se te ajudou, qualquer valor faz diferença.',
}

export default function ApoioPage() {
  const phoneNumber = '+351 968 145 322' // <-- ALTERA AQUI O TEU NÚMERO
  const revolutLink = 'https://revolut.me/unimatch' // <-- ALTERA AQUI O TEU LINK REVOLUT

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-muted/50 mb-4">
          <Heart className="h-6 w-6 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-bold text-foreground mb-2">Apoiar o UniMatch</h1>
        <p className="text-muted-foreground text-sm">
          Se este projeto te ajudou, agradeço qualquer contributo. É opcional.
        </p>
      </div>

      <div className="space-y-3">
        {/* MBway - Opção 1 */}
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="font-medium text-foreground">MBway</span>
            <span className="text-xs text-muted-foreground">Transferência</span>
          </div>
          
          <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-3 mb-2">
            <span className="font-mono text-lg font-semibold flex-1">{phoneNumber}</span>
            <CopyButton text={phoneNumber} />
          </div>
          
          <p className="text-xs text-muted-foreground">
            Copia e usa na app do teu banco
          </p>
        </div>

        {/* Revolut - Opção 2 */}
        <a
          href={revolutLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between rounded-xl border border-border/50 bg-card p-4 transition-colors hover:bg-muted/30"
        >
          <div>
            <p className="font-medium text-foreground">Revolut</p>
            <p className="text-xs text-muted-foreground">Abre diretamente na app</p>
          </div>
          <Button size="sm" className="bg-[#0075EB] hover:bg-[#0066CC] text-white">
            Abrir
          </Button>
        </a>
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground/50">
        Obrigado 💙
      </p>
    </div>
  )
}

function CopyButton({ text }: { text: string }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0"
      onClick={() => {
        navigator.clipboard.writeText(text)
        // Podes adicionar aqui um toast se quiseres
      }}
    >
      <Copy className="h-4 w-4" />
    </Button>
  )
}
