'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useResults } from '@/hooks/use-results'
import { calcStreak } from './utils'
import { PerformanceTab } from './performance-tab'
import { PointsTab } from './points-tab'
import { VotesTab } from './votes-tab'
import { PredictionsTab } from './predictions-tab'
const TAB_META = [
  { k: 'performance', l: '결과 요약', color: 'bg-amber-500' },
  { k: 'points', l: '포인트', color: 'bg-amber-500' },
  { k: 'votes', l: '투표 결과', color: 'bg-violet-500' },
  { k: 'predictions', l: '예측 결과', color: 'bg-emerald-500' },
] as const

type TabKey = (typeof TAB_META)[number]['k']

export function ResultsDashboard() {
  const [tab, setTab] = useState<TabKey>('performance')
  const { data, isLoading } = useResults()

  const votes = data?.votes ?? []
  const predictions = data?.predictions ?? []
  const points = data?.points ?? []
  const pointBalance = data?.pointBalance ?? 0
  const streak = calcStreak(predictions)

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-sm text-muted-foreground">결과를 불러오는 중...</div>
      </div>
    )
  }

  if (!data || (votes.length === 0 && predictions.length === 0 && points.length === 0)) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <div className="text-4xl">📊</div>
        <p className="text-sm text-muted-foreground">아직 참여한 결과가 없어요</p>
        <p className="text-xs text-muted-foreground/70">투표하고 예측하면 여기에서 결과를 확인할 수 있어요</p>
      </div>
    )
  }

  return (
    <div>
      {/* Tab Header */}
      <div className="sticky top-[57px] z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="flex items-center justify-between py-3">
            <h1 className="text-lg font-bold">📈 내 결과</h1>
            {streak > 0 && (
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-600">
                🔥 {streak}연속 예측 적중
              </span>
            )}
          </div>
          <div className="flex">
            {TAB_META.map((t) => (
              <button
                key={t.k}
                onClick={() => setTab(t.k)}
                className={cn(
                  'relative flex-1 pb-2 pt-1 text-center text-xs font-semibold transition-colors',
                  tab === t.k
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground/70',
                )}
              >
                {t.l}
                {tab === t.k && (
                  <span
                    className={`absolute bottom-0 left-[20%] right-[20%] h-0.5 rounded-full ${t.color}`}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto max-w-4xl px-4 py-4">
        {tab === 'performance' && <PerformanceTab votes={votes} predictions={predictions} />}
        {tab === 'points' && <PointsTab points={points} pointBalance={pointBalance} />}
        {tab === 'votes' && <VotesTab votes={votes} />}
        {tab === 'predictions' && <PredictionsTab predictions={predictions} />}
      </div>
    </div>
  )
}
