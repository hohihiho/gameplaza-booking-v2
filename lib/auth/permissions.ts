// 권한 시스템 정의
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin', 
  VIP_MEMBER: 'vip_member',
  GOLD_MEMBER: 'gold_member',
  SILVER_MEMBER: 'silver_member',
  MEMBER: 'member',
} as const

export type Role = typeof ROLES[keyof typeof ROLES]

// 권한 계층 구조 (숫자가 높을수록 높은 권한)
export const ROLE_HIERARCHY: Record<Role, number> = {
  [ROLES.SUPER_ADMIN]: 100,
  [ROLES.ADMIN]: 50,
  [ROLES.VIP_MEMBER]: 30,
  [ROLES.GOLD_MEMBER]: 25,
  [ROLES.SILVER_MEMBER]: 20,
  [ROLES.MEMBER]: 10,
}

// 회원 등급별 혜택 설정
export const MEMBER_BENEFITS = {
  [ROLES.VIP_MEMBER]: {
    reservationLimit: 10, // 동시 예약 가능 수
    reservationDays: 30, // 예약 가능 일수
    priorityBooking: true, // 우선 예약
    discountRate: 20, // 할인율 (%)
  },
  [ROLES.GOLD_MEMBER]: {
    reservationLimit: 5,
    reservationDays: 14,
    priorityBooking: false,
    discountRate: 10,
  },
  [ROLES.SILVER_MEMBER]: {
    reservationLimit: 3,
    reservationDays: 7,
    priorityBooking: false,
    discountRate: 5,
  },
  [ROLES.MEMBER]: {
    reservationLimit: 2,
    reservationDays: 3,
    priorityBooking: false,
    discountRate: 0,
  },
}

// 권한별 접근 가능한 기능
export const PERMISSIONS = {
  // 슈퍼 관리자만 가능
  MANAGE_ADMINS: [ROLES.SUPER_ADMIN],
  SYSTEM_SETTINGS: [ROLES.SUPER_ADMIN],
  VIEW_ALL_DATA: [ROLES.SUPER_ADMIN],
  
  // 관리자 이상
  MANAGE_USERS: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  MANAGE_DEVICES: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  MANAGE_RESERVATIONS: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  VIEW_ANALYTICS: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  CHECKIN_USERS: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  
  // 모든 사용자
  CREATE_RESERVATION: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MEMBER],
  VIEW_OWN_RESERVATIONS: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MEMBER],
  UPDATE_PROFILE: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MEMBER],
} as const

export type Permission = keyof typeof PERMISSIONS

// 권한 체크 함수
export function hasPermission(userRole: Role | undefined, permission: Permission): boolean {
  if (!userRole) return false
  return PERMISSIONS[permission].includes(userRole)
}

// 역할 체크 함수
export function hasRole(userRole: Role | undefined, requiredRole: Role): boolean {
  if (!userRole) return false
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}

// 관리자인지 체크
export function isAdmin(userRole: Role | undefined): boolean {
  return hasRole(userRole, ROLES.ADMIN)
}

// 슈퍼 관리자인지 체크
export function isSuperAdmin(userRole: Role | undefined): boolean {
  return userRole === ROLES.SUPER_ADMIN
}

// 사용자 상태 정의
export const USER_STATUS = {
  ACTIVE: 'active',
  BLOCKED: 'blocked',
  SUSPENDED: 'suspended',
} as const

export type UserStatus = typeof USER_STATUS[keyof typeof USER_STATUS]

// 차단 사유 타입
export interface BlockReason {
  reason: string
  blockedAt: Date
  blockedBy: string
  expiresAt?: Date // 선택적: 일시 정지의 경우
}

// 차단된 사용자인지 체크
export function isBlocked(status: UserStatus | undefined): boolean {
  return status === USER_STATUS.BLOCKED || status === USER_STATUS.SUSPENDED
}

// 예약 가능한지 체크 (차단 상태 포함)
export function canMakeReservation(userRole: Role | undefined, status: UserStatus | undefined): boolean {
  if (isBlocked(status)) return false
  return hasPermission(userRole, 'CREATE_RESERVATION')
}