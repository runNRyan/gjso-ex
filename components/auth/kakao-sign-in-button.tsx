'use client'

import { signInWithKakao } from '@/lib/auth/actions'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

interface KakaoSignInButtonProps {
  onSuccess?: () => void
}

export default function KakaoSignInButton({ onSuccess }: KakaoSignInButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleSignIn = async () => {
    setLoading(true)
    try {
      await signInWithKakao()
      onSuccess?.()
    } catch (error) {
      console.error('Sign in error:', error)
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleSignIn}
      disabled={loading}
      variant="outline"
      className="w-full bg-[#FEE500] hover:bg-[#FEE500]/90 text-[#000000] hover:text-[#000000] border-0"
    >
      {loading ? (
        '로그인 중...'
      ) : (
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12 3C6.477 3 2 6.298 2 10.5c0 2.664 1.633 5.013 4.121 6.471-.171.628-.646 2.368-.738 2.751-.112.456.167.45.353.327.142-.094 2.227-1.532 3.096-2.132.385.054.778.083 1.168.083 5.523 0 10-3.298 10-7.5S17.523 3 12 3z"
              fill="currentColor"
            />
          </svg>
          카카오로 로그인
        </div>
      )}
    </Button>
  )
}
