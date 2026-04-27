'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const PERIODS = [
  { value: 'all', label: '전체' },
  { value: 'week', label: '이번주' },
  { value: 'today', label: '오늘' },
] as const

export type Period = (typeof PERIODS)[number]['value']

export function RankingTabs({ current }: { current: Period }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleSelect(period: Period) {
    const params = new URLSearchParams(searchParams.toString())
    if (period === 'all') {
      params.delete('period')
    } else {
      params.set('period', period)
    }
    const qs = params.toString()
    router.push(`/ranking${qs ? `?${qs}` : ''}`)
  }

  return (
    <div className="flex gap-2">
      {PERIODS.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => handleSelect(value)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            current === value
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-accent'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
