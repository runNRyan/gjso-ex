"use client"

import { useSignInModalStore } from "@/store/sign-in-modal-store"

interface GuestCtaModalProps {
  virtualPoints: number
  onDismiss: () => void
}

export function GuestCtaModal({ virtualPoints, onDismiss }: GuestCtaModalProps) {
  const openSignIn = useSignInModalStore((s) => s.open)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-200">
      <div className="mx-4 w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl animate-in zoom-in-95 duration-200">
        <div className="text-center mb-6">
          <p className="text-4xl mb-3">🏆</p>
          <p className="text-lg font-bold mb-2">
            벌써 <span className="text-primary">{virtualPoints}P</span>나 쌓였어요!
          </p>
          <p className="text-sm text-muted-foreground">
            포인트가 사라지기 전에 가입하고 진짜 랭커가 되어보세요!
          </p>
        </div>
        <div className="space-y-2">
          <button
            onClick={() => { onDismiss(); openSignIn() }}
            className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            가입하기
          </button>
          <button
            onClick={onDismiss}
            className="w-full rounded-lg border py-3 text-sm font-semibold hover:bg-muted transition-colors"
          >
            계속 둘러보기
          </button>
        </div>
      </div>
    </div>
  )
}
