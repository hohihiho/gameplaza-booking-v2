import { Session } from '@/src/domain/entities/session'
import { AuthToken } from '@/src/domain/value-objects/auth-token'
import { SessionRepository } from '@/src/domain/repositories/session-repository.interface'
import { SupabaseClient } from '@supabase/supabase-js'


interface SessionRow {
  id: string
  user_id: string
  access_token: string
  refresh_token: string
  access_token_expires_at: string
  refresh_token_expires_at: string
  device_info: {
    type: 'mobile' | 'tablet' | 'desktop' | 'unknown'
    os?: string
    browser?: string
  } | null
  ip_address: string | null
  user_agent: string | null
  is_active: boolean
  last_activity_at: string
  created_at: string
  updated_at: string
}

/**
 * Supabase 세션 저장소 구현
 */
export class SessionSupabaseRepository implements SessionRepository {
  constructor(
    private readonly supabase: SupabaseClient<any, 'public', any>
  ) {}

  /**
   * ID로 세션 조회
   */
  async findById(id: string): Promise<Session | null> {
    const { data, error } = await this.supabase
      .from('sessions')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return null
    }

    return this.toDomain(data)
  }

  /**
   * 사용자 ID로 세션 조회
   */
  async findByUserId(userId: string): Promise<Session[]> {
    const { data, error } = await this.supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error || !data) {
      return []
    }

    return data.map(row => this.toDomain(row))
  }

  /**
   * 사용자의 활성 세션 조회
   */
  async findActiveByUserId(userId: string): Promise<Session[]> {
    const { data, error } = await this.supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('last_activity_at', { ascending: false })

    if (error || !data) {
      return []
    }

    return data.map(row => this.toDomain(row))
  }

  /**
   * 세션 저장
   */
  async save(session: Session): Promise<Session> {
    const row = this.toRow(session)
    
    const { data, error } = await this.supabase
      .from('sessions')
      .insert(row)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to save session: ${error.message}`)
    }

    return this.toDomain(data)
  }

  /**
   * 세션 업데이트
   */
  async update(session: Session): Promise<Session> {
    const row = this.toRow(session)
    
    const { data, error } = await this.supabase
      .from('sessions')
      .update(row)
      .eq('id', session.id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update session: ${error.message}`)
    }

    return this.toDomain(data)
  }

  /**
   * 세션 삭제
   */
  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('sessions')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete session: ${error.message}`)
    }
  }

  /**
   * 사용자의 모든 세션 삭제
   */
  async deleteByUserId(userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('sessions')
      .delete()
      .eq('user_id', userId)

    if (error) {
      throw new Error(`Failed to delete user sessions: ${error.message}`)
    }
  }

  /**
   * 만료된 세션 조회
   */
  async findExpiredSessions(before?: Date): Promise<Session[]> {
    const now = before || new Date()
    
    const { data, error } = await this.supabase
      .from('sessions')
      .select('*')
      .lt('refresh_token_expires_at', now.toISOString())

    if (error || !data) {
      return []
    }

    return data.map(row => this.toDomain(row))
  }

  /**
   * 비활성 세션 조회
   */
  async findInactiveSessions(inactiveMinutes: number): Promise<Session[]> {
    const threshold = new Date()
    threshold.setMinutes(threshold.getMinutes() - inactiveMinutes)
    
    const { data, error } = await this.supabase
      .from('sessions')
      .select('*')
      .eq('is_active', true)
      .lt('last_activity_at', threshold.toISOString())

    if (error || !data) {
      return []
    }

    return data.map(row => this.toDomain(row))
  }

  /**
   * 만료된 세션 삭제
   */
  async deleteExpiredSessions(before?: Date): Promise<number> {
    const now = before || new Date()
    
    const { data, error } = await this.supabase
      .from('sessions')
      .delete()
      .lt('refresh_token_expires_at', now.toISOString())
      .select('id')

    if (error) {
      throw new Error(`Failed to delete expired sessions: ${error.message}`)
    }

    return data?.length || 0
  }

  /**
   * 사용자의 활성 세션 수 조회
   */
  async countActiveSessionsByUserId(userId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_active', true)

    if (error) {
      throw new Error(`Failed to count active sessions: ${error.message}`)
    }

    return count || 0
  }

  /**
   * 사용자 ID와 디바이스로 세션 조회
   */
  async findByUserIdAndDevice(
    userId: string, 
    deviceType: 'mobile' | 'tablet' | 'desktop' | 'unknown'
  ): Promise<Session[]> {
    const { data, error } = await this.supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('device_info->type', deviceType)
      .order('created_at', { ascending: false })

    if (error || !data) {
      return []
    }

    return data.map(row => this.toDomain(row))
  }

  /**
   * 도메인 모델로 변환
   */
  private toDomain(row: SessionRow): Session {
    const accessToken = AuthToken.create(
      row.access_token,
      new Date(row.access_token_expires_at)
    )
    
    const refreshToken = AuthToken.create(
      row.refresh_token,
      new Date(row.refresh_token_expires_at)
    )

    return Session.createWithTokens(
      row.user_id,
      accessToken,
      refreshToken,
      {
        id: row.id,
        deviceInfo: row.device_info || undefined,
        ipAddress: row.ip_address || undefined,
        userAgent: row.user_agent || undefined,
        isActive: row.is_active,
        lastActivityAt: new Date(row.last_activity_at),
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      }
    )
  }

  /**
   * 데이터베이스 row로 변환
   */
  private toRow(session: Session): SessionRow {
    // 토큰 정보가 없는 경우를 처리
    const now = new Date()
    const accessToken = session.accessToken || AuthToken.create('dummy-token', new Date(now.getTime() + 3600000))
    const refreshToken = session.refreshToken || AuthToken.create('dummy-token', new Date(now.getTime() + 7 * 24 * 3600000))
    
    return {
      id: session.id,
      user_id: session.userId,
      access_token: accessToken.value,
      refresh_token: refreshToken.value,
      access_token_expires_at: accessToken.expiresAt.toISOString(),
      refresh_token_expires_at: refreshToken.expiresAt.toISOString(),
      device_info: session.deviceInfo || null,
      ip_address: session.ipAddress || null,
      user_agent: session.userAgent || null,
      is_active: session.isActive,
      last_activity_at: session.lastActivityAt.toISOString(),
      created_at: session.createdAt.toISOString(),
      updated_at: session.updatedAt.toISOString()
    }
  }
}