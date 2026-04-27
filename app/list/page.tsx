"use client"

import { QuestionCard, type QuestionCardProps } from "@/components/question-card"
import { SearchFilterBar } from "@/components/search-filter-bar"
import { useState, useEffect, useMemo, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useInView } from "react-intersection-observer"
import { useQuestions, useCategories, type QuestionFilters, type QuestionTab, type QuestionSort } from "@/hooks/use-questions"
import { useDebounce } from "@/hooks/use-debounce"
import { useVote, type VotePromptInfo } from "@/hooks/use-vote"
import { useBookmarks } from "@/hooks/use-bookmarks"
import { useGuestActivityStore } from "@/store/guest-activity-store"
import { useMemberOnlyModalStore } from "@/components/member-only-modal"
import { QuestionToolbar } from "@/components/question-toolbar"
import { Loader2, Layers, Search, MessageSquareText } from "lucide-react"
import { ScrollToTop } from "@/components/scroll-to-top"
import { EmptyState } from "@/components/empty-state"
import { PredictionSection } from "@/components/prediction-section"
import { formatDeadline } from "@/lib/utils"
import Link from "next/link"

type Question = Omit<QuestionCardProps, 'onVote' | 'onChangeVote' | 'onWithdrawVote' | 'onShare' | 'onBookmark' | 'isBookmarked'>

