"use client"

import { useInfiniteQuery, useQuery, keepPreviousData } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { getGuestActivity } from "@/lib/guest"
import type { Database } from "@/lib/supabase/types"

const PAGE_SIZE = 20

export type QuestionTab = 'live' | 'new' | 'closed' | 'legend'
export type QuestionSort = 'newest' | 'popular'

export interface QuestionFilters {
  search?: string
  category?: string
  tab?: QuestionTab
  sortBy?: QuestionSort
}

interface QuestionRow {
  id: string
  title: string
  category: string | null
  option_a: string
  option_b: string
  vote_count_a: number | null
  vote_count_b: number | null
  created_at: string | null
  close_at: string | null
  status: Database["public"]["Enums"]["question_status"] | null
  comment_count: number | null
  balance_type: Database["public"]["Enums"]["balance_type"] | null
}

export interface UserVoteRow {
  question_id: string
  choice: 'a' | 'b'
  created_at: string
}

interface QuestionsPage {
  questions: QuestionRow[]
  userVotes: Record<string, UserVoteRow>
  userPredictions: string[]
  nextCursor: number | null
}

async function fetchQuestions({
  pageParam = 0,
  filters,
}: {
  pageParam: number
  filters: QuestionFilters
}): Promise<QuestionsPage> {
  const supabase = createClient()
  
  const from = pageParam * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const tab = filters.tab || 'live'
  const now = new Date().toISOString()

  let query = supabase
    .from('questions')
    .select('id,title,category,option_a,option_b,vote_count_a,vote_count_b,created_at,close_at,status,comment_count,balance_type,published_at')

  if (tab === 'legend') {
    query = query.eq('status', 'legend')
  } else if (tab === 'closed') {
    query = query.eq('status', 'closed')
  } else {
    query = query.eq('status', 'published').lte('published_at', now)
    if (tab === 'live') {
      query = query.or(`close_at.is.null,close_at.gt.${now}`)
    } else if (tab === 'new') {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      query = query.gte('created_at', oneDayAgo)
    }
  }

  // Sort
  const sortBy = filters.sortBy || 'newest'
  if (sortBy === 'popular') {
    query = query.order('vote_count_a', { ascending: false }).order('vote_count_b', { ascending: false })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  query = query.range(from, to)

  if (filters.category && filters.category !== 'all') {
    query = query.eq('category', filters.category)
  }

  if (filters.search && filters.search.trim()) {
    query = query.ilike('title', `%${filters.search.trim()}%`)
  }

  // Run question query and session fetch in parallel
  const [queryResult, sessionResult] = await Promise.all([
    query,
    supabase.auth.getSession(),
  ])

  const { data, error } = queryResult

  if (error) {
    throw new Error(error.message)
  }

  // Fetch user votes and predictions
  const userVotesMap: Record<string, UserVoteRow> = {}
  const userPredictionIds: string[] = []
  const questionIds = (data || []).map(q => q.id)

  if (questionIds.length > 0) {
    const session = sessionResult.data.session
    if (session?.user) {
      const [votesResult, predictionsResult] = await Promise.all([
        supabase
          .from('votes')
          .select('question_id, choice, created_at')
          .eq('user_id', session.user.id)
          .in('question_id', questionIds),
        supabase
          .from('predictions')
          .select('question_id')
          .eq('user_id', session.user.id)
          .in('question_id', questionIds),
      ])

      if (votesResult.data) {
        votesResult.data.forEach(v => {
          userVotesMap[v.question_id] = {
            question_id: v.question_id,
            choice: v.choice,
            created_at: v.created_at!,
          }
        })
      }

      if (predictionsResult.data) {
        predictionsResult.data.forEach(p => {
          userPredictionIds.push(p.question_id)
        })
      }
    } else {
      // Guest: load from localStorage
      const guestActivity = getGuestActivity()
      const questionIdSet = new Set(questionIds)

      guestActivity.votes.forEach(v => {
        if (questionIdSet.has(v.questionId)) {
          userVotesMap[v.questionId] = {
            question_id: v.questionId,
            choice: v.choice,
            created_at: new Date(v.timestamp).toISOString(),
          }
        }
      })

      guestActivity.predictions.forEach(p => {
        if (questionIdSet.has(p.questionId)) {
          userPredictionIds.push(p.questionId)
        }
      })
    }
  }

  const hasMore = data && data.length === PAGE_SIZE
  const nextCursor = hasMore ? pageParam + 1 : null

  return {
    questions: data || [],
    userVotes: userVotesMap,
    userPredictions: userPredictionIds,
    nextCursor,
  }
}

export function useQuestions(filters: QuestionFilters = {}) {
  return useInfiniteQuery({
    queryKey: ['questions', filters],
    queryFn: ({ pageParam }) => fetchQuestions({ pageParam, filters }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  })
}

export function useQuestionCount(filters: QuestionFilters = {}) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['questionCount', filters],
    queryFn: async () => {
      const tab = filters.tab || 'live'
      const now = new Date().toISOString()

      let query = supabase
        .from('questions')
        .select('id', { count: 'exact', head: true })

      if (tab === 'legend') {
        query = query.eq('status', 'legend')
      } else if (tab === 'closed') {
        query = query.eq('status', 'closed')
      } else {
        query = query.eq('status', 'published').lte('published_at', now)
        if (tab === 'live') {
          query = query.or(`close_at.is.null,close_at.gt.${now}`)
        } else if (tab === 'new') {
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
          query = query.gte('created_at', oneDayAgo)
        }
      }

      if (filters.category && filters.category !== 'all') {
        query = query.eq('category', filters.category)
      }

      if (filters.search && filters.search.trim()) {
        query = query.ilike('title', `%${filters.search.trim()}%`)
      }

      const { count, error } = await query
      if (error) throw new Error(error.message)
      return count || 0
    },
    staleTime: 30 * 1000,
  })
}

export function useCategories() {
  const supabase = createClient()
  
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('questions')
        .select('category')
        .eq('status', 'published')
        .not('category', 'is', null)
        .limit(1000)
      
      if (error) throw new Error(error.message)
      
      const categories = [...new Set(data?.map(q => q.category).filter(Boolean))] as string[]
      return categories.sort()
    },
    staleTime: 5 * 60 * 1000,
  })
}
