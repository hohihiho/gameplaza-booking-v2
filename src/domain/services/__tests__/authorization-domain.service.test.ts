import { AuthorizationDomainService } from '../authorization-domain.service'
import { User } from '../../entities/user'
import { Permission } from '../../value-objects/permission'
import { Role } from '../../value-objects/role'

describe('AuthorizationDomainService', () => {
  let authService: AuthorizationDomainService
  let regularUser: User
  let adminUser: User
  let suspendedUser: User
  let bannedUser: User

  beforeEach(() => {
    authService = new AuthorizationDomainService()

    regularUser = User.create({
      id: 'user-123',
      email: 'user@example.com',
      fullName: 'Regular User'
    })

    adminUser = User.create({
      id: 'admin-123',
      email: 'admin@example.com',
      fullName: 'Admin User',
      role: 'admin'
    })

    suspendedUser = User.create({
      id: 'suspended-123',
      email: 'suspended@example.com',
      fullName: 'Suspended User',
      status: 'suspended',
      suspendedUntil: new Date(Date.now() + 60 * 60 * 1000)
    })

    bannedUser = User.create({
      id: 'banned-123',
      email: 'banned@example.com',
      fullName: 'Banned User',
      status: 'banned',
      bannedReason: '규정 위반'
    })
  })

  describe('canPerformAction', () => {
    it('활성 사용자의 권한을 올바르게 확인해야 한다', () => {
      expect(authService.canPerformAction(regularUser, 'reservation', 'create')).toBe(true)
      expect(authService.canPerformAction(regularUser, 'reservation', 'read')).toBe(true)
      expect(authService.canPerformAction(regularUser, 'reservation', 'approve')).toBe(false)
    })

    it('관리자는 모든 권한을 가져야 한다', () => {
      expect(authService.canPerformAction(adminUser, 'reservation', 'approve')).toBe(true)
      expect(authService.canPerformAction(adminUser, 'admin', 'read')).toBe(true)
      expect(authService.canPerformAction(adminUser, 'analytics', 'export')).toBe(true)
    })

    it('비활성 사용자는 모든 권한이 거부되어야 한다', () => {
      expect(authService.canPerformAction(suspendedUser, 'reservation', 'create')).toBe(false)
      expect(authService.canPerformAction(bannedUser, 'user', 'read')).toBe(false)
    })
  })

  describe('isResourceOwner', () => {
    it('리소스 소유자를 올바르게 확인해야 한다', () => {
      expect(authService.isResourceOwner(regularUser, 'user-123')).toBe(true)
      expect(authService.isResourceOwner(regularUser, 'user-456')).toBe(false)
    })
  })

  describe('canAccessResource', () => {
    it('관리자는 모든 리소스에 접근할 수 있어야 한다', () => {
      expect(authService.canAccessResource(
        adminUser, 'reservation', 'delete', 'other-user-id'
      )).toBe(true)
    })

    it('소유자는 자신의 예약을 관리할 수 있어야 한다', () => {
      expect(authService.canAccessResource(
        regularUser, 'reservation', 'read', 'user-123'
      )).toBe(true)
      expect(authService.canAccessResource(
        regularUser, 'reservation', 'update', 'user-123'
      )).toBe(true)
      expect(authService.canAccessResource(
        regularUser, 'reservation', 'delete', 'user-123'
      )).toBe(true)
    })

    it('소유자가 아닌 경우 일반 권한으로 확인해야 한다', () => {
      expect(authService.canAccessResource(
        regularUser, 'reservation', 'create', 'other-user-id'
      )).toBe(true) // create는 일반 권한에 포함
      expect(authService.canAccessResource(
        regularUser, 'reservation', 'approve', 'user-123'
      )).toBe(false) // approve는 관리자 전용
    })
  })

  describe('requiresAdminRole', () => {
    it('관리자 전용 액션을 올바르게 식별해야 한다', () => {
      expect(authService.requiresAdminRole('reservation', 'approve')).toBe(true)
      expect(authService.requiresAdminRole('reservation', 'reject')).toBe(true)
      expect(authService.requiresAdminRole('analytics', 'export')).toBe(true)
      expect(authService.requiresAdminRole('user', 'delete')).toBe(true)
    })

    it('일반 액션은 관리자 전용이 아니어야 한다', () => {
      expect(authService.requiresAdminRole('reservation', 'create')).toBe(false)
      expect(authService.requiresAdminRole('user', 'read')).toBe(false)
      expect(authService.requiresAdminRole('device', 'list')).toBe(false)
    })
  })

  describe('checkRoleBasedAccess', () => {
    it('역할 기반 접근을 올바르게 확인해야 한다', () => {
      const adminRole = Role.admin()
      const userRole = Role.user()

      expect(authService.checkRoleBasedAccess(adminRole, userRole)).toBe(true)
      expect(authService.checkRoleBasedAccess(userRole, adminRole)).toBe(false)
      expect(authService.checkRoleBasedAccess(userRole, userRole)).toBe(true)
    })
  })

  describe('canManageReservation', () => {
    it('관리자는 모든 예약을 관리할 수 있어야 한다', () => {
      expect(authService.canManageReservation(adminUser, 'any-user-id', 'approve')).toBe(true)
      expect(authService.canManageReservation(adminUser, 'any-user-id', 'reject')).toBe(true)
      expect(authService.canManageReservation(adminUser, 'any-user-id', 'checkin')).toBe(true)
    })

    it('일반 사용자는 예약 관리 권한이 없어야 한다', () => {
      expect(authService.canManageReservation(regularUser, 'user-123', 'approve')).toBe(false)
      expect(authService.canManageReservation(regularUser, 'user-123', 'reject')).toBe(false)
      expect(authService.canManageReservation(regularUser, 'user-123', 'checkin')).toBe(false)
    })
  })

  describe('canManageUser', () => {
    it('사용자는 자신의 정보를 읽고 수정할 수 있어야 한다', () => {
      expect(authService.canManageUser(regularUser, 'user-123', 'read')).toBe(true)
      expect(authService.canManageUser(regularUser, 'user-123', 'update')).toBe(true)
    })

    it('사용자는 자신의 계정을 삭제할 수 없어야 한다', () => {
      expect(authService.canManageUser(regularUser, 'user-123', 'delete')).toBe(false)
    })

    it('관리자는 모든 사용자를 관리할 수 있어야 한다', () => {
      expect(authService.canManageUser(adminUser, 'other-user-id', 'read')).toBe(true)
      expect(authService.canManageUser(adminUser, 'other-user-id', 'update')).toBe(true)
      expect(authService.canManageUser(adminUser, 'other-user-id', 'delete')).toBe(true)
    })
  })

  describe('getAccessDeniedMessage', () => {
    it('권한 부족 메시지를 올바르게 생성해야 한다', () => {
      expect(authService.getAccessDeniedMessage('reservation', 'approve'))
        .toBe('권한이 부족합니다: 예약 승인')
      expect(authService.getAccessDeniedMessage('user', 'delete'))
        .toBe('권한이 부족합니다: 사용자 삭제')
    })
  })

  describe('validateAccess', () => {
    it('비활성 계정에 대한 접근을 거부해야 한다', () => {
      const result = authService.validateAccess(suspendedUser, 'reservation', 'create')
      
      expect(result.allowed).toBe(false)
      expect(result.reason).toBe('계정이 정지되었습니다')
    })

    it('차단된 계정에 대한 접근을 거부해야 한다', () => {
      const result = authService.validateAccess(bannedUser, 'reservation', 'create')
      
      expect(result.allowed).toBe(false)
      expect(result.reason).toBe('계정이 차단되었습니다: 규정 위반')
    })

    it('관리자는 모든 접근이 허용되어야 한다', () => {
      const result = authService.validateAccess(adminUser, 'admin', 'delete')
      
      expect(result.allowed).toBe(true)
      expect(result.reason).toBeUndefined()
    })

    it('관리자 전용 기능에 대한 접근을 거부해야 한다', () => {
      const result = authService.validateAccess(regularUser, 'reservation', 'approve')
      
      expect(result.allowed).toBe(false)
      expect(result.reason).toBe('관리자 권한이 필요합니다')
      expect(result.requiredRole?.isAdmin()).toBe(true)
    })

    it('권한이 없는 리소스 접근을 거부해야 한다', () => {
      const result = authService.validateAccess(regularUser, 'admin', 'read')
      
      expect(result.allowed).toBe(false)
      expect(result.reason).toBe('관리자 권한이 필요합니다')
      expect(result.requiredRole?.isAdmin()).toBe(true)
    })

    it('소유자의 리소스 접근을 허용해야 한다', () => {
      const result = authService.validateAccess(
        regularUser, 'reservation', 'update', 'user-123'
      )
      
      expect(result.allowed).toBe(true)
    })
  })
})