"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { usePrediction, type PredictionChoice, type PredictionInfo } from "@/hooks/use-prediction"
import type { VotePromptInfo } from "@/hooks/use-vote"
import { Target, Trophy, Sparkles, Lock, Check, AlertTriangle, Info, Coins, Star } from "lucide-react"
import { trackEvent } from "@/lib/analytics"

interface PredictionSectionProps {
  questionId: string
  hasVoted: boolean
  isLoggedIn: boolean
  optionALabel: string
  optionBLabel: string
  isClosed?: boolean
  votePrompt?: VotePromptInfo
  onPredictionSubmitted?: () => void
}

const PREDICTION_OPTIONS: { value: PredictionChoice; icon: typeof Target }[] = [
  { value: 'a', icon: Target },
  { value: 'golden', icon: Sparkles },
  { value: 'b', icon: Target },
]

function getPredictionLabel(prediction: PredictionChoice, optionALabel: string, optionBLabel: string): string {
  switch (prediction) {
    case 'a': return `A. ${optionALabel}`
    case 'b': return `B. ${optionBLabel}`
    case 'golden': return '황금밸런스 (50:50)'
  }
}

function getPredictionResultMessage(info: PredictionInfo): string | null {
  if (info.is_correct === null) return null
  if (info.is_correct) return `적중! +${info.reward_points ?? 0}P`
  return '아쉽게 빗나갔어요'
}

