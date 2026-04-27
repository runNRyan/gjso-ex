"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Coins, Vote, Trophy } from "lucide-react"
import { EmptyState } from "@/components/empty-state"
import type { Database } from "@/lib/supabase/types"

type PointType = Database["public"]["Enums"]["point_type"]

type PointHistoryRow = {
  id: string
  amount: number
  type: PointType
  reference_id: string | null
  created_at: string | null
}

type QuestionInfo = {
  id: string
  title: string
}

const TYPE_CONFIG: Record<PointType, { label: string; icon: typeof Coins; color: string }> = {
  vote_bonus: {
    label: "투표 보너스",
    icon: Vote,
    color: "text-blue-600 dark:text-blue-400",
  },
  prediction_reward: {
    label: "예측 적중 보상",
    icon: Trophy,
    color: "text-amber-600 dark:text-amber-400",
  },
}

function getTypeConfig(type: PointType) {
  return TYPE_CONFIG[type]
}

export function PointHistory({ userId }: { userId: string }) {
  const [history, setHistory] = useState<PointHistoryRow[]>([])
  const [questions, setQuestions] = useState<Record<string, QuestionInfo>>({})
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchHistory() {
      const { data: historyData } = await supabase
        .from("point_history")
        .select("id, amount, type, reference_id, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50)

      if (!historyData || historyData.length === 0) {
        setLoading(false)
        return
      }

      setHistory(historyData)

      const refIds = historyData
        .map((h) => h.reference_id)
        .filter((id): id is string => id !== null)
      const uniqueRefIds = [...new Set(refIds)]

      if (uniqueRefIds.length > 0) {
        const { data: questionData } = await supabase
          .from("questions")
          .select("id, title")
          .in("id", uniqueRefIds)

        if (questionData) {
          const map: Record<string, QuestionInfo> = {}
          questionData.forEach((q) => {
            map[q.id] = q
          })
          setQuestions(map)
        }
      }

      setLoading(false)
    }

    fetchHistory()
  }, [userId, supabase])

  if (loading) {
    return <p className="text-muted-foreground text-sm">로딩 중...</p>
  }

  if (history.length === 0) {
    return (
      <EmptyState
        icon={Coins}
        title="아직 포인트 내역이 없습니다"
        action={{ label: "투표하러 가기", href: "/" }}
      />
    )
  }

  return (
    <div className="space-y-3">
      {history.map((item) => {
        const config = getTypeConfig(item.type)
        const Icon = config.icon
        const question = item.reference_id ? questions[item.reference_id] : null

        const content = (
          <div className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
            <div className={`shrink-0 ${config.color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-sm">{config.label}</span>
                <span className="font-semibold text-sm text-green-600 dark:text-green-400 whitespace-nowrap">
                  +{item.amount}P
                </span>
              </div>
              {question && (
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {question.title}
                </p>
              )}
              {item.created_at && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(item.created_at).toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}
            </div>
          </div>
        )

        if (question) {
          return (
            <Link key={item.id} href={`/questions/${question.id}`}>
              {content}
            </Link>
          )
        }

        return <div key={item.id}>{content}</div>
      })}
    </div>
  )
}
