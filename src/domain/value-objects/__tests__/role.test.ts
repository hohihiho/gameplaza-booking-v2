import { Role } from '../role'

describe('Role', () => {
  describe('create', () => {
    it('admin 역할을 생성해야 한다', () => {
      const role = Role.create('admin')
      
      expect(role.value).toBe('admin')
      expect(role.displayName).toBe('관리자')
      expect(role.level).toBe(100)
    })

    it('user 역할을 생성해야 한다', () => {
      const role = Role.create('user')
      
      expect(role.value).toBe('user')
      expect(role.displayName).toBe('일반 사용자')
      expect(role.level).toBe(10)
    })

    it('superadmin 역할을 생성해야 한다', () => {
      const role = Role.create('superadmin')
      
      expect(role.value).toBe('superadmin')
      expect(role.displayName).toBe('슈퍼관리자')
      expect(role.level).toBe(1000)
    })

    it('잘못된 역할로 생성 시 에러가 발생해야 한다', () => {
      expect(() => Role.create('invalid' as any)).toThrow('Invalid role: invalid')
    })
  })

  describe('static factory methods', () => {
    it('admin() 메서드로 관리자 역할을 생성해야 한다', () => {
      const role = Role.admin()
      expect(role.value).toBe('admin')
    })

    it('user() 메서드로 일반 사용자 역할을 생성해야 한다', () => {
      const role = Role.user()
      expect(role.value).toBe('user')
    })

    it('superadmin() 메서드로 슈퍼관리자 역할을 생성해야 한다', () => {
      const role = Role.superadmin()
      expect(role.value).toBe('superadmin')
    })
  })

  describe('fromString', () => {
    it('문자열에서 역할을 생성해야 한다', () => {
      const adminRole = Role.fromString('admin')
      expect(adminRole.value).toBe('admin')

      const userRole = Role.fromString('user')
      expect(userRole.value).toBe('user')

      const superadminRole = Role.fromString('superadmin')
      expect(superadminRole.value).toBe('superadmin')
    })

    it('잘못된 문자열로 생성 시 에러가 발생해야 한다', () => {
      expect(() => Role.fromString('guest')).toThrow('Invalid role: guest')
    })
  })

  describe('isValidRole', () => {
    it('유효한 역할 문자열을 확인해야 한다', () => {
      expect(Role.isValidRole('admin')).toBe(true)
      expect(Role.isValidRole('user')).toBe(true)
      expect(Role.isValidRole('superadmin')).toBe(true)
      expect(Role.isValidRole('guest')).toBe(false)
    })
  })

  describe('getAllRoles', () => {
    it('모든 역할 목록을 반환해야 한다', () => {
      const roles = Role.getAllRoles()
      
      expect(roles).toHaveLength(3)
      expect(roles[0].value).toBe('user')
      expect(roles[1].value).toBe('admin')
      expect(roles[2].value).toBe('superadmin')
    })
  })

  describe('role checks', () => {
    it('isAdmin()이 올바르게 동작해야 한다', () => {
      const admin = Role.admin()
      const user = Role.user()
      
      expect(admin.isAdmin()).toBe(true)
      expect(user.isAdmin()).toBe(false)
    })

    it('isUser()가 올바르게 동작해야 한다', () => {
      const admin = Role.admin()
      const user = Role.user()
      
      expect(admin.isUser()).toBe(false)
      expect(user.isUser()).toBe(true)
    })

    it('isSuperAdmin()이 올바르게 동작해야 한다', () => {
      const superadmin = Role.superadmin()
      const admin = Role.admin()
      const user = Role.user()
      
      expect(superadmin.isSuperAdmin()).toBe(true)
      expect(admin.isSuperAdmin()).toBe(false)
      expect(user.isSuperAdmin()).toBe(false)
    })
  })

  describe('privilege comparisons', () => {
    let superadmin: Role
    let admin: Role
    let user: Role

    beforeEach(() => {
      superadmin = Role.superadmin()
      admin = Role.admin()
      user = Role.user()
    })

    it('hasHigherPrivilegeThan()이 올바르게 동작해야 한다', () => {
      expect(superadmin.hasHigherPrivilegeThan(admin)).toBe(true)
      expect(superadmin.hasHigherPrivilegeThan(user)).toBe(true)
      expect(admin.hasHigherPrivilegeThan(user)).toBe(true)
      expect(user.hasHigherPrivilegeThan(admin)).toBe(false)
      expect(admin.hasHigherPrivilegeThan(superadmin)).toBe(false)
      expect(admin.hasHigherPrivilegeThan(admin)).toBe(false)
    })

    it('hasLowerPrivilegeThan()이 올바르게 동작해야 한다', () => {
      expect(admin.hasLowerPrivilegeThan(user)).toBe(false)
      expect(user.hasLowerPrivilegeThan(admin)).toBe(true)
      expect(admin.hasLowerPrivilegeThan(admin)).toBe(false)
    })

    it('hasSamePrivilegeAs()가 올바르게 동작해야 한다', () => {
      const anotherAdmin = Role.admin()
      const anotherUser = Role.user()
      
      expect(admin.hasSamePrivilegeAs(anotherAdmin)).toBe(true)
      expect(user.hasSamePrivilegeAs(anotherUser)).toBe(true)
      expect(admin.hasSamePrivilegeAs(user)).toBe(false)
    })

    it('hasMinimumRole()이 올바르게 동작해야 한다', () => {
      expect(admin.hasMinimumRole('user')).toBe(true)
      expect(admin.hasMinimumRole('admin')).toBe(true)
      expect(user.hasMinimumRole('user')).toBe(true)
      expect(user.hasMinimumRole('admin')).toBe(false)
    })
  })

  describe('equals', () => {
    it('동일한 역할을 비교해야 한다', () => {
      const role1 = Role.admin()
      const role2 = Role.admin()
      const role3 = Role.user()
      
      expect(role1.equals(role2)).toBe(true)
      expect(role1.equals(role3)).toBe(false)
    })
  })

  describe('string representations', () => {
    it('toString()이 역할 값을 반환해야 한다', () => {
      expect(Role.admin().toString()).toBe('admin')
      expect(Role.user().toString()).toBe('user')
      expect(Role.superadmin().toString()).toBe('superadmin')
    })

    it('toDisplayString()이 표시 이름을 반환해야 한다', () => {
      expect(Role.admin().toDisplayString()).toBe('관리자')
      expect(Role.user().toDisplayString()).toBe('일반 사용자')
      expect(Role.superadmin().toDisplayString()).toBe('슈퍼관리자')
    })
  })
})