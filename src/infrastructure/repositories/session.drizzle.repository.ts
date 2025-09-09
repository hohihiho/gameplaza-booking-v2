import { Session } from '@/src/domain/entities/session'
import { AuthToken } from '@/src/domain/value-objects/auth-token'
import { SessionRepository } from '@/src/domain/repositories/session-repository.interface'
import { sessions } from '@/lib/db/schema'
import { eq, lt, and, desc, sql } from 'drizzle-orm'
import { createDB } from '@/lib/db/client'

/**
 * Drizzle ORM 세션 저장소 구현
 */
export class SessionDrizzleRepository implements SessionRepository {
  private _db: any

  private get db() {
    if (!this._db) {
      this._db = createDB()
    }
    return this._db
  }

  /**
   * ID로 세션 조회
   */
  async findById(id: string): Promise<Session | null> {
    try {
      const [row] = await this.db
        .select()
        .from(sessions)
        .where(eq(sessions.id, id))
        .limit(1)

      if (!row) {
        return null
      }

      return this.toDomain(row)
    } catch (error) {
      console.error('SessionDrizzleRepository.findById error:', error)
      return null
    }
  }

  /**
   * 사용자 ID로 세션 조회
   */
  async findByUserId(userId: string): Promise<Session[]> {
    try {
      const rows = await this.db
        .select()
        .from(sessions)
        .where(eq(sessions.userId, userId))
        .orderBy(desc(sessions.createdAt))

      return rows.map((row: any) => this.toDomain(row))
    } catch (error) {
      console.error('SessionDrizzleRepository.findByUserId error:', error)
      return []
    }
  }

  /**
   * 사용자의 활성 세션 조회
   */
  async findActiveByUserId(userId: string): Promise<Session[]> {
    try {
      const rows = await this.db
        .select()
        .from(sessions)
        .where(
          and(
            eq(sessions.userId, userId),
            eq(sessions.isActive, true)
          )
        )
        .orderBy(desc(sessions.lastActivityAt))

      return rows.map((row: any) => this.toDomain(row))
    } catch (error) {
      console.error('SessionDrizzleRepository.findActiveByUserId error:', error)
      return []
    }
  }

  /**
   * 세션 저장
   */
  async save(session: Session): Promise<Session> {
    try {
      const row = this.toRow(session)
      
      const [inserted] = await this.db
        .insert(sessions)
        .values(row)
        .returning()

      return this.toDomain(inserted)
    } catch (error) {
      console.error('SessionDrizzleRepository.save error:', error)
      throw new Error(`세션 저장 실패: ${error}`)
    }
  }

  /**
   * 세션 업데이트
   */
  async update(session: Session): Promise<Session> {
    try {
      const row = this.toRow(session)
      
      const [updated] = await this.db
        .update(sessions)
        .set(row)
        .where(eq(sessions.id, session.id))
        .returning()

      if (!updated) {
        throw new Error('세션을 찾을 수 없습니다')
      }

      return this.toDomain(updated)
    } catch (error) {
      console.error('SessionDrizzleRepository.update error:', error)
      throw new Error(`세션 업데이트 실패: ${error}`)
    }
  }

  /**
   * 세션 삭제
   */
  async delete(id: string): Promise<void> {
    try {
      await this.db
        .delete(sessions)
        .where(eq(sessions.id, id))
    } catch (error) {
      console.error('SessionDrizzleRepository.delete error:', error)
      throw new Error(`세션 삭제 실패: ${error}`)
    }
  }

  /**
   * 사용자의 모든 세션 삭제
   */
  async deleteByUserId(userId: string): Promise<void> {
    try {
      await this.db
        .delete(sessions)
        .where(eq(sessions.userId, userId))
    } catch (error) {
      console.error('SessionDrizzleRepository.deleteByUserId error:', error)
      throw new Error(`사용자 세션 삭제 실패: ${error}`)
    }
  }

  /**
   * 만료된 세션 조회
   */
  async findExpiredSessions(before?: Date): Promise<Session[]> {
    try {
      const now = before || new Date()
      
      const rows = await this.db
        .select()
        .from(sessions)
        .where(lt(sessions.refreshTokenExpiresAt, now.toISOString()))

      return rows.map((row: any) => this.toDomain(row))
    } catch (error) {
      console.error('SessionDrizzleRepository.findExpiredSessions error:', error)
      return []
    }
  }

