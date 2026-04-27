'use server'

import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/actions'
import { revalidatePath } from 'next/cache'

interface CreateQuestionInput {
  title: string
  option_a: string
  option_b: string
  category?: string
  status: 'draft' | 'published'
  published_at?: string
  close_at?: string
}

async function requireAdmin() {
  const profile = await getProfile()
  if (!profile || profile.user_type !== 'admin') {
    return { error: '관리자 권한이 필요합니다.', profile: null }
  }
  return { error: null, profile }
}

function revalidateQuestionPages() {
  revalidatePath('/')
  revalidatePath('/admin/questions')
}

export async function createQuestion(input: CreateQuestionInput) {
  const { error: authError, profile } = await requireAdmin()
  if (authError || !profile) {
    return { error: authError }
  }

  const supabase = await createClient()

  const publishedAt =
    input.status === 'published'
      ? input.published_at || new Date().toISOString()
      : input.published_at || null

  const { data, error } = await supabase
    .from('questions')
    .insert({
      title: input.title,
      option_a: input.option_a,
      option_b: input.option_b,
      category: input.category || null,
      status: input.status,
      created_by: profile.id,
      published_at: publishedAt,
      close_at: input.close_at || null,
    })
    .select()
    .single()

  if (error) {
    console.error('Create question error:', error)
    return { error: '질문 생성에 실패했습니다.' }
  }

  revalidateQuestionPages()
  return { success: true, data }
}

export async function bulkCreateQuestions(
  questions: Array<{
    title: string
    option_a: string
    option_b: string
    category?: string
    status?: 'draft' | 'published'
    published_at?: string
    close_at?: string
  }>
) {
  const { error: authError, profile } = await requireAdmin()
  if (authError || !profile) {
    return { error: authError }
  }

  if (questions.length === 0) {
    return { error: '업로드할 질문이 없습니다.' }
  }

  const supabase = await createClient()

  const insertData = questions.map((q) => {
    const st = q.status || 'draft'
    return {
      title: q.title,
      option_a: q.option_a,
      option_b: q.option_b,
      category: q.category || null,
      status: st,
      created_by: profile.id,
      published_at:
        st === 'published'
          ? q.published_at || new Date().toISOString()
          : q.published_at || null,
      close_at: q.close_at || null,
    }
  })

  const { data, error } = await supabase
    .from('questions')
    .insert(insertData)
    .select()

  if (error) {
    console.error('Bulk create questions error:', error)
    return { error: `질문 벌크 생성에 실패했습니다: ${error.message}` }
  }

  revalidateQuestionPages()
  return { success: true, count: data?.length || 0 }
}

export async function fetchDraftQuestions() {
  const { error: authError } = await requireAdmin()
  if (authError) {
    return { error: authError, data: [] }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('questions')
    .select('id, title, option_a, option_b, category, status, published_at, close_at, created_at')
    .eq('status', 'draft')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Fetch draft questions error:', error)
    return { error: '임시저장 질문을 불러오지 못했습니다.', data: [] }
  }

  return { error: null, data: data || [] }
}

export async function publishQuestion(questionId: string) {
  const { error: authError } = await requireAdmin()
  if (authError) {
    return { error: authError }
  }

  const supabase = await createClient()

  const { data: question } = await supabase
    .from('questions')
    .select('published_at, close_at')
    .eq('id', questionId)
    .eq('status', 'draft')
    .single()

  if (!question?.close_at) {
    return { error: '마감 기한을 설정해야 게시할 수 있습니다.' }
  }

  const { error } = await supabase
    .from('questions')
    .update({
      status: 'published',
      published_at: question?.published_at || new Date().toISOString(),
    })
    .eq('id', questionId)
    .eq('status', 'draft')

  if (error) {
    console.error('Publish question error:', error)
    return { error: '질문 게시에 실패했습니다.' }
  }

  revalidateQuestionPages()
  return { success: true }
}

