'use client'

import Link from 'next/link'
import { Trophy, Lightbulb, BarChart3 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function NavLinks() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const supabase = createClient()

    async function checkAuth(userId: string | undefined) {
      if (userId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', userId)
          .single()
        setIsAdmin(profile?.user_type === 'admin')
        setIsLoggedIn(true)
      } else {
        setIsAdmin(false)
        setIsLoggedIn(false)
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      checkAuth(session?.user?.id)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      checkAuth(session?.user?.id)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (!mounted || !isLoggedIn) {
    return null
  }

  return (
    <>
      <Link
        href="/results"
        className="flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white transition-colors"
      >
        <BarChart3 className="h-4 w-4" />
        <span className="hidden sm:inline">결과</span>
      </Link>
      <Link
        href="/ranking"
        className="flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white transition-colors"
      >
        <Trophy className="h-4 w-4" />
        <span className="hidden sm:inline">랭킹</span>
      </Link>
      {!isAdmin && (
        <Link
          href="/suggest"
          className="flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white transition-colors"
        >
          <Lightbulb className="h-4 w-4" />
          <span className="hidden sm:inline">제보</span>
        </Link>
      )}
    </>
  )
}
