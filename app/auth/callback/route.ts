import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()

    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Check if user has a profile with nickname
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('nickname')
          .eq('id', user.id)
          .single()

        // If no nickname, redirect to nickname setup page
        if (!profile?.nickname) {
          return NextResponse.redirect(`${origin}/auth/setup-nickname`)
        }
      }

      // Successfully authenticated with nickname
      return NextResponse.redirect(`${origin}`)
    }
  }

  // If there's an error or no code, redirect to home with error
  return NextResponse.redirect(`${origin}?error=auth_failed`)
}