export async function deleteQuestion(questionId: string) {
  const { error: authError } = await requireAdmin()
  if (authError) {
    return { error: authError }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('questions')
    .delete()
    .eq('id', questionId)
    .eq('status', 'draft')

  if (error) {
    console.error('Delete question error:', error)
    return { error: '질문 삭제에 실패했습니다.' }
  }

  revalidateQuestionPages()
  return { success: true }
}

export async function fetchPublishedQuestions({
  search,
  category,
  limit = 50,
  offset = 0,
}: {
  search?: string
  category?: string
  limit?: number
  offset?: number
} = {}) {
  const { error: authError } = await requireAdmin()
  if (authError) {
    return { error: authError, data: [], total: 0 }
  }

  const supabase = await createClient()

  let query = supabase
    .from('questions')
    .select('id, title, option_a, option_b, category, status, published_at, close_at, closed_at, created_at, vote_count_a, vote_count_b, balance_type, comment_count', { count: 'exact' })
    .eq('status', 'published')

  if (search) {
    query = query.ilike('title', `%${search}%`)
  }

  if (category) {
    query = query.eq('category', category)
  }

  query = query.order('published_at', { ascending: false })
    .range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    console.error('Fetch published questions error:', error)
    return { error: '게시된 질문을 불러오지 못했습니다.', data: [], total: 0 }
  }

  return { error: null, data: data || [], total: count || 0 }
}

export async function updateQuestion(questionId: string, input: Partial<CreateQuestionInput>) {
  const { error: authError } = await requireAdmin()
  if (authError) {
    return { error: authError }
  }

  const supabase = await createClient()

  const updateData: Record<string, unknown> = {}

  if (input.title !== undefined) updateData.title = input.title
  if (input.option_a !== undefined) updateData.option_a = input.option_a
  if (input.option_b !== undefined) updateData.option_b = input.option_b
  if (input.category !== undefined) updateData.category = input.category || null
  if (input.published_at !== undefined) updateData.published_at = input.published_at
  if (input.close_at !== undefined) updateData.close_at = input.close_at

  const { data, error } = await supabase
    .from('questions')
    .update(updateData)
    .eq('id', questionId)
    .select()
    .single()

  if (error) {
    console.error('Update question error:', error)
    return { error: '질문 수정에 실패했습니다.' }
  }

  revalidateQuestionPages()
  return { success: true, data }
}

export async function unpublishQuestion(questionId: string) {
  const { error: authError } = await requireAdmin()
  if (authError) {
    return { error: authError }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('questions')
    .update({ status: 'draft' })
    .eq('id', questionId)
    .eq('status', 'published')

  if (error) {
    console.error('Unpublish question error:', error)
    return { error: '질문 비공개 처리에 실패했습니다.' }
  }

  revalidateQuestionPages()
  return { success: true }
}

export async function deletePublishedQuestion(questionId: string) {
  const { error: authError } = await requireAdmin()
  if (authError) {
    return { error: authError }
  }

  const supabase = await createClient()

  // Check if question has votes
  const { count } = await supabase
    .from('votes')
    .select('*', { count: 'exact', head: true })
    .eq('question_id', questionId)

  if (count && count > 0) {
    return { error: '투표가 있는 질문은 삭제할 수 없습니다. 비공개 처리를 사용하세요.' }
  }

  const { error } = await supabase
    .from('questions')
    .delete()
    .eq('id', questionId)

  if (error) {
    console.error('Delete published question error:', error)
    return { error: '질문 삭제에 실패했습니다.' }
  }

  revalidateQuestionPages()
  return { success: true }
}

export async function fetchClosedQuestions({
  search,
  category,
  limit = 50,
  offset = 0,
}: {
  search?: string
  category?: string
  limit?: number
  offset?: number
} = {}) {
  const { error: authError } = await requireAdmin()
  if (authError) {
    return { error: authError, data: [], total: 0 }
  }

  const supabase = await createClient()

  let query = supabase
    .from('questions')
    .select('id, title, option_a, option_b, category, status, published_at, close_at, closed_at, created_at, vote_count_a, vote_count_b, balance_type, comment_count', { count: 'exact' })
    .eq('status', 'closed')

  if (search) {
    query = query.ilike('title', `%${search}%`)
  }

  if (category) {
    query = query.eq('category', category)
  }

  query = query.order('closed_at', { ascending: false })
    .range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    console.error('Fetch closed questions error:', error)
    return { error: '종료된 질문을 불러오지 못했습니다.', data: [], total: 0 }
  }

  return { error: null, data: data || [], total: count || 0 }
}

