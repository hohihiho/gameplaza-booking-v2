import { checkins, type Checkin, type NewCheckin } from '@/lib/db/schema'
import { eq, and, isNull, isNotNull, desc, asc, sql, gte, lte } from 'drizzle-orm'
import { createDB } from '@/lib/db/client'

export class CheckinsService {
  private _db: any

  private get db() {
    if (!this._db) {
      this._db = createDB()
    }
    return this._db
  }

  /**
   * ID로 체크인 조회
   */
  async findById(id: string): Promise<Checkin | null> {
    try {
      const [checkin] = await this.db
        .select()
        .from(checkins)
        .where(eq(checkins.id, id))
        .limit(1)

      return checkin || null
    } catch (error) {
      console.error('CheckinsService.findById error:', error)
      return null
    }
  }

  /**
   * 예약 ID로 체크인 조회
   */
  async findByReservationId(reservationId: string): Promise<Checkin | null> {
    try {
      const [checkin] = await this.db
        .select()
        .from(checkins)
        .where(eq(checkins.reservationId, reservationId))
        .limit(1)

      return checkin || null
    } catch (error) {
      console.error('CheckinsService.findByReservationId error:', error)
      return null
    }
  }

  /**
   * 활성 체크인 목록 조회 (체크아웃 안된 것들)
   */
  async findActive(): Promise<Checkin[]> {
    try {
      return await this.db
        .select()
        .from(checkins)
        .where(isNull(checkins.checkedOutAt))
        .orderBy(desc(checkins.checkedInAt))
    } catch (error) {
      console.error('CheckinsService.findActive error:', error)
      return []
    }
  }

  /**
   * 체크인 생성
   */
  async create(data: NewCheckin): Promise<Checkin> {
    try {
      const [checkin] = await this.db
        .insert(checkins)
        .values({
          ...data,
          checkedInAt: data.checkedInAt || new Date().getTime(),
          createdAt: new Date().getTime(),
          updatedAt: new Date().getTime()
        })
        .returning()

      return checkin
    } catch (error) {
      console.error('CheckinsService.create error:', error)
      throw new Error('체크인 생성 실패')
    }
  }

  /**
   * 체크인 업데이트
   */
  async update(id: string, data: Partial<NewCheckin>): Promise<Checkin | null> {
    try {
      const [updated] = await this.db
        .update(checkins)
        .set({
          ...data,
          updatedAt: new Date().getTime()
        })
        .where(eq(checkins.id, id))
        .returning()

      return updated || null
    } catch (error) {
      console.error('CheckinsService.update error:', error)
      return null
    }
  }

  /**
   * 체크아웃 처리
   */
  async checkout(id: string, options?: {
    actualEndTime?: Date
    overtimeMinutes?: number
    additionalCharges?: number
    notes?: string
  }): Promise<Checkin | null> {
    try {
      const now = new Date()
      const [updated] = await this.db
        .update(checkins)
        .set({
          checkedOutAt: now.getTime(),
          actualEndTime: options?.actualEndTime?.getTime() || now.getTime(),
          overtimeMinutes: options?.overtimeMinutes || 0,
          additionalCharges: options?.additionalCharges || 0,
          notes: options?.notes,
          updatedAt: now.getTime()
        })
        .where(eq(checkins.id, id))
        .returning()

      return updated || null
    } catch (error) {
      console.error('CheckinsService.checkout error:', error)
      return null
    }
  }

  /**
   * 예약 ID로 체크아웃 처리
   */
  async checkoutByReservationId(reservationId: string, options?: {
    actualEndTime?: Date
    overtimeMinutes?: number
    additionalCharges?: number
    notes?: string
  }): Promise<Checkin | null> {
    try {
      const checkin = await this.findByReservationId(reservationId)
      if (!checkin) return null

      return await this.checkout(checkin.id, options)
    } catch (error) {
      console.error('CheckinsService.checkoutByReservationId error:', error)
      return null
    }
  }

  /**
   * 체크인 삭제
   */
  async delete(id: string): Promise<boolean> {
    try {
      const result = await this.db
        .delete(checkins)
        .where(eq(checkins.id, id))

      return result.changes > 0
    } catch (error) {
      console.error('CheckinsService.delete error:', error)
      return false
    }
  }

  /**
   * 기간별 체크인 목록 조회
   */
  async findByDateRange(startDate: Date, endDate: Date): Promise<Checkin[]> {
    try {
      return await this.db
        .select()
        .from(checkins)
        .where(
          and(
            gte(checkins.checkedInAt, startDate.getTime()),
            lte(checkins.checkedInAt, endDate.getTime())
          )
        )
        .orderBy(desc(checkins.checkedInAt))
    } catch (error) {
      console.error('CheckinsService.findByDateRange error:', error)
      return []
    }
  }

  /**
   * 오늘의 체크인 통계
   */
  async getTodayStatistics(): Promise<{
    total: number
    active: number
    completed: number
    overtime: number
    additionalRevenue: number
  }> {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      // 오늘의 모든 체크인
      const todayCheckins = await this.db
        .select()
        .from(checkins)
        .where(
          and(
            gte(checkins.checkedInAt, today.getTime()),
            lte(checkins.checkedInAt, tomorrow.getTime())
          )
        )

      // 통계 계산
      let active = 0
      let completed = 0
      let overtime = 0
      let additionalRevenue = 0

      todayCheckins.forEach((checkin: Checkin) => {
        if (checkin.checkedOutAt) {
          completed++
          if (checkin.overtimeMinutes && checkin.overtimeMinutes > 0) {
            overtime++
          }
          if (checkin.additionalCharges) {
            additionalRevenue += checkin.additionalCharges
          }
        } else {
          active++
        }
      })

      return {
        total: todayCheckins.length,
        active,
        completed,
        overtime,
        additionalRevenue
      }
    } catch (error) {
      console.error('CheckinsService.getTodayStatistics error:', error)
      return {
        total: 0,
        active: 0,
        completed: 0,
        overtime: 0,
        additionalRevenue: 0
      }
    }
  }

  /**
   * 연체 시간 계산 및 업데이트
   */
  async calculateOvertime(id: string, scheduledEndTime: Date): Promise<number> {
    try {
      const checkin = await this.findById(id)
      if (!checkin || !checkin.actualEndTime) return 0

      const actualEnd = new Date(checkin.actualEndTime)
      const overtimeMs = actualEnd.getTime() - scheduledEndTime.getTime()
      const overtimeMinutes = Math.max(0, Math.floor(overtimeMs / (1000 * 60)))

      if (overtimeMinutes > 0) {
        await this.update(id, { overtimeMinutes })
      }

      return overtimeMinutes
    } catch (error) {
      console.error('CheckinsService.calculateOvertime error:', error)
      return 0
    }
  }
}