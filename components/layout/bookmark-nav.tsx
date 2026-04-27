'use client'

import Link from 'next/link'
import { Bookmark } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function BookmarkNav() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const supabase = createClient()

    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session?.user)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (!mounted || !isLoggedIn) {
    return null
  }

  return (
    <Link
      href="/bookmarks"
      className="flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white transition-colors"
    >
      <Bookmark className="h-4 w-4" />
      <span className="hidden sm:inline">책갈피</span>
    </Link>
  )
}
