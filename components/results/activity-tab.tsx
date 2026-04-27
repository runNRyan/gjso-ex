'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useVote } from '@/hooks/use-vote'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { VOTE_CHANGE_WINDOW_MS, formatRemainingTime, formatDeadline } from '@/lib/utils'
import { FilterChips } from './filter-chips'

type VoteWithQuestion = {
  id: string
  choice: string
  created_at: string
  question: {
    id: string
    title: string
    option_a: string
    option_b: string
    vote_count_a: number | null
    vote_count_b: number | null
    close_at: string | null
    status: string | null
  } | null
}

type PredictionWithQuestion = {
  id: string
  prediction: string
  is_correct: boolean | null
  reward_points: number | null
  created_at: string
  question: {
    id: string
    title: string
    option_a: string
    option_b: string
    status: string
    balance_type: string
  } | null
}

export function ActivityTab() {
  const [votes, setVotes] = useState<VoteWithQuestion[]>([])
  const [predictions, setPredictions] = useState<PredictionWithQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [remainingTimes, setRemainingTimes] = useState<Record<string, number>>({})
  const [filter, setFilter] = useState<'all' | 'votes' | 'predictions'>('all')
  const supabase = createClient()
  const { changeVote, withdrawVote } = useVote()

  useEffect(() => {
    async function fetchData() {
      const { data: session } = await supabase.auth.getSession()
      const userId = session.session?.user?.id
      if (!userId) {
        setLoading(false)
        return
      }

      const [votesResult, predsResult] = await Promise.all([
        supabase
          .from('votes')
          .select(`
            id, choice, created_at,
            question:questions (id, title, option_a, option_b, vote_count_a, vote_count_b, close_at, status)
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(30),
        supabase
          .from('predictions')
          .select(`
            id, prediction, is_correct, reward_points, created_at,
            question:questions (id, title, option_a, option_b, status, balance_type)
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(30),
      ])

      if (votesResult.data) setVotes(votesResult.data as VoteWithQuestion[])
      if (predsResult.data) setPredictions(predsResult.data as PredictionWithQuestion[])
      setLoading(false)
    }

    fetchData()
  }, [supabase])

  useEffect(() => {
    const update = () => {
      const now = Date.now()
      const newTimes: Record<string, number> = {}
      votes.forEach((vote) => {
        const remaining = VOTE_CHANGE_WINDOW_MS - (now - new Date(vote.created_at).getTime())
        if (remaining > 0) newTimes[vote.id] = remaining
      })
      setRemainingTimes(newTimes)
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [votes])

  const handleChangeVote = async (questionId: string, voteId: string, currentChoice: string) => {
    const newChoice = currentChoice === 'a' ? 'b' : 'a'
    const result = await changeVote(questionId, newChoice)
    if (result.success) {
      setVotes((prev) => prev.map((v) => (v.id === voteId ? { ...v, choice: newChoice } : v)))
    }
  }

  const handleWithdraw = async (questionId: string, voteId: string) => {
    const result = await withdrawVote(questionId)
    if (result.success) {
      setVotes((prev) => prev.filter((v) => v.id !== voteId))
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-sm text-muted-foreground">불러오는 중...</div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <FilterChips
        label="유형별:"
        options={[
          { k: 'all' as const, l: '전체' },
          { k: 'votes' as const, l: '🗳️ 투표' },
          { k: 'predictions' as const, l: '🔮 예측' },
        ]}
        value={filter}
        onChange={setFilter}
        activeColor="violet"
      />

      {/* 투표 내역 */}
      {(filter === 'all' || filter === 'votes') && <div>
        <h3 className="mb-2 text-sm font-bold">🗳️ 내 투표 내역</h3>
        {votes.length === 0 ? (
          <div className="py-8 text-center">
            <div className="text-3xl">🗳️</div>
            <p className="mt-2 text-sm text-muted-foreground">아직 참여한 투표가 없어요</p>
          </div>
        ) : (
          <div className="space-y-2">
            {votes.map((vote) => {
              const q = vote.question
              if (!q) return null
              const total = (q.vote_count_a || 0) + (q.vote_count_b || 0)
              const myChoice = vote.choice === 'a' ? q.option_a : q.option_b
              const otherChoice = vote.choice === 'a' ? q.option_b : q.option_a
              const myCount = vote.choice === 'a' ? q.vote_count_a : q.vote_count_b
              const myPct = total > 0 ? Math.round(((myCount || 0) / total) * 100) : 0
              const canModify = remainingTimes[vote.id] > 0
              const deadline = formatDeadline(q.close_at)
              const isClosed = q.status === 'closed'

              return (
                <div key={vote.id} className="rounded-xl border bg-white p-3">
                  <Link href={`/questions/${q.id}`} className="block">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          {isClosed && (
                            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">마감</span>
                          )}
                          <p className="truncate text-sm font-semibold">{q.title}</p>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          내 선택: <span className={vote.choice === 'a' ? 'text-rose-500' : 'text-cyan-500'}>{myChoice}</span>
                          {' · '}{myPct}% ({total}명)
                          {deadline && <span> · {deadline}</span>}
                        </p>
                      </div>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {new Date(vote.created_at).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                  </Link>
                  {canModify && (
                    <div className="mt-2 flex items-center justify-between border-t pt-2">
                      <span className="text-[10px] text-amber-600">
                        {formatRemainingTime(remainingTimes[vote.id])} 내 변경 가능
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 px-2 text-[10px]"
                          onClick={() => handleChangeVote(q.id, vote.id, vote.choice)}
                        >
                          {otherChoice}로 변경
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-[10px] text-destructive hover:text-destructive"
                          onClick={() => handleWithdraw(q.id, vote.id)}
                        >
                          <X className="mr-0.5 h-3 w-3" />
                          철회
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>}

      {/* 예측 내역 */}
      {(filter === 'all' || filter === 'predictions') && <div>
        <h3 className="mb-2 text-sm font-bold">🔮 내 예측 내역</h3>
        {predictions.length === 0 ? (
          <div className="py-8 text-center">
            <div className="text-3xl">🔮</div>
            <p className="mt-2 text-sm text-muted-foreground">아직 예측 내역이 없어요</p>
          </div>
        ) : (
          <div className="space-y-2">
            {predictions.map((pred) => {
              const q = pred.question
              if (!q) return null
              const isClosed = q.status === 'closed'

              let predLabel = ''
              if (pred.prediction === 'a') predLabel = q.option_a
              else if (pred.prediction === 'b') predLabel = q.option_b
              else if (pred.prediction === 'golden') predLabel = '황금밸런스'

              return (
                <Link key={pred.id} href={`/questions/${q.id}`}>
                  <div className="rounded-xl border bg-white p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          {!isClosed && (
                            <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-600">대기중</span>
                          )}
                          {isClosed && (
                            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">마감</span>
                          )}
                          <p className="truncate text-sm font-semibold">{q.title}</p>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          내 예측: <span className={pred.prediction === 'a' ? 'text-rose-500' : pred.prediction === 'b' ? 'text-cyan-500' : 'text-amber-500'}>{predLabel}</span>
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-0.5">
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(pred.created_at).toLocaleDateString('ko-KR')}
                        </span>
                        {isClosed && pred.is_correct === true && (
                          <span className="text-[10px] font-bold text-emerald-600">✓ 적중 +{pred.reward_points || 0}P</span>
                        )}
                        {isClosed && pred.is_correct === false && (
                          <span className="text-[10px] font-bold text-red-500">✗ 빗나감</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>}
    </div>
  )
}
