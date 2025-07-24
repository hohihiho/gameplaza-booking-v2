import { AdminPermissionsData } from '@/src/domain/value-objects/admin-permissions'

/**
 * 관리자 생성 요청 DTO
 */
export interface CreateAdminRequestDto {
  userId: string
  permissions?: Partial<AdminPermissionsData>
  isSuperAdmin?: boolean
}

/**
 * 관리자 권한 업데이트 요청 DTO
 */
export interface UpdateAdminPermissionsRequestDto {
  adminId: string
  permissions: Partial<AdminPermissionsData>
}

/**
 * 관리자 삭제 요청 DTO
 */
export interface DeleteAdminRequestDto {
  adminId: string
}

/**
 * 관리자 목록 조회 요청 DTO
 */
export interface ListAdminsRequestDto {
  includeSuperAdmins?: boolean
  includeRegularAdmins?: boolean
  limit?: number
  offset?: number
}

/**
 * 관리자 상세 조회 요청 DTO
 */
export interface GetAdminDetailRequestDto {
  adminId: string
}

/**
 * 관리자 응답 DTO
 */
export interface AdminResponseDto {
  id: string
  userId: string
  user: {
    id: string
    email: string
    fullName: string
    profileImageUrl?: string | null
  }
  permissions: AdminPermissionsData
  isSuperAdmin: boolean
  createdAt: Date
  updatedAt: Date
}

/**
 * 관리자 목록 응답 DTO
 */
export interface AdminListResponseDto {
  admins: AdminResponseDto[]
  total: number
  limit: number
  offset: number
}

/**
 * 관리자 권한 검증 응답 DTO
 */
export interface AdminPermissionCheckResponseDto {
  hasPermission: boolean
  adminId: string
  permission: keyof AdminPermissionsData
}

/**
 * 슈퍼관리자 권한 검증을 위한 내부 DTO
 */
export interface SuperAdminCheckDto {
  executorId: string // 실행자의 Admin ID
  executorUserId: string // 실행자의 User ID
}

/**
 * 관리자 작업 결과 DTO
 */
export interface AdminOperationResultDto {
  success: boolean
  adminId?: string
  message?: string
  error?: string
}