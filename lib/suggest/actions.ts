'use server'

import { createClient } from '@/lib/supabase/server'

export async function submitSuggestion(input: {
  title: string
  option_a: string
  option_b: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: '로그인이 필요합니다.' }
  }

  // Validate
  if (!input.title.trim() || !input.option_a.trim() || !input.option_b.trim()) {
    return { error: '모든 필드를 입력해주세요.' }
  }

  const { error } = await supabase
    .from('suggested_questions')
    .insert({
      user_id: user.id,
      title: input.title.trim(),
      option_a: input.option_a.trim(),
      option_b: input.option_b.trim(),
    })

  if (error) {
    console.error('Submit suggestion error:', error)
    return { error: '제보에 실패했습니다. 다시 시도해주세요.' }
  }

  return { success: true }
}

export async function fetchMySuggestions() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: '로그인이 필요합니다.', data: [] }
  }

  const { data, error } = await supabase
    .from('suggested_questions')
    .select('id, title, option_a, option_b, status, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return { error: '내 제보 목록을 불러오지 못했습니다.', data: [] }
  }

  return { error: null, data: data || [] }
}
