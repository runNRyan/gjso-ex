import { getProfile } from '@/lib/auth/actions'
import { redirect } from 'next/navigation'
import NicknameForm from './nickname-form'

export default async function SetupNicknamePage() {
  const profile = await getProfile()

  // If not authenticated, redirect to home
  if (!profile) {
    redirect('/')
  }

  // If already has nickname, redirect to home
  if (profile.nickname) {
    redirect('/')
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">닉네임 설정</h1>
          <p className="mt-2 text-muted-foreground">
            결정소에서 사용할 닉네임을 입력해주세요
          </p>
        </div>

        <NicknameForm email={profile.email || ''} />
      </div>
    </div>
  )
}
