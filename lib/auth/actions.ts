'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

/**
 * Google OAuth 로그인
 */
export async function signInWithGoogle() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
      queryParams: {
        prompt: 'select_account', // 매번 계정 선택 화면 표시
      },
    },
  })

  if (error) {
    console.error('Google sign in error:', error)
    return { error: error.message }
  }

  if (data.url) {
    redirect(data.url)
  }
}

/**
 * Kakao OAuth 로그인
 */
export async function signInWithKakao() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'kakao',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
    },
  })

  if (error) {
    console.error('Kakao sign in error:', error)
    return { error: error.message }
  }

  if (data.url) {
    redirect(data.url)
  }
}

/**
 * 로그아웃
 */
export async function signOut() {
  const supabase = await createClient()

  const { error } = await supabase.auth.signOut({ scope: 'global' })

  if (error) {
    console.error('Sign out error:', error)
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

/**
 * 현재 로그인된 사용자 가져오기
 */
export async function getUser() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    console.error('Get user error:', error)
    return null
  }

  return user
}

/**
 * 현재 사용자의 프로필 가져오기
 */
export async function getProfile() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('Get profile error:', error)
    return null
  }

  return profile
}

/**
 * 닉네임 업데이트
 */
export async function updateNickname(nickname: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // 닉네임 유효성 검사
  const trimmed = nickname.trim()
  if (trimmed.length < 2 || trimmed.length > 20) {
    return { error: '닉네임은 2~20자여야 합니다.' }
  }
  if (!/^[가-힣a-zA-Z0-9_]+$/.test(trimmed)) {
    return { error: '닉네임에 특수문자를 사용할 수 없습니다.' }
  }

  // 닉네임 중복 체크
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('nickname', trimmed)
    .neq('id', user.id)
    .single()

  if (existing) {
    return { error: '이미 사용 중인 닉네임입니다.' }
  }

  // 닉네임 업데이트
  const { error } = await supabase
    .from('profiles')
    .update({ nickname: trimmed, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (error) {
    console.error('Update nickname error:', error)
    return { error: '닉네임 업데이트에 실패했습니다.' }
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

/**
 * 사용자 권한 업데이트 (관리자 전용)
 */
export async function updateUserPermission(
  targetUserId: string,
  userType: 'guest' | 'ghost' | 'member' | 'admin',
  userLevel?: number
) {
  const supabase = await createClient()

  // 현재 사용자 확인
  const currentProfile = await getProfile()
  if (!currentProfile || currentProfile.user_type !== 'admin') {
    return { error: '권한이 없습니다.' }
  }

  // 업데이트할 데이터 준비
  const updateData: {
    user_type: 'guest' | 'ghost' | 'member' | 'admin'
    user_level?: number
    updated_at: string
  } = {
    user_type: userType,
    updated_at: new Date().toISOString(),
  }

  if (userLevel !== undefined) {
    updateData.user_level = userLevel
  }

  // 권한 업데이트
  const { error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', targetUserId)

  if (error) {
    console.error('Update user permission error:', error)
    return { error: '권한 업데이트에 실패했습니다.' }
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

/**
 * 사용자 레벨 업데이트
 */
export async function updateUserLevel(level: number) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  if (level < 1) {
    return { error: '레벨은 1 이상이어야 합니다.' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ user_level: level, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (error) {
    console.error('Update user level error:', error)
    return { error: '레벨 업데이트에 실패했습니다.' }
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

/**
 * 이메일로 회원가입
 */
export async function signUpWithEmail(email: string, password: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
    },
  })

  if (error) {
    console.error('Email sign up error:', error)
    // 사용자 친화적인 에러 메시지로 변환
    if (error.message.includes('already registered')) {
      return { error: '이미 가입된 이메일입니다.' }
    }
    return { error: error.message }
  }

  if (data.user) {
    return {
      success: true,
      message: '인증 이메일을 확인해주세요. 이메일 인증 후 로그인할 수 있습니다.(없다면 스팸함을 확인해주세요!)'
    }
  }

  return { error: '회원가입에 실패했습니다.' }
}

/**
 * 이메일로 로그인
 */
export async function signInWithEmail(email: string, password: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('Email sign in error:', error)
    // 사용자 친화적인 에러 메시지로 변환
    if (error.message.includes('Invalid login credentials')) {
      return { error: '이메일 또는 비밀번호가 올바르지 않습니다.' }
    }
    if (error.message.includes('Email not confirmed')) {
      return { error: '이메일 인증이 완료되지 않았습니다. 이메일을 확인해주세요.' }
    }
    return { error: error.message }
  }

  if (data.user) {
    revalidatePath('/', 'layout')
    return { success: true }
  }

  return { error: '로그인에 실패했습니다.' }
}

/**
 * 비밀번호 재설정 이메일 발송
 */
export async function resetPasswordForEmail(email: string) {
  const supabase = await createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/reset-password`,
  })

  if (error) {
    console.error('Password reset error:', error)
    return { error: '비밀번호 재설정 이메일 발송에 실패했습니다.' }
  }

  return {
    success: true,
    message: '비밀번호 재설정 링크를 이메일로 보냈습니다. 이메일을 확인해주세요.'
  }
}

/**
 * 비밀번호 업데이트
 */
export async function updatePassword(newPassword: string) {
  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) {
    console.error('Password update error:', error)
    return { error: '비밀번호 변경에 실패했습니다.' }
  }

  revalidatePath('/', 'layout')
  return { success: true, message: '비밀번호가 성공적으로 변경되었습니다.' }
}
