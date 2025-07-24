/**
 * 관리자 권한 타입 정의
 */
export interface AdminPermissionsData {
  reservations: boolean  // 예약 관리
  users: boolean        // 사용자 관리
  devices: boolean      // 기기 관리
  cms: boolean          // 콘텐츠 관리
  settings: boolean     // 설정 관리
}

/**
 * AdminPermissions 값 객체
 * 관리자의 세부 권한을 관리하는 불변 값 객체
 */
export class AdminPermissions {
  private constructor(
    private readonly permissions: AdminPermissionsData
  ) {
    this.validate()
  }

  /**
   * 권한 생성
   */
  static create(permissions: Partial<AdminPermissionsData> = {}): AdminPermissions {
    const defaultPermissions: AdminPermissionsData = {
      reservations: true,
      users: true,
      devices: true,
      cms: true,
      settings: false // 기본적으로 설정 권한은 제한
    }

    return new AdminPermissions({
      ...defaultPermissions,
      ...permissions
    })
  }

  /**
   * 전체 권한 생성 (슈퍼관리자용)
   */
  static fullAccess(): AdminPermissions {
    return new AdminPermissions({
      reservations: true,
      users: true,
      devices: true,
      cms: true,
      settings: true
    })
  }

  /**
   * 제한된 권한 생성 (스태프용)
   */
  static limitedAccess(): AdminPermissions {
    return new AdminPermissions({
      reservations: true,
      users: false,
      devices: false,
      cms: false,
      settings: false
    })
  }

  /**
   * JSON에서 권한 생성
   */
  static fromJSON(json: any): AdminPermissions {
    if (typeof json === 'string') {
      json = JSON.parse(json)
    }

    return AdminPermissions.create(json)
  }

  /**
   * 예약 관리 권한 확인
   */
  canManageReservations(): boolean {
    return this.permissions.reservations
  }

  /**
   * 사용자 관리 권한 확인
   */
  canManageUsers(): boolean {
    return this.permissions.users
  }

  /**
   * 기기 관리 권한 확인
   */
  canManageDevices(): boolean {
    return this.permissions.devices
  }

  /**
   * CMS 관리 권한 확인
   */
  canManageCMS(): boolean {
    return this.permissions.cms
  }

  /**
   * 설정 관리 권한 확인
   */
  canManageSettings(): boolean {
    return this.permissions.settings
  }

  /**
   * 특정 권한 확인
   */
  hasPermission(permission: keyof AdminPermissionsData): boolean {
    return this.permissions[permission] === true
  }

  /**
   * 여러 권한 중 하나라도 가지고 있는지 확인
   */
  hasAnyPermission(permissions: (keyof AdminPermissionsData)[]): boolean {
    return permissions.some(permission => this.hasPermission(permission))
  }

  /**
   * 모든 권한을 가지고 있는지 확인
   */
  hasAllPermissions(permissions: (keyof AdminPermissionsData)[]): boolean {
    return permissions.every(permission => this.hasPermission(permission))
  }

  /**
   * 권한 업데이트 (불변성 유지)
   */
  update(updates: Partial<AdminPermissionsData>): AdminPermissions {
    return new AdminPermissions({
      ...this.permissions,
      ...updates
    })
  }

  /**
   * 권한 추가 (불변성 유지)
   */
  grant(permission: keyof AdminPermissionsData): AdminPermissions {
    return this.update({ [permission]: true })
  }

  /**
   * 권한 제거 (불변성 유지)
   */
  revoke(permission: keyof AdminPermissionsData): AdminPermissions {
    return this.update({ [permission]: false })
  }

  /**
   * 모든 권한 목록 반환
   */
  toArray(): (keyof AdminPermissionsData)[] {
    return Object.entries(this.permissions)
      .filter(([_, hasPermission]) => hasPermission)
      .map(([permission]) => permission as keyof AdminPermissionsData)
  }

  /**
   * 권한 데이터 반환
   */
  toJSON(): AdminPermissionsData {
    return { ...this.permissions }
  }

  /**
   * 문자열 표현
   */
  toString(): string {
    return JSON.stringify(this.permissions)
  }

  /**
   * 권한 유효성 검증
   */
  private validate(): void {
    const validKeys: (keyof AdminPermissionsData)[] = [
      'reservations', 'users', 'devices', 'cms', 'settings'
    ]

    for (const key of Object.keys(this.permissions)) {
      if (!validKeys.includes(key as keyof AdminPermissionsData)) {
        throw new Error(`Invalid permission key: ${key}`)
      }

      const value = this.permissions[key as keyof AdminPermissionsData]
      if (typeof value !== 'boolean') {
        throw new Error(`Permission value must be boolean: ${key}`)
      }
    }
  }

  /**
   * 동등성 비교
   */
  equals(other: AdminPermissions): boolean {
    const keys = Object.keys(this.permissions) as (keyof AdminPermissionsData)[]
    return keys.every(key => this.permissions[key] === other.permissions[key])
  }

  /**
   * 다른 권한보다 더 많은 권한을 가지고 있는지 확인
   */
  hasMorePermissionsThan(other: AdminPermissions): boolean {
    const thisCount = this.toArray().length
    const otherCount = other.toArray().length
    return thisCount > otherCount
  }

  /**
   * 다른 권한의 모든 권한을 포함하는지 확인
   */
  includes(other: AdminPermissions): boolean {
    return other.toArray().every(permission => this.hasPermission(permission))
  }
}