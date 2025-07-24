import { Admin } from '../admin'
import { AdminPermissions } from '../../value-objects/admin-permissions'

describe('Admin Entity', () => {
  describe('create', () => {
    it('일반 관리자를 생성해야 한다', () => {
      const admin = Admin.create({
        id: 'admin-123',
        userId: 'user-123',
        permissions: {
          reservations: true,
          users: false,
          devices: true,
          cms: false,
          settings: false
        }
      })

      expect(admin.id).toBe('admin-123')
      expect(admin.userId).toBe('user-123')
      expect(admin.isSuperAdmin).toBe(false)
      expect(admin.canManageReservations()).toBe(true)
      expect(admin.canManageUsers()).toBe(false)
    })

    it('슈퍼관리자를 생성해야 한다', () => {
      const superAdmin = Admin.create({
        id: 'admin-123',
        userId: 'user-123',
        isSuperAdmin: true
      })

      expect(superAdmin.isSuperAdmin).toBe(true)
      expect(superAdmin.canManageReservations()).toBe(true)
      expect(superAdmin.canManageUsers()).toBe(true)
      expect(superAdmin.canManageDevices()).toBe(true)
      expect(superAdmin.canManageCMS()).toBe(true)
      expect(superAdmin.canManageSettings()).toBe(true)
    })

    it('기본 권한으로 관리자를 생성해야 한다', () => {
      const admin = Admin.create({
        id: 'admin-123',
        userId: 'user-123'
      })

      expect(admin.canManageReservations()).toBe(true)
      expect(admin.canManageUsers()).toBe(true)
      expect(admin.canManageDevices()).toBe(true)
      expect(admin.canManageCMS()).toBe(true)
      expect(admin.canManageSettings()).toBe(false) // 기본값
    })
  })

  describe('static factory methods', () => {
    it('createSuperAdmin으로 슈퍼관리자를 생성해야 한다', () => {
      const superAdmin = Admin.createSuperAdmin({
        id: 'admin-123',
        userId: 'user-123'
      })

      expect(superAdmin.isSuperAdmin).toBe(true)
      expect(superAdmin.canManageAdmins()).toBe(true)
      
      // 모든 권한 보유
      const permissions = superAdmin.permissions.toArray()
      expect(permissions).toHaveLength(5)
    })

    it('createRegularAdmin으로 일반 관리자를 생성해야 한다', () => {
      const admin = Admin.createRegularAdmin({
        id: 'admin-123',
        userId: 'user-123',
        permissions: {
          users: false,
          settings: true
        }
      })

      expect(admin.isSuperAdmin).toBe(false)
      expect(admin.canManageAdmins()).toBe(false)
      expect(admin.canManageUsers()).toBe(false)
      expect(admin.canManageSettings()).toBe(true)
    })
  })

  describe('permission updates', () => {
    it('일반 관리자의 권한을 업데이트해야 한다', () => {
      const admin = Admin.createRegularAdmin({
        id: 'admin-123',
        userId: 'user-123',
        permissions: {
          users: false
        }
      })

      const updated = admin.updatePermissions({
        users: true,
        settings: true
      })

      expect(updated.canManageUsers()).toBe(true)
      expect(updated.canManageSettings()).toBe(true)
      
      // 원본은 변경되지 않음
      expect(admin.canManageUsers()).toBe(false)
    })

    it('슈퍼관리자의 권한은 변경할 수 없어야 한다', () => {
      const superAdmin = Admin.createSuperAdmin({
        id: 'admin-123',
        userId: 'user-123'
      })

      const updated = superAdmin.updatePermissions({
        users: false,
        settings: false
      })

      // 변경되지 않음
      expect(updated).toBe(superAdmin)
      expect(updated.canManageUsers()).toBe(true)
      expect(updated.canManageSettings()).toBe(true)
    })
  })

  describe('grant and revoke permissions', () => {
    it('일반 관리자에게 권한을 부여해야 한다', () => {
      const admin = Admin.createRegularAdmin({
        id: 'admin-123',
        userId: 'user-123',
        permissions: {
          settings: false
        }
      })

      const granted = admin.grantPermission('settings')

      expect(granted.canManageSettings()).toBe(true)
      expect(admin.canManageSettings()).toBe(false) // 원본 불변
    })

    it('일반 관리자의 권한을 제거해야 한다', () => {
      const admin = Admin.createRegularAdmin({
        id: 'admin-123',
        userId: 'user-123'
      })

      const revoked = admin.revokePermission('users')

      expect(revoked.canManageUsers()).toBe(false)
      expect(admin.canManageUsers()).toBe(true) // 원본 불변
    })

    it('슈퍼관리자의 권한은 부여/제거할 수 없어야 한다', () => {
      const superAdmin = Admin.createSuperAdmin({
        id: 'admin-123',
        userId: 'user-123'
      })

      const granted = superAdmin.grantPermission('settings')
      const revoked = superAdmin.revokePermission('users')

      expect(granted).toBe(superAdmin)
      expect(revoked).toBe(superAdmin)
      expect(superAdmin.canManageSettings()).toBe(true)
      expect(superAdmin.canManageUsers()).toBe(true)
    })
  })

  describe('promotion and demotion', () => {
    it('일반 관리자를 슈퍼관리자로 승격해야 한다', () => {
      const admin = Admin.createRegularAdmin({
        id: 'admin-123',
        userId: 'user-123',
        permissions: {
          users: false,
          settings: false
        }
      })

      const promoted = admin.promoteToSuperAdmin()

      expect(promoted.isSuperAdmin).toBe(true)
      expect(promoted.canManageAdmins()).toBe(true)
      expect(promoted.canManageUsers()).toBe(true)
      expect(promoted.canManageSettings()).toBe(true)
      
      // 원본은 변경되지 않음
      expect(admin.isSuperAdmin).toBe(false)
    })

    it('슈퍼관리자를 일반 관리자로 강등해야 한다', () => {
      const superAdmin = Admin.createSuperAdmin({
        id: 'admin-123',
        userId: 'user-123'
      })

      const demoted = superAdmin.demoteFromSuperAdmin()

      expect(demoted.isSuperAdmin).toBe(false)
      expect(demoted.canManageAdmins()).toBe(false)
      // 기본 관리자 권한은 유지
      expect(demoted.canManageReservations()).toBe(true)
      expect(demoted.canManageUsers()).toBe(true)
      
      // 원본은 변경되지 않음
      expect(superAdmin.isSuperAdmin).toBe(true)
    })

    it('이미 슈퍼관리자인 경우 승격하지 않아야 한다', () => {
      const superAdmin = Admin.createSuperAdmin({
        id: 'admin-123',
        userId: 'user-123'
      })

      const promoted = superAdmin.promoteToSuperAdmin()

      expect(promoted).toBe(superAdmin)
    })

    it('이미 일반 관리자인 경우 강등하지 않아야 한다', () => {
      const admin = Admin.createRegularAdmin({
        id: 'admin-123',
        userId: 'user-123'
      })

      const demoted = admin.demoteFromSuperAdmin()

      expect(demoted).toBe(admin)
    })
  })

  describe('canManageAdmins', () => {
    it('슈퍼관리자만 관리자를 관리할 수 있어야 한다', () => {
      const superAdmin = Admin.createSuperAdmin({
        id: 'admin-123',
        userId: 'user-123'
      })

      const admin = Admin.createRegularAdmin({
        id: 'admin-456',
        userId: 'user-456'
      })

      expect(superAdmin.canManageAdmins()).toBe(true)
      expect(admin.canManageAdmins()).toBe(false)
    })
  })

  describe('canModify', () => {
    it('슈퍼관리자는 모든 관리자를 수정할 수 있어야 한다', () => {
      const superAdmin = Admin.createSuperAdmin({
        id: 'admin-123',
        userId: 'user-123'
      })

      const anotherSuperAdmin = Admin.createSuperAdmin({
        id: 'admin-456',
        userId: 'user-456'
      })

      const regularAdmin = Admin.createRegularAdmin({
        id: 'admin-789',
        userId: 'user-789'
      })

      expect(superAdmin.canModify(superAdmin)).toBe(true) // 자기 자신
      expect(superAdmin.canModify(anotherSuperAdmin)).toBe(true)
      expect(superAdmin.canModify(regularAdmin)).toBe(true)
    })

    it('일반 관리자는 아무도 수정할 수 없어야 한다', () => {
      const admin = Admin.createRegularAdmin({
        id: 'admin-123',
        userId: 'user-123'
      })

      const anotherAdmin = Admin.createRegularAdmin({
        id: 'admin-456',
        userId: 'user-456'
      })

      expect(admin.canModify(admin)).toBe(false)
      expect(admin.canModify(anotherAdmin)).toBe(false)
    })
  })

  describe('canDelete', () => {
    it('슈퍼관리자는 일반 관리자를 삭제할 수 있어야 한다', () => {
      const superAdmin = Admin.createSuperAdmin({
        id: 'admin-123',
        userId: 'user-123'
      })

      const regularAdmin = Admin.createRegularAdmin({
        id: 'admin-456',
        userId: 'user-456'
      })

      expect(superAdmin.canDelete(regularAdmin)).toBe(true)
    })

    it('슈퍼관리자는 자기 자신을 삭제할 수 없어야 한다', () => {
      const superAdmin = Admin.createSuperAdmin({
        id: 'admin-123',
        userId: 'user-123'
      })

      expect(superAdmin.canDelete(superAdmin)).toBe(false)
    })

    it('슈퍼관리자는 다른 슈퍼관리자를 삭제할 수 없어야 한다', () => {
      const superAdmin1 = Admin.createSuperAdmin({
        id: 'admin-123',
        userId: 'user-123'
      })

      const superAdmin2 = Admin.createSuperAdmin({
        id: 'admin-456',
        userId: 'user-456'
      })

      expect(superAdmin1.canDelete(superAdmin2)).toBe(false)
    })

    it('일반 관리자는 아무도 삭제할 수 없어야 한다', () => {
      const admin1 = Admin.createRegularAdmin({
        id: 'admin-123',
        userId: 'user-123'
      })

      const admin2 = Admin.createRegularAdmin({
        id: 'admin-456',
        userId: 'user-456'
      })

      expect(admin1.canDelete(admin1)).toBe(false)
      expect(admin1.canDelete(admin2)).toBe(false)
    })
  })

  describe('toJSON', () => {
    it('Admin을 JSON으로 변환해야 한다', () => {
      const admin = Admin.create({
        id: 'admin-123',
        userId: 'user-123',
        permissions: {
          users: false,
          settings: true
        },
        isSuperAdmin: false
      })

      const json = admin.toJSON()

      expect(json).toEqual({
        id: 'admin-123',
        userId: 'user-123',
        permissions: {
          reservations: true,
          users: false,
          devices: true,
          cms: true,
          settings: true
        },
        isSuperAdmin: false,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      })
    })
  })

  describe('equals', () => {
    it('ID로 동등성을 비교해야 한다', () => {
      const admin1 = Admin.create({
        id: 'admin-123',
        userId: 'user-123'
      })

      const admin2 = Admin.create({
        id: 'admin-123',
        userId: 'user-456' // 다른 userId
      })

      const admin3 = Admin.create({
        id: 'admin-456',
        userId: 'user-123'
      })

      expect(admin1.equals(admin2)).toBe(true) // 같은 ID
      expect(admin1.equals(admin3)).toBe(false) // 다른 ID
    })
  })
})