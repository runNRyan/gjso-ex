'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Vote, Prediction, PointEntry } from '@/components/results/mock-data'

interface ResultsData {
  votes: Vote[]
  predictions: Prediction[]
  points: PointEntry[]
  pointBalance: number
}

async function fetchResults(): Promise<ResultsData> {
  const supabase = createClient()

  const { data: session } = await supabase.auth.getSession()
  const userId = session.session?.user?.id
  if (!userId) {
    return { votes: [], predictions: [], points: [], pointBalance: 0 }
  }

  // Fetch user's votes, predictions, and point history in parallel
  const [votesResult, predsResult, pointsResult, profileResult] = await Promise.all([
    supabase
      .from('votes')
      .select('id, question_id, choice, created_at, questions!inner(id, title, option_a, option_b, vote_count_a, vote_count_b, status, close_at, closed_at, category)')
      .eq('user_id', userId),
    supabase
      .from('predictions')
      .select('id, question_id, prediction, is_correct, reward_points, created_at, questions!inner(id, title, vote_count_a, vote_count_b, status, closed_at)')
      .eq('user_id', userId),
    supabase
      .from('point_history')
      .select('id, amount, type, reference_id, created_at, questions:reference_id(title)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('point_balance')
      .eq('id', userId)
      .single(),
  ])

  // Transform votes
  const votes: Vote[] = (votesResult.data || []).map((v: any) => {
    const q = v.questions
    const isClosed = q.status === 'closed'
    return {
      id: v.id,
      questionId: v.question_id,
      question: q.title,
      optionA: q.option_a,
      optionB: q.option_b,
      myChoice: v.choice.toUpperCase() as 'A' | 'B',
      resultA: q.vote_count_a ?? 0,
      resultB: q.vote_count_b ?? 0,
      status: isClosed ? 'closed' as const : 'live' as const,
      closedAt: q.closed_at?.split('T')[0] ?? '',
      closeAt: q.close_at ?? null,
      category: q.category ?? '기타',
      isNew: false,
      voteCreatedAt: v.created_at,
    }
  }).sort((a: Vote, b: Vote) => {
    // Live votes first, then by date descending
    if (a.status !== b.status) return a.status === 'live' ? -1 : 1
    return b.closedAt.localeCompare(a.closedAt) || b.voteCreatedAt.localeCompare(a.voteCreatedAt)
  })

  // Transform predictions
  const predictions: Prediction[] = (predsResult.data || []).map((p: any) => {
    const q = p.questions
    const countA = q.vote_count_a ?? 0
    const countB = q.vote_count_b ?? 0
    const majorityChoice = countA >= countB ? 'A' : 'B'
    const isClosed = q.status === 'closed'
    return {
      id: p.id,
      questionId: p.question_id,
      question: q.title,
      optionA: q.option_a,
      optionB: q.option_b,
      myPrediction: p.prediction.toUpperCase() as 'A' | 'B',
      resultA: countA,
      resultB: countB,
      majorityChoice: majorityChoice as 'A' | 'B',
      isCorrect: isClosed ? (p.is_correct ?? false) : false,
      status: isClosed ? 'closed' as const : 'live' as const,
      closedAt: q.closed_at?.split('T')[0] ?? '',
      isNew: false,
    }
  }).sort((a: Prediction, b: Prediction) => {
    if (a.status !== b.status) return a.status === 'live' ? -1 : 1
    return b.closedAt.localeCompare(a.closedAt)
  })

  // Transform points
  // Count vote_bonus per question to distinguish base vs early bonus
  const voteBonusCounts = new Map<string, number>()
  for (const p of pointsResult.data || []) {
    if (p.type === 'vote_bonus' && p.reference_id) {
      voteBonusCounts.set(p.reference_id, (voteBonusCounts.get(p.reference_id) ?? 0) + 1)
    }
  }
  const seenVoteBonus = new Set<string>()
  const points: PointEntry[] = (pointsResult.data || []).map((p: any) => {
    const qTitle = p.questions?.title ?? ''
    let type: 'vote' | 'predict' | 'bonus'
    let desc: string
    if (p.type === 'vote_bonus') {
      const key = p.reference_id ?? p.id
      const hasEarlyBonus = (voteBonusCounts.get(key) ?? 0) >= 2
      if (hasEarlyBonus && !seenVoteBonus.has(key)) {
        seenVoteBonus.add(key)
        type = 'vote'
        desc = '선착순 보너스'
      } else {
        seenVoteBonus.add(key)
        type = 'vote'
        desc = '투표 참여'
      }
    } else if (p.amount >= 50) {
      type = 'bonus'
      desc = '예측 적중'
    } else {
      type = 'predict'
      desc = '예측 참여'
    }
    return {
      id: p.id,
      date: p.created_at?.split('T')[0] ?? '',
      type,
      question: qTitle,
      points: p.amount,
      desc,
    }
  })

  const pointBalance = profileResult.data?.point_balance ?? 0

  return { votes, predictions, points, pointBalance }
}

export function useResults() {
  return useQuery({
    queryKey: ['results'],
    queryFn: fetchResults,
    staleTime: 30 * 1000,
  })
}
