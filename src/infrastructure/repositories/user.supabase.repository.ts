import { User, UserRole, UserStatus } from '@/src/domain/entities/user'
import { UserRepository } from '@/src/domain/repositories/user-repository.interface'
import { createClient } from '@supabase/supabase-js'

interface UserRow {
  id: string
  email: string
  full_name: string
  phone: string | null
  role: UserRole
  status: UserStatus
  birth_date: string | null
  profile_image_url: string | null
  google_id: string | null
  last_login_at: string | null
  login_attempts: number
  suspended_until: string | null
  banned_reason: string | null
  created_at: string
  updated_at: string
}

/**
 * Supabase 사용자 저장소 구현
 */
export class UserSupabaseRepository implements UserRepository {
  constructor(
    private readonly supabase: ReturnType<typeof createClient>
  ) {}

  /**
   * ID로 사용자 조회
   */
  async findById(id: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return null
    }

    return this.toDomain(data)
  }

  /**
   * 이메일로 사용자 조회
   */
  async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (error || !data) {
      return null
    }

    return this.toDomain(data)
  }

  /**
   * Google ID로 사용자 조회
   */
  async findByGoogleId(googleId: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('google_id', googleId)
      .single()

    if (error || !data) {
      return null
    }

    return this.toDomain(data)
  }

  /**
   * 역할별 사용자 조회
   */
  async findByRole(role: UserRole): Promise<User[]> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('role', role)

    if (error || !data) {
      return []
    }

    return data.map(row => this.toDomain(row))
  }

  /**
   * 사용자 저장
   */
  async save(user: User): Promise<User> {
    const row = this.toRow(user)
    
    const { data, error } = await this.supabase
      .from('users')
      .insert(row)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to save user: ${error.message}`)
    }

    return this.toDomain(data)
  }

  /**
   * 사용자 업데이트
   */
  async update(user: User): Promise<User> {
    const row = this.toRow(user)
    
    const { data, error } = await this.supabase
      .from('users')
      .update(row)
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update user: ${error.message}`)
    }

    return this.toDomain(data)
  }

  /**
   * 사용자 삭제
   */
  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('users')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete user: ${error.message}`)
    }
  }

  /**
   * 활성 사용자 조회
   */
  async findActiveUsers(): Promise<User[]> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('status', 'active')

    if (error || !data) {
      return []
    }

    return data.map(row => this.toDomain(row))
  }

  /**
   * 정지된 사용자 조회
   */
  async findSuspendedUsers(): Promise<User[]> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('status', 'suspended')

    if (error || !data) {
      return []
    }

    return data.map(row => this.toDomain(row))
  }

  /**
   * 차단된 사용자 조회
   */
  async findBannedUsers(): Promise<User[]> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('status', 'banned')

    if (error || !data) {
      return []
    }

    return data.map(row => this.toDomain(row))
  }

  /**
   * 상태별 사용자 수 조회
   */
  async countByStatus(status: UserStatus): Promise<number> {
    const { count, error } = await this.supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('status', status)

    if (error) {
      throw new Error(`Failed to count users: ${error.message}`)
    }

    return count || 0
  }

  /**
   * 이메일 존재 여부 확인
   */
  async existsByEmail(email: string): Promise<boolean> {
    const { count, error } = await this.supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('email', email)

    if (error) {
      throw new Error(`Failed to check email existence: ${error.message}`)
    }

    return (count || 0) > 0
  }

  /**
   * 도메인 모델로 변환
   */
  private toDomain(row: UserRow): User {
    return User.create({
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      phone: row.phone,
      role: row.role,
      status: row.status,
      birthDate: row.birth_date ? new Date(row.birth_date) : null,
      profileImageUrl: row.profile_image_url,
      googleId: row.google_id,
      lastLoginAt: row.last_login_at ? new Date(row.last_login_at) : null,
      loginAttempts: row.login_attempts,
      suspendedUntil: row.suspended_until ? new Date(row.suspended_until) : null,
      bannedReason: row.banned_reason,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    })
  }

  /**
   * 데이터베이스 row로 변환
   */
  private toRow(user: User): UserRow {
    return {
      id: user.id,
      email: user.email,
      full_name: user.fullName,
      phone: user.phone,
      role: user.role,
      status: user.status,
      birth_date: user.birthDate?.toISOString() || null,
      profile_image_url: user.profileImageUrl,
      google_id: user.googleId,
      last_login_at: user.lastLoginAt?.toISOString() || null,
      login_attempts: user.loginAttempts,
      suspended_until: user.suspendedUntil?.toISOString() || null,
      banned_reason: user.bannedReason,
      created_at: user.createdAt.toISOString(),
      updated_at: user.updatedAt.toISOString()
    }
  }
}