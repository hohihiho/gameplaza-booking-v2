import { UserRepository } from '@/src/domain/repositories/user-repository.interface'
import { UserProfileDto } from '../../dtos/auth.dto'

/**
 * 프로필 조회 유스케이스
 * 현재 로그인한 사용자의 프로필 정보 조회
 */
export class GetProfileUseCase {
  constructor(
    private readonly userRepository: UserRepository
  ) {}

  /**
   * 프로필 조회 실행
   */
  async execute(userId: string): Promise<UserProfileDto> {
    // 사용자 조회
    const user = await this.userRepository.findById(userId)
    
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다')
    }

    // 프로필 DTO 생성
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      birthDate: user.birthDate?.toISOString().split('T')[0] || null,
      profileImageUrl: user.profileImageUrl,
      role: user.role,
      status: user.status,
      googleId: user.googleId,
      googleConnected: !!user.googleId,
      marketingAgreed: user.marketingAgreed,
      termsAgreedAt: user.termsAgreedAt?.toISOString() || null,
      privacyAgreedAt: user.privacyAgreedAt?.toISOString() || null,
      marketingAgreedAt: user.marketingAgreedAt?.toISOString() || null,
      suspendedUntil: user.suspendedUntil?.toISOString() || null,
      suspendedReason: user.suspendedReason,
      createdAt: user.createdAt.toISOString(),
      lastLoginAt: user.lastLoginAt?.toISOString() || null
    }
  }
}