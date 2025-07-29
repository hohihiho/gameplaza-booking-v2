import { ReservationRepository } from '@/src/domain/repositories/reservation.repository.interface'
import { CheckInRepository } from '@/src/domain/repositories/checkin-repository.interface'
import { UserRepository } from '@/src/domain/repositories/user-repository.interface'
import { KSTDateTime } from '@/src/domain/value-objects/kst-datetime'

export interface HandleNoShowRequest {
  reservationId: string
  adminId: string
  reason?: string
}

export interface HandleNoShowResponse {
  reservation: any
}

/**
 * 노쇼 처리 유스케이스
 * 예약 시간이 지났는데 체크인하지 않은 예약을 노쇼로 처리
 */
export class HandleNoShowUseCase {
  constructor(
    private reservationRepository: ReservationRepository,
    private checkInRepository: CheckInRepository,
    private userRepository: UserRepository
  ) {}

  async execute(request: HandleNoShowRequest): Promise<HandleNoShowResponse> {
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

    // 3. 예약 상태 확인 (승인된 예약만 노쇼 처리 가능)
    if (reservation.status.value !== 'approved') {
      throw new Error('승인된 예약만 노쇼 처리할 수 있습니다')
    }

    // 4. 체크인 여부 확인
    const checkIn = await this.checkInRepository.findByReservationId(request.reservationId)
    if (checkIn && checkIn.isActive()) {
      throw new Error('이미 체크인된 예약은 노쇼 처리할 수 없습니다')
    }

    // 5. 예약 시간이 지났는지 확인
    const now = KSTDateTime.now()
    const reservationStartTime = KSTDateTime.fromDateAndHour(
      reservation.date,
      reservation.timeSlot.startHour
    )
    
    // 예약 시작 시간 + 30분까지는 노쇼 처리 불가 (늦은 체크인 가능성)
    const thirtyMinutesAfterStart = new Date(reservationStartTime.toDate().getTime() + 30 * 60 * 1000)
    if (now.toDate() < thirtyMinutesAfterStart) {
      throw new Error('예약 시작 시간 30분 후부터 노쇼 처리가 가능합니다')
    }

    // 6. 노쇼 처리
    const noShowReservation = reservation.markAsNoShow()
    await this.reservationRepository.update(noShowReservation)

    return {
      reservation: noShowReservation
    }
  }

  /**
   * 자동 노쇼 처리 (배치 작업용)
   * 예약 시작 시간으로부터 1시간이 지난 승인된 예약을 자동으로 노쇼 처리
   */
  async processAutoNoShow(): Promise<HandleNoShowResponse[]> {
    const now = KSTDateTime.now()
    
    // 오늘과 어제의 예약을 모두 조회 (밤샘 예약 포함)
    const yesterday = now.addDays(-1)
    const today = now
    
    // 어제와 오늘의 모든 예약 조회
    const reservations = await this.reservationRepository.findByDateRange(
      yesterday,
      today
    )

    const results: HandleNoShowResponse[] = []

    for (const reservation of reservations) {
      // 승인된 예약만 처리
      if (reservation.status.value !== 'approved') continue

      // 체크인 여부 확인
      const checkIn = await this.checkInRepository.findByReservationId(reservation.id)
      if (checkIn) continue

      // 예약 시작 시간으로부터 1시간이 지났는지 확인
      const reservationStartTime = KSTDateTime.fromDateAndHour(
        reservation.date,
        reservation.timeSlot.startHour
      )
      const oneHourAfterStart = new Date(reservationStartTime.toDate().getTime() + 60 * 60 * 1000)
      
      if (now.toDate() >= oneHourAfterStart) {
        try {
          const noShowReservation = reservation.markAsNoShow()
          await this.reservationRepository.update(noShowReservation)
          
          results.push({
            reservation: noShowReservation
          })
        } catch (error) {
          console.error(`Failed to process no-show for reservation ${reservation.id}:`, error)
        }
      }
    }

    return results
  }
}