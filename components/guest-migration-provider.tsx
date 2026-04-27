"use client"

import { useGuestMigration } from "@/hooks/use-guest-migration"

export function GuestMigrationProvider() {
  useGuestMigration()
  return null
}
