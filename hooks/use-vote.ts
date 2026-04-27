"use client"

import { useState, useCallback } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { VOTE_CHANGE_WINDOW_MS } from "@/lib/utils"
import { trackEvent } from "@/lib/analytics"
import { hasGuestVoted, getGuestVoteChoice } from "@/lib/guest"
import { useGuestActivityStore } from "@/store/guest-activity-store"
import { toast } from "sonner"

export type VoteInfo = {
  id: string
  choice: 'a' | 'b'
  created_at: string
  canModify: boolean
  remainingTime: number
}

export type VotePromptInfo = {
  type: 'early_bonus' | 'trend_hint'
  /** 기본 투표 보너스 (모든 투표자) */
  votePoints: number
  /** 첫 20명 추가 보너스 */
  bonusPoints?: number
  /** 21명+ 이전 10명 투표 경향 */
  trend?: {
    majorityChoice: 'a' | 'b' | 'balanced'
    aCount: number
    bCount: number
  }
}

export function useVote() {
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()
  const queryClient = useQueryClient()
  const guestStore = useGuestActivityStore()

  const calculateCanModify = (createdAt: string): { canModify: boolean; remainingTime: number } => {
    const voteTime = new Date(createdAt).getTime()
    const now = Date.now()
    const elapsed = now - voteTime
    const remaining = VOTE_CHANGE_WINDOW_MS - elapsed
    return {
      canModify: remaining > 0,
      remainingTime: Math.max(0, remaining),
    }
  }

  const getVoteInfo = useCallback(async (questionId: string, userId: string): Promise<VoteInfo | null> => {
    const { data, error } = await supabase
      .from('votes')
      .select('id, choice, created_at')
      .eq('question_id', questionId)
      .eq('user_id', userId)
      .maybeSingle()

    if (error || !data) return null

    const { canModify, remainingTime } = calculateCanModify(data.created_at!)
    return {
      id: data.id,
      choice: data.choice,
      created_at: data.created_at!,
      canModify,
      remainingTime,
    }
  }, [supabase])

  const getVotePromptInfo = useCallback(async (
    questionId: string,
  ): Promise<VotePromptInfo | null> => {
    const { count } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('question_id', questionId)

    const votePosition = count ?? 0

    if (votePosition <= 20) {
      return { type: 'early_bonus', votePoints: 10, bonusPoints: 10 }
    }

    const { data: recentVotes } = await supabase
      .from('votes')
      .select('choice')
      .eq('question_id', questionId)
      .order('created_at', { ascending: false })
      .range(1, 10)

    if (!recentVotes || recentVotes.length === 0) return null

    const aCount = recentVotes.filter(v => v.choice === 'a').length
    const bCount = recentVotes.filter(v => v.choice === 'b').length

    let majorityChoice: 'a' | 'b' | 'balanced'
    if (aCount > bCount) majorityChoice = 'a'
    else if (bCount > aCount) majorityChoice = 'b'
    else majorityChoice = 'balanced'

    return {
      type: 'trend_hint',
      votePoints: 10,
      trend: { majorityChoice, aCount, bCount },
    }
  }, [supabase])

  const vote = useCallback(async (
    questionId: string,
    choice: 'a' | 'b'
  ): Promise<{ success: boolean; error?: string; prompt?: VotePromptInfo | null }> => {
    setIsLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user ?? null

      // Guest vote path: save to localStorage
      if (!user) {
        if (hasGuestVoted(questionId)) {
          return { success: false, error: '이미 투표했습니다' }
        }
        guestStore.recordVote(questionId, choice)
        trackEvent('vote_submit', { question_id: questionId, choice })
        toast("가입하면 +10P 받을 수 있어요!")
        return { success: true, prompt: null }
      }

      const existingVote = await getVoteInfo(questionId, user.id)
      if (existingVote) {
        return { success: false, error: '이미 투표했습니다' }
      }

      const { error } = await supabase
        .from('votes')
        .insert({
          question_id: questionId,
          user_id: user.id,
          choice,
        })

      if (error) {
        return { success: false, error: error.message }
      }

      // Track vote submission event
      trackEvent('vote_submit', { question_id: questionId, choice })

      queryClient.setQueriesData({ queryKey: ['questions'] }, (oldData: any) => {
        if (!oldData?.pages) return oldData

        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            userVotes: {
              ...page.userVotes,
              ...(page.questions.some((q: any) => q.id === questionId)
                ? { [questionId]: { question_id: questionId, choice, created_at: new Date().toISOString() } }
                : {}),
            },
            questions: page.questions.map((q: any) => {
              if (q.id === questionId) {
                return {
                  ...q,
                  [choice === 'a' ? 'vote_count_a' : 'vote_count_b']:
                    (q[choice === 'a' ? 'vote_count_a' : 'vote_count_b'] || 0) + 1
                }
              }
              return q
            })
          }))
        }
      })

      const prompt = await getVotePromptInfo(questionId)
      return { success: true, prompt }
    } finally {
      setIsLoading(false)
    }
  }, [supabase, getVoteInfo, getVotePromptInfo, queryClient])

  const changeVote = useCallback(async (
    questionId: string,
    newChoice: 'a' | 'b'
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user ?? null

      // Guest change vote path
      if (!user) {
        const currentChoice = getGuestVoteChoice(questionId)
        if (!currentChoice) return { success: false, error: '투표 기록이 없습니다' }
        if (currentChoice === newChoice) return { success: false, error: '같은 선택입니다' }
        guestStore.changeVote(questionId, newChoice)
        return { success: true }
      }

      const existingVote = await getVoteInfo(questionId, user.id)
      if (!existingVote) {
        return { success: false, error: '투표 기록이 없습니다' }
      }

      if (!existingVote.canModify) {
        return { success: false, error: '변경 가능 시간(1분)이 지났습니다' }
      }

      if (existingVote.choice === newChoice) {
        return { success: false, error: '같은 선택입니다' }
      }

      const { error } = await supabase
        .from('votes')
        .update({ choice: newChoice })
        .eq('id', existingVote.id)

      if (error) {
        return { success: false, error: error.message }
      }

      // 낙관적 업데이트: 모든 questions 쿼리에서 기존 선택 -1, 새 선택 +1
      queryClient.setQueriesData({ queryKey: ['questions'] }, (oldData: any) => {
        if (!oldData?.pages) return oldData

        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            userVotes: {
              ...page.userVotes,
              ...(page.userVotes?.[questionId]
                ? { [questionId]: { ...page.userVotes[questionId], choice: newChoice } }
                : {}),
            },
            questions: page.questions.map((q: any) => {
              if (q.id === questionId) {
                const oldField = existingVote.choice === 'a' ? 'vote_count_a' : 'vote_count_b'
                const newField = newChoice === 'a' ? 'vote_count_a' : 'vote_count_b'
                return {
                  ...q,
                  [oldField]: Math.max(0, (q[oldField] || 0) - 1),
                  [newField]: (q[newField] || 0) + 1
                }
              }
              return q
            })
          }))
        }
      })

      return { success: true }
    } finally {
      setIsLoading(false)
    }
  }, [supabase, getVoteInfo, queryClient])

  const withdrawVote = useCallback(async (
    questionId: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user ?? null

      // Guest withdraw vote path
      if (!user) {
        if (!hasGuestVoted(questionId)) return { success: false, error: '투표 기록이 없습니다' }
        guestStore.withdrawVote(questionId)
        return { success: true }
      }

      const existingVote = await getVoteInfo(questionId, user.id)
      if (!existingVote) {
        return { success: false, error: '투표 기록이 없습니다' }
      }

      if (!existingVote.canModify) {
        return { success: false, error: '철회 가능 시간(1분)이 지났습니다' }
      }

      const { error } = await supabase
        .from('votes')
        .delete()
        .eq('id', existingVote.id)

      if (error) {
        return { success: false, error: error.message }
      }

      // 낙관적 업데이트: 모든 questions 쿼리에서 기존 선택 -1
      queryClient.setQueriesData({ queryKey: ['questions'] }, (oldData: any) => {
        if (!oldData?.pages) return oldData

        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            userVotes: Object.fromEntries(
              Object.entries(page.userVotes || {}).filter(([key]) => key !== questionId)
            ),
            questions: page.questions.map((q: any) => {
              if (q.id === questionId) {
                const field = existingVote.choice === 'a' ? 'vote_count_a' : 'vote_count_b'
                return {
                  ...q,
                  [field]: Math.max(0, (q[field] || 0) - 1)
                }
              }
              return q
            })
          }))
        }
      })

      return { success: true }
    } finally {
      setIsLoading(false)
    }
  }, [supabase, getVoteInfo, queryClient])

  return {
    vote,
    changeVote,
    withdrawVote,
    getVoteInfo,
    isLoading,
    calculateCanModify,
  }
}
