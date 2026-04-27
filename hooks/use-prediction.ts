"use client"

import { useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { hasGuestVoted, hasGuestPredicted, getGuestActivity } from "@/lib/guest"
import { useGuestActivityStore } from "@/store/guest-activity-store"
import { toast } from "sonner"

import type { Database } from "@/lib/supabase/types"

export type PredictionChoice = Database["public"]["Enums"]["prediction_choice"]

export type PredictionInfo = {
  id: string
  prediction: PredictionChoice
  is_correct: boolean | null
  reward_points: number | null
  created_at: string
}

export function usePrediction() {
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()
  const guestStore = useGuestActivityStore()

  const getPrediction = useCallback(async (
    questionId: string
  ): Promise<PredictionInfo | null> => {
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user ?? null

    // Guest prediction lookup
    if (!user) {
      const activity = getGuestActivity()
      const guestPred = activity.predictions.find(p => p.questionId === questionId)
      if (!guestPred) return null
      return {
        id: `guest-${questionId}`,
        prediction: guestPred.predictionType,
        is_correct: null,
        reward_points: null,
        created_at: new Date(guestPred.timestamp).toISOString(),
      }
    }

    const { data, error } = await supabase
      .from('predictions')
      .select('id, prediction, is_correct, reward_points, created_at')
      .eq('question_id', questionId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (error || !data) return null

    return {
      id: data.id,
      prediction: data.prediction,
      is_correct: data.is_correct,
      reward_points: data.reward_points,
      created_at: data.created_at!,
    }
  }, [supabase])

  const submitPrediction = useCallback(async (
    questionId: string,
    prediction: PredictionChoice
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user ?? null

      // Guest prediction path
      if (!user) {
        if (hasGuestPredicted(questionId)) {
          return { success: false, error: '이미 예측을 제출했습니다. 예측은 변경할 수 없습니다.' }
        }
        if (!hasGuestVoted(questionId)) {
          return { success: false, error: '투표를 먼저 해주세요' }
        }
        guestStore.recordPrediction(questionId, prediction)
        toast("예측 완료! 가입하면 적중 시 최대 +1,000P!")
        return { success: true }
      }

      const existing = await getPrediction(questionId)
      if (existing) {
        return { success: false, error: '이미 예측을 제출했습니다. 예측은 변경할 수 없습니다.' }
      }

      const { data: voteData } = await supabase
        .from('votes')
        .select('id')
        .eq('question_id', questionId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (!voteData) {
        return { success: false, error: '투표를 먼저 해주세요' }
      }

      const { error } = await supabase
        .from('predictions')
        .insert({
          question_id: questionId,
          user_id: user.id,
          prediction,
        })

      if (error) {
        if (error.code === '23505') {
          return { success: false, error: '이미 예측을 제출했습니다' }
        }
        return { success: false, error: error.message }
      }

      return { success: true }
    } finally {
      setIsLoading(false)
    }
  }, [supabase, getPrediction])

  return {
    submitPrediction,
    getPrediction,
    isLoading,
  }
}
