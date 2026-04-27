"use client"

import { Button } from "@/components/ui/button"
import { cn, VOTE_CHANGE_WINDOW_MS, formatRemainingTime } from "@/lib/utils"
import { Bookmark, Share2, RotateCcw, X, MessageCircle, Users, Info, LogIn } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { useSignInModalStore } from "@/store/sign-in-modal-store"

export interface QuestionCardProps {
  id: string
  category?: string
  title: string
  optionA: {
    label: string
    description?: string
    percentage: number
  }
  optionB: {
    label: string
    description?: string
    percentage: number
  }
  metadata?: {
    participantCount?: number
    volume?: string
    deadline?: string
    commentCount?: number
  }
  hasVoted?: boolean
  userVote?: "A" | "B"
  votedAt?: string
  onVote?: (choice: "A" | "B") => void
  onChangeVote?: (newChoice: "A" | "B") => void
  onWithdrawVote?: () => void
  onShare?: () => void
  onBookmark?: () => void
  isBookmarked?: boolean
  voteLocked?: boolean
  isClosed?: boolean
  isLegend?: boolean
  showResults?: boolean
  balanceType?: string | null
  hasPredicted?: boolean
  onClick?: () => void
}

export function QuestionCard({
  category,
  title,
  optionA,
  optionB,
  metadata,
  hasVoted = false,
  userVote,
  votedAt,
  onVote,
  onChangeVote,
  onWithdrawVote,
  onShare,
  onBookmark,
  isBookmarked = false,
  voteLocked = false,
  isClosed = false,
  isLegend = false,
  showResults,
  balanceType,
  hasPredicted = false,
  onClick,
}: QuestionCardProps) {
  const displayResults = showResults ?? isClosed
  const [isHovered, setIsHovered] = useState(false)
  const [showLegendInfo, setShowLegendInfo] = useState(false)
  const [remainingTime, setRemainingTime] = useState(0)
  const [canModify, setCanModify] = useState(false)
  const [showLoginNotice, setShowLoginNotice] = useState(false)
  const loginNoticeTimer = useRef<ReturnType<typeof setTimeout>>(null)
  const openSignInModal = useSignInModalStore((s) => s.open)

  useEffect(() => {
    return () => {
      if (loginNoticeTimer.current) clearTimeout(loginNoticeTimer.current)
    }
  }, [])

  useEffect(() => {
    if (!votedAt) {
      setCanModify(false)
      setRemainingTime(0)
      return
    }

    const updateRemainingTime = () => {
      if (voteLocked) {
        setCanModify(false)
        setRemainingTime(0)
        return
      }

      const voteTime = new Date(votedAt).getTime()
      const now = Date.now()
      const elapsed = now - voteTime
      const remaining = VOTE_CHANGE_WINDOW_MS - elapsed

      if (remaining > 0) {
        setCanModify(true)
        setRemainingTime(remaining)
      } else {
        setCanModify(false)
        setRemainingTime(0)
      }
    }

    updateRemainingTime()
    const interval = setInterval(updateRemainingTime, 1000)
    return () => clearInterval(interval)
  }, [votedAt, voteLocked])

  const handleVote = (choice: "A" | "B", e: React.MouseEvent) => {
    e.stopPropagation()
    if (isClosed) return
    if (!onVote) {
      if (loginNoticeTimer.current) clearTimeout(loginNoticeTimer.current)
      setShowLoginNotice(true)
      loginNoticeTimer.current = setTimeout(() => setShowLoginNotice(false), 3000)
      return
    }
    if (!hasVoted && onVote) {
      onVote(choice)
    } else if (hasVoted && canModify && onChangeVote && userVote !== choice) {
      onChangeVote(choice)
    }
  }

  const handleWithdraw = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (canModify && onWithdrawVote) {
      onWithdrawVote()
    }
  }

  const noVotes = metadata?.participantCount === 0


  return (
    <div
      className={cn(
        "relative rounded-xl border dark:border-2 dark:border-white/20 bg-card dark:bg-card/80 p-4 sm:p-6 shadow-sm dark:shadow-md dark:shadow-black/30 transition-all duration-200 hover:shadow-lg hover:scale-[1.01] hover:border-primary/50",
        isHovered && "shadow-lg scale-[1.01]",
        onClick && "cursor-pointer"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Header */}
      <div className="mb-3 sm:mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {category && (
            <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium">
              {category}
            </span>
          )}
          {isClosed && !showResults && (
            <span className="rounded-md bg-red-100 dark:bg-red-900/30 px-2 py-1 text-xs font-medium text-red-600 dark:text-red-400">
              마감됨
            </span>
          )}
          {isLegend ? (
            <span
              className="inline-flex items-center gap-1 rounded-md bg-amber-100 dark:bg-amber-900/30 px-2 py-1 text-xs font-medium text-amber-700 dark:text-amber-400 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                setShowLegendInfo(prev => !prev)
              }}
            >
              LEGEND
              <Info className="h-3 w-3 text-amber-500 dark:text-amber-400" />
            </span>
          ) : balanceType === 'golden' && (
            <span className="rounded-md bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 text-xs font-medium text-yellow-700 dark:text-yellow-400">
              Golden
            </span>
          )}
          {metadata?.volume && (
            <span className="text-xs text-muted-foreground">
              {metadata.volume}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onShare && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation()
                onShare()
              }}
            >
              <Share2 className="h-4 w-4" />
            </Button>
          )}
          {onBookmark && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation()
                onBookmark()
              }}
            >
              <Bookmark
                className={cn(
                  "h-4 w-4",
                  isBookmarked && "fill-current text-yellow-500"
                )}
              />
            </Button>
          )}
        </div>
      </div>

      {/* Legend info */}
      {isLegend && showLegendInfo && (
        <p className="mb-2 rounded-md bg-amber-50 dark:bg-amber-950/20 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
          황금밸런스: 투표 결과가 50:50 ~ 60:40 였던 초접전 선택
        </p>
      )}

      {/* Question Title */}
      <h3 className="mb-3 sm:mb-6 text-base sm:text-lg font-semibold leading-snug">
        {title}
      </h3>

      {/* Options */}
      <div className="space-y-1.5 sm:space-y-2">
        {/* Option A */}
        <button
          onClick={(e) => handleVote("A", e)}
          disabled={isClosed || (hasVoted && !canModify)}
          className={cn(
            "relative w-full overflow-hidden rounded-lg border transition-all hover:scale-[1.02]",
            hasVoted && userVote === "A" && "ring-2 ring-primary",
            !isClosed && hasVoted && userVote === "A" && "bg-green-100 dark:bg-green-700/60",
            (!isClosed && (!hasVoted || (hasVoted && canModify && userVote !== "A"))) && "hover:border-primary hover:shadow-md cursor-pointer",
            (isClosed || (hasVoted && !canModify)) && "cursor-default"
          )}
        >
          <div className="px-3 py-1.5 sm:px-4 sm:py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  A. {optionA.label}
                </span>
                {optionA.description && (
                  <span className="text-sm text-muted-foreground">
                    ({optionA.description})
                  </span>
                )}
              </div>
              {displayResults && (
                noVotes ? (
                  <span className="text-sm text-muted-foreground">-</span>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    {Math.round((optionA.percentage / 100) * (metadata?.participantCount || 0))}명 ({optionA.percentage}%)
                  </span>
                )
              )}
            </div>
            {displayResults && !noVotes && (
              <div className="mt-2 h-2.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-300"
                  style={{ width: `${optionA.percentage}%` }}
                />
              </div>
            )}
          </div>
        </button>

        {/* Option B */}
        <button
          onClick={(e) => handleVote("B", e)}
          disabled={isClosed || (hasVoted && !canModify)}
          className={cn(
            "relative w-full overflow-hidden rounded-lg border transition-all hover:scale-[1.02]",
            hasVoted && userVote === "B" && "ring-2 ring-primary",
            !isClosed && hasVoted && userVote === "B" && "bg-red-100 dark:bg-red-700/60",
            (!isClosed && (!hasVoted || (hasVoted && canModify && userVote !== "B"))) && "hover:border-primary hover:shadow-md cursor-pointer",
            (isClosed || (hasVoted && !canModify)) && "cursor-default"
          )}
        >
          <div className="px-3 py-1.5 sm:px-4 sm:py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  B. {optionB.label}
                </span>
                {optionB.description && (
                  <span className="text-sm text-muted-foreground">
                    ({optionB.description})
                  </span>
                )}
              </div>
              {displayResults && (
                noVotes ? (
                  <span className="text-sm text-muted-foreground">-</span>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    {Math.round((optionB.percentage / 100) * (metadata?.participantCount || 0))}명 ({optionB.percentage}%)
                  </span>
                )
              )}
            </div>
            {displayResults && !noVotes && (
              <div className="mt-2 h-2.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 rounded-full transition-all duration-300"
                  style={{ width: `${optionB.percentage}%` }}
                />
              </div>
            )}
          </div>
        </button>
      </div>

      {/* Login Notice */}
      {showLoginNotice && (
        <button
          onClick={(e) => { e.stopPropagation(); openSignInModal() }}
          className="mt-2 w-full flex items-center justify-center gap-1.5 rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary animate-in fade-in duration-200 hover:bg-primary/20 transition-colors cursor-pointer"
        >
          <LogIn className="h-3.5 w-3.5" />
          로그인 후 투표할 수 있습니다
        </button>
      )}

      {/* Footer */}
      <div className="mt-3 sm:mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          {metadata?.participantCount !== undefined && (
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {metadata.participantCount === 0 ? "0" : metadata.participantCount}
            </span>
          )}
          {metadata?.commentCount !== undefined && metadata.commentCount > 0 && (
            <span className="flex items-center gap-1">
              <MessageCircle className="h-3 w-3" />
              {metadata.commentCount}
            </span>
          )}
          {metadata?.deadline && metadata.deadline !== "종료됨" && (
            <span>{metadata.deadline}</span>
          )}
        </div>
        {hasPredicted && (
          <span className="rounded bg-violet-50 px-1.5 py-0.5 text-[10px] font-semibold text-violet-600 dark:bg-violet-950 dark:text-violet-400">예측완료</span>
        )}
        {hasVoted && canModify && onWithdrawVote && (
          <div className="flex items-center gap-2">
            <span className="text-amber-600 dark:text-amber-400">
              {formatRemainingTime(remainingTime)} 내 변경 가능
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-destructive hover:text-destructive"
              onClick={handleWithdraw}
            >
              <X className="h-3 w-3 mr-1" />
              철회
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
