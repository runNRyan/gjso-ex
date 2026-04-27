"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { motion, AnimatePresence, type PanInfo } from "framer-motion"
import { QuestionCard, type QuestionCardProps } from "@/components/question-card"
import { PredictionSection } from "@/components/prediction-section"
import { CommentSection } from "@/components/comment-section"
import { VoteToast } from "@/components/vote-toast"
import { useQuestions, useQuestionCount, useCategories, type QuestionFilters } from "@/hooks/use-questions"
import { useVote, type VotePromptInfo } from "@/hooks/use-vote"
import { useBookmarks } from "@/hooks/use-bookmarks"
import { useGuestActivityStore } from "@/store/guest-activity-store"
import { useMemberOnlyModalStore } from "@/components/member-only-modal"
import { createClient } from "@/lib/supabase/client"
import { formatDeadline } from "@/lib/utils"
import { List, Loader2, Layers } from "lucide-react"
import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"
import { ScrollToTop } from "@/components/scroll-to-top"
import { VoteTrendChart } from "@/components/vote-trend-chart"
import Link from "next/link"

type Question = Omit<QuestionCardProps, 'onVote' | 'onChangeVote' | 'onWithdrawVote' | 'onShare' | 'onBookmark' | 'isBookmarked'> & { isLegend?: boolean }

const SWIPE_THRESHOLD = 50
const SWIPE_VELOCITY = 500

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
}

