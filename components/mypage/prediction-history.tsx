"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Target, Check, X, Clock } from "lucide-react"
import { EmptyState } from "@/components/empty-state"

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

export function PredictionHistory({ userId }: { userId: string }) {
  const [predictions, setPredictions] = useState<PredictionWithQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchPredictions() {
      const { data } = await supabase
        .from("predictions")
        .select(`
          id,
          prediction,
          is_correct,
          reward_points,
          created_at,
          question:questions (
            id,
            title,
            option_a,
            option_b,
            status,
            balance_type
          )
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20)

      if (data) {
        setPredictions(data as PredictionWithQuestion[])
      }
      setLoading(false)
    }

    fetchPredictions()
  }, [userId, supabase])

  if (loading) {
    return <p className="text-muted-foreground text-sm">로딩 중...</p>
  }

  if (predictions.length === 0) {
    return (
      <EmptyState
        icon={Target}
        title="아직 예측 내역이 없습니다"
        action={{ label: "투표하러 가기", href: "/" }}
      />
    )
  }

  return (
    <div className="space-y-3">
      {predictions.map((pred) => {
        const question = pred.question
        if (!question) return null

        let predictionLabel = ""
        if (pred.prediction === "a") {
          predictionLabel = `A 승리 (${question.option_a})`
        } else if (pred.prediction === "b") {
          predictionLabel = `B 승리 (${question.option_b})`
        } else if (pred.prediction === "golden") {
          predictionLabel = "황금밸런스"
        }

        let resultBadge = null
        if (question.status === "closed") {
          if (pred.is_correct === true) {
            resultBadge = (
              <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <Check className="h-4 w-4" />
                <span className="text-sm font-semibold">
                  적중! +{pred.reward_points || 0}P
                </span>
              </div>
            )
          } else if (pred.is_correct === false) {
            resultBadge = (
              <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                <X className="h-4 w-4" />
                <span className="text-sm font-medium">미적중</span>
              </div>
            )
          }
        } else {
          resultBadge = (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-sm">대기 중</span>
            </div>
          )
        }

        return (
          <Link key={pred.id} href={`/questions/${question.id}`}>
            <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{question.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm text-muted-foreground">
                      내 예측: <span className="font-medium text-foreground">{predictionLabel}</span>
                    </span>
                  </div>
                  <div className="mt-2">{resultBadge}</div>
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(pred.created_at).toLocaleDateString("ko-KR")}
                </div>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
