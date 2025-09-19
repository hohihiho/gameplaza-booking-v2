/**
 * 기기 관련 비즈니스 로직을 처리하는 서비스 레이어
 */

import { DeviceRepository } from '@/lib/repositories/device.repository'
import { ReservationRepository } from '@/lib/repositories/reservation.repository'
import { 
  AppError, 
  ErrorCodes 
} from '@/lib/utils/error-handler'
import { logger } from '@/lib/utils/logger'
import { getDB } from '@/lib/db/server'

export interface CreateDeviceDto {
  deviceNumber: string
  typeId: string
  status?: string
}

export interface UpdateDeviceDto {
  deviceNumber?: string
  typeId?: string
  status?: string
}

export class DeviceService {
  private deviceRepo: DeviceRepository
  private reservationRepo: ReservationRepository

  constructor() {
    const db = getDB()
    this.deviceRepo = new DeviceRepository(db)
    this.reservationRepo = new ReservationRepository(db)
  }

  // 싱글톤 인스턴스
  private static instance: DeviceService | null = null

  static getInstance(): DeviceService {
    if (!DeviceService.instance) {
      DeviceService.instance = new DeviceService()
    }
    return DeviceService.instance
  }

  /**
   * 모든 기기 조회
   */
  async getAllDevices() {
    try {
      const devices = await this.deviceRepo.findAllWithTypes()
      return devices
    } catch (error) {
      logger.error('Failed to fetch all devices', error)
      throw error
    }
  }

  /**
   * 기기 ID로 조회
   */
  async getDeviceById(id: string) {
    try {
      const device = await this.deviceRepo.findByIdWithType(id)
      
      if (!device) {
        throw new AppError(ErrorCodes.DEVICE_NOT_FOUND, '기기를 찾을 수 없습니다', 404)
      }

      return device
    } catch (error) {
      logger.error('Failed to fetch device by id', error)
      throw error
    }
  }

  /**
   * 상태별 기기 조회
   */
  async getDevicesByStatus(status: string) {
    try {
      const devices = await this.deviceRepo.findByStatus(status)
      return devices
    } catch (error) {
      logger.error('Failed to fetch devices by status', error)
      throw error
    }
  }

  /**
   * 카테고리별 기기 조회
   */
  async getDevicesByCategory(categoryId: string) {
    try {
      const devices = await this.deviceRepo.findByCategory(categoryId)
      return devices
    } catch (error) {
      logger.error('Failed to fetch devices by category', error)
      throw error
    }
  }

  /**
   * 특정 시간대에 예약 가능한 기기 조회
   */
  async getAvailableDevices(date: string, startTime: string, endTime: string) {
    try {
      const devices = await this.deviceRepo.findAvailableDevices(date, startTime, endTime)
      return devices
    } catch (error) {
      logger.error('Failed to fetch available devices', error)
      throw error
    }
  }

  /**
   * 기기 생성
   */
  async createDevice(data: CreateDeviceDto) {
    try {
      logger.info('Creating device', { data })

      // 기기 번호 중복 확인
      const devices = await this.deviceRepo.findAll()
      const existingDevice = devices.find(d => d.device_number === data.deviceNumber)
      
      if (existingDevice) {
        throw new AppError(
          ErrorCodes.DUPLICATE_ENTRY,
          '이미 존재하는 기기 번호입니다',
          400
        )
      }

      const device = await this.deviceRepo.create({
        device_number: data.deviceNumber,
        type_id: data.typeId,
        status: data.status || 'available',
        created_at: new Date().toISOString()
      })

      logger.info('Device created successfully', { deviceId: device?.id })

      return device
    } catch (error) {
      logger.error('Failed to create device', error)
      throw error
    }
  }

  /**
   * 기기 정보 업데이트
   */
  async updateDevice(id: string, data: UpdateDeviceDto) {
    try {
      logger.info('Updating device', { id, data })

      const device = await this.deviceRepo.findById(id)
      if (!device) {
        throw new AppError(ErrorCodes.DEVICE_NOT_FOUND, '기기를 찾을 수 없습니다', 404)
      }

      // 기기 번호 중복 확인 (변경하는 경우)
      if (data.deviceNumber && data.deviceNumber !== device.device_number) {
        const devices = await this.deviceRepo.findAll()
        const existingDevice = devices.find(d => d.device_number === data.deviceNumber)
        
        if (existingDevice) {
          throw new AppError(
            ErrorCodes.DUPLICATE_ENTRY,
            '이미 존재하는 기기 번호입니다',
            400
          )
        }
      }

      const updated = await this.deviceRepo.update(id, {
        device_number: data.deviceNumber,
        type_id: data.typeId,
        status: data.status,
        updated_at: new Date().toISOString()
      })

      logger.info('Device updated successfully', { deviceId: id })

      return updated
    } catch (error) {
      logger.error('Failed to update device', error)
      throw error
    }
  }

