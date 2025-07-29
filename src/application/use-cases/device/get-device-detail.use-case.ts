import { Device } from '@/src/domain/entities/device.entity'
import { IDeviceRepository } from '@/src/domain/repositories/device.repository.interface'
import { CheckInRepository } from '@/src/domain/repositories/check-in.repository.interface'
import { ReservationRepository } from '@/src/domain/repositories/reservation.repository.interface'
import { KSTDateTime } from '@/src/domain/value-objects/kst-datetime'

export interface GetDeviceDetailRequest {
  deviceId: string
}

export interface GetDeviceDetailResponse {
  device: Device
  currentCheckIn?: {
    id: string
    userId: string
    checkInTime: string
  }
  todayReservations: {
    id: string
    userId: string
    startTime: number
    endTime: number
    status: string
  }[]
  maintenanceHistory: {
    date: string
    reason: string
  }[]
}

/**
 * 기기 상세 정보 조회 유스케이스
 */
export class GetDeviceDetailUseCase {
  constructor(
    private deviceRepository: DeviceRepository,
    private checkInRepository: CheckInRepository,
    private reservationRepository: ReservationRepository
  ) {}

  async execute(request: GetDeviceDetailRequest): Promise<GetDeviceDetailResponse> {
    // 1. 기기 조회
    const device = await this.deviceRepository.findById(request.deviceId)
    if (!device) {
      throw new Error('기기를 찾을 수 없습니다')
    }

    // 2. 현재 체크인 정보 조회
    let currentCheckIn
    if (device.status === 'in_use') {
      const activeCheckIn = await this.checkInRepository.findActiveByDeviceId(device.id)
      if (activeCheckIn) {
        currentCheckIn = {
          id: activeCheckIn.id,
          userId: activeCheckIn.userId,
          checkInTime: activeCheckIn.checkInTime.toISOString()
        }
      }
    }

    // 3. 오늘의 예약 목록 조회
    const today = KSTDateTime.now()
    const todayReservations = await this.reservationRepository.findByDeviceId(device.id)
    
    // 오늘 날짜의 예약만 필터링
    const todayReservationList = todayReservations
      .filter(reservation => reservation.date.isSameDay(today))
      .map(reservation => ({
        id: reservation.id,
        userId: reservation.userId,
        startTime: reservation.timeSlot.startHour,
        endTime: reservation.timeSlot.endHour,
        status: reservation.status.value
      }))
      .sort((a, b) => a.startTime - b.startTime)

    // 4. 점검 이력 조회 (간단히 구현 - 실제로는 별도 테이블에서 관리)
    const maintenanceHistory: { date: string; reason: string }[] = []
    if (device.status === 'maintenance' && device.notes) {
      maintenanceHistory.push({
        date: device.updatedAt.toISOString(),
        reason: device.notes
      })
    }

    return {
      device,
      currentCheckIn,
      todayReservations: todayReservationList,
      maintenanceHistory
    }
  }
}