/**
 * 예약 관련 비즈니스 로직을 처리하는 서비스 레이어
 */

import { ReservationRepository } from '@/lib/repositories/reservation.repository'
import { DeviceRepository } from '@/lib/repositories/device.repository'
import { UserRepository } from '@/lib/repositories/user.repository'
import { 
  AppError, 
  ErrorCodes 
} from '@/lib/utils/error-handler'
import { logger } from '@/lib/utils/logger'
import { getDB } from '@/lib/db/server'

export interface CreateReservationDto {
  date: string
  startTime: string
  endTime: string
  deviceId: string
  playerCount?: number
  hourlyRate?: number
  totalAmount?: number
  userNotes?: string
  creditType?: string
}

export class ReservationService {
  private reservationRepo: ReservationRepository
  private deviceRepo: DeviceRepository
  private userRepo: UserRepository

  constructor() {
    const db = getDB()
    this.reservationRepo = new ReservationRepository(db)
    this.deviceRepo = new DeviceRepository(db)
    this.userRepo = new UserRepository(db)
  }

  // 싱글톤 인스턴스
  private static instance: ReservationService | null = null

  static getInstance(): ReservationService {
    if (!ReservationService.instance) {
      ReservationService.instance = new ReservationService()
    }
    return ReservationService.instance
  }

  /**
   * 새 예약 생성
   */
  async createReservation(userId: string, data: CreateReservationDto) {
    try {
      logger.info('Creating reservation', { userId, data })

      // 1. 관리자 여부 확인
      const isAdmin = await this.userRepo.isAdmin(userId)

      // 2. 일반 사용자의 경우 활성 예약 개수 제한 확인
      if (!isAdmin) {
        const { count } = await this.reservationRepo.findActiveByUserId(userId)
        const MAX_ACTIVE_RESERVATIONS = 3

        if (count >= MAX_ACTIVE_RESERVATIONS) {
          throw new AppError(
            ErrorCodes.RESERVATION_CONFLICT,
            `현재 ${count}개의 활성 예약이 있습니다. 최대 ${MAX_ACTIVE_RESERVATIONS}개까지만 예약 가능합니다.`,
            400,
            { activeCount: count, maxCount: MAX_ACTIVE_RESERVATIONS }
          )
        }
      }

      // 3. 기기 유효성 확인
      const device = await this.deviceRepo.findByIdWithType(data.deviceId)
      if (!device) {
        throw new AppError(ErrorCodes.DEVICE_NOT_FOUND, '유효하지 않은 기기입니다', 400)
      }

      // 4. 시간대 중복 확인
      const existingReservations = await this.reservationRepo.findByDateAndDevice(
        data.date,
        data.deviceId,
        ['pending', 'approved', 'checked_in']
      )

      const hasOverlap = existingReservations.some(reservation => {
        return (data.startTime < reservation.end_time && data.endTime > reservation.start_time)
      })

      if (hasOverlap) {
        throw new AppError(ErrorCodes.TIME_SLOT_UNAVAILABLE, '해당 시간대에 이미 예약이 있습니다', 400)
      }

      // 5. 예약 번호 생성
      const reservationNumber = await this.generateReservationNumber(data.date)

      // 6. 예약 생성
      const reservationData: ReservationInsert = {
        user_id: userId,
        device_id: data.deviceId,
        reservation_number: reservationNumber,
        date: data.date,
        start_time: data.startTime,
        end_time: data.endTime,
        player_count: data.playerCount || 1,
        hourly_rate: data.hourlyRate || 0,
        total_amount: data.totalAmount || 0,
        status: 'pending',
        payment_method: 'cash',
        payment_status: 'pending',
        user_notes: data.userNotes || null,
        credit_type: data.creditType || 'freeplay',
        created_at: new Date().toISOString()
      }

      const reservation = await this.reservationRepo.createWithDetails(reservationData)

      logger.info('Reservation created successfully', { reservationId: reservation?.id })

      return {
        reservation,
        message: '예약이 접수되었습니다. 관리자 승인을 기다려주세요.'
      }
    } catch (error) {
      logger.error('Failed to create reservation', error)
      throw error
    }
  }

  /**
   * 예약 상태 업데이트
   */
  async updateReservationStatus(
    reservationId: string,
    status: string,
    adminNotes?: string
  ) {
    try {
      logger.info('Updating reservation status', { reservationId, status })

      const reservation = await this.reservationRepo.updateStatus(reservationId, status, adminNotes)
      
      if (!reservation) {
        throw new AppError(ErrorCodes.RESERVATION_NOT_FOUND, '예약을 찾을 수 없습니다', 404)
      }

      return reservation
    } catch (error) {
      logger.error('Failed to update reservation status', error)
      throw error
    }
  }

