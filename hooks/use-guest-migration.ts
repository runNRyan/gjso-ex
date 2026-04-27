"use client"

import { useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { getGuestActivity, clearGuestActivity } from "@/lib/guest"
import { useGuestActivityStore } from "@/store/guest-activity-store"
import { toast } from "sonner"

export function useGuestMigration() {
  const migrating = useRef(false)
  const clearStore = useGuestActivityStore((s) => s.clear)

  useEffect(() => {
    const supabase = createClient()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event !== 'SIGNED_IN' || !session?.user) return
      if (migrating.current) return

      const activity = getGuestActivity()
      if (activity.votes.length === 0 && activity.predictions.length === 0) return

      migrating.current = true

      try {
        const res = await fetch('/api/migrate-guest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            guestActivity: {
              votes: activity.votes,
              predictions: activity.predictions,
            },
          }),
        })

        const data = await res.json()

        // Always clear guest data on login (existing members get 409, new users get 200)
        clearGuestActivity()
        clearStore()

        if (data.success) {
          const total = data.migratedVotes + data.migratedPredictions
          if (total > 0) {
            toast.success(`이전 활동이 반영되었습니다! +${data.pointsAwarded}P 지급`)
          }
        }
      } catch (error) {
        console.error('Guest migration failed:', error)
      } finally {
        migrating.current = false
      }
    })

    return () => subscription.unsubscribe()
  }, [clearStore])
}
