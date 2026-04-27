import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserTypeLabel } from '@/lib/auth/permissions'
import { NicknameEditor } from '@/components/mypage/nickname-editor'
import Link from 'next/link'
import { Bookmark, BarChart3 } from 'lucide-react'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function MyPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/')
  }

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">마이페이지</h1>

      <div className="space-y-6">
        {/* 기본 정보 */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">기본 정보</h2>
          <div className="space-y-4">
            <NicknameEditor initialNickname={profile.nickname} />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">이메일</span>
              <span className="font-medium">{profile.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">회원 등급</span>
              <span className="font-medium">{getUserTypeLabel(profile.user_type)}</span>
            </div>
            {(profile.user_type === 'member' || profile.user_type === 'ghost') && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">포인트</span>
                <span className="font-medium">{profile.point_balance}P</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">가입일</span>
              <span className="font-medium">
                {new Date(profile.created_at!).toLocaleDateString('ko-KR')}
              </span>
            </div>
          </div>
        </div>

        {/* 빠른 링크 */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">빠른 링크</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Link
              href="/results"
              className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent transition-colors"
            >
              <BarChart3 className="h-5 w-5 text-primary" />
              <div>
                <div className="font-medium">📈 내 결과</div>
                <div className="text-sm text-muted-foreground">
                  투표·예측 결과와 활동 내역 보기
                </div>
              </div>
            </Link>
            <Link
              href="/bookmarks"
              className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent transition-colors"
            >
              <Bookmark className="h-5 w-5 text-primary" />
              <div>
                <div className="font-medium">📚 저장한 책갈피</div>
                <div className="text-sm text-muted-foreground">
                  관심있는 질문 모아보기
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