export async function getQuestionStats() {
  const { error: authError } = await requireAdmin()
  if (authError) {
    return { error: authError, data: null }
  }

  const supabase = await createClient()
  const now = new Date().toISOString()

  const [
    { count: totalQuestions },
    { count: publishedCount },
    { count: draftCount },
    { count: closedCount },
    { count: totalVotes },
    { count: activeCount },
    { count: scheduledCount },
  ] = await Promise.all([
    supabase.from('questions').select('*', { count: 'exact', head: true }),
    supabase.from('questions').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('questions').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
    supabase.from('questions').select('*', { count: 'exact', head: true }).eq('status', 'closed'),
    supabase.from('votes').select('*', { count: 'exact', head: true }),
    supabase.from('questions').select('*', { count: 'exact', head: true }).eq('status', 'published').is('closed_at', null).lte('published_at', now),
    supabase.from('questions').select('*', { count: 'exact', head: true }).eq('status', 'published').gt('published_at', now),
  ])

  return {
    error: null,
    data: {
      totalQuestions: totalQuestions || 0,
      publishedCount: publishedCount || 0,
      draftCount: draftCount || 0,
      closedCount: closedCount || 0,
      activeCount: activeCount || 0,
      scheduledCount: scheduledCount || 0,
      totalVotes: totalVotes || 0,
    }
  }
}

export async function fetchSuggestedQuestions({
  status,
  limit = 50,
  offset = 0,
}: {
  status?: 'new' | 'reviewed' | 'used'
  limit?: number
  offset?: number
} = {}) {
  const { error: authError } = await requireAdmin()
  if (authError) {
    return { error: authError, data: [], total: 0 }
  }

  const supabase = await createClient()

  let query = supabase
    .from('suggested_questions')
    .select('id, title, option_a, option_b, status, created_at, user_id, profiles!inner(nickname)', { count: 'exact' })

  if (status) {
    query = query.eq('status', status)
  }

  query = query.order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    console.error('Fetch suggested questions error:', error)
    return { error: '제보를 불러오지 못했습니다.', data: [], total: 0 }
  }

  return { error: null, data: data || [], total: count || 0 }
}

export async function updateSuggestionStatus(
  suggestionId: string,
  status: 'new' | 'reviewed' | 'used',
  overrides?: { title?: string; option_a?: string; option_b?: string }
) {
  const { error: authError, profile } = await requireAdmin()
  if (authError || !profile) {
    return { error: authError }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('suggested_questions')
    .update({ status })
    .eq('id', suggestionId)

  if (error) {
    console.error('Update suggestion status error:', error)
    return { error: '상태 변경에 실패했습니다.' }
  }

  // 채택 시 자동으로 draft 질문 생성 (overrides로 수정된 내용 반영)
  if (status === 'used') {
    const { data: suggestion } = await supabase
      .from('suggested_questions')
      .select('title, option_a, option_b')
      .eq('id', suggestionId)
      .single()

    if (suggestion) {
      const { error: createError } = await supabase
        .from('questions')
        .insert({
          title: overrides?.title || suggestion.title,
          option_a: overrides?.option_a || suggestion.option_a,
          option_b: overrides?.option_b || suggestion.option_b,
          status: 'draft',
          created_by: profile.id,
        })

      if (createError) {
        console.error('Auto-create question from suggestion error:', createError)
        return { success: true, warning: '상태는 변경되었으나 질문 자동 생성에 실패했습니다.' }
      }

      revalidateQuestionPages()
      return { success: true, questionCreated: true }
    }
  }

  return { success: true }
}

export async function fetchCommentsForAdmin({
  questionId,
  limit = 50,
  offset = 0,
}: {
  questionId?: string
  limit?: number
  offset?: number
} = {}) {
  const { error: authError } = await requireAdmin()
  if (authError) {
    return { error: authError, data: [], total: 0 }
  }

  const supabase = await createClient()

  let query = supabase
    .from('comments')
    .select('id, content, is_deleted, created_at, user_id, guest_nickname, question_id, parent_id, questions!inner(title), profiles(nickname)', { count: 'exact' })

  if (questionId) {
    query = query.eq('question_id', questionId)
  }

  query = query.order('created_at', { ascending: true })
    .range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    console.error('Fetch comments error:', error)
    return { error: '댓글을 불러오지 못했습니다.', data: [], total: 0 }
  }

  return { error: null, data: data || [], total: count || 0 }
}

