/**
 * 사용자 역할 타입
 */
export type RoleType = 'user' | 'admin' | 'superadmin'

/**
 * Role 값 객체
 * 사용자의 역할을 나타내는 값 객체
 */
export class Role {
  private static readonly VALID_ROLES: RoleType[] = ['user', 'admin', 'superadmin']

  private constructor(
    public readonly value: RoleType,
    public readonly displayName: string,
    public readonly level: number
  ) {
    this.validate()
  }

  /**
   * 역할 생성
   */
  static create(role: RoleType): Role {
    switch (role) {
      case 'superadmin':
        return new Role('superadmin', '슈퍼관리자', 1000)
      case 'admin':
        return new Role('admin', '관리자', 100)
      case 'user':
        return new Role('user', '일반 사용자', 10)
      default:
        throw new Error(`Invalid role: ${role}`)
    }
  }

  /**
   * 관리자 역할 생성
   */
  static admin(): Role {
    return Role.create('admin')
  }

  /**
   * 일반 사용자 역할 생성
   */
  static user(): Role {
    return Role.create('user')
  }

  /**
   * 슈퍼관리자 역할 생성
   */
  static superadmin(): Role {
    return Role.create('superadmin')
  }

  /**
   * 문자열에서 역할 생성
   */
  static fromString(role: string): Role {
    if (!Role.isValidRole(role)) {
      throw new Error(`Invalid role: ${role}`)
    }
    return Role.create(role as RoleType)
  }

  /**
   * 유효한 역할인지 확인
   */
  static isValidRole(role: string): role is RoleType {
    return Role.VALID_ROLES.includes(role as RoleType)
  }

  /**
   * 모든 유효한 역할 목록
   */
  static getAllRoles(): Role[] {
    return Role.VALID_ROLES.map(role => Role.create(role))
  }

  /**
   * 관리자 역할인지 확인
   */
  isAdmin(): boolean {
    return this.value === 'admin'
  }

  /**
   * 일반 사용자 역할인지 확인
   */
  isUser(): boolean {
    return this.value === 'user'
  }

  /**
   * 슈퍼관리자 역할인지 확인
   */
  isSuperAdmin(): boolean {
    return this.value === 'superadmin'
  }

  /**
   * 다른 역할보다 높은 권한인지 확인
   */
  hasHigherPrivilegeThan(other: Role): boolean {
    return this.level > other.level
  }

  /**
   * 다른 역할보다 낮은 권한인지 확인
   */
  hasLowerPrivilegeThan(other: Role): boolean {
    return this.level < other.level
  }

  /**
   * 동일한 권한 레벨인지 확인
   */
  hasSamePrivilegeAs(other: Role): boolean {
    return this.level === other.level
  }

  /**
   * 특정 역할 이상의 권한인지 확인
   */
  hasMinimumRole(minimumRole: RoleType): boolean {
    const minimum = Role.create(minimumRole)
    return this.level >= minimum.level
  }

  /**
   * 역할 유효성 검증
   */
  private validate(): void {
    if (!Role.isValidRole(this.value)) {
      throw new Error(`Invalid role: ${this.value}`)
    }

    if (this.level < 0) {
      throw new Error('Role level must be non-negative')
    }

    if (!this.displayName || this.displayName.trim().length === 0) {
      throw new Error('Role display name cannot be empty')
    }
  }

  /**
   * 동등성 비교
   */
  equals(other: Role): boolean {
    return this.value === other.value
  }

  /**
   * 문자열 표현
   */
  toString(): string {
    return this.value
  }

  /**
   * 표시용 문자열
   */
  toDisplayString(): string {
    return this.displayName
  }
}