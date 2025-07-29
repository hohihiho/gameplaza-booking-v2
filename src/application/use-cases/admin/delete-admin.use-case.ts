import { Admin } from '@/src/domain/entities/admin'
import { AdminRepository } from '@/src/domain/repositories/admin-repository.interface'
import {
  DeleteAdminRequestDto,
  AdminOperationResultDto,
  SuperAdminCheckDto
} from '@/src/application/dtos/admin.dto'

/**
 * 관리자 삭제 유스케이스
 * 슈퍼관리자만 실행 가능
 * 슈퍼관리자는 삭제 불가
 */
export class DeleteAdminUseCase {
  constructor(
    private readonly adminRepository: AdminRepository
  ) {}

  /**
   * 관리자 삭제 실행
   */
  async execute(
    request: DeleteAdminRequestDto,
    superAdminCheck: SuperAdminCheckDto
  ): Promise<AdminOperationResultDto> {
    // 1. 실행자가 슈퍼관리자인지 확인
    const executor = await this.validateSuperAdmin(superAdminCheck)

    // 2. 대상 관리자 조회
    const targetAdmin = await this.adminRepository.findById(request.adminId)
    if (!targetAdmin) {
      throw new Error('관리자를 찾을 수 없습니다')
    }

    // 3. 삭제 가능 여부 확인
    if (executor.id === targetAdmin.id) {
      throw new Error('자기 자신은 삭제할 수 없습니다')
    }
    
    if (!executor.canDelete(targetAdmin)) {
      if (targetAdmin.isSuperAdmin) {
        throw new Error('슈퍼관리자는 삭제할 수 없습니다')
      }
      throw new Error('해당 관리자를 삭제할 권한이 없습니다')
    }

    // 4. 관리자 삭제
    await this.adminRepository.delete(targetAdmin.id)

    // 5. 결과 반환
    return {
      success: true,
      adminId: targetAdmin.id,
      message: '관리자가 성공적으로 삭제되었습니다'
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
      throw new Error('슈퍼관리자만 관리자를 삭제할 수 있습니다')
    }

    return executor
  }
}