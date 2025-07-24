import { User } from '../entities/user'
import { Permission, ResourceType, ActionType } from '../value-objects/permission'
import { Role } from '../value-objects/role'

/**
 * 인가 도메인 서비스
 * 권한 확인 및 접근 제어 로직 처리
 */
export class AuthorizationDomainService {
  /**
   * 사용자가 특정 작업을 수행할 수 있는지 확인
   */
  canPerformAction(
    user: User,
    resource: ResourceType,
    action: ActionType
  ): boolean {
    // 계정이 활성 상태가 아니면 모든 권한 거부
    if (!user.isActive()) {
      return false
    }

    const permission = Permission.create(resource, action)
    return user.hasPermission(permission)
  }

  /**
   * 리소스 소유자 확인
   * 사용자가 특정 리소스의 소유자인지 확인
   */
  isResourceOwner(
    user: User,
    resourceOwnerId: string
  ): boolean {
    return user.id === resourceOwnerId
  }

  /**
   * 리소스 접근 권한 확인
   * 소유자이거나 관리자이거나 특정 권한이 있는 경우 접근 허용
   */
  canAccessResource(
    user: User,
    resource: ResourceType,
    action: ActionType,
    resourceOwnerId?: string
  ): boolean {
    // 관리자는 모든 리소스에 접근 가능
    if (user.isAdmin()) {
      return true
    }

    // 소유자인 경우 자신의 리소스에 대한 기본 권한 허용
    if (resourceOwnerId && this.isResourceOwner(user, resourceOwnerId)) {
      const ownerAllowedActions = this.getOwnerAllowedActions(resource)
      if (ownerAllowedActions.includes(action)) {
        return true
      }
    }

    // 일반 권한 확인
    return this.canPerformAction(user, resource, action)
  }

  /**
   * 리소스 소유자에게 허용되는 기본 액션 목록
   */
  private getOwnerAllowedActions(resource: ResourceType): ActionType[] {
    switch (resource) {
      case 'reservation':
        return ['read', 'update', 'delete', 'list']
      case 'user':
        return ['read', 'update']
      default:
        return ['read']
    }
  }

  /**
   * 관리자 권한 필요 여부 확인
   */
  requiresAdminRole(resource: ResourceType, action: ActionType): boolean {
    const adminOnlyActions: { resource: ResourceType; actions: ActionType[] }[] = [
      { resource: 'admin', actions: ['create', 'read', 'update', 'delete', 'list'] },
      { resource: 'analytics', actions: ['export'] },
      { resource: 'reservation', actions: ['approve', 'reject'] },
      { resource: 'user', actions: ['delete'] },
      { resource: 'device', actions: ['create', 'update', 'delete'] },
      { resource: 'banner', actions: ['create', 'update', 'delete'] },
      { resource: 'credit', actions: ['create', 'update', 'delete'] }
    ]

    const rule = adminOnlyActions.find(r => r.resource === resource)
    return rule ? rule.actions.includes(action) : false
  }

  /**
   * 역할 기반 접근 제어 (RBAC) 확인
   */
  checkRoleBasedAccess(
    userRole: Role,
    requiredRole: Role
  ): boolean {
    return userRole.hasMinimumRole(requiredRole.value)
  }

  /**
   * 예약 관련 특별 권한 확인
   */
  canManageReservation(
    user: User,
    reservationOwnerId: string,
    action: 'approve' | 'reject' | 'checkin'
  ): boolean {
    // 관리자는 모든 예약 관리 가능
    if (user.isAdmin()) {
      return true
    }

    // 일반 사용자는 자신의 예약만 취소(delete) 가능
    // approve, reject, checkin은 관리자만 가능
    return false
  }

  /**
   * 사용자 관리 권한 확인
   */
  canManageUser(
    actor: User,
    targetUserId: string,
    action: ActionType
  ): boolean {
    // 자기 자신의 정보는 read, update만 가능
    if (actor.id === targetUserId) {
      return ['read', 'update'].includes(action)
    }

    // 다른 사용자 관리는 관리자만 가능
    return actor.isAdmin()
  }

  /**
   * 권한 부족 에러 메시지 생성
   */
  getAccessDeniedMessage(
    resource: ResourceType,
    action: ActionType
  ): string {
    const permission = Permission.create(resource, action)
    return `권한이 부족합니다: ${permission.toDescription()}`
  }

  /**
   * 권한 검증 결과 상세 정보
   */
  validateAccess(
    user: User,
    resource: ResourceType,
    action: ActionType,
    resourceOwnerId?: string
  ): {
    allowed: boolean
    reason?: string
    requiredRole?: Role
    missingPermission?: Permission
  } {
    // 비활성 계정
    if (!user.isActive()) {
      return {
        allowed: false,
        reason: user.status === 'banned' 
          ? `계정이 차단되었습니다: ${user.bannedReason}`
          : '계정이 정지되었습니다'
      }
    }

    // 관리자는 모든 권한 허용
    if (user.isAdmin()) {
      return { allowed: true }
    }

    // 관리자 전용 기능
    if (this.requiresAdminRole(resource, action)) {
      return {
        allowed: false,
        reason: '관리자 권한이 필요합니다',
        requiredRole: Role.admin()
      }
    }

    // 리소스 접근 권한 확인
    const hasAccess = this.canAccessResource(user, resource, action, resourceOwnerId)
    
    if (!hasAccess) {
      const permission = Permission.create(resource, action)
      return {
        allowed: false,
        reason: this.getAccessDeniedMessage(resource, action),
        missingPermission: permission
      }
    }

    return { allowed: true }
  }
}