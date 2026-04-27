'use client'

import type { ReactNode } from 'react'
import type { UserType } from '@/lib/auth/permissions'
import { usePermissions } from '@/hooks/use-permissions'

interface PermissionGuardProps {
  children: ReactNode
  userType: UserType | null | undefined
  requiredPermission: UserType
  fallback?: ReactNode
}

/**
 * 권한에 따라 컨텐츠를 보여주거나 숨기는 컴포넌트
 *
 * @example
 * ```tsx
 * <PermissionGuard
 *   userType={profile.user_type}
 *   requiredPermission={USER_TYPES.MEMBER}
 * >
 *   <Button>회원 전용 기능</Button>
 * </PermissionGuard>
 * ```
 */
export function PermissionGuard({
  children,
  userType,
  requiredPermission,
  fallback = null,
}: PermissionGuardProps) {
  const { hasPermission } = usePermissions(userType)

  if (!hasPermission(requiredPermission)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

interface AdminOnlyProps {
  children: ReactNode
  userType: UserType | null | undefined
  fallback?: ReactNode
}

/**
 * 관리자 전용 컴포넌트
 */
export function AdminOnly({ children, userType, fallback = null }: AdminOnlyProps) {
  const { isAdmin } = usePermissions(userType)

  if (!isAdmin()) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

interface MemberOnlyProps {
  children: ReactNode
  userType: UserType | null | undefined
  fallback?: ReactNode
}

/**
 * 회원 전용 컴포넌트
 */
export function MemberOnly({ children, userType, fallback = null }: MemberOnlyProps) {
  const { isMember } = usePermissions(userType)

  if (!isMember()) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
