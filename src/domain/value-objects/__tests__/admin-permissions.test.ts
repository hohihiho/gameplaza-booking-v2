import { AdminPermissions } from '../admin-permissions'

describe('AdminPermissions', () => {
  describe('create', () => {
    it('기본 권한으로 생성해야 한다', () => {
      const permissions = AdminPermissions.create()
      
      expect(permissions.canManageReservations()).toBe(true)
      expect(permissions.canManageUsers()).toBe(true)
      expect(permissions.canManageDevices()).toBe(true)
      expect(permissions.canManageCMS()).toBe(true)
      expect(permissions.canManageSettings()).toBe(false) // 기본값은 false
    })

    it('특정 권한으로 생성해야 한다', () => {
      const permissions = AdminPermissions.create({
        reservations: true,
        users: false,
        devices: true,
        cms: false,
        settings: true
      })
      
      expect(permissions.canManageReservations()).toBe(true)
      expect(permissions.canManageUsers()).toBe(false)
      expect(permissions.canManageDevices()).toBe(true)
      expect(permissions.canManageCMS()).toBe(false)
      expect(permissions.canManageSettings()).toBe(true)
    })

    it('부분적인 권한으로 생성해야 한다', () => {
      const permissions = AdminPermissions.create({
        settings: true // 나머지는 기본값 사용
      })
      
      expect(permissions.canManageReservations()).toBe(true)
      expect(permissions.canManageSettings()).toBe(true)
    })
  })

  describe('static factory methods', () => {
    it('fullAccess로 전체 권한을 생성해야 한다', () => {
      const permissions = AdminPermissions.fullAccess()
      
      expect(permissions.canManageReservations()).toBe(true)
      expect(permissions.canManageUsers()).toBe(true)
      expect(permissions.canManageDevices()).toBe(true)
      expect(permissions.canManageCMS()).toBe(true)
      expect(permissions.canManageSettings()).toBe(true)
    })

    it('limitedAccess로 제한된 권한을 생성해야 한다', () => {
      const permissions = AdminPermissions.limitedAccess()
      
      expect(permissions.canManageReservations()).toBe(true)
      expect(permissions.canManageUsers()).toBe(false)
      expect(permissions.canManageDevices()).toBe(false)
      expect(permissions.canManageCMS()).toBe(false)
      expect(permissions.canManageSettings()).toBe(false)
    })
  })

  describe('fromJSON', () => {
    it('JSON 객체에서 권한을 생성해야 한다', () => {
      const json = {
        reservations: true,
        users: false,
        devices: true,
        cms: false,
        settings: true
      }
      
      const permissions = AdminPermissions.fromJSON(json)
      
      expect(permissions.canManageReservations()).toBe(true)
      expect(permissions.canManageUsers()).toBe(false)
    })

    it('JSON 문자열에서 권한을 생성해야 한다', () => {
      const jsonString = JSON.stringify({
        reservations: true,
        users: false,
        devices: true,
        cms: false,
        settings: true
      })
      
      const permissions = AdminPermissions.fromJSON(jsonString)
      
      expect(permissions.canManageReservations()).toBe(true)
      expect(permissions.canManageUsers()).toBe(false)
    })
  })

  describe('permission checks', () => {
    let permissions: AdminPermissions

    beforeEach(() => {
      permissions = AdminPermissions.create({
        reservations: true,
        users: false,
        devices: true,
        cms: false,
        settings: true
      })
    })

    it('hasPermission으로 특정 권한을 확인해야 한다', () => {
      expect(permissions.hasPermission('reservations')).toBe(true)
      expect(permissions.hasPermission('users')).toBe(false)
      expect(permissions.hasPermission('devices')).toBe(true)
    })

    it('hasAnyPermission으로 여러 권한 중 하나를 확인해야 한다', () => {
      expect(permissions.hasAnyPermission(['users', 'devices'])).toBe(true)
      expect(permissions.hasAnyPermission(['users', 'cms'])).toBe(false)
      expect(permissions.hasAnyPermission(['reservations', 'settings'])).toBe(true)
    })

    it('hasAllPermissions로 모든 권한을 확인해야 한다', () => {
      expect(permissions.hasAllPermissions(['reservations', 'devices'])).toBe(true)
      expect(permissions.hasAllPermissions(['reservations', 'users'])).toBe(false)
      expect(permissions.hasAllPermissions(['devices', 'settings'])).toBe(true)
    })
  })

  describe('permission updates', () => {
    let permissions: AdminPermissions

    beforeEach(() => {
      permissions = AdminPermissions.create({
        reservations: true,
        users: false,
        devices: true,
        cms: false,
        settings: false
      })
    })

    it('update로 권한을 변경해야 한다', () => {
      const updated = permissions.update({
        users: true,
        settings: true
      })
      
      expect(updated.canManageUsers()).toBe(true)
      expect(updated.canManageSettings()).toBe(true)
      expect(updated.canManageReservations()).toBe(true) // 기존 값 유지
      
      // 원본은 변경되지 않음
      expect(permissions.canManageUsers()).toBe(false)
      expect(permissions.canManageSettings()).toBe(false)
    })

    it('grant로 권한을 추가해야 한다', () => {
      const granted = permissions.grant('users')
      
      expect(granted.canManageUsers()).toBe(true)
      expect(permissions.canManageUsers()).toBe(false) // 원본 불변
    })

    it('revoke로 권한을 제거해야 한다', () => {
      const revoked = permissions.revoke('reservations')
      
      expect(revoked.canManageReservations()).toBe(false)
      expect(permissions.canManageReservations()).toBe(true) // 원본 불변
    })
  })

  describe('conversion methods', () => {
    it('toArray로 활성 권한 목록을 반환해야 한다', () => {
      const permissions = AdminPermissions.create({
        reservations: true,
        users: false,
        devices: true,
        cms: false,
        settings: true
      })
      
      const array = permissions.toArray()
      
      expect(array).toEqual(['reservations', 'devices', 'settings'])
      expect(array).not.toContain('users')
      expect(array).not.toContain('cms')
    })

    it('toJSON으로 권한 객체를 반환해야 한다', () => {
      const permissions = AdminPermissions.create({
        reservations: true,
        users: false
      })
      
      const json = permissions.toJSON()
      
      expect(json).toEqual({
        reservations: true,
        users: false,
        devices: true,
        cms: true,
        settings: false
      })
    })

    it('toString으로 JSON 문자열을 반환해야 한다', () => {
      const permissions = AdminPermissions.limitedAccess()
      const str = permissions.toString()
      
      expect(typeof str).toBe('string')
      expect(JSON.parse(str)).toEqual({
        reservations: true,
        users: false,
        devices: false,
        cms: false,
        settings: false
      })
    })
  })

  describe('comparisons', () => {
    it('equals로 동등성을 비교해야 한다', () => {
      const perm1 = AdminPermissions.create({ users: true })
      const perm2 = AdminPermissions.create({ users: true })
      const perm3 = AdminPermissions.create({ users: false })
      
      expect(perm1.equals(perm2)).toBe(true)
      expect(perm1.equals(perm3)).toBe(false)
    })

    it('hasMorePermissionsThan으로 권한 수를 비교해야 한다', () => {
      const full = AdminPermissions.fullAccess()
      const limited = AdminPermissions.limitedAccess()
      const custom = AdminPermissions.create({
        reservations: true,
        users: true,
        devices: false,
        cms: false,
        settings: false
      })
      
      expect(full.hasMorePermissionsThan(limited)).toBe(true)
      expect(limited.hasMorePermissionsThan(full)).toBe(false)
      expect(custom.hasMorePermissionsThan(limited)).toBe(true)
    })

    it('includes로 권한 포함 관계를 확인해야 한다', () => {
      const full = AdminPermissions.fullAccess()
      const limited = AdminPermissions.limitedAccess()
      const custom = AdminPermissions.create({
        reservations: true,
        users: true
      })
      
      expect(full.includes(limited)).toBe(true)
      expect(full.includes(custom)).toBe(true)
      expect(limited.includes(full)).toBe(false)
      expect(custom.includes(limited)).toBe(true)
    })
  })

  describe('validation', () => {
    it('잘못된 권한 키로 생성 시 에러가 발생해야 한다', () => {
      expect(() => {
        AdminPermissions.fromJSON({
          reservations: true,
          invalidKey: true
        })
      }).toThrow('Invalid permission key: invalidKey')
    })

    it('boolean이 아닌 값으로 생성 시 에러가 발생해야 한다', () => {
      expect(() => {
        AdminPermissions.fromJSON({
          reservations: 'yes' as any
        })
      }).toThrow('Permission value must be boolean: reservations')
    })
  })
})