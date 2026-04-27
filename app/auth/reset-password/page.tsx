'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updatePassword } from '@/lib/auth/actions'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!newPassword || !confirmPassword) {
      setError('모든 필드를 입력해주세요.')
      return
    }

    if (newPassword.length < 8) {
      setError('비밀번호는 최소 8자 이상이어야 합니다.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    setLoading(true)

    try {
      const result = await updatePassword(newPassword)
      if (result.error) {
        setError(result.error)
      } else if (result.success) {
        // 성공 시 홈으로 리다이렉트
        router.push('/?password_reset=success')
      }
    } catch (err) {
      setError('예기치 않은 오류가 발생했습니다.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">비밀번호 재설정</h1>
          <p className="text-muted-foreground">
            새로운 비밀번호를 입력해주세요
          </p>
        </div>

        <div className="bg-card rounded-lg border p-6 shadow-sm">
          {error && (
            <div className="mb-4 p-3 text-sm bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-200 rounded-md border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">새 비밀번호</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="최소 8자 이상"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">비밀번호 확인</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="비밀번호를 다시 입력해주세요"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '처리 중...' : '비밀번호 재설정'}
            </Button>
          </form>
        </div>

        <div className="text-center">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  )
}
