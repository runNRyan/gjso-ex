"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export function HeroSection() {
  const [points, setPoints] = useState<number | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    async function fetchPoints(userId: string | undefined) {
      if (!userId) {
        setIsLoggedIn(false)
        return
      }
      setIsLoggedIn(true)

      const { data: profile } = await supabase
        .from('profiles')
        .select('point_balance')
        .eq('id', userId)
        .single()

      if (profile) {
        setPoints(profile.point_balance ?? 0)
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      fetchPoints(session?.user?.id)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      fetchPoints(session?.user?.id)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <div className="text-center py-6 sm:py-8 space-y-3">
      <h1 className="text-xl sm:text-2xl font-bold">
        우리는 무엇을 더 싫어 할까 ?
      </h1>
      <p className="text-sm text-muted-foreground font-bold">
        팍팍한 인생, 불호를 마음껏 표출하세요!
      </p>
      <p className="text-sm text-muted-foreground">
        투표하고, 다수가 싫어하는 걸 예측 해보세요
      </p>
      {isLoggedIn && points !== null && (
        <div className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-medium">
          내 포인트 <span className="text-primary font-bold">{points}P</span>
        </div>
      )}
    </div>
  )
}
