import { CheckIn } from '@/src/domain/entities/checkin'
import { ReservationRepository } from '@/src/domain/repositories/reservation.repository.interface'
import { CheckInRepository } from '@/src/domain/repositories/checkin-repository.interface'
import { DeviceRepository } from '@/src/domain/repositories/device.repository.interface'
import { UserRepository } from '@/src/domain/repositories/user-repository.interface'
import { KSTDateTime } from '@/src/domain/value-objects/kst-datetime'

export interface ProcessCheckOutRequest {
  checkInId: string
  adminId: string
  notes?: string
}

export interface ProcessCheckOutResponse {
  checkIn: CheckIn
  usageMinutes: number
}

/**
 * 체크아웃 처리 유스케이스
 */
export class ProcessCheckOutUseCase {
  constructor(
    private checkInRepository: CheckInRepository,
    private reservationRepository: ReservationRepository,
    private deviceRepository: DeviceRepository,
    private userRepository: UserRepository
  ) {}

  async execute(request: ProcessCheckOutRequest): Promise<ProcessCheckOutResponse> {
    // 1. 관리자 권한 확인
    const admin = await this.userRepository.findById(request.adminId)
    if (!admin || admin.role !== 'admin') {
      throw new Error('관리자 권한이 없습니다')
    }

    // 2. 체크인 정보 조회
    const checkIn = await this.checkInRepository.findById(request.checkInId)
    if (!checkIn) {
      throw new Error('체크인 정보를 찾을 수 없습니다')
    }

    // 3. 체크인 상태 확인
    if (!checkIn.status.isInUse()) {
      throw new Error('체크인 상태가 아닙니다')
    }

    // 4. 예약 정보 조회
    const reservation = await this.reservationRepository.findById(checkIn.reservationId)
    if (!reservation) {
      throw new Error('예약 정보를 찾을 수 없습니다')
    }

    // 5. 체크아웃 처리
    const checkedOutCheckIn = checkIn.checkOut()
    
    // 메모 추가 (있는 경우)
    if (request.notes) {
      checkedOutCheckIn.updateNotes(request.notes)
    }

    // 6. 체크인 정보 업데이트
    await this.checkInRepository.update(checkedOutCheckIn)

    // 7. 예약 상태를 완료로 변경
    const completedReservation = reservation.complete()
    await this.reservationRepository.update(completedReservation)

    // 8. 기기 상태를 사용 가능으로 변경
    const device = await this.deviceRepository.findById(reservation.deviceId)
    if (device) {
      const availableDevice = device.changeStatus('available')
      await this.deviceRepository.update(availableDevice)
    }

    // 9. 사용 시간 계산
    const usageMinutes = checkedOutCheckIn.actualDuration || 0

    return {
      checkIn: checkedOutCheckIn,
      usageMinutes
    }
  }
}