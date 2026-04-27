'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import GoogleSignInButton from './google-sign-in-button'
import KakaoSignInButton from './kakao-sign-in-button'
import EmailSignInForm from './email-sign-in-form'
import ForgotPasswordForm from './forgot-password-form'
import { useSignInModalStore } from '@/store/sign-in-modal-store'

export default function SignInModal() {
  const [mode, setMode] = useState<'sign-in' | 'forgot-password'>('sign-in')
  const isOpen = useSignInModalStore((s) => s.isOpen)
  const setOpen = useSignInModalStore((s) => s.setOpen)

  // 모달이 닫힐 때 모드 리셋
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      setMode('sign-in')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="default">로그인</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {mode === 'forgot-password' ? (
          <>
            <DialogHeader>
              <DialogTitle>비밀번호 재설정</DialogTitle>
              <DialogDescription>
                비밀번호를 재설정하고 다시 로그인해보세요
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <ForgotPasswordForm onBack={() => setMode('sign-in')} />
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>로그인</DialogTitle>
              <DialogDescription>
                결정소에 로그인하고 다양한 질문에 투표해보세요
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* 소셜 로그인 */}
              <div className="space-y-3">
                <GoogleSignInButton onSuccess={() => setOpen(false)} />
                <KakaoSignInButton onSuccess={() => setOpen(false)} />
              </div>

              {/* 구분선 */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    또는
                  </span>
                </div>
              </div>

              {/* 이메일 로그인 */}
              <EmailSignInForm
                onSuccess={() => setOpen(false)}
                onForgotPassword={() => setMode('forgot-password')}
              />
            </div>
            <div className="text-center text-xs text-muted-foreground">
              <p>로그인 시 서비스 이용약관 및 개인정보처리방침에 동의하게 됩니다</p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
