import { User } from '@/src/domain/entities/user'
import { UserStatus } from '@/src/domain/value-objects/user-status'
import { UserRepository } from '@/src/domain/repositories/user-repository.interface'
import { users } from '@/lib/db/schema'
import { eq, and, desc, sql } from 'drizzle-orm'
import { createDB } from '@/lib/db/client'

/**
 * Drizzle ORM 사용자 저장소 구현
 */
export class UserDrizzleRepository implements UserRepository {
  private _db: any

  private get db() {
    if (!this._db) {
      this._db = createDB()
    }
    return this._db
  }

  /**
   * ID로 사용자 조회
   */
  async findById(id: string): Promise<User | null> {
    try {
      const [row] = await this.db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1)

      if (!row) {
        return null
      }

      return this.toDomain(row)
    } catch (error) {
      console.error('UserDrizzleRepository.findById error:', error)
      return null
    }
  }

  /**
   * 이메일로 사용자 조회
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      const [row] = await this.db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1)

      if (!row) {
        return null
      }

      return this.toDomain(row)
    } catch (error) {
      console.error('UserDrizzleRepository.findByEmail error:', error)
      return null
    }
  }

  /**
   * Google ID로 사용자 조회
   */
  async findByGoogleId(googleId: string): Promise<User | null> {
    try {
      const [row] = await this.db
        .select()
        .from(users)
        .where(eq(users.googleId, googleId))
        .limit(1)

      if (!row) {
        return null
      }

      return this.toDomain(row)
    } catch (error) {
      console.error('UserDrizzleRepository.findByGoogleId error:', error)
      return null
    }
  }

  /**
   * 역할별 사용자 조회
   */
  async findByRole(role: string): Promise<User[]> {
    try {
      const rows = await this.db
        .select()
        .from(users)
        .where(eq(users.role, role))
        .orderBy(desc(users.createdAt))

      return rows.map((row: any) => this.toDomain(row))
    } catch (error) {
      console.error('UserDrizzleRepository.findByRole error:', error)
      return []
    }
  }

  /**
   * 사용자 저장
   */
  async save(user: User): Promise<User> {
    try {
      const row = this.toRow(user)
      
      const [inserted] = await this.db
        .insert(users)
        .values(row)
        .returning()

      return this.toDomain(inserted)
    } catch (error) {
      console.error('UserDrizzleRepository.save error:', error)
      throw new Error(`사용자 저장 실패: ${error}`)
    }
  }

  /**
   * 사용자 업데이트
   */
  async update(user: User): Promise<User> {
    try {
      const row = this.toRow(user)
      
      const [updated] = await this.db
        .update(users)
        .set(row)
        .where(eq(users.id, user.id))
        .returning()

      if (!updated) {
        throw new Error('사용자를 찾을 수 없습니다')
      }

      return this.toDomain(updated)
    } catch (error) {
      console.error('UserDrizzleRepository.update error:', error)
      throw new Error(`사용자 업데이트 실패: ${error}`)
    }
  }

  /**
   * 사용자 삭제
   */
  async delete(id: string): Promise<void> {
    try {
      await this.db
        .delete(users)
        .where(eq(users.id, id))
    } catch (error) {
      console.error('UserDrizzleRepository.delete error:', error)
      throw new Error(`사용자 삭제 실패: ${error}`)
    }
  }

  /**
   * 활성 사용자 조회
   */
  async findActiveUsers(): Promise<User[]> {
    try {
      const rows = await this.db
        .select()
        .from(users)
        .where(eq(users.status, 'active'))
        .orderBy(desc(users.createdAt))

      return rows.map((row: any) => this.toDomain(row))
    } catch (error) {
      console.error('UserDrizzleRepository.findActiveUsers error:', error)
      return []
    }
  }

  /**
   * 정지된 사용자 조회
   */
  async findSuspendedUsers(): Promise<User[]> {
    try {
      const rows = await this.db
        .select()
        .from(users)
        .where(eq(users.status, 'suspended'))
        .orderBy(desc(users.suspendedAt))

      return rows.map((row: any) => this.toDomain(row))
    } catch (error) {
      console.error('UserDrizzleRepository.findSuspendedUsers error:', error)
      return []
    }
  }

  /**
   * 차단된 사용자 조회
   */
  async findBannedUsers(): Promise<User[]> {
    try {
      const rows = await this.db
        .select()
        .from(users)
        .where(eq(users.status, 'banned'))
        .orderBy(desc(users.bannedAt))

      return rows.map((row: any) => this.toDomain(row))
    } catch (error) {
      console.error('UserDrizzleRepository.findBannedUsers error:', error)
      return []
    }
  }

  /**
   * 상태별 사용자 수 조회
   */
  async countByStatus(status: 'active' | 'suspended' | 'banned'): Promise<number> {
    try {
      const [result] = await this.db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(eq(users.status, status))

      return result?.count || 0
    } catch (error) {
      console.error('UserDrizzleRepository.countByStatus error:', error)
      return 0
    }
  }

  /**
   * 이메일 중복 확인
   */
  async existsByEmail(email: string): Promise<boolean> {
    try {
      const [result] = await this.db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(eq(users.email, email))

      return (result?.count || 0) > 0
    } catch (error) {
      console.error('UserDrizzleRepository.existsByEmail error:', error)
      return false
    }
  }

  /**
   * 도메인 모델로 변환
   */
  private toDomain(row: any): User {
    const status = UserStatus.create(
      row.status as 'active' | 'suspended' | 'banned',
      row.suspendedAt ? new Date(row.suspendedAt) : undefined,
      row.suspendedReason || undefined,
      row.bannedAt ? new Date(row.bannedAt) : undefined,
      row.bannedReason || undefined
    )

    return User.create(
      {
        email: row.email,
        name: row.name,
        phone: row.phone,
        role: row.role,
        status,
        googleId: row.googleId,
        marketingAgreed: row.marketingAgreed || false,
        pushNotificationsEnabled: row.pushNotificationsEnabled || false,
        lastLoginAt: row.lastLoginAt ? new Date(row.lastLoginAt) : undefined,
        loginCount: row.loginCount || 0
      },
      row.id
    )
  }

  /**
   * 데이터베이스 row로 변환
   */
  private toRow(user: User): any {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      status: user.status.value,
      suspendedAt: user.status.suspendedAt?.toISOString() || null,
      suspendedReason: user.status.suspendedReason || null,
      bannedAt: user.status.bannedAt?.toISOString() || null,
      bannedReason: user.status.bannedReason || null,
      googleId: user.googleId || null,
      marketingAgreed: user.marketingAgreed,
      pushNotificationsEnabled: user.pushNotificationsEnabled,
      lastLoginAt: user.lastLoginAt?.toISOString() || null,
      loginCount: user.loginCount,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString()
    }
  }
}