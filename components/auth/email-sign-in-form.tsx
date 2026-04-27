'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signUpWithEmail, signInWithEmail } from '@/lib/auth/actions'
import { toast } from 'sonner'

interface EmailSignInFormProps {
  onSuccess?: () => void
  onForgotPassword?: () => void
}

export default function EmailSignInForm({
  onSuccess,
  onForgotPassword,
}: EmailSignInFormProps) {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
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

    // 유효성 검사
    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요.')
      return
    }

    if (!validateEmail(email)) {
      setError('올바른 이메일 형식이 아닙니다.')
      return
    }

    if (password.length < 8) {
      setError('비밀번호는 최소 8자 이상이어야 합니다.')
      return
    }

    if (mode === 'sign-up' && password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    setLoading(true)

    try {
      if (mode === 'sign-up') {
        const result = await signUpWithEmail(email, password)
        if (result.error) {
          setError(result.error)
        } else if (result.success) {
          setSuccessMessage(result.message || '회원가입이 완료되었습니다.')
          setEmail('')
          setPassword('')
          setConfirmPassword('')
        }
      } else {
        const result = await signInWithEmail(email, password)
        if (result.error) {
          setError(result.error)
          toast.error(result.error)
        } else if (result.success) {
          onSuccess?.()
        }
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
      {/* Mode Toggle */}
      <div className="flex gap-2 p-1 bg-muted rounded-lg">
        <button
          type="button"
          onClick={() => {
            setMode('sign-in')
            setError('')
            setSuccessMessage('')
          }}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
            mode === 'sign-in'
              ? 'bg-background shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          로그인
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('sign-up')
            setError('')
            setSuccessMessage('')
          }}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
            mode === 'sign-up'
              ? 'bg-background shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          회원가입
        </button>
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
          <Label htmlFor="email">이메일</Label>
          <Input
            id="email"
            type="email"
            placeholder="example@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">비밀번호</Label>
          <Input
            id="password"
            type="password"
            placeholder="최소 8자 이상"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        {mode === 'sign-up' && (
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
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading
            ? '처리 중...'
            : mode === 'sign-in'
              ? '로그인'
              : '회원가입'}
        </Button>
      </form>

      {/* Forgot Password Link */}
      {mode === 'sign-in' && (
        <div className="text-center">
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            비밀번호를 잊으셨나요?
          </button>
        </div>
      )}
    </div>
  )
}
