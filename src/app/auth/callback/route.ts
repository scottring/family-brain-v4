import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = createClient()
    
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Error exchanging code for session:', error)
        return NextResponse.redirect(`${origin}/auth/login?error=callback_error`)
      }
      
      // Successful authentication - redirect to the app
      return NextResponse.redirect(`${origin}/today`)
    } catch (error) {
      console.error('Unexpected error in auth callback:', error)
      return NextResponse.redirect(`${origin}/auth/login?error=unexpected_error`)
    }
  }

  // No code present, redirect to login
  return NextResponse.redirect(`${origin}/auth/login?error=no_code`)
}