import { Admin } from '../entities/admin'

/**
 * Admin 레포지토리 인터페이스
 */
export interface AdminRepository {
  /**
   * ID로 관리자 조회
   */
  findById(id: string): Promise<Admin | null>
  
  /**
   * 사용자 ID로 관리자 조회
   */
  findByUserId(userId: string): Promise<Admin | null>
  
  /**
   * 모든 관리자 조회
   */
  findAll(): Promise<Admin[]>
  
  /**
   * 슈퍼관리자만 조회
   */
  findSuperAdmins(): Promise<Admin[]>
  
  /**
   * 일반 관리자만 조회
   */
  findRegularAdmins(): Promise<Admin[]>
  
  /**
   * 관리자 생성
   */
  create(admin: Admin): Promise<Admin>
  
  /**
   * 관리자 정보 업데이트
   */
  update(admin: Admin): Promise<Admin>
  
  /**
   * 관리자 삭제
   */
  delete(id: string): Promise<void>
  
  /**
   * 관리자 존재 여부 확인
   */
  exists(id: string): Promise<boolean>
  
  /**
   * 사용자 ID로 관리자 존재 여부 확인
   */
  existsByUserId(userId: string): Promise<boolean>
  
  /**
   * 관리자 수 조회
   */
  count(): Promise<number>
  
  /**
   * 슈퍼관리자 수 조회
   */
  countSuperAdmins(): Promise<number>
}