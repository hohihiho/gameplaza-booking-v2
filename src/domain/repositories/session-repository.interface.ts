import { Session } from '../entities/session'

/**
 * Session 레포지토리 인터페이스
 */
export interface SessionRepository {
  findById(id: string): Promise<Session | null>
  findByUserId(userId: string): Promise<Session[]>
  findActiveByUserId(userId: string): Promise<Session[]>
  save(session: Session): Promise<Session>
  update(session: Session): Promise<Session>
  delete(id: string): Promise<void>
  deleteByUserId(userId: string): Promise<void>
  
  // 추가 쿼리 메서드
  findExpiredSessions(before?: Date): Promise<Session[]>
  findInactiveSessions(inactiveMinutes: number): Promise<Session[]>
  deleteExpiredSessions(before?: Date): Promise<number>
  countActiveSessionsByUserId(userId: string): Promise<number>
  findByUserIdAndDevice(
    userId: string, 
    deviceType: 'mobile' | 'tablet' | 'desktop' | 'unknown'
  ): Promise<Session[]>
}