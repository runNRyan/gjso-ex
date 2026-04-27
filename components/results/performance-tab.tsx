'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import type { Vote, Prediction } from './mock-data'
import {
  calcStreak,
  pct,
  isMajority,
  getAlignBadge,
} from './utils'
import { AccuracyRing } from './accuracy-ring'

interface PerformanceTabProps {
  votes: Vote[]
  predictions: Prediction[]
}

export function PerformanceTab({ votes, predictions }: PerformanceTabProps) {
  const closedPreds = predictions.filter((p) => p.status === 'closed')
  const correctPreds = closedPreds.filter((p) => p.isCorrect)
  const accPct = closedPreds.length
    ? Math.round((correctPreds.length / closedPreds.length) * 100)
    : 0
  const streak = calcStreak(predictions)

  const closedVotes = votes.filter((v) => v.status === 'closed')
  const majorityAligned = closedVotes.filter(isMajority)
  const alignPct = closedVotes.length
    ? Math.round((majorityAligned.length / closedVotes.length) * 100)
    : 0

  const streakMsg =
    streak >= 5
      ? '대단해요! 기록 갱신중 🔥'
      : streak >= 3
        ? '좋은 흐름! 계속 이어가세요'
        : streak >= 1
          ? '연승 시작! 계속 맞춰볼까요?'
          : '다음 예측에서 시작해보세요'

  const badge = getAlignBadge(alignPct)

  // Compute trivia from real data
  const bestStreak = useMemo(() => {
    const sorted = [...predictions]
      .filter((p) => p.status === 'closed' && p.closedAt)
      .sort((a, b) => a.closedAt.localeCompare(b.closedAt))
    let max = 0, cur = 0
    for (const p of sorted) {
      if (p.isCorrect) { cur++; max = Math.max(max, cur) }
      else cur = 0
    }
    return Math.max(max, streak)
  }, [predictions, streak])

  const mostDominant = useMemo(() => {
    if (!votes.length) return null
    let best = votes[0]
    let bestPct = 0
    for (const v of votes) {
      const [a, b] = pct(v.resultA, v.resultB)
      const max = Math.max(a, b)
      if (max > bestPct) { bestPct = max; best = v }
    }
    const label = best.question.length > 12 ? best.question.slice(0, 12) + '…' : best.question
    return { questionId: best.questionId, label, pct: bestPct }
  }, [votes])

  const mostClose = useMemo(() => {
    if (!votes.length) return null
    let best = votes[0]
    let bestDiff = 100
    for (const v of votes) {
      const [a, b] = pct(v.resultA, v.resultB)
      const diff = Math.abs(a - b)
      if (diff < bestDiff) { bestDiff = diff; best = v }
    }
    const [a, b] = pct(best.resultA, best.resultB)
    const label = best.question.length > 12 ? best.question.slice(0, 12) + '…' : best.question
    return { questionId: best.questionId, label, a, b }
  }, [votes])

  return (
    <div className="space-y-3">
      {/* Streak Card */}
      <div className="flex items-center gap-4 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-emerald-50 p-4">
        <span className="text-[34px] leading-none">
          {streak >= 3 ? '🔥' : streak >= 1 ? '✨' : '💤'}
        </span>
        <div>
          <div className="text-xl font-black text-amber-600">
            {streak}연속 예측 적중
          </div>
          <div className="text-xs font-semibold text-muted-foreground">
            현재 예측 스트릭
          </div>
          <div className="text-[10.5px] text-muted-foreground/70">
            {streakMsg}
          </div>
        </div>
      </div>

      {/* Accuracy Ring */}
      <div className="rounded-xl border bg-white p-5 text-center">
        <AccuracyRing
          accPct={accPct}
          active={true}
          correctCount={correctPreds.length}
          missCount={closedPreds.length - correctPreds.length}
        />
      </div>

      {/* Alignment Card */}
      <div className="relative rounded-xl border bg-white p-4">
        <span
          className={`absolute right-3 top-3 rounded-md px-2 py-1 text-[11px] font-bold ${badge.className}`}
        >
          {badge.emoji} {badge.label}
        </span>
        <h3 className="flex items-center gap-1.5 text-sm font-bold">
          👥 다수 의견 일치도
        </h3>
        <p className="mb-3 text-[10.5px] text-muted-foreground">
          내 투표가 다수와 같았던 비율
        </p>
        <div className="flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-500 transition-all duration-700"
              style={{ width: `${alignPct}%` }}
            />
          </div>
          <span className="text-base font-extrabold tabular-nums">
            {alignPct}%
          </span>
        </div>
        <div className="mt-1.5 text-[10.5px] text-muted-foreground">
          {closedVotes.length}개 중 {majorityAligned.length}개 일치
        </div>
      </div>

      {/* Trivia Card */}
      <div className="rounded-xl border bg-white p-4">
        <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold">
          📊 흥미로운 기록
        </h3>
        {[
          {
            label: '최장 연속 예측 적중',
            value: (
              <span key="s" className="text-amber-600">
                🔥 {bestStreak}연속
              </span>
            ),
          },
          mostDominant && {
            label: '가장 압도적 투표',
            href: `/questions/${mostDominant.questionId}`,
            value: (
              <span key="b">
                {mostDominant.label}{' '}
                <span className="text-rose-500">{mostDominant.pct}%</span>
              </span>
            ),
          },
          mostClose && {
            label: '가장 박빙 투표',
            href: `/questions/${mostClose.questionId}`,
            value: (
              <span key="c">
                {mostClose.label}{' '}
                <span className="text-cyan-500">{mostClose.a}:{mostClose.b}</span>
              </span>
            ),
          },
        ].filter((x): x is { label: string; href?: string; value: React.ReactElement } => x !== null).map((item, i) => {
          const content = (
            <div
              key={i}
              className={`flex items-center justify-between border-t py-2 first:border-t-0 ${item.href ? 'hover:bg-muted/50 -mx-1 px-1 rounded transition-colors' : ''}`}
            >
              <span className="text-xs text-muted-foreground">{item.label}</span>
              <span className="text-xs font-bold">{item.value}</span>
            </div>
          )
          return item.href ? (
            <Link key={i} href={item.href}>{content}</Link>
          ) : (
            content
          )
        })}
      </div>
    </div>
  )
}
