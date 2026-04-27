'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { MessageCircleQuestion, Trophy, Lightbulb, User, BarChart3 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
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

const QUESTION_MODE_KEY = 'app-question-mode'

function getQuestionPath() {
  if (typeof window === 'undefined') return '/swipe'
  return localStorage.getItem(QUESTION_MODE_KEY) === 'list' ? '/list' : '/swipe'
}

const staticNavItems = [
  { label: '결과', path: '/results', icon: BarChart3, requiresAuth: true, hideForGuest: true },
  { label: '랭킹', path: '/ranking', icon: Trophy },
  { label: '제보', path: '/suggest', icon: Lightbulb, hideForAdmin: true },
  { label: 'MY', path: '/mypage', icon: User, requiresAuth: true, hideForGuest: true },
]

export default function MobileBottomNav() {
  const pathname = usePathname()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [questionPath, setQuestionPath] = useState('/swipe')

  // localStorage에서 마지막 모드 읽기 + pathname 변경 시 모드 저장
  useEffect(() => {
    setQuestionPath(getQuestionPath())
  }, [])

  useEffect(() => {
    if (pathname === '/swipe' || pathname === '/list') {
      const mode = pathname === '/list' ? 'list' : 'swipe'
      localStorage.setItem(QUESTION_MODE_KEY, mode)
      setQuestionPath(pathname)
    }
  }, [pathname])

  useEffect(() => {
    const supabase = createClient()
    async function checkAdmin(userId: string | undefined) {
      if (userId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', userId)
          .single()
        setIsAdmin(profile?.user_type === 'admin')
        setIsLoggedIn(true)
      } else {
        setIsAdmin(false)
        setIsLoggedIn(false)
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      checkAdmin(session?.user?.id)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      checkAdmin(session?.user?.id)
    })

    return () => subscription.unsubscribe()
  }, [])

  const [hidden, setHidden] = useState(false)
  const lastScrollY = useRef(0)

  const handleScroll = useCallback(() => {
    const currentY = window.scrollY
    const delta = currentY - lastScrollY.current
    if (delta > 10) {
      setHidden(true)
    } else if (delta < -10) {
      setHidden(false)
    }
    lastScrollY.current = currentY
  }, [])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  const allNavItems = [
    { label: '질문', path: questionPath, icon: MessageCircleQuestion },
    ...staticNavItems,
  ]

  const navItems = allNavItems.filter(item => {
    if (item.hideForAdmin && isAdmin) return false
    if (item.hideForGuest && !isLoggedIn) return false
    return true
  })

  const isActive = (path: string) => {
    if (path === '/swipe' || path === '/list') {
      return pathname === '/list' || pathname === '/swipe'
    }
    return pathname.startsWith(path)
  }

  return (
    <>
      <nav className={`sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#1E5C52] pb-[env(safe-area-inset-bottom)] transition-transform duration-300 ${hidden ? 'translate-y-full' : 'translate-y-0'}`}>
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)

            if (item.requiresAuth && !isLoggedIn) {
              return (
                <button
                  key={item.path}
                  onClick={() => setShowLoginPrompt(true)}
                  className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors text-white/60`}
                >
                  <Icon size={20} />
                  <span className="text-xs">{item.label}</span>
                </button>
              )
            }

            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${
                  active ? 'text-white' : 'text-white/60'
                }`}
              >
                <Icon size={20} />
                <span className="text-xs">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
      <Dialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>로그인</DialogTitle>
            <DialogDescription>
              내용을 확인하기 위해서는 로그인해주세요
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
    </>
  )
}