export function PredictionSection({
  questionId,
  hasVoted,
  isLoggedIn,
  optionALabel,
  optionBLabel,
  isClosed = false,
  votePrompt,
  onPredictionSubmitted,
}: PredictionSectionProps) {
  const { submitPrediction, getPrediction, isLoading } = usePrediction()
  const [userPrediction, setUserPrediction] = useState<PredictionInfo | null>(null)
  const [selected, setSelected] = useState<PredictionChoice | null>(null)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showInfo, setShowInfo] = useState(false)

  useEffect(() => {
    if (!hasVoted) {
      setFetchLoading(false)
      return
    }

    async function fetchPrediction() {
      try {
        const prediction = await getPrediction(questionId)
        setUserPrediction(prediction)
      } finally {
        setFetchLoading(false)
      }
    }

    fetchPrediction()
  }, [questionId, hasVoted, getPrediction])

  const handleSubmitClick = () => {
    if (!selected || isLoading) return
    setShowConfirm(true)
  }

  const handleConfirm = async () => {
    if (!selected || isLoading) return
    setShowConfirm(false)
    setError(null)

    const result = await submitPrediction(questionId, selected)
    if (result.success) {
      const prediction = await getPrediction(questionId)
      setUserPrediction(prediction)
      setSelected(null)
      onPredictionSubmitted?.()

      // Track prediction submission event
      trackEvent('prediction_submit', { question_id: questionId, prediction: selected })
    } else {
      setError(result.error ?? '예측 제출에 실패했습니다')
    }
  }

  const handleCancel = () => {
    setShowConfirm(false)
  }

  // Removed isLoggedIn gate - guests can now predict too

  if (!hasVoted) {
    return (
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Target className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">결과 예측</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          투표를 먼저 해주세요! 투표 후에 결과를 예측할 수 있습니다.
        </p>
      </div>
    )
  }

  if (fetchLoading) {
    return (
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Target className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">결과 예측</h2>
        </div>
        <p className="text-sm text-muted-foreground">로딩 중...</p>
      </div>
    )
  }

  if (userPrediction) {
    const isCorrect = userPrediction.is_correct
    const resultMessage = getPredictionResultMessage(userPrediction)

    return (
      <div className={cn(
        "rounded-xl border bg-card p-6 shadow-sm",
        isCorrect === true && "border-green-500/50 bg-green-50 dark:bg-green-950/20",
        isCorrect === false && "border-red-500/50 bg-red-50 dark:bg-red-950/20",
      )}>
        <div className="flex items-center gap-2 mb-4">
          {isCorrect === true ? (
            <Trophy className="h-5 w-5 text-green-500" />
          ) : (
            <Target className="h-5 w-5 text-primary" />
          )}
          <h2 className="text-lg font-semibold">내 예측</h2>
        </div>

        <div className={cn(
          "rounded-lg border p-4",
          isCorrect === true && "border-green-500/30 bg-green-100/50 dark:bg-green-900/20",
          isCorrect === false && "border-red-500/30 bg-red-100/50 dark:bg-red-900/20",
          isCorrect === null && "border-primary/30 bg-primary/5",
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span className="font-medium">
                {getPredictionLabel(userPrediction.prediction, optionALabel, optionBLabel)}
              </span>
            </div>
            {resultMessage && (
              <span className={cn(
                "text-sm font-medium px-2 py-1 rounded-md",
                isCorrect === true && "text-green-700 bg-green-200 dark:text-green-300 dark:bg-green-800/50",
                isCorrect === false && "text-red-700 bg-red-200 dark:text-red-300 dark:bg-red-800/50",
              )}>
                {resultMessage}
              </span>
            )}
          </div>
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          예측은 변경할 수 없습니다. 마감 후 결과가 확정됩니다.
        </p>
      </div>
    )
  }

  if (isClosed) {
    return (
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Target className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">결과 예측</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          이 질문은 이미 마감되었습니다.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      {votePrompt && (
        <div className="flex items-center gap-2 mb-3 text-sm text-green-600 dark:text-green-400">
          <Check className="h-4 w-4 shrink-0" />
          <span className="font-medium">투표 완료! +{votePrompt.votePoints}P</span>
          {votePrompt.type === 'early_bonus' && votePrompt.bonusPoints && (
            <>
              <Star className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                초기 답변자 보너스 +{votePrompt.bonusPoints}P
              </span>
            </>
          )}
          {votePrompt.type === 'trend_hint' && votePrompt.trend && (
            <span className="text-xs text-muted-foreground">
              · 이전 10명 중 과반이 {votePrompt.trend.majorityChoice === 'balanced' ? '황금밸런스!' : `${votePrompt.trend.majorityChoice === 'a' ? optionALabel : optionBLabel} 선택`}
            </span>
          )}
        </div>
      )}
      <div className="flex items-center gap-2 mb-4">
        <Target className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">결과 예측</h2>
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="설명 보기"
        >
          <Info className="h-4 w-4" />
        </button>
      </div>

      {showInfo && (
        <p className="text-sm text-muted-foreground mb-4 animate-in fade-in slide-in-from-top-2 duration-200">
          최종 결과를 예측하세요! 적중 시 포인트를 획득합니다.
          <br></br>
          “황금밸런스”: 투표 결과가 50:50 ~ 60:40 인 초접전 선택
        </p>
      )}

      <div className="grid grid-cols-3 gap-2">
        {PREDICTION_OPTIONS.map(({ value, icon: Icon }) => {
          const isSelected = selected === value
          const label = value === 'a' ? 'A 승리' : value === 'b' ? 'B 승리' : '황금밸런스'
          const points = value === 'golden' ? '+1,000P' : '+100P'

          return (
            <button
              key={value}
              onClick={() => setSelected(value)}
              disabled={isLoading}
              className={cn(
                "rounded-lg border p-3 text-center transition-all hover:scale-[1.02]",
                "flex flex-col items-center justify-center gap-1.5",
                isSelected
                  ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                  : "hover:border-primary/50 hover:shadow-sm",
                value === 'golden' && !isSelected && "border-amber-300/50 bg-amber-50/50 dark:bg-amber-950/10",
                value === 'golden' && isSelected && "border-amber-500 ring-amber-500/20 bg-amber-50 dark:bg-amber-950/20",
              )}
            >
              <Icon className={cn(
                "h-5 w-5",
                value === 'golden' ? "text-amber-500" : "text-muted-foreground",
                isSelected && value !== 'golden' && "text-primary",
              )} />
              <span className={cn(
                "text-sm font-medium",
                value === 'golden' && "text-amber-700 dark:text-amber-400",
              )}>
                {label}
              </span>
              <span className={cn(
                "text-xs",
                value === 'golden' ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground",
              )}>
                {points}
              </span>
            </button>
          )
        })}
      </div>

      {error && (
        <p className="mt-3 text-sm text-destructive">{error}</p>
      )}

      {showConfirm ? (
        <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30 p-4 space-y-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              예측을 제출하면 투표와 예측 모두 변경할 수 없습니다. 제출하시겠습니까?
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className="flex-1 rounded-lg py-2.5 font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer"
            >
              {isLoading ? '제출 중...' : '확인'}
            </button>
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="flex-1 rounded-lg py-2.5 font-semibold border bg-card hover:bg-muted transition-all cursor-pointer"
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={handleSubmitClick}
          disabled={!selected || isLoading}
          className={cn(
            "mt-4 w-full rounded-lg py-3 font-semibold transition-all",
            selected
              ? "bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
              : "bg-muted text-muted-foreground cursor-not-allowed",
          )}
        >
          {isLoading ? '제출 중...' : '예측 제출하기'}
        </button>
      )}
    </div>
  )
}
