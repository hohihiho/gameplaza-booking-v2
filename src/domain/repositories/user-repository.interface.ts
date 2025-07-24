import { User } from '../entities/user'

/**
 * User 레포지토리 인터페이스
 */
export interface UserRepository {
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  findByGoogleId(googleId: string): Promise<User | null>
  findByRole(role: 'user' | 'admin'): Promise<User[]>
  save(user: User): Promise<User>
  update(user: User): Promise<User>
  delete(id: string): Promise<void>
  
  // 추가 쿼리 메서드
  findActiveUsers(): Promise<User[]>
  findSuspendedUsers(): Promise<User[]>
  findBannedUsers(): Promise<User[]>
  countByStatus(status: 'active' | 'suspended' | 'banned'): Promise<number>
  existsByEmail(email: string): Promise<boolean>
}