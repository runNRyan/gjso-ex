'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { resetPasswordForEmail } from '@/lib/auth/actions'
import { ChevronLeft } from 'lucide-react'

interface ForgotPasswordFormProps {
  onBack?: () => void
}

export default function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')

    if (!email) {
      setError('이메일을 입력해주세요.')
      return
    }

    if (!validateEmail(email)) {
      setError('올바른 이메일 형식이 아닙니다.')
      return
    }

    setLoading(true)

    try {
      const result = await resetPasswordForEmail(email)
      if (result.error) {
        setError(result.error)
      } else if (result.success) {
        setSuccessMessage(result.message || '재설정 링크를 이메일로 보냈습니다.')
        setEmail('')
      }
    } catch (err) {
      setError('예기치 않은 오류가 발생했습니다.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold">비밀번호 재설정</h3>
        <p className="text-sm text-muted-foreground mt-1">
          가입하신 이메일 주소를 입력하시면 비밀번호 재설정 링크를 보내드립니다.
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="p-3 text-sm bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-200 rounded-md border border-green-200 dark:border-green-800">
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 text-sm bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-200 rounded-md border border-red-200 dark:border-red-800">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="reset-email">이메일</Label>
          <Input
            id="reset-email"
            type="email"
            placeholder="example@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? '처리 중...' : '재설정 링크 보내기'}
        </Button>
      </form>

      {/* Back to Login */}
      <div className="text-center">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          로그인으로 돌아가기
        </button>
      </div>
    </div>
  )
}
