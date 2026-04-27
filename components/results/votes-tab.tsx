'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { Vote } from './mock-data'
import {
  pct,
  fmt,
  filterByPeriod,
  isMajority,
  PERIODS,
  type Period,
} from './utils'
import { useCountUp } from './use-count-up'
import { FilterChips } from './filter-chips'
import { useVote } from '@/hooks/use-vote'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { VOTE_CHANGE_WINDOW_MS, formatRemainingTime, formatDeadline } from '@/lib/utils'

function VoteCard({ item }: { item: Vote }) {
  const [pcA, pcB] = pct(item.resultA, item.resultB)
  const isMaj = isMajority(item)

  return (
    <Link href={`/questions/${item.questionId}`}>
      <div className="relative rounded-xl border bg-white p-4 transition-transform active:scale-[0.985]">
        <div className="mb-1.5">
          <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
            {item.category}
          </span>
        </div>
        <h4 className="mb-2 pr-4 text-sm font-bold leading-snug">
          {item.question}
        </h4>
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ${
              item.myChoice === 'A'
                ? 'bg-rose-50 text-rose-600'
                : 'bg-cyan-50 text-cyan-600'
            }`}
          >
            ✋ 내 선택: {item.myChoice}
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold ${
              isMaj
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-red-50 text-red-500'
            }`}
          >
            {isMaj ? '👥 다수와 일치' : '🙋 소수 의견'}
          </span>
        </div>
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
      </div>
    </Link>
  )
}

