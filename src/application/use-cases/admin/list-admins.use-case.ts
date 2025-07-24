import { Admin } from '@/src/domain/entities/admin'
import { User } from '@/src/domain/entities/user'
import { AdminRepository } from '@/src/domain/repositories/admin-repository.interface'
import { UserRepository } from '@/src/domain/repositories/user.repository.interface'
import {
  ListAdminsRequestDto,
  AdminListResponseDto,
  AdminResponseDto,
  SuperAdminCheckDto
} from '@/src/application/dtos/admin.dto'

/**
 * 관리자 목록 조회 유스케이스
 * 슈퍼관리자만 실행 가능
 */
export class ListAdminsUseCase {
  constructor(
    private readonly adminRepository: AdminRepository,
    private readonly userRepository: UserRepository
  ) {}

  /**
   * 관리자 목록 조회 실행
   */
  async execute(
    request: ListAdminsRequestDto,
    superAdminCheck: SuperAdminCheckDto
  ): Promise<AdminListResponseDto> {
    // 1. 실행자가 슈퍼관리자인지 확인
    await this.validateSuperAdmin(superAdminCheck)

    // 2. 필터 옵션 설정
    const includeSuperAdmins = request.includeSuperAdmins ?? true
    const includeRegularAdmins = request.includeRegularAdmins ?? true
    const limit = request.limit ?? 20
    const offset = request.offset ?? 0

    // 3. 관리자 목록 조회
    let admins: Admin[] = []
    
    if (includeSuperAdmins && includeRegularAdmins) {
      admins = await this.adminRepository.findAll()
    } else if (includeSuperAdmins) {
      admins = await this.adminRepository.findSuperAdmins()
    } else if (includeRegularAdmins) {
      admins = await this.adminRepository.findRegularAdmins()
    }

    // 4. 페이지네이션 적용
    const total = admins.length
    const paginatedAdmins = admins.slice(offset, offset + limit)

    // 5. 사용자 정보 조회 및 DTO 변환
    const adminDtos = await Promise.all(
      paginatedAdmins.map(async (admin) => {
        const user = await this.userRepository.findById(admin.userId)
        if (!user) {
          throw new Error(`사용자 정보를 찾을 수 없습니다: ${admin.userId}`)
        }
        return this.toResponseDto(admin, user)
      })
    )

    // 6. 응답 생성
    return {
      admins: adminDtos,
      total,
      limit,
      offset
    }
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
      throw new Error('슈퍼관리자만 관리자 목록을 조회할 수 있습니다')
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