export default function ListPage() {
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [tab, setTab] = useState<QuestionTab>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('list-tab')
      if (saved) {
        sessionStorage.removeItem('list-tab')
        return saved as QuestionTab
      }
    }
    return "live"
  })
  const [sortBy, setSortBy] = useState<QuestionSort>("newest")
  const [showMyVotes, setShowMyVotes] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('showMyVotes')
      return saved !== null ? JSON.parse(saved) : true
    }
    return true
  })
  const [onlyMyVotes, setOnlyMyVotes] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('onlyMyVotes')
      return saved !== null ? JSON.parse(saved) : false
    }
    return false
  })

  const [localVotes, setLocalVotes] = useState<Record<string, { choice: 'a' | 'b'; created_at: string }>>({})
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [votePrompt, setVotePrompt] = useState<{ info: VotePromptInfo; questionId: string } | null>(null)
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null)
  const [hasPredictions, setHasPredictions] = useState<Record<string, boolean>>({})

  const router = useRouter()
  const supabase = createClient()
  const { ref: loadMoreRef, inView } = useInView({ rootMargin: '200px' })
  const { vote, changeVote, withdrawVote } = useVote()
  const { isBookmarked, toggleBookmark } = useBookmarks()
  const guestHydrate = useGuestActivityStore((s) => s.hydrate)
  const guestSetIsGuest = useGuestActivityStore((s) => s.setIsGuest)
  const openMemberOnly = useMemberOnlyModalStore((s) => s.open)

  useEffect(() => {
    localStorage.setItem('showMyVotes', JSON.stringify(showMyVotes))
  }, [showMyVotes])

  useEffect(() => {
    localStorage.setItem('onlyMyVotes', JSON.stringify(onlyMyVotes))
  }, [onlyMyVotes])

  const debouncedSearch = useDebounce(search, 300)

  const filters: QuestionFilters = {
    search: debouncedSearch,
    category: selectedCategory,
    tab,
    sortBy,
  }

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useQuestions(filters)

  const { data: categories = [], isLoading: isLoadingCategories } = useCategories()

  useEffect(() => {
    const savedY = sessionStorage.getItem('list-scroll-y')
    if (savedY) {
      sessionStorage.removeItem('list-scroll-y')
      const y = parseInt(savedY, 10)
      // Delay to allow content to render before scrolling
      requestAnimationFrame(() => window.scrollTo(0, y))
    }
  }, [])

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

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

  const questions: Question[] = useMemo(() => {
    const seen = new Set<string>()
    return (data?.pages.flatMap(page => {
      const pageVotes = page.userVotes || {}
      const pagePredictions = new Set(page.userPredictions || [])
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
            optionA: {
              label: q.option_a,
              percentage: percentageA,
            },
            optionB: {
              label: q.option_b,
              percentage: percentageB,
            },
            metadata: {
              participantCount: totalVotes,
              deadline: formatDeadline(q.close_at),
              commentCount: q.comment_count || 0,
            },
            hasVoted: !!voteInfo,
            userVote: voteInfo ? (voteInfo.choice === 'a' ? 'A' as const : 'B' as const) : undefined,
            votedAt: voteInfo?.created_at,
            isClosed: q.status === 'legend' ? false : (q.status === 'closed' || (q.close_at ? new Date(q.close_at) <= new Date() : false)),
            balanceType: q.balance_type,
            hasPredicted: pagePredictions.has(q.id) || hasPredictions[q.id] || false,
          }
        })
    }) || [])
  }, [data?.pages, localVotes, hasPredictions])

  const handleVote = useCallback(async (questionId: string, choice: "A" | "B") => {
    const choiceLower = choice.toLowerCase() as 'a' | 'b'

    setLocalVotes(prev => ({
      ...prev,
      [questionId]: { choice: choiceLower, created_at: new Date().toISOString() },
    }))

    const result = await vote(questionId, choiceLower)

    if (!result.success) {
      console.error('Vote failed:', result.error)
      setLocalVotes(prev => {
        const newVotes = { ...prev }
        delete newVotes[questionId]
        return newVotes
      })
      return
    }

    setExpandedQuestionId(questionId)

    if (result.prompt) {
      setVotePrompt({ info: result.prompt, questionId })
    }
  }, [vote])

  const handleChangeVote = useCallback(async (questionId: string, newChoice: "A" | "B") => {
    const choiceLower = newChoice.toLowerCase() as 'a' | 'b'
    const result = await changeVote(questionId, choiceLower)

    if (!result.success) {
      console.error('Change vote failed:', result.error)
      return
    }

    setLocalVotes(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], choice: choiceLower },
    }))
  }, [changeVote])

  const handleWithdrawVote = useCallback(async (questionId: string) => {
    const result = await withdrawVote(questionId)

    if (!result.success) {
      console.error('Withdraw vote failed:', result.error)
      return
    }

    setLocalVotes(prev => {
      const newVotes = { ...prev }
      delete newVotes[questionId]
      return newVotes
    })
  }, [withdrawVote])

  const handleShare = useCallback((questionId: string) => {
    const url = `${window.location.origin}/questions/${questionId}`
    navigator.clipboard.writeText(url).then(() => {
      alert('링크가 클립보드에 복사되었습니다!')
    })
  }, [])

  const handleBookmark = useCallback(async (questionId: string) => {
    await toggleBookmark(questionId)
  }, [toggleBookmark])

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-4 sm:py-8">
        <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
          {/* Hero section */}
          <div className="text-center py-4 space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold">
              우리는 무엇을 더 싫어 할까 ?
            </h1>
            <p className="text-sm text-muted-foreground font-bold">
              팍팍한 인생, 불호를 마음껏 표출하세요!
            </p>
            <p className="text-sm text-muted-foreground">
              투표하고, 다수가 싫어하는 걸 예측 해보세요
            </p>
          </div>

          {/* Swipe mode toggle */}
          <div className="flex justify-end">
            <Link
              href="/swipe"
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-primary/60 px-3 py-1.5 text-xs font-bold text-primary shadow-sm hover:bg-primary/10 transition-colors"
            >
              <Layers className="h-4 w-4" />
              스와이프 모드
            </Link>
          </div>

          <SearchFilterBar
            search={search}
            onSearchChange={setSearch}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            categories={categories}
            isLoadingCategories={isLoadingCategories}
          />

          <QuestionToolbar
            tab={tab}
            onTabChange={setTab}
            sortBy={sortBy}
            onSortChange={setSortBy}
            showMyVotes={tab === 'closed' || tab === 'legend' ? onlyMyVotes : showMyVotes}
            onShowMyVotesChange={tab === 'closed' || tab === 'legend' ? setOnlyMyVotes : setShowMyVotes}
            voteFilterMode={tab === 'closed' || tab === 'legend' ? 'only' : 'hide'}
          />

          {isLoading && (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {isError && (
            <div className="text-center py-12 text-destructive">
              오류가 발생했습니다: {error?.message}
            </div>
          )}

          {!isLoading && !isError && (
            <div className="space-y-4">
              {questions.filter(q => {
                if (tab === 'closed' || tab === 'legend') return !onlyMyVotes || q.hasVoted
                if (q.id in localVotes) return true
                return showMyVotes || !q.hasVoted
              }).map((question) => (
                <div key={question.id}>
                  <QuestionCard
                    id={question.id}
                    category={question.category}
                    title={question.title}
                    optionA={question.optionA}
                    optionB={question.optionB}
                    metadata={question.metadata}
                    isClosed={question.isClosed}
                    isLegend={tab === 'legend'}
                    showResults={tab === 'legend' ? true : undefined}
                    balanceType={question.balanceType}
                    hasPredicted={question.hasPredicted}
                    voteLocked={question.hasPredicted}
                    hasVoted={question.hasVoted}
                    userVote={question.userVote}
                    votedAt={question.votedAt}
                    onVote={(choice) => handleVote(question.id, choice)}
                    onChangeVote={(choice) => handleChangeVote(question.id, choice)}
                    onWithdrawVote={() => handleWithdrawVote(question.id)}
                    onShare={() => handleShare(question.id)}
                    onBookmark={isLoggedIn ? () => handleBookmark(question.id) : () => openMemberOnly('북마크는 회원만 사용할 수 있어요. 가입하고 포인트도 받으세요!')}
                    isBookmarked={isBookmarked(question.id)}
                    onClick={() => {
                      sessionStorage.setItem('list-scroll-y', String(window.scrollY))
                      sessionStorage.setItem('list-tab', tab)
                      router.push(`/questions/${question.id}`)
                    }}
                  />
                  {expandedQuestionId === question.id && question.hasVoted && tab !== 'legend' && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                      <PredictionSection
                        questionId={question.id}
                        hasVoted={true}
                        isLoggedIn={isLoggedIn}
                        optionALabel={question.optionA.label}
                        optionBLabel={question.optionB.label}
                        isClosed={question.isClosed}
                        votePrompt={votePrompt?.questionId === question.id ? votePrompt.info : undefined}
                        onPredictionSubmitted={() => {
                          setHasPredictions(prev => ({ ...prev, [question.id]: true }))
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}

              <div ref={loadMoreRef} className="flex justify-center py-4">
                {isFetchingNextPage && (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                )}
                {!hasNextPage && questions.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    모든 질문을 불러왔습니다
                  </p>
                )}
              </div>
            </div>
          )}

          {!isLoading && !isError && questions.length === 0 && (
            search || selectedCategory !== "all"
              ? <EmptyState icon={Search} title="검색 결과가 없습니다" />
              : <EmptyState icon={MessageSquareText} title="아직 질문이 없습니다" />
          )}
        </div>

      </main>

      <ScrollToTop />
    </div>
  )
}
