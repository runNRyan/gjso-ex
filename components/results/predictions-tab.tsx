'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Prediction } from './mock-data'
import { pct, fmt, filterByPeriod, PERIODS, type Period } from './utils'
import { AccuracyRing } from './accuracy-ring'
import { FilterChips } from './filter-chips'

function PredCard({ item }: { item: Prediction }) {
  const [pcA, pcB] = pct(item.resultA, item.resultB)

  return (
    <Link href={`/questions/${item.questionId}`}>
      <div className="relative rounded-xl border bg-white p-4 transition-transform active:scale-[0.985]">
        <h4 className="mb-2 pr-4 text-sm font-bold leading-snug">
          {item.question}
        </h4>
        <span
          className={`mb-3 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ${
            item.myPrediction === 'A'
              ? 'bg-rose-50 text-rose-600'
              : 'bg-cyan-50 text-cyan-600'
          }`}
        >
          🔮 내 예측: {item.myPrediction}
        </span>
        <div className="space-y-1.5">
          {(
            [
              ['A', item.optionA, pcA, item.resultA, 'bg-gradient-to-r from-rose-400 to-rose-300', 'text-rose-500'],
              ['B', item.optionB, pcB, item.resultB, 'bg-gradient-to-r from-cyan-400 to-cyan-300', 'text-cyan-500'],
            ] as const
          ).map(([tag, name, pc, cnt, fill, tc]) => (
            <div key={tag}>
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  <span className={`mr-1 font-extrabold ${tc}`}>{tag}</span>
                  {name}
                </span>
                <span className="text-xs text-muted-foreground">
                  <span className="mr-1 font-bold text-foreground">{pc}%</span>
                  {fmt(cnt)}
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full ${fill} transition-all duration-700`}
                  style={{ width: `${pc}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        {item.isCorrect !== null && item.status === 'closed' && (
          <span
            className={`mt-3 inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold ${
              item.isCorrect
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-red-50 text-red-500'
            }`}
          >
            {item.isCorrect ? '✓ 적중!' : '✗ 빗나감'}
            {item.isCorrect && (
              <span className="ml-0.5 tabular-nums">+50P</span>
            )}
          </span>
        )}
      </div>
    </Link>
  )
}

function PendingPredCard({ item }: { item: Prediction }) {
  const predLabel = item.myPrediction === 'A' ? item.optionA : item.optionB

  return (
    <Link href={`/questions/${item.questionId}`}>
      <div className="rounded-xl border border-emerald-200 bg-white p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600">대기중</span>
              <p className="truncate text-sm font-semibold">{item.question}</p>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              내 예측: <span className={item.myPrediction === 'A' ? 'text-rose-500' : 'text-cyan-500'}>{predLabel}</span>
            </p>
          </div>
        </div>
      </div>
    </Link>
  )
}

interface PredictionsTabProps {
  predictions: Prediction[]
}

export function PredictionsTab({ predictions }: PredictionsTabProps) {
  const [period, setPeriod] = useState<Period>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'live' | 'closed'>('all')
  const [hitFilter, setHitFilter] = useState<'all' | 'hit' | 'miss'>('all')

  const livePreds = predictions.filter((p) => p.status === 'live')
  const closedPreds = predictions.filter((p) => p.status === 'closed')
  const correctPreds = closedPreds.filter((p) => p.isCorrect)
  const accPct = closedPreds.length
    ? Math.round((correctPreds.length / closedPreds.length) * 100)
    : 0

  const showLive = statusFilter === 'all' || statusFilter === 'live'
  const showClosed = statusFilter === 'all' || statusFilter === 'closed'

  const filteredClosed = filterByPeriod(closedPreds, period).filter((p) => {
    if (hitFilter === 'all') return true
    return hitFilter === 'hit' ? p.isCorrect : !p.isCorrect
  })

  const statusOptions = [
    { k: 'all' as const, l: `전체 (${predictions.length})` },
    { k: 'closed' as const, l: `마감 (${closedPreds.length})` },
    ...(livePreds.length > 0 ? [{ k: 'live' as const, l: `대기중 (${livePreds.length})` }] : []),
  ]

  return (
    <div className="space-y-3">
      {/* Status filter */}
      <FilterChips
        label="상태별:"
        options={statusOptions}
        value={statusFilter}
        onChange={setStatusFilter}
        activeColor="emerald"
      />

      {/* Hero */}
      {showClosed && closedPreds.length > 0 && (
        <div className="rounded-xl border bg-white p-4">
          <div className="mb-3 flex items-baseline justify-center gap-2">
            <span className="text-sm font-semibold text-muted-foreground">
              마감된 예측
            </span>
            <span className="text-[28px] font-black tabular-nums text-emerald-600">
              {closedPreds.length}
            </span>
          </div>
          <AccuracyRing
            accPct={accPct}
            active={true}
            correctCount={correctPreds.length}
            missCount={closedPreds.length - correctPreds.length}
          />
        </div>
      )}

      {/* Closed filters */}
      {showClosed && (
        <>
          <FilterChips
            label="기간별:"
            options={PERIODS}
            value={period}
            onChange={setPeriod}
            activeColor="emerald"
          />
          <FilterChips
            label="결과별:"
            options={[
              { k: 'all' as const, l: '전체' },
              { k: 'hit' as const, l: '🎯 적중' },
              { k: 'miss' as const, l: '😅 빗나감' },
            ]}
            value={hitFilter}
            onChange={setHitFilter}
            activeColor="emerald"
          />
        </>
      )}

      {/* Closed cards */}
      {showClosed && (
        filteredClosed.length ? (
          filteredClosed.map((p) => <PredCard key={p.id} item={p} />)
        ) : (
          <div className="py-12 text-center">
            <div className="text-4xl">🔮</div>
            <p className="mt-2 text-sm text-muted-foreground">
              해당 기간에 예측 결과가 없어요
            </p>
          </div>
        )
      )}

      {/* Pending predictions */}
      {showLive && livePreds.length > 0 && (
        <div className="space-y-2">
          <h3 className="mt-3 text-sm font-bold text-emerald-600">🔮 대기중인 예측 ({livePreds.length})</h3>
          {livePreds.map((p) => (
            <PendingPredCard key={p.id} item={p} />
          ))}
        </div>
      )}

      {/* Live only empty state */}
      {statusFilter === 'live' && livePreds.length === 0 && (
        <div className="py-12 text-center">
          <div className="text-4xl">🔮</div>
          <p className="mt-2 text-sm text-muted-foreground">
            대기중인 예측이 없어요
          </p>
        </div>
      )}
    </div>
  )
}