  /**
   * 비활성 세션 조회
   */
  async findInactiveSessions(inactiveMinutes: number): Promise<Session[]> {
    try {
      const threshold = new Date()
      threshold.setMinutes(threshold.getMinutes() - inactiveMinutes)
      
      const rows = await this.db
        .select()
        .from(sessions)
        .where(
          and(
            eq(sessions.isActive, true),
            lt(sessions.lastActivityAt, threshold.toISOString())
          )
        )

      return rows.map((row: any) => this.toDomain(row))
    } catch (error) {
      console.error('SessionDrizzleRepository.findInactiveSessions error:', error)
      return []
    }
  }

  /**
   * 만료된 세션 삭제
   */
  async deleteExpiredSessions(before?: Date): Promise<number> {
    try {
      const now = before || new Date()
      
      const result = await this.db
        .delete(sessions)
        .where(lt(sessions.refreshTokenExpiresAt, now.toISOString()))
        .returning({ id: sessions.id })

      return result.length
    } catch (error) {
      console.error('SessionDrizzleRepository.deleteExpiredSessions error:', error)
      throw new Error(`만료된 세션 삭제 실패: ${error}`)
    }
  }

  /**
   * 사용자의 활성 세션 수 조회
   */
  async countActiveSessionsByUserId(userId: string): Promise<number> {
    try {
      const [result] = await this.db
        .select({ count: sql<number>`count(*)` })
        .from(sessions)
        .where(
          and(
            eq(sessions.userId, userId),
            eq(sessions.isActive, true)
          )
        )

      return result?.count || 0
    } catch (error) {
      console.error('SessionDrizzleRepository.countActiveSessionsByUserId error:', error)
      throw new Error(`활성 세션 수 조회 실패: ${error}`)
    }
  }

  /**
   * 사용자 ID와 디바이스로 세션 조회
   */
  async findByUserIdAndDevice(
    userId: string, 
    deviceType: 'mobile' | 'tablet' | 'desktop' | 'unknown'
  ): Promise<Session[]> {
    try {
      const rows = await this.db
        .select()
        .from(sessions)
        .where(
          and(
            eq(sessions.userId, userId),
            sql`json_extract(${sessions.deviceInfo}, '$.type') = ${deviceType}`
          )
        )
        .orderBy(desc(sessions.createdAt))

      return rows.map((row: any) => this.toDomain(row))
    } catch (error) {
      console.error('SessionDrizzleRepository.findByUserIdAndDevice error:', error)
      return []
    }
  }

  /**
   * 도메인 모델로 변환
   */
  private toDomain(row: any): Session {
    const accessToken = AuthToken.create(
      row.accessToken,
      new Date(row.accessTokenExpiresAt)
    )
    
    const refreshToken = AuthToken.create(
      row.refreshToken,
      new Date(row.refreshTokenExpiresAt)
    )

    const deviceInfo = typeof row.deviceInfo === 'string' 
      ? JSON.parse(row.deviceInfo) 
      : row.deviceInfo

    return Session.createWithTokens(
      row.userId,
      accessToken,
      refreshToken,
      {
        id: row.id,
        deviceInfo: deviceInfo || undefined,
        ipAddress: row.ipAddress || undefined,
        userAgent: row.userAgent || undefined,
        isActive: row.isActive,
        lastActivityAt: new Date(row.lastActivityAt),
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt)
      }
    )
  }

  /**
   * 데이터베이스 row로 변환
   */
  private toRow(session: Session): any {
    // 토큰 정보가 없는 경우를 처리
    const now = new Date()
    const accessToken = session.accessToken || AuthToken.create('dummy-token', new Date(now.getTime() + 3600000))
    const refreshToken = session.refreshToken || AuthToken.create('dummy-token', new Date(now.getTime() + 7 * 24 * 3600000))
    
    return {
      id: session.id,
      userId: session.userId,
      accessToken: accessToken.value,
      refreshToken: refreshToken.value,
      accessTokenExpiresAt: accessToken.expiresAt.toISOString(),
      refreshTokenExpiresAt: refreshToken.expiresAt.toISOString(),
      deviceInfo: session.deviceInfo ? JSON.stringify(session.deviceInfo) : null,
      ipAddress: session.ipAddress || null,
      userAgent: session.userAgent || null,
      isActive: session.isActive,
      lastActivityAt: session.lastActivityAt.toISOString(),
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString()
    }
  }
}