import { Reservation } from '@/src/domain/entities/reservation'
import { ReservationRepository } from '@/src/domain/repositories/reservation.repository.interface'
import { UserRepository } from '@/src/domain/repositories/user.repository.interface'
import { KSTDateTime } from '@/src/domain/value-objects/kst-datetime'
import { SendReservationNotificationUseCase } from '../notification/send-reservation-notification.use-case'
import { NotificationRepository } from '@/src/domain/repositories/notification.repository.interface'
import { DeviceRepository } from '@/src/domain/repositories/device.repository.interface'
import { NotificationService } from '@/src/domain/services/notification.service.interface'

export interface CancelReservationRequest {
  reservationId: string
  userId: string
  reason?: string
}

export interface CancelReservationResponse {
  reservation: Reservation
}

/**
 * 예약 취소 유스케이스
 * 사용자가 자신의 예약을 취소하거나 관리자가 예약을 취소할 수 있음
 */
export class CancelReservationUseCase {
  constructor(
    private reservationRepository: ReservationRepository,
    private userRepository: UserRepository,
    private deviceRepository?: DeviceRepository,
    private notificationRepository?: NotificationRepository,
    private notificationService?: NotificationService
  ) {}

  async execute(request: CancelReservationRequest): Promise<CancelReservationResponse> {
    // 1. 예약 정보 조회
    const reservation = await this.reservationRepository.findById(request.reservationId)
    if (!reservation) {
      throw new Error('예약을 찾을 수 없습니다')
    }

    // 2. 사용자 조회
    const user = await this.userRepository.findById(request.userId)
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다')
    }

    // 3. 취소 권한 확인
    const isOwner = reservation.userId === request.userId
    const isAdmin = user.role === 'admin'

    if (!isOwner && !isAdmin) {
      throw new Error('예약을 취소할 권한이 없습니다')
    }

    // 4. 예약 상태 확인
    if (!reservation.isActive()) {
      throw new Error('활성 상태가 아닌 예약은 취소할 수 없습니다')
    }

    if (reservation.status.value === 'checked_in') {
      throw new Error('이미 체크인된 예약은 취소할 수 없습니다')
    }

    // 5. 취소 가능 시간 확인 (사용자의 경우)
    if (isOwner && !isAdmin) {
      this.validateCancellationTime(reservation)
    }

    // 6. 예약 취소
    const cancelledReservation = reservation.cancel()

    // 7. 취소 사유 기록 (옵션)
    if (request.reason) {
      // 실제 구현에서는 별도의 취소 기록 테이블에 저장하거나
      // 예약 엔티티에 취소 사유 필드를 추가할 수 있습니다
      console.log(`Cancellation reason for ${request.reservationId}: ${request.reason}`)
    }

    // 8. 변경사항 저장
    await this.reservationRepository.update(cancelledReservation)

    // 9. 예약 취소 알림 발송 (옵션)
    if (this.deviceRepository && this.notificationRepository && this.notificationService) {
      try {
        const notificationUseCase = new SendReservationNotificationUseCase(
          this.notificationRepository,
          this.reservationRepository,
          this.deviceRepository,
          this.userRepository,
          this.notificationService
        )

        await notificationUseCase.execute({
          reservationId: cancelledReservation.id,
          type: 'reservation_cancelled',
          additionalData: {
            reason: request.reason,
            cancelledBy: isOwner ? 'user' : 'admin'
          }
        })
      } catch (error) {
        // 알림 발송 실패는 예약 취소를 막지 않음
        console.error('Failed to send cancellation notification:', error)
      }
    }

    return {
      reservation: cancelledReservation
    }
  }

  /**
   * 취소 가능 시간 검증
   * 예약 시작 2시간 전까지만 취소 가능
   */
  private validateCancellationTime(reservation: Reservation): void {
    const now = KSTDateTime.now()
    const reservationStartTime = reservation.startDateTime
    
    // 현재 시간과 예약 시작 시간의 차이 계산 (시간 단위)
    const hoursUntilStart = reservationStartTime.differenceInHours(now)
    
    if (hoursUntilStart < 2) {
      throw new Error('예약 시작 2시간 전까지만 취소가 가능합니다')
    }
  }
}