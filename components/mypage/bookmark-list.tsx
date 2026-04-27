"use client"

import { useBookmarks } from "@/hooks/use-bookmarks"
import { QuestionCard } from "@/components/question-card"
import { useVote } from "@/hooks/use-vote"
import { usePrediction } from "@/hooks/use-prediction"
import { createClient } from "@/lib/supabase/client"
import { useState, useEffect } from "react"
import { Bookmark } from "lucide-react"
import { EmptyState } from "@/components/empty-state"

export function BookmarkList() {
  const { bookmarks, isLoading, toggleBookmark } = useBookmarks()
  const { vote, changeVote, withdrawVote, getVoteInfo } = useVote()
  const { submitPrediction, getPrediction } = usePrediction()
  const [userId, setUserId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id || null)
    })
  }, [supabase])

  const handleVote = async (questionId: string, choice: "A" | "B") => {
    const result = await vote(questionId, choice.toLowerCase() as 'a' | 'b')
    if (!result.success) {
      alert(result.error)
    }
  }

  const handleChangeVote = async (questionId: string, newChoice: "A" | "B") => {
    const result = await changeVote(questionId, newChoice.toLowerCase() as 'a' | 'b')
    if (!result.success) {
      alert(result.error)
    }
  }

  const handleWithdrawVote = async (questionId: string) => {
    const result = await withdrawVote(questionId)
    if (!result.success) {
      alert(result.error)
    }
  }

  const handleBookmark = async (questionId: string) => {
    await toggleBookmark(questionId)
  }

  const handleShare = (questionId: string) => {
    const url = `${window.location.origin}/questions/${questionId}`
    navigator.clipboard.writeText(url).then(() => {
      alert('링크가 클립보드에 복사되었습니다!')
    })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (bookmarks.length === 0) {
    return (
      <EmptyState
        icon={Bookmark}
        title="저장한 책갈피가 없습니다"
        description="관심있는 질문의 책갈피 아이콘을 클릭해보세요!"
        action={{ label: "질문 둘러보기", href: "/" }}
      />
    )
  }

  return (
    <div className="space-y-4">
      {bookmarks.map((bookmark) => {
        const q = bookmark.questions
        const totalVotes = q.vote_count_a + q.vote_count_b
        const percentageA = totalVotes > 0 ? Math.round((q.vote_count_a / totalVotes) * 100) : 50
        const percentageB = 100 - percentageA

        return (
          <QuestionCard
            key={q.id}
            id={q.id}
            title={q.title}
            optionA={{
              label: q.option_a,
              percentage: percentageA,
            }}
            optionB={{
              label: q.option_b,
              percentage: percentageB,
            }}
            metadata={{
              participantCount: totalVotes,
              deadline: q.close_at || undefined,
            }}
            isBookmarked={true}
            onVote={(choice) => handleVote(q.id, choice)}
            onChangeVote={(newChoice) => handleChangeVote(q.id, newChoice)}
            onWithdrawVote={() => handleWithdrawVote(q.id)}
            onBookmark={() => handleBookmark(q.id)}
            onShare={() => handleShare(q.id)}
            onClick={() => window.location.href = `/questions/${q.id}`}
          />
        )
      })}
    </div>
  )
}
