import { Permission } from '../permission'

describe('Permission', () => {
  describe('create', () => {
    it('권한을 생성해야 한다', () => {
      const permission = Permission.create('reservation', 'create')
      
      expect(permission.resource).toBe('reservation')
      expect(permission.action).toBe('create')
      expect(permission.value).toBe('reservation:create')
    })

    it('모든 리소스와 액션 조합으로 권한을 생성할 수 있어야 한다', () => {
      const resources = ['reservation', 'user', 'device'] as const
      const actions = ['create', 'read', 'update', 'delete'] as const
      
      resources.forEach(resource => {
        actions.forEach(action => {
          const permission = Permission.create(resource, action)
          expect(permission.value).toBe(`${resource}:${action}`)
        })
      })
    })
  })

  describe('fromString', () => {
    it('문자열에서 권한을 생성해야 한다', () => {
      const permission = Permission.fromString('user:update')
      
      expect(permission.resource).toBe('user')
      expect(permission.action).toBe('update')
      expect(permission.value).toBe('user:update')
    })

    it('잘못된 형식의 문자열은 에러가 발생해야 한다', () => {
      expect(() => Permission.fromString('invalid')).toThrow('Invalid permission format')
      expect(() => Permission.fromString('user-update')).toThrow('Invalid permission format')
      expect(() => Permission.fromString('user:update:extra')).toThrow('Invalid permission format')
    })

    it('잘못된 리소스는 에러가 발생해야 한다', () => {
      expect(() => Permission.fromString('invalid:read')).toThrow('Invalid resource: invalid')
    })

    it('잘못된 액션은 에러가 발생해야 한다', () => {
      expect(() => Permission.fromString('user:invalid')).toThrow('Invalid action: invalid')
    })
  })

  describe('wildcard', () => {
    it('예약 리소스의 와일드카드 권한을 생성해야 한다', () => {
      const permissions = Permission.wildcard('reservation')
      
      expect(permissions).toHaveLength(8) // 기본 5개 + approve, reject, checkin
      expect(permissions.map(p => p.value)).toContain('reservation:create')
      expect(permissions.map(p => p.value)).toContain('reservation:approve')
      expect(permissions.map(p => p.value)).toContain('reservation:reject')
      expect(permissions.map(p => p.value)).toContain('reservation:checkin')
    })

    it('분석 리소스의 와일드카드 권한을 생성해야 한다', () => {
      const permissions = Permission.wildcard('analytics')
      
      expect(permissions).toHaveLength(6) // 기본 5개 + export
      expect(permissions.map(p => p.value)).toContain('analytics:export')
    })

    it('일반 리소스의 와일드카드 권한을 생성해야 한다', () => {
      const permissions = Permission.wildcard('user')
      
      expect(permissions).toHaveLength(5) // 기본 5개만
      expect(permissions.map(p => p.action)).toEqual(['create', 'read', 'update', 'delete', 'list'])
    })
  })

  describe('adminPermissions', () => {
    it('관리자의 모든 권한을 생성해야 한다', () => {
      const permissions = Permission.adminPermissions()
      
      // 모든 리소스에 대한 권한이 있어야 함
      const resources = ['reservation', 'user', 'device', 'analytics', 'admin', 'banner', 'credit']
      
      resources.forEach(resource => {
        const resourcePermissions = permissions.filter(p => p.resource === resource)
        expect(resourcePermissions.length).toBeGreaterThan(0)
      })

      // 예약 특수 권한 포함 확인
      expect(permissions.some(p => p.value === 'reservation:approve')).toBe(true)
      expect(permissions.some(p => p.value === 'reservation:reject')).toBe(true)
      expect(permissions.some(p => p.value === 'analytics:export')).toBe(true)
    })
  })

  describe('userPermissions', () => {
    it('일반 사용자의 기본 권한을 생성해야 한다', () => {
      const permissions = Permission.userPermissions()
      
      // 예약 CRUD 권한
      expect(permissions.some(p => p.value === 'reservation:create')).toBe(true)
      expect(permissions.some(p => p.value === 'reservation:read')).toBe(true)
      expect(permissions.some(p => p.value === 'reservation:update')).toBe(true)
      expect(permissions.some(p => p.value === 'reservation:delete')).toBe(true)
      expect(permissions.some(p => p.value === 'reservation:list')).toBe(true)
      
      // 사용자 프로필 권한
      expect(permissions.some(p => p.value === 'user:read')).toBe(true)
      expect(permissions.some(p => p.value === 'user:update')).toBe(true)
      
      // 기기 조회 권한
      expect(permissions.some(p => p.value === 'device:read')).toBe(true)
      expect(permissions.some(p => p.value === 'device:list')).toBe(true)
      
      // 관리자 권한은 없어야 함
      expect(permissions.some(p => p.value === 'reservation:approve')).toBe(false)
      expect(permissions.some(p => p.value === 'admin:read')).toBe(false)
    })
  })

  describe('resource and action checks', () => {
    it('isForResource()가 올바르게 동작해야 한다', () => {
      const permission = Permission.create('user', 'update')
      
      expect(permission.isForResource('user')).toBe(true)
      expect(permission.isForResource('reservation')).toBe(false)
    })

    it('isForAction()이 올바르게 동작해야 한다', () => {
      const permission = Permission.create('user', 'update')
      
      expect(permission.isForAction('update')).toBe(true)
      expect(permission.isForAction('delete')).toBe(false)
    })
  })

  describe('includes', () => {
    it('동일한 권한을 포함해야 한다', () => {
      const permission1 = Permission.create('user', 'read')
      const permission2 = Permission.create('user', 'read')
      
      expect(permission1.includes(permission2)).toBe(true)
    })

    it('다른 리소스의 권한은 포함하지 않아야 한다', () => {
      const permission1 = Permission.create('user', 'read')
      const permission2 = Permission.create('device', 'read')
      
      expect(permission1.includes(permission2)).toBe(false)
    })

    it('다른 액션의 권한은 포함하지 않아야 한다', () => {
      const permission1 = Permission.create('user', 'read')
      const permission2 = Permission.create('user', 'update')
      
      expect(permission1.includes(permission2)).toBe(false)
    })
  })

  describe('equals', () => {
    it('동일한 권한을 비교해야 한다', () => {
      const permission1 = Permission.create('user', 'update')
      const permission2 = Permission.create('user', 'update')
      const permission3 = Permission.create('user', 'delete')
      
      expect(permission1.equals(permission2)).toBe(true)
      expect(permission1.equals(permission3)).toBe(false)
    })
  })

  describe('string representations', () => {
    it('toString()이 권한 값을 반환해야 한다', () => {
      const permission = Permission.create('reservation', 'approve')
      expect(permission.toString()).toBe('reservation:approve')
    })

    it('toDescription()이 읽기 쉬운 설명을 반환해야 한다', () => {
      expect(Permission.create('reservation', 'create').toDescription()).toBe('예약 생성')
      expect(Permission.create('user', 'update').toDescription()).toBe('사용자 수정')
      expect(Permission.create('device', 'list').toDescription()).toBe('기기 목록 조회')
      expect(Permission.create('analytics', 'export').toDescription()).toBe('분석 내보내기')
    })
  })
})