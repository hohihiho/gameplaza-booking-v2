/**
 * 대여 제한 서비스
 * maimai 기기 동시 대여 제한 및 2인 플레이 옵션 관리
 */

import { RentalLimitRepository } from '@/lib/repositories/rental-limit.repository'
import { AppError, ErrorCodes } from '@/lib/utils/error-handler'
import { logger } from '@/lib/utils/logger'

export interface Device {
  id: string
  device_type: string
  device_name: string
  status: string
}

export interface ValidationResult {
  isValid: boolean
  errors?: string[]
  warnings?: string[]
}

export interface RentalRequest {
  userId: string
  devices: Device[]
  date: string
  isTwoPlayer?: boolean
}

export class RentalLimitService {
  private static readonly MAIMAI_MAX_RENTALS = 3
  private static readonly TWO_PLAYER_SURCHARGE = 10000 // 2인 플레이 추가 요금

  constructor(
    private rentalLimitRepository: RentalLimitRepository
  ) {}

  /**
   * maimai 기기 대여 제한 확인
   */
  async checkMaimaiLimit(
    userId: string,
    requestedUnits: number
  ): Promise<{
    allowed: boolean
    currentRentals: number
    maxAllowed: number
    availableSlots: number
    message?: string
  }> {
    try {
      const currentRentals = await this.rentalLimitRepository.getCurrentRentals(
        userId,
        'maimai'
      )

      const availableSlots = RentalLimitService.MAIMAI_MAX_RENTALS - currentRentals
      const allowed = requestedUnits <= availableSlots

      const result = {
        allowed,
        currentRentals,
        maxAllowed: RentalLimitService.MAIMAI_MAX_RENTALS,
        availableSlots,
        message: allowed
          ? undefined
          : `maimai 기기는 최대 ${RentalLimitService.MAIMAI_MAX_RENTALS}대까지만 동시 대여 가능합니다. 현재 ${currentRentals}대 대여 중입니다.`
      }

      logger.info('Maimai limit checked', { userId, requestedUnits, result })

      return result
    } catch (error) {
      logger.error('Failed to check maimai limit', { userId, requestedUnits, error })
      throw error
    }
  }

  /**
   * 2인 플레이 추가 요금 적용
   */
  applyTwoPlayerSurcharge(
    basePrice: number,
    isTwoPlayer: boolean
  ): {
    totalPrice: number
    surcharge: number
    breakdown: {
      base: number
      twoPlayerOption?: number
    }
  } {
    const surcharge = isTwoPlayer ? RentalLimitService.TWO_PLAYER_SURCHARGE : 0
    const totalPrice = basePrice + surcharge

    return {
      totalPrice,
      surcharge,
      breakdown: {
        base: basePrice,
        ...(isTwoPlayer && { twoPlayerOption: RentalLimitService.TWO_PLAYER_SURCHARGE })
      }
    }
  }

  /**
   * 대여 요청 검증
   */
  async validateRentalRequest(request: RentalRequest): Promise<ValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      // 1. 기기 타입별 그룹화
      const devicesByType = request.devices.reduce((acc, device) => {
        if (!acc[device.device_type]) {
          acc[device.device_type] = []
        }
        acc[device.device_type].push(device)
        return acc
      }, {} as Record<string, Device[]>)

      // 2. maimai 기기 제한 확인
      if (devicesByType['maimai']) {
        const maimaiCount = devicesByType['maimai'].length
        const limitCheck = await this.checkMaimaiLimit(request.userId, maimaiCount)

        if (!limitCheck.allowed) {
          errors.push(limitCheck.message || 'maimai 대여 제한 초과')
        }

        // 2인 플레이는 maimai 1대에서만 가능
        if (request.isTwoPlayer && maimaiCount !== 1) {
          errors.push('2인 플레이는 maimai 기기 1대에서만 가능합니다.')
        }
      }

      // 3. 기타 기기 타입 검증 (필요시 추가)
      for (const [deviceType, devices] of Object.entries(devicesByType)) {
        if (deviceType !== 'maimai') {
          // 다른 기기 타입의 제한 사항 확인
          const canRent = await this.rentalLimitRepository.checkRentalLimit(
            request.userId,
            deviceType,
            devices.length
          )

          if (!canRent) {
            errors.push(`${deviceType} 기기 대여 제한을 확인해주세요.`)
          }
        }
      }

      // 4. 가용 기기 확인
      for (const [deviceType, devices] of Object.entries(devicesByType)) {
        const available = await this.rentalLimitRepository.getAvailableUnits(
          deviceType,
          request.date
        )

        if (available < devices.length) {
          warnings.push(
            `${deviceType} 기기의 가용 수량이 부족할 수 있습니다. (가용: ${available}대)`
          )
        }
      }

