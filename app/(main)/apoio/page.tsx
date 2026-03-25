'use client'

export default function ApoioPage() {
  return (
    <div className="mx-auto max-w-sm px-4 py-10 sm:px-6">
      <h1 className="mb-6 text-center text-xl font-bold text-foreground">Apoiar o UniMatch</h1>

      <div className="overflow-hidden rounded-2xl border border-border/60">
        <iframe
          id="kofiframe"
          src="https://ko-fi.com/unimatch/?hidefeed=true&widget=true&embed=true&preview=true"
          style={{ border: 'none', width: '100%', background: 'transparent' }}
          height="712"
          title="Apoiar no Ko-fi"
        />
      </div>

      <p className="mt-4 text-center text-[11px] text-muted-foreground/40">
        Obrigada 💙
      </p>
    </div>
  )
}
