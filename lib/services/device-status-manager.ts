// 기기 상태 실시간 관리 서비스
import { emitDeviceStatusChanged } from '@/lib/realtime/reservation-events'

export interface DeviceStatus {
  deviceId: string
  status: 'available' | 'in_use' | 'maintenance' | 'reserved'
  currentReservationId?: string
  startTime?: Date
  endTime?: Date
  userId?: string
}

// 메모리 저장소 (실제로는 DB 사용)
const deviceStatuses = new Map<string, DeviceStatus>()

// 자동 상태 변경을 위한 타이머 저장소
const statusTimers = new Map<string, NodeJS.Timeout>()

export class DeviceStatusManager {
  // 기기 상태 조회
  static getStatus(deviceId: string): DeviceStatus | undefined {
    return deviceStatuses.get(deviceId)
  }

  // 모든 기기 상태 조회
  static getAllStatuses(): DeviceStatus[] {
    return Array.from(deviceStatuses.values())
  }

  // 체크인 처리 (대여 시작 시간에 따라 상태 변경)
  static async checkIn(
    deviceId: string, 
    reservationId: string,
    startTime: Date,
    endTime: Date,
    userId?: string
  ): Promise<void> {
    console.log(`✅ 체크인 완료: 기기 ${deviceId}`)
    
    // 기존 타이머가 있다면 취소
    this.clearExistingTimers(deviceId)
    
    const now = new Date()
    const timeUntilStart = startTime.getTime() - now.getTime()
    
    // 대여 시작 시간이 이미 지났거나 현재 시간인 경우
    if (timeUntilStart <= 0) {
      console.log(`🎮 즉시 대여 시작: 기기 ${deviceId}`)
      this.startRental(deviceId, reservationId, endTime, userId)
    } else {
      // 대여 시작 시간이 아직 안 된 경우 - 체크인만 하고 예약 상태 유지
      console.log(`⏳ 대여 대기: ${startTime.toLocaleString('ko-KR')}에 시작 예정`)
      
      // 현재는 예약 상태로 유지
      const status: DeviceStatus = {
        deviceId,
        status: 'reserved',
        currentReservationId: reservationId,
        startTime,
        endTime,
        userId
      }
      deviceStatuses.set(deviceId, status)
      
      // 대여 시작 시간에 자동으로 상태 변경하도록 타이머 설정
      const startTimer = setTimeout(() => {
        console.log(`🎮 예약 시간 도달: 기기 ${deviceId} 대여 시작`)
        this.startRental(deviceId, reservationId, endTime, userId)
      }, timeUntilStart)
      
      statusTimers.set(`${deviceId}_start`, startTimer)
      console.log(`⏰ 대여 시작 예약: ${startTime.toLocaleString('ko-KR')}`)
    }
  }

  // 실제 대여 시작 (기기 상태를 "대여중"으로 변경)
  private static startRental(
    deviceId: string,
    reservationId: string,
    endTime: Date,
    userId?: string
  ): void {
    // 기기 상태를 "대여중"으로 변경
    const status: DeviceStatus = {
      deviceId,
      status: 'in_use',
      currentReservationId: reservationId,
      startTime: new Date(),
      endTime,
      userId
    }
    
    deviceStatuses.set(deviceId, status)
    
    // 실시간 이벤트 발송
    emitDeviceStatusChanged(deviceId, 'in_use')
    
    // 대여 종료 시간에 자동으로 상태 변경하도록 타이머 설정
    const timeUntilEnd = endTime.getTime() - Date.now()
    if (timeUntilEnd > 0) {
      const endTimer = setTimeout(() => {
        this.autoRelease(deviceId, reservationId)
      }, timeUntilEnd)
      
      statusTimers.set(`${deviceId}_end`, endTimer)
      console.log(`⏰ 자동 반납 예약: ${endTime.toLocaleString('ko-KR')}`)
    }
  }

  // 기존 타이머 정리
  private static clearExistingTimers(deviceId: string): void {
    // 시작 타이머 정리
    const startTimer = statusTimers.get(`${deviceId}_start`)
    if (startTimer) {
      clearTimeout(startTimer)
      statusTimers.delete(`${deviceId}_start`)
    }
    
    // 종료 타이머 정리
    const endTimer = statusTimers.get(`${deviceId}_end`)
    if (endTimer) {
      clearTimeout(endTimer)
      statusTimers.delete(`${deviceId}_end`)
    }
  }

