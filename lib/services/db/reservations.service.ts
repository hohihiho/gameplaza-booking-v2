import { reservations, users, devices, deviceTypes, deviceCategories, type Reservation, type NewReservation } from '@/lib/db/schema'
import { eq, and, or, gte, lte, between, desc, asc, sql, inArray } from 'drizzle-orm'
import { createDB } from '@/lib/db/client'

export class ReservationsService {
  private _db: any

  private get db() {
    if (!this._db) {
      this._db = createDB()
    }
    return this._db
  }

  /**
   * ID로 예약 조회
   */
  async findById(id: string): Promise<Reservation | null> {
    try {
      const [reservation] = await this.db
        .select()
        .from(reservations)
        .where(eq(reservations.id, id))
        .limit(1)

      return reservation || null
    } catch (error) {
      console.error('ReservationsService.findById error:', error)
      return null
    }
  }

  /**
   * 사용자 ID로 예약 목록 조회
   */
  async findByUserId(userId: string, options?: {
    status?: string[]
    startDate?: Date
    endDate?: Date
    limit?: number
    offset?: number
  }): Promise<Reservation[]> {
    try {
      let query = this.db
        .select()
        .from(reservations)
        .where(eq(reservations.userId, userId))

      // 상태 필터
      if (options?.status && options.status.length > 0) {
        query = query.where(inArray(reservations.status, options.status))
      }

      // 날짜 필터
      if (options?.startDate) {
        query = query.where(gte(reservations.startTime, options.startDate.getTime()))
      }
      if (options?.endDate) {
        query = query.where(lte(reservations.endTime, options.endDate.getTime()))
      }

      // 정렬
      query = query.orderBy(desc(reservations.createdAt))

      // 페이지네이션
      if (options?.limit) {
        query = query.limit(options.limit)
      }
      if (options?.offset) {
        query = query.offset(options.offset)
      }

      return await query
    } catch (error) {
      console.error('ReservationsService.findByUserId error:', error)
      return []
    }
  }

  /**
   * 기기 ID로 예약 목록 조회
   */
  async findByDeviceId(deviceId: string, options?: {
    status?: string[]
    startDate?: Date
    endDate?: Date
  }): Promise<Reservation[]> {
    try {
      let query = this.db
        .select()
        .from(reservations)
        .where(eq(reservations.deviceId, deviceId))

      // 상태 필터
      if (options?.status && options.status.length > 0) {
        query = query.where(inArray(reservations.status, options.status))
      }

      // 날짜 필터
      if (options?.startDate && options?.endDate) {
        query = query.where(
          and(
            gte(reservations.startTime, options.startDate.getTime()),
            lte(reservations.endTime, options.endDate.getTime())
          )
        )
      }

      return await query.orderBy(asc(reservations.startTime))
    } catch (error) {
      console.error('ReservationsService.findByDeviceId error:', error)
      return []
    }
  }

  /**
   * 예약 생성
   */
  async create(data: NewReservation): Promise<Reservation> {
    try {
      const [reservation] = await this.db
        .insert(reservations)
        .values({
          ...data,
          createdAt: new Date().getTime(),
          updatedAt: new Date().getTime()
        })
        .returning()

      return reservation
    } catch (error) {
      console.error('ReservationsService.create error:', error)
      throw new Error('예약 생성 실패')
    }
  }

  /**
   * 예약 업데이트
   */
  async update(id: string, data: Partial<NewReservation>): Promise<Reservation | null> {
    try {
      const [updated] = await this.db
        .update(reservations)
        .set({
          ...data,
          updatedAt: new Date().getTime()
        })
        .where(eq(reservations.id, id))
        .returning()

      return updated || null
    } catch (error) {
      console.error('ReservationsService.update error:', error)
      return null
    }
  }

  /**
   * 예약 상태 변경
   */
  async updateStatus(id: string, status: string): Promise<boolean> {
    try {
      const result = await this.db
        .update(reservations)
        .set({
          status,
          updatedAt: new Date().getTime()
        })
        .where(eq(reservations.id, id))

      return result.changes > 0
    } catch (error) {
      console.error('ReservationsService.updateStatus error:', error)
      return false
    }
  }

