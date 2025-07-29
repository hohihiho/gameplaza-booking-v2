import { Role } from '../value-objects/role'
import { Permission } from '../value-objects/permission'

export type UserRole = 'user' | 'admin' | 'superadmin'
export type UserStatus = 'active' | 'suspended' | 'banned'

export interface UserProps {
  id: string
  email: string
  fullName: string
  phone?: string | null
  role?: UserRole
  status?: UserStatus
  birthDate?: Date | null
  profileImageUrl?: string | null
  googleId?: string | null
  lastLoginAt?: Date | null
  loginAttempts?: number
  suspendedUntil?: Date | null
  suspendedReason?: string | null
  bannedReason?: string | null
  marketingAgreed?: boolean
  termsAgreedAt?: Date | null
  privacyAgreedAt?: Date | null
  marketingAgreedAt?: Date | null
  createdAt?: Date
  updatedAt?: Date
}

export class User {
  private constructor(
    public readonly id: string,
    public readonly email: string,
    private _fullName: string,
    private _phone: string | null,
    private _role: UserRole,
    private _status: UserStatus,
    private _birthDate: Date | null,
    private _profileImageUrl: string | null,
    private _googleId: string | null,
    private _lastLoginAt: Date | null,
    private _loginAttempts: number,
    private _suspendedUntil: Date | null,
    private _suspendedReason: string | null,
    private _bannedReason: string | null,
    private _marketingAgreed: boolean,
    private _termsAgreedAt: Date | null,
    private _privacyAgreedAt: Date | null,
    private _marketingAgreedAt: Date | null,
    public readonly createdAt: Date,
    private _updatedAt: Date
  ) {}

  static create(props: UserProps): User {
    return new User(
      props.id,
      props.email,
      props.fullName,
      props.phone ?? null,
      props.role ?? 'user',
      props.status ?? 'active',
      props.birthDate ?? null,
      props.profileImageUrl ?? null,
      props.googleId ?? null,
      props.lastLoginAt ?? null,
      props.loginAttempts ?? 0,
      props.suspendedUntil ?? null,
      props.suspendedReason ?? null,
      props.bannedReason ?? null,
      props.marketingAgreed ?? false,
      props.termsAgreedAt ?? null,
      props.privacyAgreedAt ?? null,
      props.marketingAgreedAt ?? null,
      props.createdAt ?? new Date(),
      props.updatedAt ?? new Date()
    )
  }

  /**
   * Google OAuth로 사용자 생성
   */
  static createFromGoogle(googleProfile: {
    id: string
    email: string
    name: string
    picture?: string
  }): User {
    const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    return User.create({
      id: userId,
      email: googleProfile.email,
      fullName: googleProfile.name,
      googleId: googleProfile.id,
      profileImageUrl: googleProfile.picture
    })
  }

  get fullName(): string {
    return this._fullName
  }

  get phone(): string | null {
    return this._phone
  }

  get role(): UserRole {
    return this._role
  }

  get status(): UserStatus {
    return this._status
  }

  get birthDate(): Date | null {
    return this._birthDate
  }

  get profileImageUrl(): string | null {
    return this._profileImageUrl
  }

  get googleId(): string | null {
    return this._googleId
  }

  get lastLoginAt(): Date | null {
    return this._lastLoginAt
  }

  get loginAttempts(): number {
    return this._loginAttempts
  }

  get suspendedUntil(): Date | null {
    return this._suspendedUntil
  }

  get suspendedReason(): string | null {
    return this._suspendedReason
  }

  get bannedReason(): string | null {
    return this._bannedReason
  }

  get marketingAgreed(): boolean {
    return this._marketingAgreed
  }

  get termsAgreedAt(): Date | null {
    return this._termsAgreedAt
  }

  get privacyAgreedAt(): Date | null {
    return this._privacyAgreedAt
  }

  get marketingAgreedAt(): Date | null {
    return this._marketingAgreedAt
  }

  get updatedAt(): Date {
    return this._updatedAt
  }

  isAdmin(): boolean {
    return this._role === 'admin' || this._role === 'superadmin'
  }

  isSuperAdmin(): boolean {
    return this._role === 'superadmin'
  }

