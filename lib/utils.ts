import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 투표 관련 상수
export const VOTE_CHANGE_WINDOW_MS = 1 * 60 * 1000

// 투표 종료 시간 포맷팅
export function formatDeadline(closeAt: string | null): string | undefined {
  if (!closeAt) return undefined

  const now = new Date()
  const closeDate = new Date(closeAt)
  const diffMs = closeDate.getTime() - now.getTime()

  if (diffMs < 0) {
    return "종료됨"
  }

  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

  // 날짜만 비교 (시간 제외)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const closeDateOnly = new Date(closeDate.getFullYear(), closeDate.getMonth(), closeDate.getDate())
  const diffDays = Math.ceil((closeDateOnly.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diffMinutes < 60) {
    return `${diffMinutes}분 후 종료`
  } else if (diffHours < 24) {
    return `${diffHours}시간 후 종료`
  } else {
    return `${diffDays}일 후 종료`
  }
}

// 투표 변경 남은 시간 포맷팅 (mm:ss)
export function formatRemainingTime(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}
