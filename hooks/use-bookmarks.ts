"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"

export type Bookmark = {
  id: string
  question_id: string
  created_at: string
  questions: {
    id: string
    title: string
    option_a: string
    option_b: string
    status: string
    vote_count_a: number
    vote_count_b: number
    close_at: string | null
    published_at: string | null
  }
}

export function useBookmarks() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  // Get all bookmarks
  const {
    data: bookmarks = [],
    isLoading,
    error,
  } = useQuery<Bookmark[]>({
    queryKey: ['bookmarks'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const response = await fetch('/api/bookmarks')
      if (!response.ok) {
        throw new Error('Failed to fetch bookmarks')
      }
      const result = await response.json()
      return result.bookmarks || []
    },
  })

  // Check if a question is bookmarked
  const isBookmarked = (questionId: string): boolean => {
    return bookmarks.some(b => b.question_id === questionId)
  }

  // Toggle bookmark mutation
  const toggleBookmarkMutation = useMutation({
    mutationFn: async (questionId: string) => {
      const response = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ questionId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to toggle bookmark')
      }

      return response.json()
    },
    onMutate: async (questionId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['bookmarks'] })

      // Snapshot the previous value
      const previousBookmarks = queryClient.getQueryData<Bookmark[]>(['bookmarks'])

      // Optimistically update
      const isCurrentlyBookmarked = previousBookmarks?.some(b => b.question_id === questionId)

      if (isCurrentlyBookmarked) {
        // Remove bookmark optimistically
        queryClient.setQueryData<Bookmark[]>(['bookmarks'], (old = []) =>
          old.filter(b => b.question_id !== questionId)
        )
      } else {
        // Add placeholder bookmark (will be replaced with real data on success)
        queryClient.setQueryData<Bookmark[]>(['bookmarks'], (old = []) => [
          ...old,
          {
            id: 'temp-' + Date.now(),
            question_id: questionId,
            created_at: new Date().toISOString(),
            questions: {} as any, // Will be populated on refetch
          }
        ])
      }

      return { previousBookmarks }
    },
    onError: (err, questionId, context) => {
      // Rollback on error
      if (context?.previousBookmarks) {
        queryClient.setQueryData(['bookmarks'], context.previousBookmarks)
      }
    },
    onSuccess: () => {
      // Refetch to get accurate data
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
    },
  })

  const toggleBookmark = async (questionId: string) => {
    try {
      await toggleBookmarkMutation.mutateAsync(questionId)
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '책갈피 처리에 실패했습니다',
      }
    }
  }

  return {
    bookmarks,
    isLoading,
    error,
    isBookmarked,
    toggleBookmark,
    isTogglingBookmark: toggleBookmarkMutation.isPending,
  }
}