  /**
   * 예약 삭제
   */
  async delete(id: string): Promise<boolean> {
    try {
      const result = await this.db
        .delete(reservations)
        .where(eq(reservations.id, id))

      return result.changes > 0
    } catch (error) {
      console.error('ReservationsService.delete error:', error)
      return false
    }
  }

  /**
   * 시간 충돌 확인
   */
  async checkTimeConflict(
    deviceId: string,
    startTime: Date,
    endTime: Date,
    excludeId?: string
  ): Promise<boolean> {
    try {
      let query = this.db
        .select()
        .from(reservations)
        .where(
          and(
            eq(reservations.deviceId, deviceId),
            inArray(reservations.status, ['confirmed', 'checked_in']),
            or(
              // 새 예약의 시작이 기존 예약 중간에 있는 경우
              and(
                lte(reservations.startTime, startTime.getTime()),
                gte(reservations.endTime, startTime.getTime())
              ),
              // 새 예약의 종료가 기존 예약 중간에 있는 경우
              and(
                lte(reservations.startTime, endTime.getTime()),
                gte(reservations.endTime, endTime.getTime())
              ),
              // 새 예약이 기존 예약을 완전히 포함하는 경우
              and(
                gte(reservations.startTime, startTime.getTime()),
                lte(reservations.endTime, endTime.getTime())
              )
            )
          )
        )

      // 수정 시 자기 자신은 제외
      if (excludeId) {
        query = query.where(sql`${reservations.id} != ${excludeId}`)
      }

      const conflicts = await query
      return conflicts.length > 0
    } catch (error) {
      console.error('ReservationsService.checkTimeConflict error:', error)
      return true // 에러 시 충돌로 간주
    }
  }