  /**
   * 계정 활성 상태 확인
   */
  isActive(): boolean {
    if (this._status === 'banned') return false
    
    if (this._status === 'suspended' && this._suspendedUntil) {
      return new Date() > this._suspendedUntil
    }
    
    return this._status === 'active'
  }

  /**
   * 로그인 가능 여부
   */
  canLogin(): boolean {
    return this.isActive() && this._loginAttempts < 5
  }

  /**
   * 예약 가능 여부
   */
  canReserve(): boolean {
    return this.isActive()
  }

  /**
   * 나이 계산
   */
  getAge(): number | null {
    if (!this._birthDate) return null
    
    const today = new Date()
    const birthDate = new Date(this._birthDate)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    
    return age
  }

  /**
   * 청소년 여부 (만 16세 미만)
   */
  isYouth(): boolean {
    const age = this.getAge()
    return age !== null && age < 16
  }

  /**
   * 프로필 업데이트
   */
  updateProfile(data: { 
    fullName?: string
    phone?: string | null
    birthDate?: Date | null
    profileImageUrl?: string | null 
  }): User {
    return new User(
      this.id,
      this.email,
      data.fullName ?? this._fullName,
      data.phone !== undefined ? data.phone : this._phone,
      this._role,
      this._status,
      data.birthDate !== undefined ? data.birthDate : this._birthDate,
      data.profileImageUrl !== undefined ? data.profileImageUrl : this._profileImageUrl,
      this._googleId,
      this._lastLoginAt,
      this._loginAttempts,
      this._suspendedUntil,
      this._suspendedReason,
      this._bannedReason,
      this._marketingAgreed,
      this._termsAgreedAt,
      this._privacyAgreedAt,
      this._marketingAgreedAt,
      this.createdAt,
      new Date()
    )
  }

  /**
   * 로그인 성공 처리
   */
  recordSuccessfulLogin(): User {
    return new User(
      this.id,
      this.email,
      this._fullName,
      this._phone,
      this._role,
      this._status,
      this._birthDate,
      this._profileImageUrl,
      this._googleId,
      new Date(),
      0, // 로그인 시도 횟수 초기화
      this._suspendedUntil,
      this._suspendedReason,
      this._bannedReason,
      this._marketingAgreed,
      this._termsAgreedAt,
      this._privacyAgreedAt,
      this._marketingAgreedAt,
      this.createdAt,
      new Date()
    )
  }

  /**
   * 로그인 실패 처리
   */
  recordFailedLogin(): User {
    const newAttempts = this._loginAttempts + 1
    const shouldSuspend = newAttempts >= 5
    
    return new User(
      this.id,
      this.email,
      this._fullName,
      this._phone,
      this._role,
      shouldSuspend ? 'suspended' : this._status,
      this._birthDate,
      this._profileImageUrl,
      this._googleId,
      this._lastLoginAt,
      newAttempts,
      shouldSuspend ? new Date(Date.now() + 30 * 60 * 1000) : this._suspendedUntil, // 30분 정지
      shouldSuspend ? '로그인 시도 초과' : this._suspendedReason,
      this._bannedReason,
      this._marketingAgreed,
      this._termsAgreedAt,
      this._privacyAgreedAt,
      this._marketingAgreedAt,
      this.createdAt,
      new Date()
    )
  }

  /**
   * 계정 정지
   */
  suspend(until: Date, reason?: string): User {
    return new User(
      this.id,
      this.email,
      this._fullName,
      this._phone,
      this._role,
      'suspended',
      this._birthDate,
      this._profileImageUrl,
      this._googleId,
      this._lastLoginAt,
      this._loginAttempts,
      until,
      reason ?? null,
      this._bannedReason,
      this._marketingAgreed,
      this._termsAgreedAt,
      this._privacyAgreedAt,
      this._marketingAgreedAt,
      this.createdAt,
      new Date()
    )
  }

  /**
   * 계정 차단
   */
  ban(reason: string): User {
    return new User(
      this.id,
      this.email,
      this._fullName,
      this._phone,
      this._role,
      'banned',
      this._birthDate,
      this._profileImageUrl,
      this._googleId,
      this._lastLoginAt,
      this._loginAttempts,
      null,
      null,
      reason,
      this._marketingAgreed,
      this._termsAgreedAt,
      this._privacyAgreedAt,
      this._marketingAgreedAt,
      this.createdAt,
      new Date()
    )
  }

