import type { Database } from '@/lib/supabase/types'

// User Type 타입 정의
export type UserType = Database['public']['Enums']['user_type']

// Profile 타입 정의
export type Profile = Database['public']['Tables']['profiles']['Row']

// 사용자 권한 레벨 정의
export const USER_TYPES = {
  GUEST: 'guest' as UserType,
  GHOST: 'ghost' as UserType,
  MEMBER: 'member' as UserType,
  ADMIN: 'admin' as UserType,
} as const

// 각 유저 타입별 권한 레벨 (숫자가 높을수록 높은 권한)
export const USER_TYPE_LEVELS = {
  guest: 0,
  ghost: 1,
  member: 2,
  admin: 10,
} as const

/**
 * 사용자가 특정 권한을 가지고 있는지 확인
 */
export function hasPermission(
  userType: UserType | null | undefined,
  requiredType: UserType
): boolean {
  if (!userType) return false
  return USER_TYPE_LEVELS[userType] >= USER_TYPE_LEVELS[requiredType]
}

/**
 * 사용자가 관리자인지 확인
 */
export function isAdmin(userType: UserType | null | undefined): boolean {
  return userType === USER_TYPES.ADMIN
}

/**
 * 사용자가 회원인지 확인 (member 이상)
 */
export function isMember(userType: UserType | null | undefined): boolean {
  return hasPermission(userType, USER_TYPES.MEMBER)
}

/**
 * 사용자가 게스트인지 확인
 */
export function isGuest(userType: UserType | null | undefined): boolean {
  return userType === USER_TYPES.GUEST
}

/**
 * 사용자가 고스트인지 확인
 */
export function isGhost(userType: UserType | null | undefined): boolean {
  return userType === USER_TYPES.GHOST
}

/**
 * 사용자 타입에 따른 표시 레이블
 */
export function getUserTypeLabel(userType: UserType | null | undefined): string {
  switch (userType) {
    case USER_TYPES.ADMIN:
      return '관리자'
    case USER_TYPES.MEMBER:
      return '회원'
    case USER_TYPES.GHOST:
      return '고스트'
    case USER_TYPES.GUEST:
      return '게스트'
    default:
      return '알 수 없음'
  }
}

/**
 * 사용자 레벨에 따른 뱃지 색상
 */
export function getUserTypeBadgeColor(userType: UserType | null | undefined): string {
  switch (userType) {
    case USER_TYPES.ADMIN:
      return 'bg-red-500 text-white'
    case USER_TYPES.MEMBER:
      return 'bg-blue-500 text-white'
    case USER_TYPES.GHOST:
      return 'bg-gray-500 text-white'
    case USER_TYPES.GUEST:
      return 'bg-gray-300 text-gray-700'
    default:
      return 'bg-gray-200 text-gray-600'
  }
}

/**
 * 레벨에 따른 표시 (레벨이 1 이상일 때)
 */
export function getUserLevelLabel(level: number | null | undefined): string {
  if (!level || level < 1) return 'Lv.1'
  return `Lv.${level}`
}
