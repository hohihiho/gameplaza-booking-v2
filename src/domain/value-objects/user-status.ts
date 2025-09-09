/**
 * 사용자 상태 값 객체
 */
export class UserStatus {
  constructor(
    public readonly value: 'active' | 'suspended' | 'banned',
    public readonly suspendedAt?: Date,
    public readonly suspendedReason?: string,
    public readonly bannedAt?: Date,
    public readonly bannedReason?: string
  ) {}

  /**
   * 팩토리 메서드
   */
  static create(
    value: 'active' | 'suspended' | 'banned',
    suspendedAt?: Date,
    suspendedReason?: string,
    bannedAt?: Date,
    bannedReason?: string
  ): UserStatus {
    return new UserStatus(value, suspendedAt, suspendedReason, bannedAt, bannedReason)
  }

  /**
   * 활성 상태 생성
   */
  static active(): UserStatus {
    return new UserStatus('active')
  }

  /**
   * 정지 상태 생성
   */
  static suspended(reason?: string): UserStatus {
    return new UserStatus('suspended', new Date(), reason)
  }

  /**
   * 차단 상태 생성
   */
  static banned(reason?: string): UserStatus {
    return new UserStatus('banned', undefined, undefined, new Date(), reason)
  }

  /**
   * 활성 상태인지 확인
   */
  isActive(): boolean {
    return this.value === 'active'
  }

  /**
   * 정지 상태인지 확인
   */
  isSuspended(): boolean {
    return this.value === 'suspended'
  }

  /**
   * 차단 상태인지 확인
   */
  isBanned(): boolean {
    return this.value === 'banned'
  }

  /**
   * 상태 변경
   */
  changeStatus(newStatus: 'active' | 'suspended' | 'banned', reason?: string): UserStatus {
    switch (newStatus) {
      case 'active':
        return UserStatus.active()
      case 'suspended':
        return UserStatus.suspended(reason)
      case 'banned':
        return UserStatus.banned(reason)
      default:
        throw new Error(`Invalid status: ${newStatus}`)
    }
  }

  /**
   * 활성화
   */
  activate(): UserStatus {
    return UserStatus.active()
  }

  /**
   * 정지
   */
  suspend(reason?: string): UserStatus {
    return UserStatus.suspended(reason)
  }

  /**
   * 차단
   */
  ban(reason?: string): UserStatus {
    return UserStatus.banned(reason)
  }

  /**
   * 같은 상태인지 비교
   */
  equals(other: UserStatus): boolean {
    return this.value === other.value
  }

  /**
   * 문자열로 변환
   */
  toString(): string {
    return this.value
  }
}