      const isValid = errors.length === 0

      logger.info('Rental request validated', {
        userId: request.userId,
        deviceCount: request.devices.length,
        isValid,
        errors,
        warnings
      })

      return {
        isValid,
        ...(errors.length > 0 && { errors }),
        ...(warnings.length > 0 && { warnings })
      }
    } catch (error) {
      logger.error('Failed to validate rental request', { request, error })
      return {
        isValid: false,
        errors: ['대여 요청 검증 중 오류가 발생했습니다.']
      }
    }
  }

  /**
   * 대여 슬롯 해제 (예약 취소/완료 시)
   */
  async releaseRentalSlots(
    userId: string,
    devices: Device[]
  ): Promise<void> {
    try {
      // 기기 타입별로 그룹화
      const devicesByType = devices.reduce((acc, device) => {
        if (!acc[device.device_type]) {
          acc[device.device_type] = 0
        }
        acc[device.device_type]++
        return acc
      }, {} as Record<string, number>)

      // 각 기기 타입별로 대여 수량 감소
      for (const [deviceType, count] of Object.entries(devicesByType)) {
        await this.rentalLimitRepository.decrementRental(
          userId,
          deviceType,
          count
        )
      }

      logger.info('Rental slots released', {
        userId,
        deviceCount: devices.length,
        deviceTypes: Object.keys(devicesByType)
      })
    } catch (error) {
      logger.error('Failed to release rental slots', { userId, devices, error })
      throw error
    }
  }

  /**
   * 사용자의 대여 현황 조회
   */
  async getUserRentalStatus(userId: string): Promise<{
    rentals: Array<{
      deviceType: string
      currentCount: number
      maxAllowed: number | null
    }>
    canRentMore: boolean
  }> {
    try {
      const status = await this.rentalLimitRepository.getUserRentalStatus(userId)

      const rentals = status.map(record => ({
        deviceType: record.deviceType,
        currentCount: record.count,
        maxAllowed: record.deviceType.toLowerCase() === 'maimai'
          ? RentalLimitService.MAIMAI_MAX_RENTALS
          : null
      }))

      // maimai 기기에 대한 추가 대여 가능 여부 확인
      const maimaiRental = rentals.find(
        r => r.deviceType.toLowerCase() === 'maimai'
      )
      const canRentMoreMaimai = !maimaiRental ||
        maimaiRental.currentCount < RentalLimitService.MAIMAI_MAX_RENTALS

      return {
        rentals,
        canRentMore: canRentMoreMaimai
      }
    } catch (error) {
      logger.error('Failed to get user rental status', { userId, error })
      return {
        rentals: [],
        canRentMore: true
      }
    }
  }

  /**
   * 동적 제한 조정 (기기 고장 등)
   */
  async adjustDynamicLimit(
    deviceType: string,
    adjustment: number,
    reason: string
  ): Promise<void> {
    try {
      // 관리자가 특정 기기 타입의 가용 수량을 임시로 조정
      // 예: maimai 1대 고장 시 최대 대여 가능 수를 2대로 제한
      logger.info('Dynamic limit adjusted', {
        deviceType,
        adjustment,
        reason
      })

      // 실제 구현 시 admin_settings 테이블 등에 저장
      // 현재는 로그만 남김
    } catch (error) {
      logger.error('Failed to adjust dynamic limit', {
        deviceType,
        adjustment,
        reason,
        error
      })
      throw error
    }
  }

  /**
   * 2인 플레이 옵션 처리
   */
  async processTwoPlayerOption(
    reservationId: string,
    isTwoPlayer: boolean,
    baseAmount: number
  ): Promise<{
    finalAmount: number
    surcharge: number
  }> {
    try {
      // 2인 플레이 옵션 저장
      await this.rentalLimitRepository.setTwoPlayerOption(
        reservationId,
        isTwoPlayer
      )

      // 추가 요금 계산
      const pricing = this.applyTwoPlayerSurcharge(baseAmount, isTwoPlayer)

      logger.info('Two player option processed', {
        reservationId,
        isTwoPlayer,
        baseAmount,
        finalAmount: pricing.totalPrice,
        surcharge: pricing.surcharge
      })

      return {
        finalAmount: pricing.totalPrice,
        surcharge: pricing.surcharge
      }
    } catch (error) {
      logger.error('Failed to process two player option', {
        reservationId,
        isTwoPlayer,
        error
      })
      throw error
    }
  }
}