export default function SwipeView() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)
  const [localVotes, setLocalVotes] = useState<Record<string, { choice: 'a' | 'b'; created_at: string }>>({})
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [hasPredictions, setHasPredictions] = useState<Record<string, boolean>>({})
  const [votePrompt, setVotePrompt] = useState<{ info: VotePromptInfo; questionId: string } | null>(null)
  const [selectedCategory, setSelectedCategory] = useState("all")

  const supabase = createClient()
  const { vote, changeVote, withdrawVote } = useVote()
  const { isBookmarked, toggleBookmark } = useBookmarks()
  const { data: categories, isLoading: isLoadingCategories } = useCategories()
  const guestHydrate = useGuestActivityStore((s) => s.hydrate)
  const guestSetIsGuest = useGuestActivityStore((s) => s.setIsGuest)
  const openMemberOnly = useMemberOnlyModalStore((s) => s.open)

  const filters: QuestionFilters = { tab: 'live', sortBy: 'newest', category: selectedCategory }
  const legendFilters: QuestionFilters = { tab: 'legend', sortBy: 'newest', category: selectedCategory }
  const { data: liveCount } = useQuestionCount(filters)
  const { data: legendCount } = useQuestionCount(legendFilters)
  const totalQuestionCount = (liveCount || 0) + (legendCount || 0)
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useQuestions(filters)
  const { data: legendData } = useQuestions(legendFilters)

  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category)
    setCurrentIndex(0)
    setDirection(0)
  }, [])

  // Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const loggedIn = !!session?.user
      setIsLoggedIn(loggedIn)
      if (!loggedIn) {
        guestHydrate()
        guestSetIsGuest(true)
      }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const loggedIn = !!session?.user
      setIsLoggedIn(loggedIn)
      guestSetIsGuest(!loggedIn)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Transform questions (same logic as home page) + legend questions
  const rawQuestions: Question[] = (() => {
    const seen = new Set<string>()
    const allPages = [...(data?.pages || []), ...(legendData?.pages || [])]
    return allPages.flatMap(page => {
      const pageVotes = page.userVotes || {}
      return page.questions
        .filter(q => {
          if (seen.has(q.id)) return false
          seen.add(q.id)
          return true
        })
        .map(q => {
          const totalVotes = (q.vote_count_a || 0) + (q.vote_count_b || 0)
          const percentageA = totalVotes > 0 ? Math.round(((q.vote_count_a || 0) / totalVotes) * 100) : 50
          const percentageB = totalVotes > 0 ? Math.round(((q.vote_count_b || 0) / totalVotes) * 100) : 50
          const voteInfo = localVotes[q.id] || (pageVotes[q.id] ? { choice: pageVotes[q.id].choice, created_at: pageVotes[q.id].created_at } : null)

          return {
            id: q.id,
            category: q.category || "기타",
            title: q.title,
            optionA: { label: q.option_a, percentage: percentageA },
            optionB: { label: q.option_b, percentage: percentageB },
            metadata: {
              participantCount: totalVotes,
              deadline: formatDeadline(q.close_at),
              commentCount: q.comment_count || 0,
            },
            hasVoted: !!voteInfo,
            userVote: voteInfo ? (voteInfo.choice === 'a' ? 'A' as const : 'B' as const) : undefined,
            votedAt: voteInfo?.created_at,
            isClosed: q.status === 'legend' ? false : (q.status === 'closed' || (q.close_at ? new Date(q.close_at) <= new Date() : false)),
            isLegend: q.status === 'legend',
            balanceType: q.balance_type,
          }
        })
    })
  })()

  // Stable random shuffle: compute shuffled order once when question IDs change
  const questionIds = rawQuestions.map(q => q.id).join(',')
  const shuffledIndices = useMemo(() => {
    const indices = rawQuestions.map((_, i) => i)
    // Seeded shuffle using question IDs for stability across re-renders
    let seed = 0
    for (let i = 0; i < questionIds.length; i++) {
      seed = ((seed << 5) - seed + questionIds.charCodeAt(i)) | 0
    }
    const seededRandom = () => {
      seed = (seed * 16807 + 0) % 2147483647
      return (seed & 0x7fffffff) / 0x7fffffff
    }
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(seededRandom() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]]
    }
    return indices
  }, [questionIds])

  const questions = useMemo(() => {
    return shuffledIndices.map(i => rawQuestions[i]).filter(Boolean)
  }, [shuffledIndices, rawQuestions])

  const currentQuestion = questions[currentIndex]

  // Prefetch next page when nearing end
  useEffect(() => {
    if (currentIndex >= questions.length - 5 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [currentIndex, questions.length, hasNextPage, isFetchingNextPage, fetchNextPage])

  const goToNext = useCallback(() => {
    if (questions.length === 0) return
    setDirection(1)
    setCurrentIndex(prev => (prev + 1) % questions.length)
  }, [questions.length])

  const goToPrev = useCallback(() => {
    if (questions.length === 0) return
    setDirection(-1)
    setCurrentIndex(prev => (prev - 1 + questions.length) % questions.length)
  }, [questions.length])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrev()
      if (e.key === 'ArrowRight') goToNext()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goToNext, goToPrev])

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { offset, velocity } = info
    if (offset.x < -SWIPE_THRESHOLD || velocity.x < -SWIPE_VELOCITY) {
      goToNext()
    } else if (offset.x > SWIPE_THRESHOLD || velocity.x > SWIPE_VELOCITY) {
      goToPrev()
    }
  }


  const handleVote = async (questionId: string, choice: "A" | "B") => {
    const choiceLower = choice.toLowerCase() as 'a' | 'b'
    const result = await vote(questionId, choiceLower)
    if (!result.success) return

    setLocalVotes(prev => ({
      ...prev,
      [questionId]: { choice: choiceLower, created_at: new Date().toISOString() },
    }))

    if (result.prompt) {
      setVotePrompt({ info: result.prompt, questionId })
    }
  }

  const handleChangeVote = async (questionId: string, newChoice: "A" | "B") => {
    const choiceLower = newChoice.toLowerCase() as 'a' | 'b'
    const result = await changeVote(questionId, choiceLower)
    if (!result.success) return

    setLocalVotes(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], choice: choiceLower },
    }))
  }

  const handleWithdrawVote = async (questionId: string) => {
    const result = await withdrawVote(questionId)
    if (!result.success) return

    setLocalVotes(prev => {
      const newVotes = { ...prev }
      delete newVotes[questionId]
      return newVotes
    })
  }

  const handleShare = (questionId: string) => {
    const url = `${window.location.origin}/questions/${questionId}`
    if (navigator.share) {
      navigator.share({ title: currentQuestion?.title, url })
    } else {
      navigator.clipboard.writeText(url).then(() => alert('링크가 클립보드에 복사되었습니다!'))
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Error state
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-muted-foreground">오류가 발생했습니다</p>
        <Link href="/list">
          <Button variant="outline">목록으로 돌아가기</Button>
        </Link>
      </div>
    )
  }

  // Empty state
  if (questions.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <EmptyState
          icon={Layers}
          title="진행 중인 질문이 없습니다"
          action={{ label: "목록으로 돌아가기", href: "/list" }}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto max-w-2xl">
        {/* Top bar: counter + list toggle */}
        <div className="flex items-center justify-between px-4 py-3 sticky top-14 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <span className="text-sm font-medium text-muted-foreground">
            {currentIndex + 1} / {totalQuestionCount || questions.length}
          </span>
          <Link
            href="/list"
            className="inline-flex items-center gap-1.5 rounded-full border-2 border-primary/60 px-3 py-1.5 text-xs font-bold text-primary shadow-sm hover:bg-primary/10 transition-colors"
          >
            <List className="h-4 w-4" />
            목록 보기
          </Link>
        </div>

        {/* Category filter buttons */}
        <div className="px-4 py-2">
          <div
            className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => handleCategoryChange("all")}
              className="rounded-full shrink-0"
            >
              전체
            </Button>
            {isLoadingCategories ? (
              <>
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-8 w-16 animate-pulse rounded-full bg-muted shrink-0"
                  />
                ))}
              </>
            ) : (
              categories?.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleCategoryChange(category)}
                  className="rounded-full shrink-0"
                >
                  {category}
                </Button>
              ))
            )}
          </div>
        </div>

        {/* Swipe hint (above card) */}
        {currentQuestion && (
          <p className="text-center text-sm font-bold text-foreground/70 py-2">
            ← 스와이프하여 다른 질문 보기 →
          </p>
        )}

        {/* Swipeable content: card + prediction + comments all animate together */}
        <div className="relative overflow-x-hidden">
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.15 },
              }}
              drag="x"
              dragDirectionLock
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.7}
              onDragEnd={handleDragEnd}
            >
              {currentQuestion && (
                <>
                  <div className="px-4">
                    <QuestionCard
                      id={currentQuestion.id}
                      category={currentQuestion.category}
                      title={currentQuestion.title}
                      optionA={currentQuestion.optionA}
                      optionB={currentQuestion.optionB}
                      metadata={currentQuestion.metadata}
                      isClosed={currentQuestion.isClosed}
                      isLegend={currentQuestion.isLegend}
                      showResults={currentQuestion.isLegend ? true : undefined}
                      balanceType={currentQuestion.balanceType}
                      hasVoted={currentQuestion.hasVoted}
                      userVote={currentQuestion.userVote}
                      votedAt={currentQuestion.votedAt}
                      voteLocked={hasPredictions[currentQuestion.id]}
                      onVote={(choice) => handleVote(currentQuestion.id, choice)}
                      onChangeVote={(choice) => handleChangeVote(currentQuestion.id, choice)}
                      onWithdrawVote={() => handleWithdrawVote(currentQuestion.id)}
                      onShare={() => handleShare(currentQuestion.id)}
                      onBookmark={isLoggedIn ? () => toggleBookmark(currentQuestion.id) : () => openMemberOnly('북마크는 회원만 사용할 수 있어요. 가입하고 포인트도 받으세요!')}
                      isBookmarked={isBookmarked(currentQuestion.id)}
                    />
                  </div>

                  {/* Below-card content: fades in after slide */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                  >
                    {/* Vote toast */}
                    {votePrompt && votePrompt.questionId === currentQuestion.id && (() => {
                      return (
                        <div className="px-4 pt-2">
                          <VoteToast
                            prompt={votePrompt.info}
                            optionALabel={currentQuestion.optionA.label}
                            optionBLabel={currentQuestion.optionB.label}
                            onDone={() => setVotePrompt(null)}
                          />
                        </div>
                      )
                    })()}

                    {/* Post-vote: Prediction section (hidden for legend questions) */}
                    {currentQuestion.hasVoted && !currentQuestion.isLegend && (
                      <div className="px-4 pt-4">
                        <PredictionSection
                          questionId={currentQuestion.id}
                          hasVoted={true}
                          isLoggedIn={isLoggedIn}
                          optionALabel={currentQuestion.optionA.label}
                          optionBLabel={currentQuestion.optionB.label}
                          isClosed={currentQuestion.isClosed}
                          onPredictionSubmitted={() => {
                            setHasPredictions(prev => ({ ...prev, [currentQuestion.id]: true }))
                          }}
                        />
                      </div>
                    )}

                    {/* Vote Trend Chart for Legend questions */}
                    {currentQuestion.isLegend && (
                      <div className="px-4 pt-4">
                        <VoteTrendChart
                          questionId={currentQuestion.id}
                          optionALabel={currentQuestion.optionA.label}
                          optionBLabel={currentQuestion.optionB.label}
                        />
                      </div>
                    )}

                    {/* Comments */}
                    <div className="px-4 pt-4 pb-24">
                      <CommentSection questionId={currentQuestion.id} />
                    </div>
                  </motion.div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Loading more indicator */}
        {isFetchingNextPage && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
      </main>

      <ScrollToTop />
    </div>
  )
}
