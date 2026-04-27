"use client"

import { useSignInModalStore } from "@/store/sign-in-modal-store"
import { X } from "lucide-react"

interface GuestCtaSheetProps {
  virtualPoints: number
  onDismiss: () => void
}

export function GuestCtaSheet({ virtualPoints, onDismiss }: GuestCtaSheetProps) {
  const openSignIn = useSignInModalStore((s) => s.open)

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 animate-in slide-in-from-bottom duration-300">
      <div className="mx-auto max-w-lg px-4 pb-20 sm:pb-4">
        <div className="relative rounded-xl border bg-card p-5 shadow-lg">
          <button
            onClick={onDismiss}
            className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
          <p className="text-base font-semibold mb-1">
            첫 예측 완료!
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            지금 가입하고 쌓인 <span className="font-bold text-primary">{virtualPoints}P</span>와 예측 결과를 모두 챙기세요!
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => { onDismiss(); openSignIn() }}
              className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              가입하기
            </button>
            <button
              onClick={onDismiss}
              className="flex-1 rounded-lg border py-2.5 text-sm font-semibold hover:bg-muted transition-colors"
            >
              나중에
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
