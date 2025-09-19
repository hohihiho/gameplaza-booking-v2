/**
 * 대여 제한 관리 Repository
 * maimai 기기 동시 대여 제한 등 관리
 */

import { getDB } from '@/lib/db/server'
import { AppError, ErrorCodes } from '@/lib/utils/error-handler'
import { logger } from '@/lib/utils/logger'

export interface RentalLimit {
  id: string
  user_id: string
  device_type: string
  current_rentals: number
  max_rentals: number
  is_two_player?: boolean
  created_at: string
  updated_at?: string
}

export interface RentalLimitRecord {
  userId: string
  deviceType: string
  count: number
}

export class RentalLimitRepository {
  private db: any

  constructor(db?: any) {
    this.db = db || getDB()
  }

  /**
   * 사용자의 특정 기기 타입 대여 현황 조회
   */
  async getCurrentRentals(userId: string, deviceType: string): Promise<number> {
    try {
      const stmt = this.db.prepare(`
        SELECT COUNT(*) as count
        FROM reservations r
        JOIN devices d ON r.device_id = d.id
        WHERE r.user_id = ?
        AND d.device_type = ?
        AND r.status IN ('pending', 'approved', 'checked_in')
        AND r.date >= date('now')
      `)

      const result = await stmt.bind(userId, deviceType).first()
      return result?.count || 0
    } catch (error) {
      logger.error('Failed to get current rentals', { userId, deviceType, error })
      return 0
    }
  }

  /**
   * 대여 제한 확인
   */
  async checkRentalLimit(
    userId: string,
    deviceType: string,
    requestedUnits: number = 1
  ): Promise<boolean> {
    try {
      const currentRentals = await this.getCurrentRentals(userId, deviceType)

      // maimai 기기는 최대 3대까지만 허용
      if (deviceType.toLowerCase() === 'maimai') {
        const maxAllowed = 3
        return (currentRentals + requestedUnits) <= maxAllowed
      }

      // 다른 기기 타입은 제한 없음 (또는 나중에 추가 가능)
      return true
    } catch (error) {
      logger.error('Failed to check rental limit', { userId, deviceType, error })
      return false
    }
  }

  /**
   * 대여 수량 증가
   */
  async incrementRental(
    userId: string,
    deviceType: string,
    amount: number = 1
  ): Promise<void> {
    try {
      // rental_limits 테이블이 있다면 여기서 업데이트
      // 현재는 reservations 테이블을 통해 간접적으로 관리
      const canRent = await this.checkRentalLimit(userId, deviceType, amount)
      if (!canRent) {
        throw new AppError(
          ErrorCodes.RENTAL_LIMIT_EXCEEDED,
          `${deviceType} 기기의 동시 대여 제한을 초과했습니다.`,
          400
        )
      }

      logger.info('Rental incremented', { userId, deviceType, amount })
    } catch (error) {
      logger.error('Failed to increment rental', { userId, deviceType, error })
      throw error
    }
  }

  /**
   * 대여 수량 감소 (예약 취소/완료 시)
   */
  async decrementRental(
    userId: string,
    deviceType: string,
    amount: number = 1
  ): Promise<void> {
    try {
      // 현재는 reservations 상태 변경으로 자동 처리
      logger.info('Rental decremented', { userId, deviceType, amount })
    } catch (error) {
      logger.error('Failed to decrement rental', { userId, deviceType, error })
      throw error
    }
  }

  /**
   * 사용자의 모든 기기 타입별 대여 현황
   */
  async getUserRentalStatus(userId: string): Promise<RentalLimitRecord[]> {
    try {
      const stmt = this.db.prepare(`
        SELECT
          d.device_type as deviceType,
          COUNT(*) as count
        FROM reservations r
        JOIN devices d ON r.device_id = d.id
        WHERE r.user_id = ?
        AND r.status IN ('pending', 'approved', 'checked_in')
        AND r.date >= date('now')
        GROUP BY d.device_type
      `)

      const results = await stmt.bind(userId).all()

      return results?.results?.map((row: any) => ({
        userId,
        deviceType: row.deviceType,
        count: row.count
      })) || []
    } catch (error) {
      logger.error('Failed to get user rental status', { userId, error })
      return []
    }
  }

  /**
   * 특정 기기 타입의 가용 수량 확인
   */
  async getAvailableUnits(deviceType: string, date: string): Promise<number> {
    try {
      // 전체 기기 수 확인
      const totalStmt = this.db.prepare(`
        SELECT COUNT(*) as total
        FROM devices
        WHERE device_type = ?
        AND status = 'available'
      `)
      const totalResult = await totalStmt.bind(deviceType).first()
      const total = totalResult?.total || 0

      // 예약된 기기 수 확인
      const reservedStmt = this.db.prepare(`
        SELECT COUNT(DISTINCT r.device_id) as reserved
        FROM reservations r
        JOIN devices d ON r.device_id = d.id
        WHERE d.device_type = ?
        AND r.date = ?
        AND r.status IN ('pending', 'approved', 'checked_in')
      `)
      const reservedResult = await reservedStmt.bind(deviceType, date).first()
      const reserved = reservedResult?.reserved || 0

      return Math.max(0, total - reserved)
    } catch (error) {
      logger.error('Failed to get available units', { deviceType, date, error })
      return 0
    }
  }

  /**
   * 2인 플레이 옵션 설정
   */
  async setTwoPlayerOption(
    reservationId: string,
    isTwoPlayer: boolean
  ): Promise<void> {
    try {
      // 예약 메타데이터에 2인 플레이 정보 저장
      const stmt = this.db.prepare(`
        UPDATE reservations
        SET admin_notes = CASE
          WHEN admin_notes IS NULL THEN ?
          ELSE admin_notes || ' | ' || ?
        END,
        updated_at = datetime('now')
        WHERE id = ?
      `)

      const note = isTwoPlayer ? '2인 플레이 옵션 적용' : '1인 플레이'
      await stmt.bind(note, note, reservationId).run()

      logger.info('Two player option set', { reservationId, isTwoPlayer })
    } catch (error) {
      logger.error('Failed to set two player option', { reservationId, error })
      throw error
    }
  }
}