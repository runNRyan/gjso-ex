import type { Prediction, Vote } from './mock-data'


export type Period = 'all' | 'week' | 'month' | '3months'

export function pct(a: number, b: number): [number, number] {
  const t = a + b
  return t ? [Math.round((a / t) * 100), Math.round((b / t) * 100)] : [50, 50]
}

export function fmt(n: number | undefined) {
  return n?.toLocaleString() ?? '-'
}

export function filterByPeriod<T>(
  items: T[],
  period: Period,
  key: keyof T & string = 'closedAt' as keyof T & string,
): T[] {
  if (period === 'all') return items
  const now = new Date()
  const cut = new Date(now)
  if (period === 'week') cut.setDate(now.getDate() - 7)
  if (period === 'month') cut.setMonth(now.getMonth() - 1)
  if (period === '3months') cut.setMonth(now.getMonth() - 3)
  return items.filter((i) => {
    const v = i[key]
    const d = v ? new Date(String(v)) : new Date()
    return d >= cut
  })
}

export function calcStreak(preds: Prediction[]): number {
  const closed = preds
    .filter((p) => p.status === 'closed' && p.closedAt)
    .sort((a, b) => b.closedAt.localeCompare(a.closedAt))
  let s = 0
  for (const p of closed) {
    if (p.isCorrect) s++
    else break
  }
  return s
}

export function buildAccuracyTimeline(preds: Prediction[]) {
  const closed = preds
    .filter((p) => p.status === 'closed' && p.closedAt)
    .sort((a, b) => a.closedAt.localeCompare(b.closedAt))
  let c = 0
  return closed.map((p, i) => {
    if (p.isCorrect) c++
    return {
      label: p.closedAt.slice(5).replace('-', '/'),
      accuracy: Math.round((c / (i + 1)) * 100),
      hit: p.isCorrect ? 1 : 0,
      q:
        p.question.length > 10
          ? p.question.slice(0, 10) + '…'
          : p.question,
    }
  })
}

export function isMajority(vote: Vote): boolean {
  const [pcA, pcB] = pct(vote.resultA, vote.resultB)
  return (
    (vote.myChoice === 'A' && pcA >= pcB) ||
    (vote.myChoice === 'B' && pcB >= pcA)
  )
}

export function getAlignBadge(alignPct: number) {
  if (alignPct >= 90)
    return { emoji: '👑', label: '민심 대변인', className: 'bg-amber-100 text-amber-700' }
  if (alignPct >= 80)
    return { emoji: '🤝', label: '국민 공감러', className: 'bg-emerald-100 text-emerald-700' }
  if (alignPct >= 70)
    return { emoji: '🎯', label: '공감 저격수', className: 'bg-emerald-100 text-emerald-700' }
  if (alignPct >= 60)
    return { emoji: '📡', label: '여론 감지러', className: 'bg-blue-100 text-blue-700' }
  if (alignPct >= 50)
    return { emoji: '🌊', label: '흐름 탑승러', className: 'bg-blue-100 text-blue-700' }
  if (alignPct >= 40)
    return { emoji: '⚖️', label: '밸런스 지킴이', className: 'bg-violet-100 text-violet-700' }
  if (alignPct >= 30)
    return { emoji: '🎭', label: '반골 기질러', className: 'bg-rose-100 text-rose-700' }
  if (alignPct >= 20)
    return { emoji: '🦄', label: '취향 이단아', className: 'bg-rose-100 text-rose-700' }
  if (alignPct >= 10)
    return { emoji: '🌵', label: '외로운 신념가', className: 'bg-red-100 text-red-700' }
  return { emoji: '🐺', label: '절대 고독러', className: 'bg-red-100 text-red-700' }
}

export const PERIODS: { k: Period; l: string }[] = [
  { k: 'all', l: '전체' },
  { k: 'week', l: '1주' },
  { k: 'month', l: '1달' },
  { k: '3months', l: '3개월' },
]
