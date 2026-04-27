'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { submitSuggestion, fetchMySuggestions } from '@/lib/suggest/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Send, Lightbulb, CheckCircle } from 'lucide-react'
import { EmptyState } from '@/components/empty-state'
import { trackEvent } from '@/lib/analytics'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import GoogleSignInButton from '@/components/auth/google-sign-in-button'
import KakaoSignInButton from '@/components/auth/kakao-sign-in-button'
import EmailSignInForm from '@/components/auth/email-sign-in-form'

type Suggestion = {
  id: string
  title: string
  option_a: string
  option_b: string
  status: string | null
  created_at: string | null
}

export default function SuggestPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [title, setTitle] = useState('')
  const [optionA, setOptionA] = useState('')
  const [optionB, setOptionB] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    setLoading(false)

    if (user) {
      loadSuggestions()
    }
  }

  async function loadSuggestions() {
    const result = await fetchMySuggestions()
    if (!result.error && result.data) {
      setSuggestions(result.data)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setSuccessMessage('')
    setErrorMessage('')

    const result = await submitSuggestion({
      title,
      option_a: optionA,
      option_b: optionB,
    })

    if (result.error) {
      setErrorMessage(result.error)
    } else {
      setSuccessMessage('질문이 성공적으로 제보되었습니다!')

      // Track question suggestion event
      trackEvent('question_suggested', { title })

      setTitle('')
      setOptionA('')
      setOptionB('')
      // Reload suggestions list
      await loadSuggestions()
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000)
    }

    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="container mx-auto max-w-2xl py-8 px-4">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-gray-500 dark:text-gray-400">로딩 중...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto max-w-2xl py-8 px-4">
        <div className="border dark:border-gray-800 rounded-lg p-8 text-center">
          <Lightbulb className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
          <h2 className="text-2xl font-bold mb-2">질문 제보</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            로그인 후 질문을 제보할 수 있습니다.
          </p>
          <Button onClick={() => setShowLoginPrompt(true)}>로그인하기</Button>
        </div>
        <Dialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>로그인</DialogTitle>
              <DialogDescription>
                질문을 제보하려면 로그인해주세요
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-3">
                <GoogleSignInButton onSuccess={() => setShowLoginPrompt(false)} />
                <KakaoSignInButton onSuccess={() => setShowLoginPrompt(false)} />
              </div>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">또는</span>
                </div>
              </div>
              <EmailSignInForm onSuccess={() => setShowLoginPrompt(false)} />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  const getStatusBadge = (status: string | null) => {
    const styles = {
      new: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-800',
      reviewed: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-300 dark:border-red-800',
      used: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-800',
    }
    const labels = {
      new: '접수완료',
      reviewed: '반려됨',
      used: '채택됨',
    }
    const statusKey = (status || 'new') as keyof typeof styles
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded border ${styles[statusKey] || styles.new}`}>
        {labels[statusKey] || statusKey}
      </span>
    )
  }

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Lightbulb className="w-8 h-8 text-yellow-500" />
          질문 제보
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          결정소에서 다루었으면 하는 질문을 제보해주세요!
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2 text-green-800 dark:text-green-200">
          <CheckCircle className="w-5 h-5" />
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200">
          {errorMessage}
        </div>
      )}

      {/* Suggestion Form */}
      <div className="mb-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">질문 제목</Label>
            <Input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 치킨 vs 피자"
              maxLength={100}
              required
              className="mt-1"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {title.length}/100
            </p>
          </div>

          <div>
            <Label htmlFor="optionA">선택지 A</Label>
            <Input
              id="optionA"
              type="text"
              value={optionA}
              onChange={(e) => setOptionA(e.target.value)}
              placeholder="예: 치킨"
              maxLength={50}
              required
              className="mt-1"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {optionA.length}/50
            </p>
          </div>

          <div>
            <Label htmlFor="optionB">선택지 B</Label>
            <Input
              id="optionB"
              type="text"
              value={optionB}
              onChange={(e) => setOptionB(e.target.value)}
              placeholder="예: 피자"
              maxLength={50}
              required
              className="mt-1"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {optionB.length}/50
            </p>
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full"
          >
            <Send className="w-4 h-4 mr-2" />
            {submitting ? '제보 중...' : '질문 제보하기'}
          </Button>
        </form>
      </div>

      {/* My Suggestions List */}
      {suggestions.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">내 제보 목록</h2>
          <div className="space-y-3">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="border dark:border-gray-800 rounded-lg p-4 bg-white dark:bg-gray-950 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">{suggestion.title}</h3>
                  {getStatusBadge(suggestion.status)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span className="font-medium">{suggestion.option_a}</span>
                  {' vs '}
                  <span className="font-medium">{suggestion.option_b}</span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {suggestion.created_at && new Date(suggestion.created_at).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {suggestions.length === 0 && (
        <EmptyState
          icon={Lightbulb}
          title="아직 제보한 질문이 없습니다"
          description="위 양식으로 질문을 제보해보세요!"
        />
      )}
    </div>
  )
}
