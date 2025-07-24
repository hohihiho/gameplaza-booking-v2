import { Admin } from '@/src/domain/entities/admin'
import { User } from '@/src/domain/entities/user'
import { AdminRepository } from '@/src/domain/repositories/admin-repository.interface'
import { UserRepository } from '@/src/domain/repositories/user.repository.interface'
import { 
  CreateAdminRequestDto, 
  AdminResponseDto,
  SuperAdminCheckDto 
} from '@/src/application/dtos/admin.dto'

/**
 * 관리자 생성 유스케이스
 * 슈퍼관리자만 실행 가능
 */
export class CreateAdminUseCase {
  constructor(
    private readonly adminRepository: AdminRepository,
    private readonly userRepository: UserRepository
  ) {}

  /**
   * 관리자 생성 실행
   */
  async execute(
    request: CreateAdminRequestDto,
    superAdminCheck: SuperAdminCheckDto
  ): Promise<AdminResponseDto> {
    // 1. 실행자가 슈퍼관리자인지 확인
    const executor = await this.validateSuperAdmin(superAdminCheck)

    // 2. 대상 사용자 존재 확인
    const targetUser = await this.userRepository.findById(request.userId)
    if (!targetUser) {
      throw new Error('사용자를 찾을 수 없습니다')
    }

    // 3. 이미 관리자인지 확인
    const existingAdmin = await this.adminRepository.findByUserId(request.userId)
    if (existingAdmin) {
      throw new Error('이미 관리자로 등록된 사용자입니다')
    }

    // 4. 관리자 생성
    const adminId = `admin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const admin = request.isSuperAdmin
      ? Admin.createSuperAdmin({
          id: adminId,
          userId: request.userId
        })
      : Admin.createRegularAdmin({
          id: adminId,
          userId: request.userId,
          permissions: request.permissions
        })

    // 5. 저장
    const savedAdmin = await this.adminRepository.create(admin)

    // 6. 응답 생성
    return this.toResponseDto(savedAdmin, targetUser)
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
      throw new Error('슈퍼관리자만 관리자를 생성할 수 있습니다')
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