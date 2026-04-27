"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Vote, Target, TrendingUp, Coins } from "lucide-react"

type ActivityStats = {
  totalVotes: number
  totalPredictions: number
  correctPredictions: number
  totalPointsEarned: number
}

export function ActivitySummary({ userId }: { userId: string }) {
  const [stats, setStats] = useState<ActivityStats>({
    totalVotes: 0,
    totalPredictions: 0,
    correctPredictions: 0,
    totalPointsEarned: 0,
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchStats() {
      const [votesResult, predictionsResult, correctPredictionsResult, pointsResult] =
        await Promise.all([
          supabase
            .from("votes")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId),
          supabase
            .from("predictions")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId),
          supabase
            .from("predictions")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("is_correct", true),
          supabase
            .from("point_history")
            .select("amount")
            .eq("user_id", userId),
        ])

      const totalVotes = votesResult.count || 0
      const totalPredictions = predictionsResult.count || 0
      const correctPredictions = correctPredictionsResult.count || 0
      const totalPointsEarned = pointsResult.data
        ? pointsResult.data.reduce((sum, row) => sum + (row.amount || 0), 0)
        : 0

      setStats({
        totalVotes,
        totalPredictions,
        correctPredictions,
        totalPointsEarned,
      })
      setLoading(false)
    }

    fetchStats()
  }, [userId, supabase])

  if (loading) {
    return <p className="text-muted-foreground text-sm">로딩 중...</p>
  }

  const predictionAccuracy =
    stats.totalPredictions > 0
      ? Math.round((stats.correctPredictions / stats.totalPredictions) * 100)
      : 0

  const statCards = [
    {
      label: "총 투표수",
      value: stats.totalVotes.toLocaleString(),
      icon: Vote,
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "총 예측수",
      value: stats.totalPredictions.toLocaleString(),
      icon: Target,
      color: "text-purple-600 dark:text-purple-400",
    },
    {
      label: "예측 적중률",
      value: `${predictionAccuracy}%`,
      icon: TrendingUp,
      color: "text-green-600 dark:text-green-400",
    },
    {
      label: "획득 포인트",
      value: `${stats.totalPointsEarned.toLocaleString()}P`,
      icon: Coins,
      color: "text-amber-600 dark:text-amber-400",
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statCards.map((card) => {
        const Icon = card.icon
        return (
          <div
            key={card.label}
            className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`h-5 w-5 ${card.color}`} />
              <span className="text-xs text-muted-foreground">{card.label}</span>
            </div>
            <div className="text-2xl font-bold">{card.value}</div>
          </div>
        )
      })}
    </div>
  )
}
