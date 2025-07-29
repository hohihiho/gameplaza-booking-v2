/**
 * 사용자 역할 값 객체
 * Role 값 객체의 간단한 래퍼 버전
 */

import { Role, RoleType } from './role'

export type UserRole = RoleType
export { Role, RoleType, type UserRole as UserRoleType }

/**
 * UserRole 유틸리티 함수들
 */
export class UserRoleUtils {
  /**
   * UserRole에서 Role 객체 생성
   */
  static toRole(userRole: UserRole): Role {
    return Role.create(userRole)
  }

  /**
   * Role 객체에서 UserRole 추출
   */
  static fromRole(role: Role): UserRole {
    return role.value
  }

  /**
   * 문자열에서 UserRole 생성 (유효성 검사 포함)
   */
  static fromString(roleString: string): UserRole {
    const role = Role.fromString(roleString)
    return role.value
  }

  /**
   * UserRole 유효성 검사
   */
  static isValid(userRole: string): userRole is UserRole {
    return Role.isValidRole(userRole)
  }

  /**
   * 관리자 역할인지 확인
   */
  static isAdmin(userRole: UserRole): boolean {
    return userRole === 'admin' || userRole === 'superadmin'
  }

  /**
   * 슈퍼관리자 역할인지 확인
   */
  static isSuperAdmin(userRole: UserRole): boolean {
    return userRole === 'superadmin'
  }

  /**
   * 일반 사용자 역할인지 확인
   */
  static isUser(userRole: UserRole): boolean {
    return userRole === 'user'
  }
}