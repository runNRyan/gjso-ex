import { useMemo } from 'react'
import type { UserType } from '@/lib/auth/permissions'
import {
  hasPermission,
  isAdmin,
  isMember,
  isGuest,
  isGhost,
  USER_TYPES,
} from '@/lib/auth/permissions'

/**
 * 사용자 권한을 확인하는 커스텀 훅
 */
export function usePermissions(userType: UserType | null | undefined) {
  return useMemo(
    () => ({
      // 권한 체크 함수들
      hasPermission: (requiredType: UserType) => hasPermission(userType, requiredType),
      isAdmin: () => isAdmin(userType),
      isMember: () => isMember(userType),
      isGuest: () => isGuest(userType),
      isGhost: () => isGhost(userType),

      // 권한별 체크
      canCreateQuestion: () => hasPermission(userType, USER_TYPES.MEMBER),
      canVote: () => !!userType, // 로그인된 사용자면 투표 가능
      canComment: () => !!userType, // 로그인된 사용자면 댓글 가능
      canPredict: () => hasPermission(userType, USER_TYPES.MEMBER),
      canManageUsers: () => isAdmin(userType),
      canModerateContent: () => hasPermission(userType, USER_TYPES.ADMIN),
    }),
    [userType]
  )
}
