"use client"

import { useEffect, useRef, useState } from "react"
import { Check, Coins, Star } from "lucide-react"
import type { VotePromptInfo } from "@/hooks/use-vote"

interface VoteToastProps {
  prompt: VotePromptInfo | null
  optionALabel?: string
  optionBLabel?: string
  onDone: () => void
}

export function VoteToast({ prompt, optionALabel = "A", optionBLabel = "B", onDone }: VoteToastProps) {
  const [visible, setVisible] = useState(false)
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  useEffect(() => {
    if (!prompt) return

    const enterTimer = setTimeout(() => setVisible(true), 50)
    const exitTimer = setTimeout(() => setVisible(false), 2500)
    const cleanupTimer = setTimeout(() => onDoneRef.current(), 3000)

    return () => {
      clearTimeout(enterTimer)
      clearTimeout(exitTimer)
      clearTimeout(cleanupTimer)
    }
  }, [prompt])

  if (!prompt) return null

  const isBonus = prompt.type === "early_bonus"

  return (
    <div
      className={`rounded-lg border bg-card px-4 py-3 shadow-sm transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
      }`}
    >
      {/* 투표 완료 + 기본 보너스 */}
      <div className="flex items-center gap-2">
        <Check className="h-4 w-4 text-green-500 shrink-0" />
        <span className="text-sm font-medium">투표 완료!</span>
        <span className="text-xs text-muted-foreground">+{prompt.votePoints}P</span>
      </div>

      {/* 초기 답변자 추가 보너스 */}
      {isBonus && (
        <div className="flex items-center gap-2 mt-1.5 ml-6">
          <Star className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
            초기 답변자 보너스 +{prompt.bonusPoints}P
          </span>
        </div>
      )}

      {/* 투표 경향 힌트 */}
      {!isBonus && prompt.trend && (
        <p className="text-xs text-muted-foreground mt-1.5 ml-6">
          {prompt.trend.majorityChoice === "balanced"
            ? "이전 10명의 선택이 황금밸런스!"
            : `이전 10명 중 과반이 ${
                prompt.trend.majorityChoice === "a" ? optionALabel : optionBLabel
              } 선택`}
        </p>
      )}
    </div>
  )
}
