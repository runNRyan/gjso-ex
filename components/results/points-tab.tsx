'use client'

import { useState, useMemo } from 'react'
import type { PointEntry } from './mock-data'
import { filterByPeriod, PERIODS, type Period } from './utils'
import { useCountUp } from './use-count-up'
import { FilterChips } from './filter-chips'

const POINT_TYPES = [
  { k: 'all' as const, l: '전체' },
  { k: 'vote' as const, l: '투표' },
  { k: 'predict' as const, l: '예측' },
  { k: 'bonus' as const, l: '적중보너스' },
]

const ICON_MAP: Record<string, { emoji: string; className: string }> = {
  vote: { emoji: '🗳️', className: 'bg-violet-50' },
  predict: { emoji: '🔮', className: 'bg-emerald-50' },
  bonus: { emoji: '🎯', className: 'bg-amber-50' },
}

interface PointsTabProps {
  points: PointEntry[]
  pointBalance: number
}

export function PointsTab({ points, pointBalance }: PointsTabProps) {
  const [period, setPeriod] = useState<Period>('all')
  const [pointType, setPointType] = useState<string>('all')

  const filtered = useMemo(() => {
    let items = filterByPeriod([...points], period, 'date')
    if (pointType !== 'all') items = items.filter((p) => p.type === pointType)
    return items.sort((a, b) => b.date.localeCompare(a.date))
  }, [points, period, pointType])

  const filteredTotal = filtered.reduce((s, p) => s + p.points, 0)
  const total = period === 'all' && pointType === 'all' ? pointBalance : filteredTotal
  const animTotal = useCountUp(total, 1000, true)

  const byDate = useMemo(() => {
    const m: Record<string, typeof filtered> = {}
    filtered.forEach((p) => {
      if (!m[p.date]) m[p.date] = []
      m[p.date].push(p)
    })
    return Object.entries(m).sort(([a], [b]) => b.localeCompare(a))
  }, [filtered])

  const periodLabel =
    period === 'all' && pointType === 'all'
      ? '보유'
      : period === 'all'
        ? '전체'
        : period === 'week'
          ? '최근 1주'
          : period === 'month'
            ? '최근 1달'
            : '최근 3개월'

  return (
    <div className="space-y-3">
      {/* B급 감성 안내 */}
      <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/50 p-4 text-center">
        <p className="text-sm text-amber-700">
          🐮 포인트를 꾸준히 모으시면 언젠가 좋은 일이 있을 거에요. 🐮
        </p>
      </div>

      {/* Summary */}
      <div className="flex items-baseline justify-between rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-amber-50/30 p-5">
        <span className="text-sm font-semibold text-muted-foreground">
          {periodLabel} 적립
        </span>
        <span className="text-[26px] font-black tabular-nums text-amber-600">
          +{animTotal.toLocaleString()}P
        </span>
      </div>

      {/* Filters */}
      <FilterChips
        label="기간별:"
        options={PERIODS}
        value={period}
        onChange={setPeriod}
        activeColor="amber"
      />
      <FilterChips
        label="유형별:"
        options={POINT_TYPES}
        value={pointType}
        onChange={setPointType}
        activeColor="amber"
      />

      {/* List */}
      {filtered.length ? (
        byDate.map(([date, items]) => (
          <div key={date}>
            <div className="py-1 text-xs font-bold text-muted-foreground">
              {date}
            </div>
            <div className="space-y-1.5">
              {items.map((p) => {
                const icon = ICON_MAP[p.type]
                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 rounded-xl border bg-white p-3"
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base ${icon.className}`}
                    >
                      {icon.emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold">{p.desc}</div>
                      <div className="truncate text-[11px] text-muted-foreground">
                        {p.question}
                      </div>
                    </div>
                    <div className="shrink-0 text-sm font-bold tabular-nums text-amber-600">
                      +{p.points}P
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))
      ) : (
        <div className="py-12 text-center">
          <div className="text-4xl">💰</div>
          <p className="mt-2 text-sm text-muted-foreground">
            해당 기간에 포인트 내역이 없어요
          </p>
        </div>
      )}

    </div>
  )
}