  /**
   * 예약 취소
   */
  async cancelReservation(reservationId: string, userId: string, isAdmin: boolean = false) {
    try {
      logger.info('Cancelling reservation', { reservationId, userId, isAdmin })

      // 예약 확인
      const reservation = await this.reservationRepo.findById(reservationId)
      
      if (!reservation) {
        throw new AppError(ErrorCodes.RESERVATION_NOT_FOUND, '예약을 찾을 수 없습니다', 404)
      }

      // 권한 확인 (관리자가 아닌 경우 본인 예약만 취소 가능)
      if (!isAdmin && reservation.user_id !== userId) {
        throw new AppError(ErrorCodes.UNAUTHORIZED, '예약을 취소할 권한이 없습니다', 403)
      }

      if (reservation.status === 'cancelled') {
        throw new AppError(ErrorCodes.RESERVATION_CANCELLED, '이미 취소된 예약입니다', 400)
      }

      // 예약 취소
      const updated = await this.reservationRepo.updateStatus(reservationId, 'cancelled')

      logger.info('Reservation cancelled successfully', { reservationId })

      return updated
    } catch (error) {
      logger.error('Failed to cancel reservation', error)
      throw error
    }
  }

  /**
   * 사용자의 예약 목록 조회
   */
  async getUserReservations(
    userId: string,
    options?: {
      status?: string
      page?: number
      pageSize?: number
    }
  ) {
    try {
      const offset = ((options?.page || 1) - 1) * (options?.pageSize || 10)
      const limit = options?.pageSize || 10

      const { data, count } = await this.reservationRepo.findByUserId(userId, {
        status: options?.status,
        offset,
        limit
      })

      return {
        reservations: data,
        total: count,
        page: options?.page || 1,
        pageSize: limit,
        totalPages: Math.ceil(count / limit)
      }
    } catch (error) {
      logger.error('Failed to fetch user reservations', error)
      throw error
    }
  }

  /**
   * 특정 날짜와 기기의 예약 가능한 시간대 조회
   */
  async getAvailableTimeSlots(deviceId: string, date: string) {
    try {
      // 해당 날짜의 예약된 시간대 조회
      const reservations = await this.reservationRepo.findByDateAndDevice(
        date,
        deviceId,
        ['pending', 'approved', 'checked_in']
      )

      // 전체 운영 시간대 생성 (10:00 ~ 29:00)
      const allSlots = this.generateAllTimeSlots()
      
      // 예약된 시간대 제외
      const availableSlots = allSlots.filter(slot => {
        const slotStart = slot.start
        const slotEnd = slot.end

        return !reservations.some(reservation => {
          return (slotStart < reservation.end_time && slotEnd > reservation.start_time)
        })
      })

      return availableSlots
    } catch (error) {
      logger.error('Failed to fetch available time slots', error)
      throw error
    }
  }

  /**
   * 예약 번호 생성 (YYMMDD-순서)
   */
  private async generateReservationNumber(date: string): Promise<string> {
    const reservationDate = new Date(date)
    const dateStr = reservationDate.toLocaleDateString('ko-KR', { 
      year: '2-digit', 
      month: '2-digit', 
      day: '2-digit',
      timeZone: 'Asia/Seoul'
    }).replace(/\. /g, '').replace('.', '')
    
    const count = await this.reservationRepo.countByDate(date)
    const sequence = count + 1
    
    return `${dateStr}-${String(sequence).padStart(3, '0')}`
  }

  /**
   * 전체 운영 시간대 생성 (10:00 ~ 익일 05:00)
   */
  private generateAllTimeSlots() {
    const slots = []
    
    // 10:00 ~ 23:00
    for (let hour = 10; hour <= 23; hour++) {
      slots.push({
        start: `${hour.toString().padStart(2, '0')}:00`,
        end: `${hour.toString().padStart(2, '0')}:30`,
        display: `${hour}:00 ~ ${hour}:30`
      })
      slots.push({
        start: `${hour.toString().padStart(2, '0')}:30`,
        end: `${(hour + 1).toString().padStart(2, '0')}:00`,
        display: `${hour}:30 ~ ${hour + 1}:00`
      })
    }
    
    // 24:00 ~ 29:00 (익일 0:00 ~ 5:00)
    for (let hour = 24; hour <= 29; hour++) {
      const displayHour = hour
      const actualHour = hour - 24
      
      slots.push({
        start: `${actualHour.toString().padStart(2, '0')}:00`,
        end: `${actualHour.toString().padStart(2, '0')}:30`,
        display: `${displayHour}:00 ~ ${displayHour}:30`
      })
      
      if (hour < 29) {
        slots.push({
          start: `${actualHour.toString().padStart(2, '0')}:30`,
          end: `${(actualHour + 1).toString().padStart(2, '0')}:00`,
          display: `${displayHour}:30 ~ ${displayHour + 1}:00`
        })
      }
    }
    
    return slots
  }

  /**
   * 예약 통계 조회
   */
  async getReservationStats(userId: string) {
    try {
      const { data: allReservations } = await this.reservationRepo.findByUserId(userId)
      
      const stats = {
        total: allReservations.length,
        pending: 0,
        approved: 0,
        completed: 0,
        cancelled: 0
      }

      allReservations.forEach(reservation => {
        switch (reservation.status) {
          case 'pending':
            stats.pending++
            break
          case 'approved':
          case 'checked_in':
            stats.approved++
            break
          case 'completed':
            stats.completed++
            break
          case 'cancelled':
          case 'rejected':
            stats.cancelled++
            break
        }
      })

      return stats
    } catch (error) {
      logger.error('Failed to fetch reservation stats', error)
      throw error
    }
  }
}