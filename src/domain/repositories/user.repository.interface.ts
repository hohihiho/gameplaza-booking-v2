import { User } from '../entities/user.entity'

export interface UserRepository {
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  findByGoogleId(googleId: string): Promise<User | null>
  save(user: User): Promise<User>
  update(user: User): Promise<User>
  delete(id: string): Promise<void>
}

// 기존 인터페이스명과의 호환성을 위한 타입 별칭
export type IUserRepository = UserRepository