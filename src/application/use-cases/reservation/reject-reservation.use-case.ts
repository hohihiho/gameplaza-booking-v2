import { Reservation } from '../../../domain/entities/reservation'
import { User } from '../../../domain/entities/user'
import { IReservationRepository } from '../../../domain/repositories/reservation.repository.interface'
import { IUserRepository } from '../../../domain/repositories/user.repository.interface'
import { INotificationRepository } from '../../../domain/repositories/notification.repository.interface'
import { Notification } from '../../../domain/entities/notification'
import { NotificationChannel } from '../../../domain/value-objects/notification-channel'

export interface RejectReservationRequest {
  userId: string
  reservationId: string
  reason: string
}

export interface RejectReservationResponse {
  reservation: Reservation
  message: string
}

export class RejectReservationUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly reservationRepository: IReservationRepository,
    private readonly notificationRepository: INotificationRepository
  ) {}

  async execute(request: RejectReservationRequest): Promise<RejectReservationResponse> {
    // 1. 사용자 확인 및 권한 검증
    const user = await this.userRepository.findById(request.userId)
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다')
    }

    if (user.role !== 'admin') {
      throw new Error('관리자만 예약을 거절할 수 있습니다')
    }

    // 2. 거절 사유 검증
    if (!request.reason || request.reason.trim().length === 0) {
      throw new Error('거절 사유는 필수입니다')
    }

    // 3. 예약 조회
    const reservation = await this.reservationRepository.findById(request.reservationId)
    if (!reservation) {
      throw new Error('예약을 찾을 수 없습니다')
    }

    // 4. 예약 상태 확인
    if (reservation.status.value !== 'pending') {
      throw new Error('대기 중인 예약만 거절할 수 있습니다')
    }

    // 5. 예약 거절 처리
    const rejectedReservation = reservation.rejectWithReason(request.reason)
    await this.reservationRepository.update(rejectedReservation)

    // 6. 예약한 사용자에게 알림 발송
    const reservationUser = await this.userRepository.findById(reservation.userId)
    if (reservationUser) {
      const notification = Notification.create({
        id: this.generateId(),
        userId: reservation.userId,
        type: 'reservation_rejected',
        title: '예약이 거절되었습니다',
        content: `예약번호 ${reservation.reservationNumber}이(가) 거절되었습니다.\n사유: ${request.reason}`,
        channels: [NotificationChannel.push(), NotificationChannel.inApp()],
        metadata: {
          reservationId: reservation.id,
          rejectionReason: request.reason
        }
      })
      
      await this.notificationRepository.save(notification)
    }

    return {
      reservation: rejectedReservation,
      message: `예약이 거절되었습니다. 사유: ${request.reason}`
    }
  }

  private generateId(): string {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}