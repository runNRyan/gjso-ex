'use client'

import Link from 'next/link'
import { signOut } from '@/lib/auth/actions'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import type { Tables } from '@/lib/supabase/types'
import {
  getUserTypeLabel,
  getUserTypeBadgeColor,
} from '@/lib/auth/permissions'
import { ProfileDrawer } from './profile-drawer'

interface UserMenuProps {
  profile: Tables<'profiles'>
}

export default function UserMenu({ profile }: UserMenuProps) {
  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    await signOut()
  }

  return (
    <>
      {/* Mobile: Profile Drawer */}
      <div className="sm:hidden">
        <ProfileDrawer profile={profile} />
      </div>

      {/* Desktop: Inline Menu */}
      <div className="hidden sm:flex items-center gap-4">
        <div className="text-sm">
          <div className="flex items-center gap-2">
            <Link href="/mypage" className="font-medium text-white hover:underline">
              {profile.nickname}
            </Link>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${getUserTypeBadgeColor(profile.user_type)}`}
            >
              {getUserTypeLabel(profile.user_type)}
            </span>
            {(profile.user_type === 'member' || profile.user_type === 'ghost') && (
              <span className="text-xs font-medium text-white bg-white/15 px-2 py-0.5 rounded-full">
                {profile.point_balance}P
              </span>
            )}
          </div>
        </div>
        {profile.user_type === 'admin' && (
          <Link
            href="/admin/questions"
            className="text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            질문 관리
          </Link>
        )}
        <Button onClick={handleSignOut} variant="outline" size="sm" className="bg-transparent border-white/50 text-white hover:bg-white/10 hover:text-white">
          로그아웃
        </Button>
      </div>
    </>
  )
}