  /**
   * 오늘의 예약 조회
   */
  async getTodayReservations(options?: {
    status?: string[]
    deviceId?: string
    userId?: string
  }): Promise<Reservation[]> {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      let conditions = [
        gte(reservations.startTime, today.getTime()),
        lte(reservations.startTime, tomorrow.getTime())
      ]

      if (options?.status && options.status.length > 0) {
        conditions.push(inArray(reservations.status, options.status))
      }
      if (options?.deviceId) {
        conditions.push(eq(reservations.deviceId, options.deviceId))
      }
      if (options?.userId) {
        conditions.push(eq(reservations.userId, options.userId))
      }

      return await this.db
        .select()
        .from(reservations)
        .where(and(...conditions))
        .orderBy(asc(reservations.startTime))
    } catch (error) {
      console.error('ReservationsService.getTodayReservations error:', error)
      return []
    }
  }

  /**
   * 통계 조회
   */
  async getStatistics(startDate: Date, endDate: Date): Promise<{
    total: number
    byStatus: Record<string, number>
    byDevice: Record<string, number>
  }> {
    try {
      // 전체 예약 수
      const totalResult = await this.db
        .select({ count: sql<number>`count(*)` })
        .from(reservations)
        .where(
          and(
            gte(reservations.createdAt, startDate.getTime()),
            lte(reservations.createdAt, endDate.getTime())
          )
        )

      // 상태별 통계
      const statusResult = await this.db
        .select({
          status: reservations.status,
          count: sql<number>`count(*)`
        })
        .from(reservations)
        .where(
          and(
            gte(reservations.createdAt, startDate.getTime()),
            lte(reservations.createdAt, endDate.getTime())
          )
        )
        .groupBy(reservations.status)

      // 기기별 통계
      const deviceResult = await this.db
        .select({
          deviceId: reservations.deviceId,
          count: sql<number>`count(*)`
        })
        .from(reservations)
        .where(
          and(
            gte(reservations.createdAt, startDate.getTime()),
            lte(reservations.createdAt, endDate.getTime())
          )
        )
        .groupBy(reservations.deviceId)

      const byStatus: Record<string, number> = {}
      statusResult.forEach(row => {
        byStatus[row.status] = row.count
      })

      const byDevice: Record<string, number> = {}
      deviceResult.forEach(row => {
        byDevice[row.deviceId] = row.count
      })

      return {
        total: totalResult[0]?.count || 0,
        byStatus,
        byDevice
      }
    } catch (error) {
      console.error('ReservationsService.getStatistics error:', error)
      return { total: 0, byStatus: {}, byDevice: {} }
    }
  }

  /**
   * 영업일 기준 예약 조회 (07시 이후 + 다음날 00~05시 밤샘 예약)
   */
  async findByBusinessDate(businessDate: string): Promise<any[]> {
    try {
      // 당일 07시 이후 예약
      const dayReservations = await this.db
        .select({
          id: reservations.id,
          status: reservations.status,
          date: reservations.date,
          start_time: reservations.startTime,
          end_time: reservations.endTime,
          total_amount: reservations.totalAmount,
          reservation_number: reservations.reservationNumber,
          created_at: reservations.createdAt
        })
        .from(reservations)
        .where(and(
          eq(reservations.date, businessDate),
          gte(reservations.startTime, '07:00:00')
        ))

      // 다음날 00~05시 밤샘 예약
      const nextDay = new Date(businessDate)
      nextDay.setDate(nextDay.getDate() + 1)
      const nextDayStr = nextDay.toISOString().split('T')[0]

      const nightReservations = await this.db
        .select({
          id: reservations.id,
          status: reservations.status,
          date: reservations.date,
          start_time: reservations.startTime,
          end_time: reservations.endTime,
          total_amount: reservations.totalAmount,
          reservation_number: reservations.reservationNumber,
          created_at: reservations.createdAt
        })
        .from(reservations)
        .where(and(
          eq(reservations.date, nextDayStr),
          lte(reservations.startTime, '05:59:59')
        ))

      return [...dayReservations, ...nightReservations]
    } catch (error) {
      console.error('ReservationsService.findByBusinessDate error:', error)
      return []
    }
  }

  /**
   * 최근 예약 조회 (상세 정보 포함)
   */
  async findRecentWithDetails(limit: number = 5): Promise<any[]> {
    try {
      return await this.db
        .select({
          id: reservations.id,
          status: reservations.status,
          date: reservations.date,
          start_time: reservations.startTime,
          end_time: reservations.endTime,
          created_at: reservations.createdAt,
          reservation_number: reservations.reservationNumber,
          users: {
            name: users.name,
            nickname: users.nickname
          },
          devices: {
            device_number: devices.deviceNumber,
            device_types: {
              name: deviceTypes.name,
              model_name: deviceTypes.modelName
            }
          }
        })
        .from(reservations)
        .leftJoin(users, eq(reservations.userId, users.id))
        .leftJoin(devices, eq(reservations.deviceId, devices.id))
        .leftJoin(deviceTypes, eq(devices.deviceTypeId, deviceTypes.id))
        .orderBy(desc(reservations.createdAt))
        .limit(limit)
    } catch (error) {
      console.error('ReservationsService.findRecentWithDetails error:', error)
      return []
    }
  }

  /**
   * 체크인 대기중인 예약 조회
   */
  async findWaitingCheckIn(businessDate: string, currentTime: string): Promise<any[]> {
    try {
      return await this.db
        .select({
          id: reservations.id,
          date: reservations.date,
          start_time: reservations.startTime,
          reservation_number: reservations.reservationNumber
        })
        .from(reservations)
        .where(and(
          eq(reservations.status, 'approved'),
          eq(reservations.date, businessDate),
          lte(reservations.startTime, currentTime)
        ))
    } catch (error) {
      console.error('ReservationsService.findWaitingCheckIn error:', error)
      return []
    }
  }

  /**
   * 결제 대기중인 예약 조회
   */
  async findPendingPayment(): Promise<any[]> {
    try {
      return await this.db
        .select({
          id: reservations.id,
          reservation_number: reservations.reservationNumber
        })
        .from(reservations)
        .where(and(
          eq(reservations.status, 'checked_in'),
          eq(reservations.paymentStatus, 'pending')
        ))
    } catch (error) {
      console.error('ReservationsService.findPendingPayment error:', error)
      return []
    }
  }

  /**
   * 관리자용 예약 목록 조회 (사용자, 기기, 기기타입 정보 포함)
   */
  async findAllWithDetails(options?: {
    year?: string
    limit?: number
  }): Promise<any[]> {
    try {
      let query = this.db
        .select({
          // 예약 정보
          id: reservations.id,
          userId: reservations.userId,
          deviceId: reservations.deviceId,
          reservationNumber: reservations.reservationNumber,
          date: reservations.date,
          startTime: reservations.startTime,
          endTime: reservations.endTime,
          status: reservations.status,
          paymentStatus: reservations.paymentStatus,
          totalAmount: reservations.totalAmount,
          adminNotes: reservations.adminNotes,
          approvedAt: reservations.approvedAt,
          createdAt: reservations.createdAt,
          updatedAt: reservations.updatedAt,
          // 사용자 정보
          userName: users.name,
          userPhone: users.phone,
          userEmail: users.email,
          userNickname: users.nickname,
          // 기기 정보
          deviceNumber: devices.deviceNumber,
          // 기기 타입 정보
          deviceTypeName: deviceTypes.name,
          deviceTypeModelName: deviceTypes.modelName,
          deviceTypeVersionName: deviceTypes.versionName,
          deviceTypeCategoryId: deviceTypes.categoryId,
          // 카테고리 정보
          categoryName: deviceCategories.name
        })
        .from(reservations)
        .leftJoin(users, eq(reservations.userId, users.id))
        .leftJoin(devices, eq(reservations.deviceId, devices.id))
        .leftJoin(deviceTypes, eq(devices.deviceTypeId, deviceTypes.id))
        .leftJoin(deviceCategories, eq(deviceTypes.categoryId, deviceCategories.id))
        .orderBy(desc(reservations.createdAt))

      // 연도 필터링
      if (options?.year && options.year !== 'all') {
        const startDate = `${options.year}-01-01`
        const endDate = `${options.year}-12-31`
        query = query.where(
          and(
            gte(reservations.date, startDate),
            lte(reservations.date, endDate)
          )
        )
      }

      // 제한 개수
      if (options?.limit) {
        query = query.limit(options.limit)
      } else {
        query = query.limit(1000)
      }

      const results = await query

      // 결과를 원본 API 형태로 변환
      return results.map(row => ({
        id: row.id,
        user_id: row.userId,
        device_id: row.deviceId,
        reservation_number: row.reservationNumber,
        date: row.date,
        start_time: row.startTime,
        end_time: row.endTime,
        status: row.status,
        payment_status: row.paymentStatus,
        total_amount: row.totalAmount,
        admin_notes: row.adminNotes,
        approved_at: row.approvedAt,
        created_at: row.createdAt,
        updated_at: row.updatedAt,
        users: {
          id: row.userId,
          name: row.userName,
          phone: row.userPhone,
          email: row.userEmail,
          nickname: row.userNickname
        },
        devices: {
          device_number: row.deviceNumber,
          device_types: {
            name: row.deviceTypeName,
            model_name: row.deviceTypeModelName,
            version_name: row.deviceTypeVersionName,
            category_id: row.deviceTypeCategoryId,
            device_categories: {
              name: row.categoryName
            }
          }
        }
      }))
    } catch (error) {
      console.error('ReservationsService.findAllWithDetails error:', error)
      return []
    }
  }

  /**
   * 예약 상태 업데이트
   */
  async updateStatus(id: string, status: string, options?: {
    notes?: string
    approvedAt?: Date
  }): Promise<Reservation | null> {
    try {
      const updateData: any = {
        status,
        updatedAt: new Date().getTime()
      }

      if (status === 'approved' && options?.approvedAt) {
        updateData.approvedAt = options.approvedAt.getTime()
      }

      if (status === 'rejected' && options?.notes) {
        updateData.adminNotes = options.notes
      }

      const [updated] = await this.db
        .update(reservations)
        .set(updateData)
        .where(eq(reservations.id, id))
        .returning()

      return updated || null
    } catch (error) {
      console.error('ReservationsService.updateStatus error:', error)
      return null
    }
  }

  /**
   * 노쇼 처리
   */
  async markAsNoShow(id: string, reason?: string, cancelledBy?: string): Promise<Reservation | null> {
    try {
      const updateData: any = {
        status: 'no_show',
        cancelledAt: new Date().getTime(),
        cancellationReason: reason || '고객 미방문 (노쇼)',
        updatedAt: new Date().getTime()
      }

      if (cancelledBy) {
        updateData.cancelledBy = cancelledBy
      }

      const [updated] = await this.db
        .update(reservations)
        .set(updateData)
        .where(eq(reservations.id, id))
        .returning()

      return updated || null
    } catch (error) {
      console.error('ReservationsService.markAsNoShow error:', error)
      return null
    }
  }

  /**
   * 예약 금액 조정
   */
  async adjustAmount(
    id: string, 
    adjustedAmount: number, 
    reason?: string, 
    adjustedBy?: string
  ): Promise<Reservation | null> {
    try {
      // 기존 예약 정보 조회
      const existingReservation = await this.findById(id)
      if (!existingReservation) {
        return null
      }

      const updateData: any = {
        adjustedAmount: adjustedAmount,
        adjustmentReason: reason || '관리자 수동 조정',
        updatedAt: new Date().getTime()
      }

      const [updatedReservation] = await this.db
        .update(reservations)
        .set(updateData)
        .where(eq(reservations.id, id))
        .returning()

      return updatedReservation || null
    } catch (error) {
      console.error('ReservationsService.adjustAmount error:', error)
      return null
    }
  }

  /**
   * 예약 시간 조정
   */
  async adjustTime(
    id: string, 
    actualStartTime?: string, 
    actualEndTime?: string, 
    reason?: string, 
    adjustedBy?: string
  ): Promise<Reservation | null> {
    try {
      const updateData: any = {
        timeAdjustmentReason: reason || '관리자 시간 조정',
        updatedAt: new Date().getTime()
      }

      if (actualStartTime) {
        updateData.actualStartTime = actualStartTime
      }
      if (actualEndTime) {
        updateData.actualEndTime = actualEndTime
      }

      const [updatedReservation] = await this.db
        .update(reservations)
        .set(updateData)
        .where(eq(reservations.id, id))
        .returning()

      return updatedReservation || null
    } catch (error) {
      console.error('ReservationsService.adjustTime error:', error)
      return null
    }
  }

  /**
   * 고객 분석용 예약 데이터 조회
   */
  async findForCustomerAnalytics(startDate: Date, endDate: Date): Promise<any[]> {
    try {
      return await this.db
        .select({
          id: reservations.id,
          createdAt: reservations.createdAt,
          userId: reservations.userId,
          status: reservations.status,
          // User 정보
          userEmail: users.email,
          userCreatedAt: users.createdAt
        })
        .from(reservations)
        .leftJoin(users, eq(reservations.userId, users.id))
        .where(
          and(
            gte(reservations.createdAt, startDate.getTime()),
            lte(reservations.createdAt, endDate.getTime())
          )
        )
        .orderBy(asc(reservations.createdAt))
    } catch (error) {
      console.error('ReservationsService.findForCustomerAnalytics error:', error)
      return []
    }
  }

  /**
   * 기종 분석용 예약 데이터 조회 (기기 및 기종 정보 포함)
   */
  async findForDeviceAnalytics(startDateStr: string, endDateStr: string): Promise<any[]> {
    try {
      return await this.db
        .select({
          id: reservations.id,
          date: reservations.date,
          startTime: reservations.startTime,
          endTime: reservations.endTime,
          totalAmount: reservations.totalAmount,
          status: reservations.status,
          refundAmount: reservations.refundAmount,
          deviceId: reservations.deviceId,
          creditType: reservations.creditType,
          // Device 정보
          deviceNumber: devices.deviceNumber,
          deviceTypeId: devices.deviceTypeId,
          // Device Type 정보  
          deviceTypeName: deviceTypes.name,
          deviceTypeCategoryId: deviceTypes.categoryId
        })
        .from(reservations)
        .innerJoin(devices, eq(reservations.deviceId, devices.id))
        .innerJoin(deviceTypes, eq(devices.deviceTypeId, deviceTypes.id))
        .where(
          and(
            gte(reservations.date, startDateStr),
            lte(reservations.date, endDateStr)
          )
        )
        .orderBy(asc(reservations.date))
    } catch (error) {
      console.error('ReservationsService.findForDeviceAnalytics error:', error)
      return []
    }
  }

  /**
   * 매출 분석용 예약 데이터 조회 (기기 및 기종 정보 포함)
   */
  async findForRevenueAnalytics(startDateStr: string, endDateStr: string): Promise<any[]> {
    try {
      return await this.db
        .select({
          id: reservations.id,
          totalAmount: reservations.totalAmount,
          date: reservations.date,
          createdAt: reservations.createdAt,
          status: reservations.status,
          startTime: reservations.startTime,
          endTime: reservations.endTime,
          paymentMethod: reservations.paymentMethod,
          deviceId: reservations.deviceId,
          // Device Type 정보 (매출 분석에 필요)
          deviceTypeName: deviceTypes.name,
          deviceTypeCategoryId: deviceTypes.categoryId
        })
        .from(reservations)
        .leftJoin(devices, eq(reservations.deviceId, devices.id))
        .leftJoin(deviceTypes, eq(devices.deviceTypeId, deviceTypes.id))
        .where(
          and(
            gte(reservations.date, startDateStr),
            lte(reservations.date, endDateStr)
          )
        )
        .orderBy(asc(reservations.date))
    } catch (error) {
      console.error('ReservationsService.findForRevenueAnalytics error:', error)
      return []
    }
  }

  /**
   * Reservations Analytics용 예약 데이터 조회
   */
  async findForReservationAnalytics(startDateStr: string, endDateStr: string): Promise<any[]> {
    try {
      return await this.db
        .select({
          id: reservations.id,
          userId: reservations.userId,
          deviceId: reservations.deviceId,
          status: reservations.status,
          totalAmount: reservations.totalAmount,
          refundAmount: reservations.refundAmount,
          date: reservations.date,
          startTime: reservations.startTime,
          endTime: reservations.endTime,
          duration: reservations.duration,
          createdAt: reservations.createdAt,
          updatedAt: reservations.updatedAt,
          checkedInAt: reservations.checkedInAt,
          checkedOutAt: reservations.checkedOutAt,
          approvedAt: reservations.approvedAt,
          cancelledAt: reservations.cancelledAt,
          cancellationReason: reservations.cancellationReason,
          paymentMethod: reservations.paymentMethod,
          creditType: reservations.creditType,
          creditAmount: reservations.creditAmount,
          deviceNumber: devices.deviceNumber,
          deviceTypeName: deviceTypes.name,
          deviceTypeId: deviceTypes.id,
          deviceCategoryId: deviceTypes.categoryId,
          userEmail: users.email,
          userName: users.name
        })
        .from(reservations)
        .leftJoin(devices, eq(reservations.deviceId, devices.id))
        .leftJoin(deviceTypes, eq(devices.deviceTypeId, deviceTypes.id))
        .leftJoin(users, eq(reservations.userId, users.id))
        .where(
          and(
            gte(reservations.date, startDateStr),
            lte(reservations.date, endDateStr)
          )
        )
        .orderBy(asc(reservations.date), asc(reservations.startTime))
    } catch (error) {
      console.error('ReservationsService.findForReservationAnalytics error:', error)
      return []
    }
  }

  /**
   * 조기 예약 조회 (승인된 예약 중 07:00-14:00 시간대)
   */
  async findEarlyReservations(startDate: string, endDate: string): Promise<any[]> {
    try {
      return await this.db
        .select({
          id: reservations.id,
          reservationNumber: reservations.reservationNumber,
          date: reservations.date,
          startTime: reservations.startTime,
          endTime: reservations.endTime,
          status: reservations.status,
          deviceNumber: devices.deviceNumber,
          deviceTypeName: deviceTypes.name
        })
        .from(reservations)
        .leftJoin(devices, eq(reservations.deviceId, devices.id))
        .leftJoin(deviceTypes, eq(devices.deviceTypeId, deviceTypes.id))
        .where(
          and(
            eq(reservations.status, 'approved'),
            gte(reservations.date, startDate),
            lte(reservations.date, endDate),
            gte(reservations.startTime, '07:00'),
            lte(reservations.startTime, '14:00')
          )
        )
        .orderBy(asc(reservations.date))
    } catch (error) {
      console.error('ReservationsService.findEarlyReservations error:', error)
      return []
    }
  }
}