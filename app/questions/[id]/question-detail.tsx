"use client"

import { QuestionCard, type QuestionCardProps } from "@/components/question-card"
import { CommentSection } from "@/components/comment-section"
import { PredictionSection } from "@/components/prediction-section"
import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useParams, useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { useVote, type VotePromptInfo } from "@/hooks/use-vote"
import { useBookmarks } from "@/hooks/use-bookmarks"
import { useGuestActivityStore } from "@/store/guest-activity-store"
import { useMemberOnlyModalStore } from "@/components/member-only-modal"
import { getGuestActivity } from "@/lib/guest"
import { VoteToast } from "@/components/vote-toast"
import { formatDeadline } from "@/lib/utils"
import { trackEvent } from "@/lib/analytics"
import { toast } from "sonner"
import { ScrollToTop } from "@/components/scroll-to-top"
import { VoteTrendChart } from "@/components/vote-trend-chart"

type Question = Omit<QuestionCardProps, 'onVote' | 'onChangeVote' | 'onWithdrawVote' | 'onShare' | 'onBookmark' | 'isBookmarked'> & {
  optionARaw: string
  optionBRaw: string
  isClosed: boolean
  isLegend: boolean
  balanceType: "golden" | "normal" | null
}

export default function QuestionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const questionId = params.id as string
  const [question, setQuestion] = useState<Question | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [hasPrediction, setHasPrediction] = useState(false)
  const [votePrompt, setVotePrompt] = useState<VotePromptInfo | null>(null)
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { vote, changeVote, withdrawVote } = useVote()
  const { isBookmarked, toggleBookmark } = useBookmarks()
  const guestHydrate = useGuestActivityStore((s) => s.hydrate)
  const guestSetIsGuest = useGuestActivityStore((s) => s.setIsGuest)
  const openMemberOnly = useMemberOnlyModalStore((s) => s.open)

  const goToNextUnvoted = useCallback(() => {
    // Restore the tab the user came from to find the correct cached query
    const sourceTab = sessionStorage.getItem('list-tab') || 'live'
    const queryCache = queryClient.getQueriesData<any>({ queryKey: ['questions'] })

    // Find cached data matching the source tab
    let cachedData: any = null
    for (const [key, data] of queryCache) {
      const filters = (key as any[])[1] as any
      if (filters?.tab === sourceTab && data?.pages) {
        cachedData = data
        break
      }
    }

    if (!cachedData?.pages) {
      toast('모든 질문에 투표했습니다!')
      return
    }

    const allQuestions: any[] = cachedData.pages.flatMap((page: any) => {
      const pageVotes = page.userVotes || {}
      return page.questions.map((q: any) => ({ ...q, hasVoted: !!pageVotes[q.id] }))
    })

    const currentIndex = allQuestions.findIndex((q: any) => q.id === questionId)
    const after = allQuestions.slice(currentIndex + 1)
    const before = allQuestions.slice(0, currentIndex)
    const candidates = [...after, ...before]

    const next = candidates.find((q: any) => !q.hasVoted)
    if (next) {
      router.push(`/questions/${next.id}`)
    } else {
      toast('모든 질문에 투표했습니다!')
    }
  }, [queryClient, questionId, router])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const loggedIn = !!session?.user
      setIsLoggedIn(loggedIn)
      guestSetIsGuest(!loggedIn)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  useEffect(() => {
    async function fetchQuestion() {
      try {
        // Parallel: question + session
        const [questionResult, sessionResult] = await Promise.all([
          supabase
            .from('questions')
            .select('*')
            .eq('id', questionId)
            .single(),
          supabase.auth.getSession(),
        ])

        const { data: questionData, error } = questionResult

        if (error) {
          console.error('Error fetching question:', error)
          return
        }

        if (!questionData) return

        const user = sessionResult.data.session?.user ?? null
        const loggedIn = !!user
        setIsLoggedIn(loggedIn)
        guestSetIsGuest(!loggedIn)

        let userVote: { choice: string; created_at: string | null } | null = null
        if (user) {
          // Parallel: votes + predictions
          const [voteResult, predictionResult] = await Promise.all([
            supabase
              .from('votes')
              .select('choice, created_at')
              .eq('question_id', questionId)
              .eq('user_id', user.id)
              .maybeSingle(),
            supabase
              .from('predictions')
              .select('id')
              .eq('question_id', questionId)
              .eq('user_id', user.id)
              .maybeSingle(),
          ])

          userVote = voteResult.data

          setHasPrediction(!!predictionResult.data)
        } else {
          // Guest: load from localStorage
          guestHydrate()
          const guestActivity = getGuestActivity()
          const guestVote = guestActivity.votes.find(v => v.questionId === questionId)
          if (guestVote) {
            userVote = { choice: guestVote.choice, created_at: new Date(guestVote.timestamp).toISOString() }
          }
          const guestPred = guestActivity.predictions.find(p => p.questionId === questionId)
          setHasPrediction(!!guestPred)
        }

        const totalVotes = (questionData.vote_count_a || 0) + (questionData.vote_count_b || 0)
        const percentageA = totalVotes > 0 ? Math.round(((questionData.vote_count_a || 0) / totalVotes) * 100) : 50
        const percentageB = totalVotes > 0 ? Math.round(((questionData.vote_count_b || 0) / totalVotes) * 100) : 50

        setQuestion({
          id: questionData.id,
          category: questionData.category || "기타",
          title: questionData.title,
          optionA: {
            label: questionData.option_a,
            percentage: percentageA,
          },
          optionB: {
            label: questionData.option_b,
            percentage: percentageB,
          },
          metadata: {
            participantCount: totalVotes,
            deadline: formatDeadline(questionData.close_at),
          },
          hasVoted: !!userVote,
          userVote: userVote ? (userVote.choice === 'a' ? 'A' as const : 'B' as const) : undefined,
          votedAt: userVote?.created_at ?? undefined,
          optionARaw: questionData.option_a,
          optionBRaw: questionData.option_b,
          isClosed: questionData.status === 'closed' || false,
          isLegend: questionData.status === 'legend',
          balanceType: questionData.balance_type as Question["balanceType"],
        })

        // Track question view event
        trackEvent('question_view', { question_id: questionId })
      } catch (error) {
        console.error('Error loading question:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchQuestion()
  }, [questionId])

  const refreshQuestionData = async () => {
    const { data: updatedQuestion } = await supabase
      .from('questions')
      .select('vote_count_a, vote_count_b')
      .eq('id', questionId)
      .single()

    if (!updatedQuestion) return null

    const totalVotes = (updatedQuestion.vote_count_a || 0) + (updatedQuestion.vote_count_b || 0)
    const percentageA = totalVotes > 0 ? Math.round(((updatedQuestion.vote_count_a || 0) / totalVotes) * 100) : 50
    const percentageB = totalVotes > 0 ? Math.round(((updatedQuestion.vote_count_b || 0) / totalVotes) * 100) : 50

    return { totalVotes, percentageA, percentageB }
  }

  const handleVote = async (choice: "A" | "B") => {
    const choiceLower = choice.toLowerCase() as 'a' | 'b'
    const result = await vote(questionId, choiceLower)

    if (!result.success) {
      console.error('Vote failed:', result.error)
      return
    }

    const data = await refreshQuestionData()
    if (!data) return

    setQuestion(prev => prev ? {
      ...prev,
      hasVoted: true,
      userVote: choice,
      votedAt: new Date().toISOString(),
      metadata: { ...prev.metadata, participantCount: data.totalVotes },
      optionA: { ...prev.optionA, percentage: data.percentageA },
      optionB: { ...prev.optionB, percentage: data.percentageB },
    } : null)

    if (result.prompt) {
      setVotePrompt(result.prompt)
    }
  }

  const handleChangeVote = async (newChoice: "A" | "B") => {
    const choiceLower = newChoice.toLowerCase() as 'a' | 'b'
    const result = await changeVote(questionId, choiceLower)

    if (!result.success) {
      console.error('Change vote failed:', result.error)
      return
    }

    const data = await refreshQuestionData()
    if (!data) return

    setQuestion(prev => prev ? {
      ...prev,
      userVote: newChoice,
      metadata: { ...prev.metadata, participantCount: data.totalVotes },
      optionA: { ...prev.optionA, percentage: data.percentageA },
      optionB: { ...prev.optionB, percentage: data.percentageB },
    } : null)
  }

  const handleWithdrawVote = async () => {
    const result = await withdrawVote(questionId)

    if (!result.success) {
      console.error('Withdraw vote failed:', result.error)
      return
    }

    const data = await refreshQuestionData()
    if (!data) return

    setQuestion(prev => prev ? {
      ...prev,
      hasVoted: false,
      userVote: undefined,
      votedAt: undefined,
      metadata: { ...prev.metadata, participantCount: data.totalVotes },
      optionA: { ...prev.optionA, percentage: data.percentageA },
      optionB: { ...prev.optionB, percentage: data.percentageB },
    } : null)
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: question?.title,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('링크가 복사되었습니다!')
    }
  }

  const handleBookmark = async () => {
    await toggleBookmark(questionId)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center py-12 text-muted-foreground">
              로딩 중...
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center py-12 text-muted-foreground">
              질문을 찾을 수 없습니다
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Question Card */}
          <QuestionCard
            id={question.id}
            category={question.category}
            title={question.title}
            optionA={question.optionA}
            optionB={question.optionB}
            metadata={question.metadata}
            hasVoted={question.hasVoted}
            userVote={question.userVote}
            votedAt={question.votedAt}
            onVote={handleVote}
            onChangeVote={handleChangeVote}
            onWithdrawVote={handleWithdrawVote}
            onShare={handleShare}
            onBookmark={isLoggedIn ? handleBookmark : () => openMemberOnly('북마크는 회원만 사용할 수 있어요. 가입하고 포인트도 받으세요!')}
            isBookmarked={isBookmarked(questionId)}
            voteLocked={hasPrediction}
            isClosed={question.isLegend ? false : question.isClosed}
            isLegend={question.isLegend}
            showResults={question.isLegend ? true : undefined}
            balanceType={question.balanceType}
          />

          {/* Vote Trend Chart for Legend questions */}
          {question.isLegend && (
            <VoteTrendChart
              questionId={question.id}
              optionALabel={question.optionARaw}
              optionBLabel={question.optionBRaw}
            />
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3">
            <Button onClick={goToNextUnvoted} className="flex-1">
              다음질문으로
            </Button>
            <Button variant="ghost" onClick={() => router.push('/list')} className="flex-1 border-2 border-muted-foreground/70">
              목록으로
            </Button>
          </div>

          {/* Vote Toast */}
          {votePrompt && (
            <VoteToast
              prompt={votePrompt}
              optionALabel={question.optionA.label}
              optionBLabel={question.optionB.label}
              onDone={() => setVotePrompt(null)}
            />
          )}

          {/* Prediction Section */}
          {!question.isLegend && (
            <PredictionSection
              questionId={question.id}
              hasVoted={question.hasVoted ?? false}
              isLoggedIn={isLoggedIn}
              optionALabel={question.optionARaw}
              optionBLabel={question.optionBRaw}
              isClosed={question.isClosed}
              onPredictionSubmitted={() => setHasPrediction(true)}
            />
          )}

          {/* Comments Section */}
          <CommentSection questionId={questionId} />
        </div>

      </main>

      <ScrollToTop />
    </div>
  )
}