function LiveVoteCard({
  item,
  remaining,
  onChangeVote,
  onWithdraw,
}: {
  item: Vote
  remaining: number
  onChangeVote: () => void
  onWithdraw: () => void
}) {
  const deadline = formatDeadline(item.closeAt)
  const total = item.resultA + item.resultB
  const myChoice = item.myChoice === 'A' ? item.optionA : item.optionB
  const otherChoice = item.myChoice === 'A' ? item.optionB : item.optionA
  const myCount = item.myChoice === 'A' ? item.resultA : item.resultB
  const myPct = total > 0 ? Math.round((myCount / total) * 100) : 0
  const canModify = remaining > 0

  return (
    <div className="rounded-xl border border-violet-200 bg-white p-3">
      <Link href={`/questions/${item.questionId}`} className="block">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="rounded bg-violet-50 px-1.5 py-0.5 text-[10px] font-semibold text-violet-600">진행중</span>
              <p className="truncate text-sm font-semibold">{item.question}</p>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              내 선택: <span className={item.myChoice === 'A' ? 'text-rose-500' : 'text-cyan-500'}>{myChoice}</span>
              {' · '}{myPct}% ({total}명)
              {deadline && <span> · {deadline}</span>}
            </p>
          </div>
        </div>
      </Link>
      {canModify && (
        <div className="mt-2 flex items-center justify-between border-t pt-2">
          <span className="text-[10px] text-amber-600">
            {formatRemainingTime(remaining)} 내 변경 가능
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-6 px-2 text-[10px]"
              onClick={onChangeVote}
            >
              {otherChoice}로 변경
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[10px] text-destructive hover:text-destructive"
              onClick={onWithdraw}
            >
              <X className="mr-0.5 h-3 w-3" />
              철회
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

interface VotesTabProps {
  votes: Vote[]
}

export function VotesTab({ votes }: VotesTabProps) {
  const [period, setPeriod] = useState<Period>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'live' | 'closed'>('all')
  const [majFilter, setMajFilter] = useState<'all' | 'majority' | 'minority'>('all')
  const [remainingTimes, setRemainingTimes] = useState<Record<string, number>>({})
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set())
  const [changedChoices, setChangedChoices] = useState<Record<string, 'A' | 'B'>>({})
  const { changeVote, withdrawVote } = useVote()

  const allVotes = votes.filter((v) => !removedIds.has(String(v.id)))
  const liveVotes = allVotes.filter((v) => v.status === 'live')
  const closedVotes = allVotes.filter((v) => v.status === 'closed')
  const majorityAligned = closedVotes.filter(isMajority)
  const alignPct = closedVotes.length
    ? Math.round((majorityAligned.length / closedVotes.length) * 100)
    : 0

  const vsOffset = useCountUp(alignPct - 50, 1200, true)
  const leftW = 50 + vsOffset
  const rightW = 50 - vsOffset

  // Timer for vote change window
  useEffect(() => {
    const update = () => {
      const now = Date.now()
      const newTimes: Record<string, number> = {}
      liveVotes.forEach((vote) => {
        const remaining = VOTE_CHANGE_WINDOW_MS - (now - new Date(vote.voteCreatedAt).getTime())
        if (remaining > 0) newTimes[String(vote.id)] = remaining
      })
      setRemainingTimes(newTimes)
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [liveVotes])

  const handleChangeVote = async (vote: Vote) => {
    const currentChoice = changedChoices[String(vote.id)] || vote.myChoice
    const newChoice = currentChoice === 'A' ? 'b' : 'a'
    const result = await changeVote(vote.questionId, newChoice)
    if (result.success) {
      setChangedChoices(prev => ({
        ...prev,
        [String(vote.id)]: newChoice.toUpperCase() as 'A' | 'B',
      }))
    }
  }

  const handleWithdraw = async (vote: Vote) => {
    const result = await withdrawVote(vote.questionId)
    if (result.success) {
      setRemovedIds(prev => new Set(prev).add(String(vote.id)))
    }
  }

  // Apply filters
  const showLive = statusFilter === 'all' || statusFilter === 'live'
  const showClosed = statusFilter === 'all' || statusFilter === 'closed'

  const filteredClosed = filterByPeriod(closedVotes, period).filter((v) => {
    if (majFilter === 'all') return true
    const maj = isMajority(v)
    return majFilter === 'majority' ? maj : !maj
  })

  const statusOptions = [
    { k: 'all' as const, l: `전체 (${allVotes.length})` },
    { k: 'closed' as const, l: `마감 (${closedVotes.length})` },
    ...(liveVotes.length > 0 ? [{ k: 'live' as const, l: `진행중 (${liveVotes.length})` }] : []),
  ]

  return (
    <div className="space-y-3">
      {/* Status filter */}
      <FilterChips
        label="상태별:"
        options={statusOptions}
        value={statusFilter}
        onChange={setStatusFilter}
        activeColor="violet"
      />

      {/* Hero (only when showing closed) */}
      {showClosed && closedVotes.length > 0 && (
        <div className="rounded-xl border bg-white p-4">
          <div className="mb-3 flex items-baseline justify-center gap-2">
            <span className="text-sm font-semibold text-muted-foreground">
              마감된 투표
            </span>
            <span className="text-[28px] font-black tabular-nums text-violet-600">
              {closedVotes.length}
            </span>
          </div>
          <p className="mb-3 text-center text-xs text-muted-foreground">
            내 선택은 다수 의견? 소수 의견?
          </p>

          <div className="relative">
            <div className="flex h-8 overflow-hidden rounded-lg">
              <div
                className="flex items-center justify-center bg-gradient-to-r from-emerald-500 to-emerald-400 text-xs font-extrabold text-white transition-all duration-700"
                style={{ width: `${leftW}%` }}
              >
                {leftW}%
              </div>
              <div
                className="flex items-center justify-center bg-gradient-to-l from-red-500 to-red-400 text-xs font-extrabold text-white transition-all duration-700"
                style={{ width: `${rightW}%` }}
              >
                {rightW}%
              </div>
            </div>
            <div
              className="absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-md border bg-white px-2 py-0.5 text-[11px] font-black tracking-wide transition-all duration-700"
              style={{ left: `${leftW}%` }}
            >
              VS
            </div>
          </div>

          <div className="mt-2 flex justify-between">
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
              👥 다수와 일치{' '}
              <span className="font-extrabold">{majorityAligned.length}</span>
            </span>
            <span className="flex items-center gap-1 text-xs font-semibold text-red-500">
              🙋 소수 의견{' '}
              <span className="font-extrabold">
                {closedVotes.length - majorityAligned.length}
              </span>
            </span>
          </div>
        </div>
      )}

      {/* Closed vote filters (only when showing closed) */}
      {showClosed && (
        <>
          <FilterChips
            label="기간별:"
            options={PERIODS}
            value={period}
            onChange={setPeriod}
            activeColor="violet"
          />
          <FilterChips
            label="의견별:"
            options={[
              { k: 'all' as const, l: '전체' },
              { k: 'majority' as const, l: '👥 다수와 일치' },
              { k: 'minority' as const, l: '🙋 소수 의견' },
            ]}
            value={majFilter}
            onChange={setMajFilter}
            activeColor="violet"
          />
        </>
      )}

      {/* Closed vote cards */}
      {showClosed && (
        filteredClosed.length ? (
          filteredClosed.map((v) => <VoteCard key={v.id} item={v} />)
        ) : (
          <div className="py-12 text-center">
            <div className="text-4xl">🗳️</div>
            <p className="mt-2 text-sm text-muted-foreground">
              해당 기간에 투표 결과가 없어요
            </p>
          </div>
        )
      )}

      {/* Live votes */}
      {showLive && liveVotes.length > 0 && (
        <div className="space-y-2">
          <h3 className="mt-3 text-sm font-bold text-violet-600">🗳️ 진행중인 투표 ({liveVotes.length})</h3>
          {liveVotes.map((vote) => {
            const displayVote = changedChoices[String(vote.id)]
              ? { ...vote, myChoice: changedChoices[String(vote.id)] }
              : vote
            return (
              <LiveVoteCard
                key={vote.id}
                item={displayVote}
                remaining={remainingTimes[String(vote.id)] || 0}
                onChangeVote={() => handleChangeVote(vote)}
                onWithdraw={() => handleWithdraw(vote)}
              />
            )
          })}
        </div>
      )}

      {/* Live only empty state */}
      {statusFilter === 'live' && liveVotes.length === 0 && (
        <div className="py-12 text-center">
          <div className="text-4xl">🗳️</div>
          <p className="mt-2 text-sm text-muted-foreground">
            진행중인 투표가 없어요
          </p>
        </div>
      )}
    </div>
  )
}
