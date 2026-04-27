"use client"

import { create } from "zustand"
import { useSignInModalStore } from "@/store/sign-in-modal-store"

interface MemberOnlyModalState {
  isOpen: boolean
  message: string
  open: (message?: string) => void
  close: () => void
}

export const useMemberOnlyModalStore = create<MemberOnlyModalState>((set) => ({
  isOpen: false,
  message: '',
  open: (message = '이 기능은 회원만 사용할 수 있어요. 가입하고 포인트도 받으세요!') =>
    set({ isOpen: true, message }),
  close: () => set({ isOpen: false, message: '' }),
}))

export function MemberOnlyModal() {
  const { isOpen, message, close } = useMemberOnlyModalStore()
  const openSignIn = useSignInModalStore((s) => s.open)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-200">
      <div className="mx-4 w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl animate-in zoom-in-95 duration-200">
        <div className="text-center mb-5">
          <p className="text-3xl mb-3">🔒</p>
          <p className="text-sm text-muted-foreground">
            {message}
          </p>
        </div>
        <div className="space-y-2">
          <button
            onClick={() => { close(); openSignIn() }}
            className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            가입하기
          </button>
          <button
            onClick={close}
            className="w-full rounded-lg border py-3 text-sm font-semibold hover:bg-muted transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}
