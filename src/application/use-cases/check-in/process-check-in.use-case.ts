import { CheckIn } from '@/src/domain/entities/checkin'
import { ReservationRepository } from '@/src/domain/repositories/reservation.repository.interface'
import { CheckInRepository } from '@/src/domain/repositories/checkin-repository.interface'
import { DeviceRepository } from '@/src/domain/repositories/device.repository.interface'
import { UserRepository } from '@/src/domain/repositories/user-repository.interface'
import { KSTDateTime } from '@/src/domain/value-objects/kst-datetime'

export interface ProcessCheckInRequest {
  reservationId: string
  adminId: string
  notes?: string
}

export interface ProcessCheckInResponse {
  checkIn: CheckIn
}

/**
 * 예약 체크인 처리 유스케이스
 */
export class ProcessCheckInUseCase {
  constructor(
    private reservationRepository: ReservationRepository,
    private checkInRepository: CheckInRepository,
    private deviceRepository: DeviceRepository,
    private userRepository: UserRepository
  ) {}

  async execute(request: ProcessCheckInRequest): Promise<ProcessCheckInResponse> {
    // 1. 관리자 권한 확인
    const admin = await this.userRepository.findById(request.adminId)
    if (!admin || admin.role !== 'admin') {
      throw new Error('관리자 권한이 없습니다')
    }

    // 2. 예약 정보 조회
    const reservation = await this.reservationRepository.findById(request.reservationId)
    if (!reservation) {
      throw new Error('예약을 찾을 수 없습니다')
    }

    // 3. 예약 상태 확인 (승인된 예약만 체크인 가능)
    if (reservation.status.value !== 'approved') {
      throw new Error('승인된 예약만 체크인할 수 있습니다')
    }

    // 4. 이미 체크인된 예약인지 확인
    const existingCheckIn = await this.checkInRepository.findByReservationId(request.reservationId)
    if (existingCheckIn && existingCheckIn.isActive()) {
      throw new Error('이미 체크인이 완료된 예약입니다')
    }

    // 5. 기기 상태 확인 (시간보다 먼저 체크)
    const device = await this.deviceRepository.findById(reservation.deviceId)
    if (!device) {
      throw new Error('기기를 찾을 수 없습니다')
    }

    if (!device.isOperational()) {
      throw new Error('사용할 수 없는 기기입니다')
    }

    // 6. 현재 시간이 예약 시간대에 맞는지 확인 (30분 전부터 체크인 가능)
    const now = KSTDateTime.now()
    const reservationStartTime = KSTDateTime.fromDateAndHour(
      reservation.date,
      reservation.timeSlot.startHour
    )
    
    const thirtyMinutesBefore = new Date(reservationStartTime.toDate().getTime() - 30 * 60 * 1000)
    if (now.toDate() < thirtyMinutesBefore) {
      throw new Error('예약 시간 30분 전부터 체크인이 가능합니다')
    }

    // 예약 종료 시간 이후에는 체크인 불가
    const reservationEndTime = KSTDateTime.fromDateAndHour(
      reservation.date,
      reservation.timeSlot.endHour
    )
    if (now.toDate() > reservationEndTime.toDate()) {
      throw new Error('예약 시간이 지나 체크인할 수 없습니다')
    }

    // 7. 다른 사용자가 해당 기기를 사용 중인지 확인
    const activeCheckIn = await this.checkInRepository.findActiveByDeviceId(device.id)
    if (activeCheckIn) {
      throw new Error('해당 기기는 이미 사용 중입니다')
    }

    // 8. 예약 상태를 체크인으로 업데이트
    const checkedInReservation = reservation.checkIn()
    await this.reservationRepository.update(checkedInReservation)

    // 9. 체크인 엔티티 생성
    const checkIn = CheckIn.create({
      reservationId: reservation.id,
      deviceId: reservation.deviceId,
      paymentAmount: 30000, // TODO: 예약 금액 정보 필요
      reservationStartTime: reservation.startDateTime.toDate()
    })

    // 10. 체크인 정보 저장
    await this.checkInRepository.save(checkIn)

    // 11. 기기 상태를 사용 중으로 변경
    const updatedDevice = device.changeStatus('in_use')
    await this.deviceRepository.update(updatedDevice)

    return { checkIn }
  }
}