"use client"

import Link from "next/link"
import { signOut } from "@/lib/auth/actions"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

import {
  getUserTypeLabel,
  getUserTypeBadgeColor,
} from "@/lib/auth/permissions"
import { Trophy, Settings, FileText, Shield, LogOut, User } from "lucide-react"
import type { Tables } from "@/lib/supabase/types"

interface ProfileDrawerProps {
  profile: Tables<"profiles">
}

export function ProfileDrawer({ profile }: ProfileDrawerProps) {
  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    await signOut()
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="flex items-center gap-2 text-sm">
          {(profile.user_type === "member" || profile.user_type === "ghost") && (
            <span className="text-xs font-medium text-primary">{profile.point_balance}P</span>
          )}
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
          </div>
          <span className="hidden sm:inline font-medium">{profile.nickname}</span>
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] sm:w-[350px]">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-left truncate">
                {profile.nickname}
              </SheetTitle>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${getUserTypeBadgeColor(profile.user_type)}`}
                >
                  {getUserTypeLabel(profile.user_type)}
                </span>
              </div>
            </div>
          </div>
        </SheetHeader>

        {(profile.user_type === "member" || profile.user_type === "ghost") && (
          <div className="mt-4 rounded-lg border bg-card p-4 text-center">
            <p className="text-sm text-muted-foreground">내 포인트</p>
            <p className="text-2xl font-bold">{profile.point_balance}P</p>
          </div>
        )}

        <nav className="mt-6 space-y-1">
          <SheetClose asChild>
            <Link
              href="/mypage"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-accent transition-colors"
            >
              <Settings className="h-4 w-4" />
              마이페이지
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link
              href="/ranking"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-accent transition-colors"
            >
              <Trophy className="h-4 w-4" />
              랭킹
            </Link>
          </SheetClose>
          {profile.user_type === "admin" && (
            <SheetClose asChild>
              <Link
                href="/admin/questions"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-accent transition-colors"
              >
                <Shield className="h-4 w-4" />
                질문 관리
              </Link>
            </SheetClose>
          )}
        </nav>

        <div className="mt-4 border-t pt-4 space-y-1">
          <SheetClose asChild>
            <Link
              href="/terms"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent transition-colors"
            >
              <FileText className="h-4 w-4" />
              이용약관
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link
              href="/privacy"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent transition-colors"
            >
              <Shield className="h-4 w-4" />
              개인정보처리방침
            </Link>
          </SheetClose>
        </div>

        <div className="mt-4 border-t pt-4 px-3">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            로그아웃
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
