import { Reservation } from '../entities/reservation'
import { KSTDateTime } from '../value-objects/kst-datetime'

/**
 * 예약 규칙 검증 결과
 */
export interface ReservationRuleValidationResult {
  isValid: boolean
  errors: string[]
}

/**
 * 예약 규칙 도메인 서비스
 * 
 * 비즈니스 규칙:
 * 1. 24시간 전부터 예약 가능
 * 2. 1인당 동시 예약 가능 건수는 1건
 * 3. 밤샘/조기개장은 24시간 전까지 신청
 */
export class ReservationRulesService {
  /**
   * 24시간 사전 예약 규칙 검증
   */
  static validate24HourRule(
    reservation: Reservation,
    currentTime: KSTDateTime = KSTDateTime.now()
  ): ReservationRuleValidationResult {
    const errors: string[] = []
    
    if (!reservation.isValidFor24HourRule(currentTime)) {
      const hoursUntilStart = reservation.startDateTime.differenceInHours(currentTime)
      
      if (hoursUntilStart < 0) {
        errors.push('이미 시작된 시간대는 예약할 수 없습니다')
      } else {
        errors.push(`예약은 최소 24시간 전에 신청해야 합니다. 현재 ${Math.floor(hoursUntilStart)}시간 전입니다`)
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * 사용자별 활성 예약 개수 제한 검증
   * 1인당 동시 예약 가능 건수는 1건
   */
  static validateUserReservationLimit(
    userId: string,
    activeReservations: Reservation[],
    excludeReservationId?: string
  ): ReservationRuleValidationResult {
    const errors: string[] = []
    
    // 현재 사용자의 활성 예약 필터링 (제외할 예약 ID가 있으면 제외)
    const userActiveReservations = activeReservations.filter(r => 
      r.userId === userId && 
      r.isActive() &&
      r.id !== excludeReservationId
    )
    
    if (userActiveReservations.length >= 1) {
      errors.push('1인당 동시 예약 가능 건수는 1건입니다. 기존 예약을 완료하거나 취소한 후 신청해주세요')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * 특별 영업(밤샘/조기개장) 시간대 검증
   * 22시 이후 또는 6-12시 시작 예약은 24시간 전까지만 가능
   */
  static validateSpecialOperatingHours(
    reservation: Reservation,
    currentTime: KSTDateTime = KSTDateTime.now()
  ): ReservationRuleValidationResult {
    const errors: string[] = []
    const startHour = reservation.timeSlot.startHour
    
    // 밤샘 영업 시간대 (22시 이후 또는 0-6시)
    const isOvernightHours = startHour >= 22 || startHour < 6
    
    // 조기 영업 시간대 (6-12시)
    const isEarlyHours = startHour >= 6 && startHour < 12
    
    if (isOvernightHours || isEarlyHours) {
      const hoursUntilStart = reservation.startDateTime.differenceInHours(currentTime)
      
      console.log('Special hours validation:', {
        startHour,
        isOvernightHours,
        isEarlyHours,
        currentTime: currentTime.toString(),
        startDateTime: reservation.startDateTime.toString(),
        hoursUntilStart,
        meetsRequirement: hoursUntilStart >= 24
      })
      
      if (hoursUntilStart < 24) {
        const type = isOvernightHours ? '밤샘 영업' : '조기 영업'
        errors.push(`${type} 시간대 예약은 24시간 전까지만 신청 가능합니다`)
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * 시간대 충돌 검증
   * 같은 사용자가 같은 시간대에 다른 기기를 예약했는지 확인
   */
  static validateTimeConflict(
    reservation: Reservation,
    userReservations: Reservation[]
  ): ReservationRuleValidationResult {
    const errors: string[] = []
    
    const conflictingReservations = userReservations.filter(r => 
      r.hasUserConflict(reservation)
    )
    
    if (conflictingReservations.length > 0) {
      const conflict = conflictingReservations[0]
      if (conflict) {
        errors.push(
          `이미 해당 시간대에 예약이 있습니다. ` +
          `(${conflict.date.dateString} ${conflict.timeSlot.displayTime})`
        )
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * 모든 예약 규칙 종합 검증
   */
  static validateAll(
    reservation: Reservation,
    activeReservations: Reservation[],
    currentTime: KSTDateTime = KSTDateTime.now()
  ): ReservationRuleValidationResult {
    const errors: string[] = []
    
    // 1. 24시간 규칙 검증
    const hourRuleResult = this.validate24HourRule(reservation, currentTime)
    errors.push(...hourRuleResult.errors)
    
    // 2. 사용자별 예약 개수 제한 검증
    const limitResult = this.validateUserReservationLimit(
      reservation.userId,
      activeReservations
    )
    errors.push(...limitResult.errors)
    
    // 3. 특별 영업 시간대 검증
    const specialHoursResult = this.validateSpecialOperatingHours(reservation, currentTime)
    errors.push(...specialHoursResult.errors)
    
    // 4. 시간대 충돌 검증
    const userReservations = activeReservations.filter(r => r.userId === reservation.userId)
    const conflictResult = this.validateTimeConflict(reservation, userReservations)
    errors.push(...conflictResult.errors)
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * 예약 가능한 최소 시간 계산
   * 현재 시간으로부터 24시간 후
   */
  static getMinimumReservationTime(
    currentTime: KSTDateTime = KSTDateTime.now()
  ): KSTDateTime {
    const minimumTime = new Date(currentTime.toDate())
    minimumTime.setHours(minimumTime.getHours() + 24)
    return KSTDateTime.create(minimumTime)
  }

  /**
   * 예약 가능한 날짜인지 확인
   */
  static isReservableDate(
    date: KSTDateTime,
    currentTime: KSTDateTime = KSTDateTime.now()
  ): boolean {
    const minimumTime = this.getMinimumReservationTime(currentTime)
    return date.toDate() >= minimumTime.toDate()
  }
}