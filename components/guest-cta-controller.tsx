"use client"

import { useState, useEffect } from "react"
import { useGuestActivityStore } from "@/store/guest-activity-store"
import { GuestCtaSheet } from "@/components/guest-cta-sheet"
import { GuestCtaModal } from "@/components/guest-cta-modal"

export function GuestCtaController() {
  const { activityCount, virtualPoints, isGuest } = useGuestActivityStore()
  const [sheetDismissed, setSheetDismissed] = useState(false)
  const [modalDismissed, setModalDismissed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !isGuest) return null

  // Full-screen modal at 4+ activities
  if (activityCount >= 4 && !modalDismissed) {
    return (
      <GuestCtaModal
        virtualPoints={virtualPoints}
        onDismiss={() => setModalDismissed(true)}
      />
    )
  }

  // Bottom sheet at 2+ activities
  if (activityCount >= 2 && !sheetDismissed) {
    return (
      <GuestCtaSheet
        virtualPoints={virtualPoints}
        onDismiss={() => setSheetDismissed(true)}
      />
    )
  }

  return null
}
