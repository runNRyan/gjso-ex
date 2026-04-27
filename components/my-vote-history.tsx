"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useVote } from "@/hooks/use-vote"
import { Button } from "@/components/ui/button"
import { X, Vote } from "lucide-react"
import { EmptyState } from "@/components/empty-state"
import { VOTE_CHANGE_WINDOW_MS, formatRemainingTime, formatDeadline } from "@/lib/utils"

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

export function MyVoteHistory({ userId }: { userId: string }) {
  const [votes, setVotes] = useState<VoteWithQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [remainingTimes, setRemainingTimes] = useState<Record<string, number>>({})
  const supabase = createClient()
  const { changeVote, withdrawVote } = useVote()

  useEffect(() => {
    async function fetchVotes() {
      const { data } = await supabase
        .from('votes')
        .select(`
          id,
          choice,
          created_at,
          question:questions (
            id,
            title,
            option_a,
            option_b,
            vote_count_a,
            vote_count_b,
            close_at,
            status
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (data) {
        setVotes(data as VoteWithQuestion[])
      }
      setLoading(false)
    }

    fetchVotes()
  }, [userId, supabase])

  useEffect(() => {
    const updateRemainingTimes = () => {
      const now = Date.now()
      const newTimes: Record<string, number> = {}

      votes.forEach(vote => {
        const voteTime = new Date(vote.created_at).getTime()
        const elapsed = now - voteTime
        const remaining = VOTE_CHANGE_WINDOW_MS - elapsed
        if (remaining > 0) {
          newTimes[vote.id] = remaining
        }
      })

      setRemainingTimes(newTimes)
    }

    updateRemainingTimes()
    const interval = setInterval(updateRemainingTimes, 1000)
    return () => clearInterval(interval)
  }, [votes])

  const handleChangeVote = async (questionId: string, voteId: string, currentChoice: string) => {
    const newChoice = currentChoice === 'a' ? 'b' : 'a'
    const result = await changeVote(questionId, newChoice)

    if (result.success) {
      setVotes(prev => prev.map(v =>
        v.id === voteId ? { ...v, choice: newChoice } : v
      ))
    }
  }

  const handleWithdraw = async (questionId: string, voteId: string) => {
    const result = await withdrawVote(questionId)

    if (result.success) {
      setVotes(prev => prev.filter(v => v.id !== voteId))
    }
  }

  if (loading) {
    return <p className="text-muted-foreground text-sm">로딩 중...</p>
  }

  if (votes.length === 0) {
    return (
      <EmptyState
        icon={Vote}
        title="아직 참여한 투표가 없습니다"
        action={{ label: "투표하러 가기", href: "/" }}
      />
    )
  }

  return (
    <div className="space-y-3">
      {votes.map((vote) => {
        const question = vote.question
        if (!question) return null

        const totalVotes = (question.vote_count_a || 0) + (question.vote_count_b || 0)
        const myChoice = vote.choice === 'a' ? question.option_a : question.option_b
        const otherChoice = vote.choice === 'a' ? question.option_b : question.option_a
        const myChoiceCount = vote.choice === 'a' ? question.vote_count_a : question.vote_count_b
        const myPercentage = totalVotes > 0 ? Math.round(((myChoiceCount || 0) / totalVotes) * 100) : 0
        const canModify = remainingTimes[vote.id] > 0
        const deadline = formatDeadline(question.close_at)

        return (
          <div
            key={vote.id}
            className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <Link href={`/questions/${question.id}`} className="block">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{question.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    내 선택: <span className={vote.choice === 'a' ? 'text-green-600' : 'text-red-600'}>{myChoice}</span>
                    {' · '}{myPercentage}% ({totalVotes}명 참여)
                    {deadline && <span> · {deadline}</span>}
                  </p>
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(vote.created_at).toLocaleDateString('ko-KR')}
                </div>
              </div>
            </Link>

            {canModify && (
              <div className="mt-3 pt-3 border-t flex items-center justify-between">
                <span className="text-xs text-amber-600 dark:text-amber-400">
                  {formatRemainingTime(remainingTimes[vote.id])} 내 변경 가능
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={(e) => {
                      e.preventDefault()
                      handleChangeVote(question.id, vote.id, vote.choice)
                    }}
                  >
                    {otherChoice}로 변경
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.preventDefault()
                      handleWithdraw(question.id, vote.id)
                    }}
                  >
                    <X className="h-3 w-3 mr-1" />
                    철회
                  </Button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