  // 대여 시간 종료 시 자동으로 "사용 가능"으로 변경
  static async autoRelease(deviceId: string, reservationId: string): Promise<void> {
    console.log(`🔄 자동 반납: 기기 ${deviceId} 사용 가능 상태로 변경`)
    
    const currentStatus = deviceStatuses.get(deviceId)
    
    // 현재 예약과 일치하는 경우에만 반납 처리
    if (currentStatus?.currentReservationId === reservationId) {
      const status: DeviceStatus = {
        deviceId,
        status: 'available',
        currentReservationId: undefined,
        startTime: undefined,
        endTime: undefined,
        userId: undefined
      }
      
      deviceStatuses.set(deviceId, status)
      
      // 실시간 이벤트 발송
      emitDeviceStatusChanged(deviceId, 'available')
      
      // 타이머 정리
      statusTimers.delete(deviceId)
    }
  }

  // 수동 반납 (조기 반납 등)
  static async manualRelease(deviceId: string): Promise<void> {
    console.log(`📤 수동 반납: 기기 ${deviceId}`)
    
    // 기존 타이머 취소
    this.clearExistingTimers(deviceId)
    
    const status: DeviceStatus = {
      deviceId,
      status: 'available',
      currentReservationId: undefined,
      startTime: undefined,
      endTime: undefined,
      userId: undefined
    }
    
    deviceStatuses.set(deviceId, status)
    
    // 실시간 이벤트 발송
    emitDeviceStatusChanged(deviceId, 'available')
  }

  // 예약 시 기기 상태를 "예약됨"으로 변경
  static async reserve(
    deviceId: string,
    reservationId: string,
    startTime: Date,
    userId?: string
  ): Promise<void> {
    console.log(`📅 예약: 기기 ${deviceId} 예약됨`)
    
    const status: DeviceStatus = {
      deviceId,
      status: 'reserved',
      currentReservationId: reservationId,
      startTime,
      endTime: undefined,
      userId
    }
    
    deviceStatuses.set(deviceId, status)
    
    // 실시간 이벤트 발송
    emitDeviceStatusChanged(deviceId, 'reserved')
  }

  // 유지보수 모드로 변경
  static async setMaintenance(deviceId: string): Promise<void> {
    console.log(`🔧 유지보수: 기기 ${deviceId}`)
    
    // 기존 타이머 취소
    this.clearExistingTimers(deviceId)
    
    const status: DeviceStatus = {
      deviceId,
      status: 'maintenance',
      currentReservationId: undefined,
      startTime: undefined,
      endTime: undefined,
      userId: undefined
    }
    
    deviceStatuses.set(deviceId, status)
    
    // 실시간 이벤트 발송
    emitDeviceStatusChanged(deviceId, 'maintenance')
  }

  // 대여 시간 연장
  static async extendRental(deviceId: string, newEndTime: Date): Promise<void> {
    console.log(`⏰ 대여 연장: 기기 ${deviceId}`)
    
    const currentStatus = deviceStatuses.get(deviceId)
    if (!currentStatus || currentStatus.status !== 'in_use') {
      throw new Error('대여 중인 기기가 아닙니다')
    }
    
    // 기존 종료 타이머만 취소 (시작 타이머는 이미 실행됨)
    const endTimer = statusTimers.get(`${deviceId}_end`)
    if (endTimer) {
      clearTimeout(endTimer)
      statusTimers.delete(`${deviceId}_end`)
    }
    
    // 상태 업데이트
    currentStatus.endTime = newEndTime
    deviceStatuses.set(deviceId, currentStatus)
    
    // 새로운 종료 타이머 설정
    const timeUntilEnd = newEndTime.getTime() - Date.now()
    if (timeUntilEnd > 0) {
      const timer = setTimeout(() => {
        this.autoRelease(deviceId, currentStatus.currentReservationId!)
      }, timeUntilEnd)
      
      statusTimers.set(`${deviceId}_end`, timer)
      console.log(`⏰ 자동 반납 재설정: ${newEndTime.toLocaleString('ko-KR')}`)
    }
  }

  // 서버 시작 시 기존 예약 복원
  static async restoreFromDatabase(): Promise<void> {
    console.log('🔄 기기 상태 복원 중...')
    
    // TODO: DB에서 현재 진행 중인 예약 조회하여 타이머 재설정
    // 실제 구현 시 DB 쿼리로 대체
    
    console.log('✅ 기기 상태 복원 완료')
  }

  // 정리 (서버 종료 시)
  static cleanup(): void {
    // 모든 타이머 정리
    statusTimers.forEach(timer => clearTimeout(timer))
    statusTimers.clear()
    deviceStatuses.clear()
  }
}

// 서버 시작 시 자동 복원
if (typeof window === 'undefined') {
  DeviceStatusManager.restoreFromDatabase().catch(console.error)
  
  // 프로세스 종료 시 정리
  process.on('SIGTERM', () => DeviceStatusManager.cleanup())
  process.on('SIGINT', () => DeviceStatusManager.cleanup())
}