export async function softDeleteComment(commentId: string) {
  const { error: authError } = await requireAdmin()
  if (authError) {
    return { error: authError }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('comments')
    .update({ is_deleted: true })
    .eq('id', commentId)

  if (error) {
    console.error('Soft delete comment error:', error)
    return { error: '댓글 삭제에 실패했습니다.' }
  }

  return { success: true }
}

export async function fetchAdminDashboard({
  filter = 'all',
  search,
  category,
}: {
  filter?: 'all' | 'published' | 'scheduled' | 'closed' | 'drafts'
  search?: string
  category?: string
} = {}) {
  const { error: authError } = await requireAdmin()
  if (authError) {
    return { error: authError, stats: null, published: [], closed: [], drafts: [] }
  }

  const supabase = await createClient()
  const now = new Date().toISOString()

  // Build parallel queries based on what the filter needs
  const promises: Record<string, Promise<any>> = {}

  // Stats - always fetch (lightweight COUNT queries)
  promises.stats = Promise.all([
    supabase.from('questions').select('*', { count: 'exact', head: true }),
    supabase.from('questions').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('questions').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
    supabase.from('questions').select('*', { count: 'exact', head: true }).eq('status', 'closed'),
    supabase.from('votes').select('*', { count: 'exact', head: true }),
    supabase.from('questions').select('*', { count: 'exact', head: true }).eq('status', 'published').is('closed_at', null).lte('published_at', now),
    supabase.from('questions').select('*', { count: 'exact', head: true }).eq('status', 'published').gt('published_at', now),
  ])

  // Published questions
  if (filter === 'all' || filter === 'published' || filter === 'scheduled') {
    let query = supabase
      .from('questions')
      .select('id, title, option_a, option_b, category, status, published_at, close_at, closed_at, created_at, vote_count_a, vote_count_b, balance_type, comment_count')
      .eq('status', 'published')
    if (search) query = query.ilike('title', `%${search}%`)
    if (category) query = query.eq('category', category)
    query = query.order('published_at', { ascending: false }).range(0, 49)
    promises.published = query as unknown as Promise<any>
  }

  // Closed questions
  if (filter === 'all' || filter === 'closed') {
    let query = supabase
      .from('questions')
      .select('id, title, option_a, option_b, category, status, published_at, close_at, closed_at, created_at, vote_count_a, vote_count_b, balance_type, comment_count')
      .eq('status', 'closed')
    if (search) query = query.ilike('title', `%${search}%`)
    if (category) query = query.eq('category', category)
    query = query.order('closed_at', { ascending: false }).range(0, 49)
    promises.closed = query as unknown as Promise<any>
  }

  // Draft questions
  if (filter === 'all' || filter === 'drafts') {
    promises.drafts = supabase
      .from('questions')
      .select('id, title, option_a, option_b, category, status, published_at, close_at, created_at')
      .eq('status', 'draft')
      .order('created_at', { ascending: false }) as unknown as Promise<any>
  }

  // Execute all in parallel
  const keys = Object.keys(promises)
  const results = await Promise.all(Object.values(promises))
  const resultMap: Record<string, any> = {}
  keys.forEach((key, i) => { resultMap[key] = results[i] })

  // Parse stats
  const statsResults = resultMap.stats || []
  const stats = {
    totalQuestions: statsResults[0]?.count || 0,
    publishedCount: statsResults[1]?.count || 0,
    draftCount: statsResults[2]?.count || 0,
    closedCount: statsResults[3]?.count || 0,
    totalVotes: statsResults[4]?.count || 0,
    activeCount: statsResults[5]?.count || 0,
    scheduledCount: statsResults[6]?.count || 0,
  }

  return {
    error: null,
    stats,
    published: resultMap.published?.data || [],
    closed: resultMap.closed?.data || [],
    drafts: resultMap.drafts?.data || [],
  }
}
