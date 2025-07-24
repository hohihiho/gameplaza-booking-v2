import { User } from '../user'
import { Permission } from '../../value-objects/permission'
import { Role } from '../../value-objects/role'

describe('User Entity', () => {
  describe('create', () => {
    it('should create a user with required fields', () => {
      const user = User.create({
        id: 'user-123',
        email: 'test@example.com',
        fullName: 'Test User',
      })

      expect(user.id).toBe('user-123')
      expect(user.email).toBe('test@example.com')
      expect(user.fullName).toBe('Test User')
      expect(user.phone).toBeNull()
      expect(user.role).toBe('user')
    })

    it('should create a user with optional phone number', () => {
      const user = User.create({
        id: 'user-123',
        email: 'test@example.com',
        fullName: 'Test User',
        phone: '010-1234-5678',
      })

      expect(user.phone).toBe('010-1234-5678')
    })

    it('should create an admin user', () => {
      const admin = User.create({
        id: 'admin-123',
        email: 'admin@example.com',
        fullName: 'Admin User',
        role: 'admin',
      })

      expect(admin.role).toBe('admin')
      expect(admin.isAdmin()).toBe(true)
    })
  })

  describe('canReserve', () => {
    it('should allow regular users to make reservations', () => {
      const user = User.create({
        id: 'user-123',
        email: 'test@example.com',
        fullName: 'Test User',
      })

      expect(user.canReserve()).toBe(true)
    })

    it('should allow users without phone numbers to make reservations', () => {
      const user = User.create({
        id: 'user-123',
        email: 'test@example.com',
        fullName: 'Test User',
        phone: null,
      })

      expect(user.canReserve()).toBe(true)
    })
  })

  describe('updateProfile', () => {
    it('should update user profile', () => {
      const user = User.create({
        id: 'user-123',
        email: 'test@example.com',
        fullName: 'Test User',
      })

      const updatedUser = user.updateProfile({
        fullName: 'Updated Name',
        phone: '010-9876-5432',
      })

      expect(updatedUser.fullName).toBe('Updated Name')
      expect(updatedUser.phone).toBe('010-9876-5432')
      // 원본은 변경되지 않음
      expect(user.fullName).toBe('Test User')
      expect(user.phone).toBeNull()
    })

    it('should allow removing phone number', () => {
      const user = User.create({
        id: 'user-123',
        email: 'test@example.com',
        fullName: 'Test User',
        phone: '010-1234-5678',
      })

      const updatedUser = user.updateProfile({
        phone: null,
      })

      expect(updatedUser.phone).toBeNull()
      // 원본은 변경되지 않음
      expect(user.phone).toBe('010-1234-5678')
    })
  })

  describe('권한 관리', () => {
    describe('getRole', () => {
      it('사용자의 Role 값 객체를 반환해야 한다', () => {
        const user = User.create({
          id: 'user-123',
          email: 'test@example.com',
          fullName: 'Test User'
        })
        
        const role = user.getRole()
        expect(role).toBeInstanceOf(Role)
        expect(role.value).toBe('user')
      })

      it('관리자의 Role 값 객체를 반환해야 한다', () => {
        const admin = User.create({
          id: 'admin-123',
          email: 'admin@example.com',
          fullName: 'Admin User',
          role: 'admin'
        })
        
        const role = admin.getRole()
        expect(role.value).toBe('admin')
        expect(role.isAdmin()).toBe(true)
      })
    })

    describe('getPermissions', () => {
      it('일반 사용자의 기본 권한을 반환해야 한다', () => {
        const user = User.create({
          id: 'user-123',
          email: 'test@example.com',
          fullName: 'Test User'
        })
        
        const permissions = user.getPermissions()
        
        // 예약 권한 확인
        expect(permissions.some(p => p.value === 'reservation:create')).toBe(true)
        expect(permissions.some(p => p.value === 'reservation:read')).toBe(true)
        expect(permissions.some(p => p.value === 'reservation:update')).toBe(true)
        expect(permissions.some(p => p.value === 'reservation:delete')).toBe(true)
        
        // 관리자 권한은 없어야 함
        expect(permissions.some(p => p.value === 'reservation:approve')).toBe(false)
        expect(permissions.some(p => p.value === 'admin:read')).toBe(false)
      })

      it('관리자의 모든 권한을 반환해야 한다', () => {
        const admin = User.create({
          id: 'admin-123',
          email: 'admin@example.com',
          fullName: 'Admin User',
          role: 'admin'
        })
        
        const permissions = admin.getPermissions()
        
        // 관리자 특수 권한 확인
        expect(permissions.some(p => p.value === 'reservation:approve')).toBe(true)
        expect(permissions.some(p => p.value === 'reservation:reject')).toBe(true)
        expect(permissions.some(p => p.value === 'admin:read')).toBe(true)
        expect(permissions.some(p => p.value === 'analytics:export')).toBe(true)
      })
    })

    describe('hasPermission', () => {
      it('보유한 권한을 확인해야 한다', () => {
        const user = User.create({
          id: 'user-123',
          email: 'test@example.com',
          fullName: 'Test User'
        })
        
        expect(user.hasPermission('reservation:create')).toBe(true)
        expect(user.hasPermission('user:read')).toBe(true)
        expect(user.hasPermission(Permission.create('device', 'list'))).toBe(true)
      })

      it('보유하지 않은 권한을 확인해야 한다', () => {
        const user = User.create({
          id: 'user-123',
          email: 'test@example.com',
          fullName: 'Test User'
        })
        
        expect(user.hasPermission('reservation:approve')).toBe(false)
        expect(user.hasPermission('admin:read')).toBe(false)
        expect(user.hasPermission(Permission.create('banner', 'create'))).toBe(false)
      })
    })

    describe('canPerformAction', () => {
      it('수행 가능한 액션을 확인해야 한다', () => {
        const user = User.create({
          id: 'user-123',
          email: 'test@example.com',
          fullName: 'Test User'
        })
        
        expect(user.canPerformAction('reservation', 'create')).toBe(true)
        expect(user.canPerformAction('user', 'read')).toBe(true)
      })

      it('수행 불가능한 액션을 확인해야 한다', () => {
        const user = User.create({
          id: 'user-123',
          email: 'test@example.com',
          fullName: 'Test User'
        })
        
        expect(user.canPerformAction('reservation', 'approve')).toBe(false)
        expect(user.canPerformAction('invalid', 'read')).toBe(false)
      })
    })

    describe('hasAnyPermission', () => {
      it('여러 권한 중 하나라도 보유하고 있으면 true를 반환해야 한다', () => {
        const user = User.create({
          id: 'user-123',
          email: 'test@example.com',
          fullName: 'Test User'
        })
        
        expect(user.hasAnyPermission([
          'reservation:approve',
          'reservation:create',
          'admin:read'
        ])).toBe(true)
      })

      it('모든 권한을 보유하지 않으면 false를 반환해야 한다', () => {
        const user = User.create({
          id: 'user-123',
          email: 'test@example.com',
          fullName: 'Test User'
        })
        
        expect(user.hasAnyPermission([
          'reservation:approve',
          'admin:read'
        ])).toBe(false)
      })
    })

    describe('hasAllPermissions', () => {
      it('모든 권한을 보유하면 true를 반환해야 한다', () => {
        const user = User.create({
          id: 'user-123',
          email: 'test@example.com',
          fullName: 'Test User'
        })
        
        expect(user.hasAllPermissions([
          'reservation:create',
          'reservation:read',
          'user:read'
        ])).toBe(true)
      })

      it('하나라도 권한을 보유하지 않으면 false를 반환해야 한다', () => {
        const user = User.create({
          id: 'user-123',
          email: 'test@example.com',
          fullName: 'Test User'
        })
        
        expect(user.hasAllPermissions([
          'reservation:create',
          'reservation:approve'
        ])).toBe(false)
      })
    })

    describe('hasFullAccessTo', () => {
      it('리소스에 대한 전체 권한을 확인해야 한다', () => {
        const admin = User.create({
          id: 'admin-123',
          email: 'admin@example.com',
          fullName: 'Admin User',
          role: 'admin'
        })
        
        expect(admin.hasFullAccessTo('reservation')).toBe(true)
        expect(admin.hasFullAccessTo('user')).toBe(true)
      })

      it('일반 사용자는 제한된 리소스 접근 권한을 가져야 한다', () => {
        const user = User.create({
          id: 'user-123',
          email: 'test@example.com',
          fullName: 'Test User'
        })
        
        // 예약은 approve, reject, checkin 권한이 없으므로 false
        expect(user.hasFullAccessTo('reservation')).toBe(false)
        // admin 리소스는 접근 불가
        expect(user.hasFullAccessTo('admin')).toBe(false)
      })
    })

    describe('hasHigherPrivilegeThan', () => {
      it('권한 레벨을 비교해야 한다', () => {
        const admin = User.create({
          id: 'admin-123',
          email: 'admin@example.com',
          fullName: 'Admin User',
          role: 'admin'
        })
        
        const user = User.create({
          id: 'user-123',
          email: 'test@example.com',
          fullName: 'Test User'
        })
        
        expect(admin.hasHigherPrivilegeThan(user)).toBe(true)
        expect(user.hasHigherPrivilegeThan(admin)).toBe(false)
        expect(user.hasHigherPrivilegeThan(user)).toBe(false)
      })
    })

    describe('canAccess', () => {
      it('활성 사용자의 권한 접근을 허용해야 한다', () => {
        const user = User.create({
          id: 'user-123',
          email: 'test@example.com',
          fullName: 'Test User'
        })
        
        expect(user.canAccess('reservation:create')).toBe(true)
      })

      it('정지된 사용자의 권한 접근을 거부해야 한다', () => {
        const user = User.create({
          id: 'user-123',
          email: 'test@example.com',
          fullName: 'Test User',
          status: 'suspended',
          suspendedUntil: new Date(Date.now() + 60 * 60 * 1000)
        })
        
        expect(user.canAccess('reservation:create')).toBe(false)
      })

      it('차단된 사용자의 권한 접근을 거부해야 한다', () => {
        const user = User.create({
          id: 'user-123',
          email: 'test@example.com',
          fullName: 'Test User',
          status: 'banned',
          bannedReason: '규정 위반'
        })
        
        expect(user.canAccess('reservation:create')).toBe(false)
      })
    })
  })
})