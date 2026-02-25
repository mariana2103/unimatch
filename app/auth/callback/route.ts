import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  // Supabase sends error params when auth fails (e.g. DB trigger error)
  const oauthError = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  if (oauthError) {
    console.error('OAuth callback error:', oauthError, errorDescription)
    const msg = errorDescription ?? oauthError
    return NextResponse.redirect(`${origin}/?authError=${encodeURIComponent(msg)}`)
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }

    console.error('Erro no callback:', error)
    return NextResponse.redirect(`${origin}/?authError=${encodeURIComponent(error.message)}`)
  }

  return NextResponse.redirect(`${origin}/`)
}