  /**
   * 기기 상태 업데이트
   */
  async updateDeviceStatus(id: string, status: string) {
    try {
      logger.info('Updating device status', { id, status })

      const device = await this.deviceRepo.findById(id)
      if (!device) {
        throw new AppError(ErrorCodes.DEVICE_NOT_FOUND, '기기를 찾을 수 없습니다', 404)
      }

      // 사용 중인 기기는 maintenance로 변경 불가
      if (status === 'maintenance' && device.status === 'in_use') {
        throw new AppError(
          ErrorCodes.DEVICE_IN_USE,
          '사용 중인 기기는 점검 상태로 변경할 수 없습니다',
          400
        )
      }

      const updated = await this.deviceRepo.updateStatus(id, status)

      logger.info('Device status updated successfully', { deviceId: id })

      return updated
    } catch (error) {
      logger.error('Failed to update device status', error)
      throw error
    }
  }

  /**
   * 기기 삭제
   */
  async deleteDevice(id: string) {
    try {
      logger.info('Deleting device', { id })

      const device = await this.deviceRepo.findById(id)
      if (!device) {
        throw new AppError(ErrorCodes.DEVICE_NOT_FOUND, '기기를 찾을 수 없습니다', 404)
      }

      // 예약이 있는 기기는 삭제 불가
      const currentDate = new Date().toISOString().split('T')[0]
      const reservations = await this.reservationRepo.findByDateAndDevice(
        currentDate,
        id,
        ['pending', 'approved', 'checked_in']
      )

      if (reservations.length > 0) {
        throw new AppError(
          ErrorCodes.DEVICE_HAS_RESERVATIONS,
          '예약이 있는 기기는 삭제할 수 없습니다',
          400
        )
      }

      const deleted = await this.deviceRepo.delete(id)

      if (!deleted) {
        throw new AppError(ErrorCodes.DATABASE_ERROR, '기기 삭제에 실패했습니다', 500)
      }

      logger.info('Device deleted successfully', { deviceId: id })

      return { success: true }
    } catch (error) {
      logger.error('Failed to delete device', error)
      throw error
    }
  }

  /**
   * 기기 통계 조회
   */
  async getDeviceStats() {
    try {
      const stats = await this.deviceRepo.getDeviceStats()
      return stats
    } catch (error) {
      logger.error('Failed to fetch device stats', error)
      throw error
    }
  }

  /**
   * 기기별 예약 현황 조회
   */
  async getDeviceReservations(deviceId: string, date: string) {
    try {
      const device = await this.deviceRepo.findByIdWithType(deviceId)
      if (!device) {
        throw new AppError(ErrorCodes.DEVICE_NOT_FOUND, '기기를 찾을 수 없습니다', 404)
      }

      const reservations = await this.reservationRepo.findByDateAndDevice(
        date,
        deviceId,
        ['pending', 'approved', 'checked_in']
      )

      return {
        device,
        reservations,
        date
      }
    } catch (error) {
      logger.error('Failed to fetch device reservations', error)
      throw error
    }
  }

  /**
   * 기기 사용률 조회
   */
  async getDeviceUsageRate(deviceId: string, startDate: string, endDate: string) {
    try {
      const device = await this.deviceRepo.findById(deviceId)
      if (!device) {
        throw new AppError(ErrorCodes.DEVICE_NOT_FOUND, '기기를 찾을 수 없습니다', 404)
      }

      // 날짜 범위 내 모든 예약 조회
      const reservations = await this.reservationRepo.findForAnalytics(startDate, endDate)
      const deviceReservations = reservations.filter(r => r.device_id === deviceId)

      // 총 운영 시간 계산 (하루 19시간 * 일수)
      const start = new Date(startDate)
      const end = new Date(endDate)
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
      const totalOperatingHours = days * 19 // 10:00 ~ 05:00 = 19시간

      // 실제 사용 시간 계산
      let totalUsageHours = 0
      deviceReservations.forEach(reservation => {
        const startHour = parseInt(reservation.start_time.split(':')[0])
        const startMin = parseInt(reservation.start_time.split(':')[1])
        const endHour = parseInt(reservation.end_time.split(':')[0])
        const endMin = parseInt(reservation.end_time.split(':')[1])
        
        const usageHours = (endHour + endMin / 60) - (startHour + startMin / 60)
        totalUsageHours += usageHours
      })

      const usageRate = totalOperatingHours > 0 
        ? Math.round((totalUsageHours / totalOperatingHours) * 100)
        : 0

      return {
        device,
        totalOperatingHours,
        totalUsageHours,
        usageRate,
        reservationCount: deviceReservations.length
      }
    } catch (error) {
      logger.error('Failed to calculate device usage rate', error)
      throw error
    }
  }
}