import { Admin } from '@/src/domain/entities/admin'
import { User } from '@/src/domain/entities/user'
import { AdminRepository } from '@/src/domain/repositories/admin-repository.interface'
import { UserRepository } from '@/src/domain/repositories/user.repository.interface'
import {
  GetAdminDetailRequestDto,
  AdminResponseDto,
  SuperAdminCheckDto
} from '@/src/application/dtos/admin.dto'

/**
 * 관리자 상세 조회 유스케이스
 * 슈퍼관리자만 실행 가능
 */
export class GetAdminDetailUseCase {
  constructor(
    private readonly adminRepository: AdminRepository,
    private readonly userRepository: UserRepository
  ) {}

  /**
   * 관리자 상세 조회 실행
   */
  async execute(
    request: GetAdminDetailRequestDto,
    superAdminCheck: SuperAdminCheckDto
  ): Promise<AdminResponseDto> {
    // 1. 실행자가 슈퍼관리자인지 확인
    await this.validateSuperAdmin(superAdminCheck)

    // 2. 대상 관리자 조회
    const admin = await this.adminRepository.findById(request.adminId)
    if (!admin) {
      throw new Error('관리자를 찾을 수 없습니다')
    }

    // 3. 사용자 정보 조회
    const user = await this.userRepository.findById(admin.userId)
    if (!user) {
      throw new Error('사용자 정보를 찾을 수 없습니다')
    }

    // 4. 응답 생성
    return this.toResponseDto(admin, user)
  }

  /**
   * 슈퍼관리자 권한 검증
   */
  private async validateSuperAdmin(check: SuperAdminCheckDto): Promise<Admin> {
    const executor = await this.adminRepository.findById(check.executorId)
    
    if (!executor) {
      throw new Error('권한이 없습니다')
    }

    if (!executor.isSuperAdmin) {
      throw new Error('슈퍼관리자만 관리자 정보를 조회할 수 있습니다')
    }

    return executor
  }

  /**
   * 도메인 엔티티를 응답 DTO로 변환
   */
  private toResponseDto(admin: Admin, user: User): AdminResponseDto {
    return {
      id: admin.id,
      userId: admin.userId,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        profileImageUrl: user.profileImageUrl
      },
      permissions: admin.permissions.toJSON(),
      isSuperAdmin: admin.isSuperAdmin,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt
    }
  }
}