  /**
   * 계정 활성화
   */
  activate(): User {
    return new User(
      this.id,
      this.email,
      this._fullName,
      this._phone,
      this._role,
      'active',
      this._birthDate,
      this._profileImageUrl,
      this._googleId,
      this._lastLoginAt,
      0, // 로그인 시도 횟수 초기화
      null,
      null,
      null,
      this._marketingAgreed,
      this._termsAgreedAt,
      this._privacyAgreedAt,
      this._marketingAgreedAt,
      this.createdAt,
      new Date()
    )
  }

  /**
   * 역할 변경
   */
  changeRole(role: UserRole): User {
    return new User(
      this.id,
      this.email,
      this._fullName,
      this._phone,
      role,
      this._status,
      this._birthDate,
      this._profileImageUrl,
      this._googleId,
      this._lastLoginAt,
      this._loginAttempts,
      this._suspendedUntil,
      this._suspendedReason,
      this._bannedReason,
      this._marketingAgreed,
      this._termsAgreedAt,
      this._privacyAgreedAt,
      this._marketingAgreedAt,
      this.createdAt,
      new Date()
    )
  }

  /**
   * Google 계정 연동
   */
  linkGoogleAccount(googleId: string, profileImageUrl?: string): User {
    return new User(
      this.id,
      this.email,
      this._fullName,
      this._phone,
      this._role,
      this._status,
      this._birthDate,
      profileImageUrl || this._profileImageUrl,
      googleId,
      this._lastLoginAt,
      this._loginAttempts,
      this._suspendedUntil,
      this._suspendedReason,
      this._bannedReason,
      this._marketingAgreed,
      this._termsAgreedAt,
      this._privacyAgreedAt,
      this._marketingAgreedAt,
      this.createdAt,
      new Date()
    )
  }

  /**
   * 사용자의 Role 값 객체 반환
   */
  getRole(): Role {
    return Role.create(this._role)
  }

  /**
   * 사용자의 기본 권한 목록 반환
   */
  getPermissions(): Permission[] {
    if (this.isSuperAdmin()) {
      return Permission.adminPermissions() // 슈퍼관리자는 모든 권한 보유
    }
    return this.isAdmin() ? Permission.adminPermissions() : Permission.userPermissions()
  }

  /**
   * 특정 권한 보유 여부 확인
   */
  hasPermission(permission: Permission | string): boolean {
    const targetPermission = typeof permission === 'string' 
      ? Permission.fromString(permission) 
      : permission

    const userPermissions = this.getPermissions()
    return userPermissions.some(p => p.equals(targetPermission))
  }

  /**
   * 특정 리소스에 대한 특정 액션 권한 확인
   */
  canPerformAction(resource: string, action: string): boolean {
    try {
      const permission = Permission.create(resource as any, action as any)
      return this.hasPermission(permission)
    } catch {
      return false
    }
  }

  /**
   * 여러 권한 중 하나라도 보유하고 있는지 확인
   */
  hasAnyPermission(permissions: (Permission | string)[]): boolean {
    return permissions.some(permission => this.hasPermission(permission))
  }

  /**
   * 모든 권한을 보유하고 있는지 확인
   */
  hasAllPermissions(permissions: (Permission | string)[]): boolean {
    return permissions.every(permission => this.hasPermission(permission))
  }

  /**
   * 특정 리소스에 대한 모든 권한 보유 여부
   */
  hasFullAccessTo(resource: string): boolean {
    try {
      const allPermissions = Permission.wildcard(resource as any)
      return this.hasAllPermissions(allPermissions)
    } catch {
      return false
    }
  }

  /**
   * 다른 사용자보다 높은 권한을 가지고 있는지 확인
   */
  hasHigherPrivilegeThan(other: User): boolean {
    return this.getRole().hasHigherPrivilegeThan(other.getRole())
  }

  /**
   * 계정이 활성 상태이고 특정 권한을 가지고 있는지 확인
   */
  canAccess(permission: Permission | string): boolean {
    return this.isActive() && this.hasPermission(permission)
  }
}