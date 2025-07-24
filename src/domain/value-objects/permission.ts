/**
 * 권한 타입 정의
 * 리소스와 액션의 조합으로 권한을 표현
 */
export type ResourceType = 
  | 'reservation'
  | 'user'
  | 'device'
  | 'analytics'
  | 'admin'
  | 'banner'
  | 'credit'

export type ActionType = 
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'list'
  | 'approve'
  | 'reject'
  | 'checkin'
  | 'export'

/**
 * Permission 값 객체
 * 특정 리소스에 대한 특정 액션의 권한을 나타냄
 */
export class Permission {
  private static readonly PERMISSION_SEPARATOR = ':'
  
  private constructor(
    public readonly resource: ResourceType,
    public readonly action: ActionType,
    public readonly value: string
  ) {
    this.validate()
  }

  /**
   * 권한 생성
   */
  static create(resource: ResourceType, action: ActionType): Permission {
    const value = `${resource}${Permission.PERMISSION_SEPARATOR}${action}`
    return new Permission(resource, action, value)
  }

  /**
   * 문자열에서 권한 생성
   */
  static fromString(permission: string): Permission {
    const parts = permission.split(Permission.PERMISSION_SEPARATOR)
    
    if (parts.length !== 2) {
      throw new Error(`Invalid permission format: ${permission}`)
    }

    const [resource, action] = parts
    
    if (!Permission.isValidResource(resource)) {
      throw new Error(`Invalid resource: ${resource}`)
    }

    if (!Permission.isValidAction(action)) {
      throw new Error(`Invalid action: ${action}`)
    }

    return Permission.create(resource as ResourceType, action as ActionType)
  }

  /**
   * 유효한 리소스인지 확인
   */
  private static isValidResource(resource: string): resource is ResourceType {
    const validResources: ResourceType[] = [
      'reservation', 'user', 'device', 'analytics', 
      'admin', 'banner', 'credit'
    ]
    return validResources.includes(resource as ResourceType)
  }

  /**
   * 유효한 액션인지 확인
   */
  private static isValidAction(action: string): action is ActionType {
    const validActions: ActionType[] = [
      'create', 'read', 'update', 'delete', 'list',
      'approve', 'reject', 'checkin', 'export'
    ]
    return validActions.includes(action as ActionType)
  }

  /**
   * 와일드카드 권한 생성 (특정 리소스의 모든 액션)
   */
  static wildcard(resource: ResourceType): Permission[] {
    const allActions: ActionType[] = [
      'create', 'read', 'update', 'delete', 'list'
    ]
    
    // 특정 리소스에 대한 추가 액션
    if (resource === 'reservation') {
      allActions.push('approve', 'reject', 'checkin')
    }
    
    if (resource === 'analytics') {
      allActions.push('export')
    }

    return allActions.map(action => Permission.create(resource, action))
  }

  /**
   * 관리자 기본 권한 세트
   */
  static adminPermissions(): Permission[] {
    const permissions: Permission[] = []
    
    // 모든 리소스에 대한 전체 권한
    const resources: ResourceType[] = [
      'reservation', 'user', 'device', 'analytics', 
      'admin', 'banner', 'credit'
    ]

    resources.forEach(resource => {
      permissions.push(...Permission.wildcard(resource))
    })

    return permissions
  }

  /**
   * 일반 사용자 기본 권한 세트
   */
  static userPermissions(): Permission[] {
    return [
      // 예약 관련
      Permission.create('reservation', 'create'),
      Permission.create('reservation', 'read'),
      Permission.create('reservation', 'update'),
      Permission.create('reservation', 'delete'),
      Permission.create('reservation', 'list'),
      
      // 사용자 프로필
      Permission.create('user', 'read'),
      Permission.create('user', 'update'),
      
      // 기기 조회
      Permission.create('device', 'read'),
      Permission.create('device', 'list')
    ]
  }

  /**
   * 권한이 특정 리소스에 속하는지 확인
   */
  isForResource(resource: ResourceType): boolean {
    return this.resource === resource
  }

  /**
   * 권한이 특정 액션인지 확인
   */
  isForAction(action: ActionType): boolean {
    return this.action === action
  }

  /**
   * 다른 권한을 포함하는지 확인
   * 예: admin:* 은 admin:read를 포함
   */
  includes(other: Permission): boolean {
    return this.resource === other.resource && 
           (this.action === other.action || this.isWildcardAction())
  }

  /**
   * 와일드카드 액션인지 확인 (현재는 미지원)
   */
  private isWildcardAction(): boolean {
    return false // 현재 구현에서는 와일드카드 미지원
  }

  /**
   * 권한 유효성 검증
   */
  private validate(): void {
    if (!Permission.isValidResource(this.resource)) {
      throw new Error(`Invalid resource: ${this.resource}`)
    }

    if (!Permission.isValidAction(this.action)) {
      throw new Error(`Invalid action: ${this.action}`)
    }

    const expectedValue = `${this.resource}${Permission.PERMISSION_SEPARATOR}${this.action}`
    if (this.value !== expectedValue) {
      throw new Error(`Invalid permission value: ${this.value}`)
    }
  }

  /**
   * 동등성 비교
   */
  equals(other: Permission): boolean {
    return this.value === other.value
  }

  /**
   * 문자열 표현
   */
  toString(): string {
    return this.value
  }

  /**
   * 사람이 읽기 쉬운 설명
   */
  toDescription(): string {
    const actionDescriptions: Record<ActionType, string> = {
      create: '생성',
      read: '조회',
      update: '수정',
      delete: '삭제',
      list: '목록 조회',
      approve: '승인',
      reject: '거절',
      checkin: '체크인',
      export: '내보내기'
    }

    const resourceDescriptions: Record<ResourceType, string> = {
      reservation: '예약',
      user: '사용자',
      device: '기기',
      analytics: '분석',
      admin: '관리자',
      banner: '배너',
      credit: '크레딧'
    }

    return `${resourceDescriptions[this.resource]} ${actionDescriptions[this.action]}`
  }
}