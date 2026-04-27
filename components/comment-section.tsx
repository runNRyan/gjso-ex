"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Trash2, Edit2, Heart, MessageSquare, Send } from "lucide-react"
import { EmptyState } from "@/components/empty-state"
import { useMemberOnlyModalStore } from "@/components/member-only-modal"
import { formatDistanceToNow } from "date-fns"
import { ko } from "date-fns/locale"

interface Comment {
  id: string
  content: string
  created_at: string | null
  updated_at: string | null
  is_deleted: boolean | null
  user_id: string | null
  guest_nickname: string | null
  parent_id: string | null
  like_count: number | null
  user?: {
    nickname: string
  } | null
  replies?: Comment[]
}

type CommentSort = "newest" | "oldest" | "popular"

interface CommentSectionProps {
  questionId: string
}

export function CommentSection({ questionId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [likedCommentIds, setLikedCommentIds] = useState<Set<string>>(new Set())
  const [sortBy, setSortBy] = useState<CommentSort>("newest")
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set())
  const supabase = createClient()
  const openMemberOnly = useMemberOnlyModalStore((s) => s.open)

  useEffect(() => {
    getCurrentUser()
  }, [])

  useEffect(() => {
    fetchComments()
  }, [questionId, sortBy])

  async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUserId(user?.id || null)
    if (user) {
      fetchUserLikes(user.id)
    }
  }

  async function fetchUserLikes(userId: string) {
    const { data } = await supabase
      .from('comment_likes')
      .select('comment_id')
      .eq('user_id', userId)

    if (data) {
      setLikedCommentIds(new Set(data.map(d => d.comment_id)))
    }
  }

  function buildCommentTree(flatComments: Comment[]): Comment[] {
    const map = new Map<string, Comment>()
    const roots: Comment[] = []

    flatComments.forEach(c => {
      map.set(c.id, { ...c, replies: [] })
    })

    flatComments.forEach(c => {
      const comment = map.get(c.id)!
      if (c.parent_id && map.has(c.parent_id)) {
        map.get(c.parent_id)!.replies!.push(comment)
      } else {
        roots.push(comment)
      }
    })

    // Sort replies by created_at ascending always
    map.forEach(c => {
      c.replies?.sort((a, b) => {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0
        return aTime - bTime
      })
    })

    return roots
  }

  async function fetchComments() {
    try {
      let orderColumn = 'created_at'
      let ascending = false

      if (sortBy === 'oldest') {
        orderColumn = 'created_at'
        ascending = true
      } else if (sortBy === 'popular') {
        orderColumn = 'like_count'
        ascending = false
      }

      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          user:user_id (
            nickname
          )
        `)
        .eq('question_id', questionId)
        .order(orderColumn, { ascending })
        .limit(100)

      if (error) {
        console.error('Error fetching comments:', error)
        return
      }

      const tree = buildCommentTree(data || [])
      setComments(tree)
    } catch (error) {
      console.error('Error loading comments:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!newComment.trim()) return
    setSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        openMemberOnly('댓글은 회원만 작성할 수 있어요. 가입하고 포인트도 받으세요!')
        return
      }

      const { error } = await supabase
        .from('comments')
        .insert({
          question_id: questionId,
          user_id: user.id,
          content: newComment.trim(),
        })

      if (error) {
        console.error('Error creating comment:', error)
        alert('댓글 작성에 실패했습니다')
        return
      }

      setNewComment("")
      await fetchComments()
    } catch (error) {
      console.error('Error submitting comment:', error)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleReplySubmit(parentId: string) {
    if (!replyContent.trim()) return
    setSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        openMemberOnly('답글은 회원만 작성할 수 있어요. 가입하고 포인트도 받으세요!')
        return
      }

      const { error } = await supabase
        .from('comments')
        .insert({
          question_id: questionId,
          user_id: user.id,
          content: replyContent.trim(),
          parent_id: parentId,
        })

      if (error) {
        console.error('Error creating reply:', error)
        alert('답글 작성에 실패했습니다')
        return
      }

      setReplyingTo(null)
      setReplyContent("")
      await fetchComments()
    } catch (error) {
      console.error('Error submitting reply:', error)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleEdit(commentId: string) {
    if (!editContent.trim()) return

    try {
      const { error } = await supabase
        .from('comments')
        .update({
          content: editContent.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', commentId)

      if (error) {
        console.error('Error updating comment:', error)
        alert('댓글 수정에 실패했습니다')
        return
      }

      setEditingId(null)
      setEditContent("")
      await fetchComments()
    } catch (error) {
      console.error('Error editing comment:', error)
    }
  }

  async function handleDelete(commentId: string) {
    if (!confirm('댓글을 삭제하시겠습니까?')) return

    try {
      const { error } = await supabase
        .from('comments')
        .update({
          is_deleted: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', commentId)

      if (error) {
        console.error('Error deleting comment:', error)
        alert('댓글 삭제에 실패했습니다')
        return
      }

      await fetchComments()
    } catch (error) {
      console.error('Error deleting comment:', error)
    }
  }

  async function handleToggleLike(commentId: string) {
    if (!currentUserId) {
      openMemberOnly('좋아요는 회원만 누를 수 있어요. 가입하고 포인트도 받으세요!')
      return
    }

    const isLiked = likedCommentIds.has(commentId)

    // Optimistic update
    setLikedCommentIds(prev => {
      const next = new Set(prev)
      if (isLiked) {
        next.delete(commentId)
      } else {
        next.add(commentId)
      }
      return next
    })

    // Optimistic count update
    setComments(prev => updateLikeCount(prev, commentId, isLiked ? -1 : 1))

    try {
      if (isLiked) {
        const { error } = await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', currentUserId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('comment_likes')
          .insert({
            comment_id: commentId,
            user_id: currentUserId,
          })

        if (error) throw error
      }
    } catch (error) {
      // Rollback optimistic update
      setLikedCommentIds(prev => {
        const next = new Set(prev)
        if (isLiked) {
          next.add(commentId)
        } else {
          next.delete(commentId)
        }
        return next
      })
      setComments(prev => updateLikeCount(prev, commentId, isLiked ? 1 : -1))
      console.error('Error toggling like:', error)
    }
  }

  function updateLikeCount(comments: Comment[], commentId: string, delta: number): Comment[] {
    let found = false
    const result = comments.map(c => {
      if (found) return c
      if (c.id === commentId) {
        found = true
        return { ...c, like_count: (c.like_count || 0) + delta }
      }
      if (c.replies && c.replies.length > 0) {
        const updatedReplies = updateLikeCount(c.replies, commentId, delta)
        if (updatedReplies !== c.replies) {
          found = true
          return { ...c, replies: updatedReplies }
        }
      }
      return c
    })
    return found ? result : comments
  }

  function startEdit(comment: Comment) {
    setEditingId(comment.id)
    setEditContent(comment.content)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditContent("")
  }

  function countAllComments(comments: Comment[]): number {
    return comments.reduce((acc, c) => {
      if (c.is_deleted) return acc
      return acc + 1 + (c.replies ? countAllComments(c.replies) : 0)
    }, 0)
  }

  function renderComment(comment: Comment, isReply = false) {
    return (
      <div
        key={comment.id}
        className={isReply ? "ml-8 border-l-2 border-muted pl-4" : "border-b pb-4 last:border-b-0 last:pb-0"}
      >
        {comment.is_deleted ? (
          <div className="text-sm text-muted-foreground italic py-2">
            삭제된 댓글입니다
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">
                  {comment.user?.nickname || comment.guest_nickname || "익명"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {comment.created_at && formatDistanceToNow(new Date(comment.created_at), {
                    locale: ko,
                  })}
                  {comment.updated_at && comment.created_at && comment.updated_at !== comment.created_at && " (수정됨)"}
                </span>
              </div>
              {currentUserId === comment.user_id && (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => startEdit(comment)}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => handleDelete(comment.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>

            {editingId === comment.id ? (
              <div className="space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="resize-none"
                  rows={3}
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" onClick={cancelEdit}>
                    취소
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleEdit(comment.id)}
                    disabled={!editContent.trim()}
                  >
                    저장
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm whitespace-pre-wrap mb-2">{comment.content}</p>
            )}

            {/* Action buttons: Like + Reply */}
            {editingId !== comment.id && (
              <div className="flex items-center gap-3 mt-1">
                <button
                  onClick={() => handleToggleLike(comment.id)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-red-500 transition-colors"
                >
                  <Heart
                    className={`h-3.5 w-3.5 ${
                      likedCommentIds.has(comment.id)
                        ? "fill-red-500 text-red-500"
                        : ""
                    }`}
                  />
                  {(comment.like_count || 0) > 0 && (
                    <span>{comment.like_count}</span>
                  )}
                </button>

                {!isReply && (
                  <button
                    onClick={() => {
                      setReplyingTo(replyingTo === comment.id ? null : comment.id)
                      setReplyContent("")
                    }}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>{comment.replies?.filter(r => !r.is_deleted).length || 0}</span>
                  </button>
                )}
              </div>
            )}

            {/* Inline reply form */}
            {replyingTo === comment.id && (
              <div className="mt-3 ml-8 relative">
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="답글을 입력하세요..."
                  className="resize-none pr-12"
                  rows={2}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setReplyingTo(null)
                      setReplyContent("")
                    }
                  }}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleReplySubmit(comment.id)}
                  disabled={submitting || !replyContent.trim()}
                  className="absolute right-2 bottom-2 h-8 w-8 text-muted-foreground hover:text-primary"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}

        {/* Render replies */}
        {!isReply && comment.replies && comment.replies.length > 0 && (
          expandedReplies.has(comment.id) ? (
            <div className="mt-3 space-y-3">
              {comment.replies.map(reply => renderComment(reply, true))}
              <button
                onClick={() => setExpandedReplies(prev => {
                  const next = new Set(prev)
                  next.delete(comment.id)
                  return next
                })}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors ml-8"
              >
                대댓글 접기
              </button>
            </div>
          ) : (
            <button
              onClick={() => setExpandedReplies(prev => {
                const next = new Set(prev)
                next.add(comment.id)
                return next
              })}
              className="mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              + 대댓글 {comment.replies.filter(r => !r.is_deleted).length}개 더보기
            </button>
          )
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">댓글</h2>
        <div className="text-center py-4 text-muted-foreground">
          로딩 중...
        </div>
      </div>
    )
  }

  const totalCount = countAllComments(comments)

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">
          댓글 {totalCount}
        </h2>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as CommentSort)}>
          <SelectTrigger className="w-[120px] h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">최신순</SelectItem>
            <SelectItem value="oldest">오래된순</SelectItem>
            <SelectItem value="popular">인기순</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="mb-6 relative">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="댓글을 입력하세요..."
          className="resize-none pr-12"
          rows={2}
        />
        <Button
          type="submit"
          size="icon"
          variant="ghost"
          disabled={submitting || !newComment.trim()}
          className="absolute right-2 bottom-2 h-8 w-8 text-muted-foreground hover:text-primary"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="아직 댓글이 없습니다"
            description="첫 번째 댓글을 작성해보세요"
          />
        ) : (
          comments.map(comment => renderComment(comment))
        )}
      </div>
    </div>
  )
}
