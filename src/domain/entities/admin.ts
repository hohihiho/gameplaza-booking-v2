import { AdminPermissions, AdminPermissionsData } from '../value-objects/admin-permissions'

export interface AdminProps {
  id: string
  userId: string
  permissions?: AdminPermissionsData
  isSuperAdmin?: boolean
  createdAt?: Date
  updatedAt?: Date
}

/**
 * Admin 엔티티
 * 관리자의 권한과 정보를 관리
 */
export class Admin {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    private _permissions: AdminPermissions,
    private _isSuperAdmin: boolean,
    public readonly createdAt: Date,
    private _updatedAt: Date
  ) {}

  /**
   * Admin 생성
   */
  static create(props: AdminProps): Admin {
    const permissions = props.isSuperAdmin 
      ? AdminPermissions.fullAccess()
      : AdminPermissions.create(props.permissions)

    return new Admin(
      props.id,
      props.userId,
      permissions,
      props.isSuperAdmin ?? false,
      props.createdAt ?? new Date(),
      props.updatedAt ?? new Date()
    )
  }

  /**
   * 슈퍼관리자 생성
   */
  static createSuperAdmin(props: Omit<AdminProps, 'isSuperAdmin' | 'permissions'>): Admin {
    return Admin.create({
      ...props,
      isSuperAdmin: true,
      permissions: AdminPermissions.fullAccess().toJSON()
    })
  }

  /**
   * 일반 관리자 생성
   */
  static createRegularAdmin(props: Omit<AdminProps, 'isSuperAdmin'>): Admin {
    return Admin.create({
      ...props,
      isSuperAdmin: false
    })
  }

  get permissions(): AdminPermissions {
    return this._permissions
  }

  get isSuperAdmin(): boolean {
    return this._isSuperAdmin
  }

  get updatedAt(): Date {
    return this._updatedAt
  }

  /**
   * 권한 업데이트 (슈퍼관리자는 항상 전체 권한 유지)
   */
  updatePermissions(permissions: Partial<AdminPermissionsData>): Admin {
    if (this._isSuperAdmin) {
      // 슈퍼관리자는 항상 전체 권한을 가짐
      return this
    }

    return new Admin(
      this.id,
      this.userId,
      this._permissions.update(permissions),
      this._isSuperAdmin,
      this.createdAt,
      new Date()
    )
  }

  /**
   * 특정 권한 부여
   */
  grantPermission(permission: keyof AdminPermissionsData): Admin {
    if (this._isSuperAdmin) {
      return this
    }

    return new Admin(
      this.id,
      this.userId,
      this._permissions.grant(permission),
      this._isSuperAdmin,
      this.createdAt,
      new Date()
    )
  }

  /**
   * 특정 권한 제거
   */
  revokePermission(permission: keyof AdminPermissionsData): Admin {
    if (this._isSuperAdmin) {
      return this
    }

    return new Admin(
      this.id,
      this.userId,
      this._permissions.revoke(permission),
      this._isSuperAdmin,
      this.createdAt,
      new Date()
    )
  }

  /**
   * 슈퍼관리자로 승격
   */
  promoteToSuperAdmin(): Admin {
    if (this._isSuperAdmin) {
      return this
    }

    return new Admin(
      this.id,
      this.userId,
      AdminPermissions.fullAccess(),
      true,
      this.createdAt,
      new Date()
    )
  }

  /**
   * 일반 관리자로 강등
   */
  demoteFromSuperAdmin(): Admin {
    if (!this._isSuperAdmin) {
      return this
    }

    // 슈퍼관리자에서 강등 시 기본 관리자 권한 부여
    return new Admin(
      this.id,
      this.userId,
      AdminPermissions.create(),
      false,
      this.createdAt,
      new Date()
    )
  }

  /**
   * 관리자를 관리할 수 있는지 확인
   */
  canManageAdmins(): boolean {
    return this._isSuperAdmin
  }

  /**
   * 특정 권한이 있는지 확인
   */
  hasPermission(permission: keyof AdminPermissionsData): boolean {
    return this._permissions.hasPermission(permission)
  }

  /**
   * 예약 관리 권한 확인
   */
  canManageReservations(): boolean {
    return this._permissions.canManageReservations()
  }

  /**
   * 사용자 관리 권한 확인
   */
  canManageUsers(): boolean {
    return this._permissions.canManageUsers()
  }

  /**
   * 기기 관리 권한 확인
   */
  canManageDevices(): boolean {
    return this._permissions.canManageDevices()
  }

  /**
   * CMS 관리 권한 확인
   */
  canManageCMS(): boolean {
    return this._permissions.canManageCMS()
  }

  /**
   * 설정 관리 권한 확인
   */
  canManageSettings(): boolean {
    return this._permissions.canManageSettings()
  }

  /**
   * 다른 관리자를 수정할 수 있는지 확인
   */
  canModify(targetAdmin: Admin): boolean {
    // 슈퍼관리자만 다른 관리자를 수정할 수 있음
    if (!this._isSuperAdmin) {
      return false
    }

    // 자기 자신은 수정 가능
    if (this.id === targetAdmin.id) {
      return true
    }

    // 슈퍼관리자는 모든 관리자를 수정 가능
    return true
  }

  /**
   * 다른 관리자를 삭제할 수 있는지 확인
   */
  canDelete(targetAdmin: Admin): boolean {
    // 슈퍼관리자만 다른 관리자를 삭제할 수 있음
    if (!this._isSuperAdmin) {
      return false
    }

    // 자기 자신은 삭제 불가
    if (this.id === targetAdmin.id) {
      return false
    }

    // 다른 슈퍼관리자는 삭제 불가
    if (targetAdmin.isSuperAdmin) {
      return false
    }

    return true
  }

  /**
   * JSON으로 변환
   */
  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      permissions: this._permissions.toJSON(),
      isSuperAdmin: this._isSuperAdmin,
      createdAt: this.createdAt,
      updatedAt: this._updatedAt
    }
  }

  /**
   * 동등성 비교
   */
  equals(other: Admin): boolean {
    return this.id === other.id
  }
}