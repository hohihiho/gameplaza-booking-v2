import { Notification, NotificationType } from '@/src/domain/entities/notification'
import { Reservation } from '@/src/domain/entities/reservation'
import { Device } from '@/src/domain/entities/device.entity'
import { NotificationRepository } from '@/src/domain/repositories/notification.repository.interface'
import { ReservationRepository } from '@/src/domain/repositories/reservation.repository.interface'
import { DeviceRepository } from '@/src/domain/repositories/device.repository.interface'
import { UserRepository } from '@/src/domain/repositories/user.repository.interface'
import { NotificationService } from '@/src/domain/services/notification.service.interface'
import { KSTDateTime } from '@/src/domain/value-objects/kst-datetime'

export interface SendReservationNotificationRequest {
  reservationId: string
  type: NotificationType
  additionalData?: Record<string, any>
}

export interface SendReservationNotificationResponse {
  notification: Notification
  sent: boolean
}

/**
 * 예약 관련 알림 발송 유스케이스
 * 예약 생성, 승인, 거절, 취소 등의 이벤트에 대한 알림 발송
 */
export class SendReservationNotificationUseCase {
  constructor(
    private notificationRepository: NotificationRepository,
    private reservationRepository: ReservationRepository,
    private deviceRepository: DeviceRepository,
    private userRepository: UserRepository,
    private notificationService: NotificationService
  ) {}

  async execute(request: SendReservationNotificationRequest): Promise<SendReservationNotificationResponse> {
    // 1. 예약 정보 조회
    const reservation = await this.reservationRepository.findById(request.reservationId)
    if (!reservation) {
      throw new Error('예약을 찾을 수 없습니다')
    }

    // 2. 기기 정보 조회
    const device = await this.deviceRepository.findById(reservation.deviceId)
    if (!device) {
      throw new Error('기기를 찾을 수 없습니다')
    }

    // 3. 사용자 정보 조회
    const user = await this.userRepository.findById(reservation.userId)
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다')
    }

    // 4. 알림 데이터 구성
    const notificationData = {
      reservationId: reservation.id,
      deviceId: device.id,
      deviceNumber: device.deviceNumber,
      date: reservation.date.dateString,
      timeSlot: `${reservation.timeSlot.startHour}:00 - ${reservation.timeSlot.endHour}:00`,
      ...request.additionalData
    }

    // 5. 알림 생성
    const notification = Notification.createReservationNotification(
      user.id,
      request.type,
      notificationData
    )

    // 6. 예약 리마인더인 경우 예약 시간 설정
    if (request.type === 'reservation_reminder' || request.type === 'check_in_reminder') {
      const scheduledTime = this.calculateScheduledTime(reservation, request.type)
      notification.props.scheduledFor = scheduledTime
    }

    // 7. 알림 저장
    const savedNotification = await this.notificationRepository.save(notification)

    // 8. 즉시 발송인 경우 발송 처리
    let sent = false
    if (!notification.isScheduled()) {
      try {
        const result = await this.notificationService.sendNotification(
          savedNotification,
          user.email,
          user.phoneNumber
        )
        
        savedNotification.markAsSent(result.sentChannels, result.failedChannels)
        await this.notificationRepository.update(savedNotification)
        
        sent = result.success
      } catch (error) {
        console.error('Notification send error:', error)
      }
    }

    return {
      notification: savedNotification,
      sent
    }
  }

  /**
   * 예약 알림 시간 계산
   */
  private calculateScheduledTime(
    reservation: Reservation,
    type: NotificationType
  ): KSTDateTime {
    const reservationStart = reservation.startDateTime

    switch (type) {
      case 'reservation_reminder':
        // 예약 1시간 전 알림
        return reservationStart.addHours(-1)
      
      case 'check_in_reminder':
        // 예약 시작 시간에 알림
        return reservationStart
      
      default:
        return KSTDateTime.now()
    }
  }
}

/**
 * 예약 리마인더 일괄 생성 유스케이스
 * 매일 실행되어 다음날 예약에 대한 리마인더 알림을 생성
 */
export class CreateReservationRemindersUseCase {
  constructor(
    private notificationRepository: NotificationRepository,
    private reservationRepository: ReservationRepository,
    private deviceRepository: DeviceRepository,
    private userRepository: UserRepository
  ) {}

  async execute(): Promise<{ created: number }> {
    // 1. 내일 날짜 계산
    const tomorrow = KSTDateTime.now().addDays(1)
    
    // 2. 내일 예약 조회 (활성 상태만)
    const reservations = await this.reservationRepository.findByDate(tomorrow)
    const activeReservations = reservations.filter(r => r.isActive())

    // 3. 각 예약에 대해 리마인더 알림 생성
    const notifications: Notification[] = []
    
    for (const reservation of activeReservations) {
      try {
        // 이미 리마인더가 생성되었는지 확인
        const existingReminders = await this.notificationRepository.findByUserId(
          reservation.userId,
          {
            type: ['reservation_reminder'],
            dateFrom: tomorrow.startOfDay().toDate(),
            dateTo: tomorrow.endOfDay().toDate()
          }
        )

        const hasReminder = existingReminders.notifications.some(n => 
          n.data?.reservationId === reservation.id
        )

        if (hasReminder) {
          continue
        }

        // 기기 정보 조회
        const device = await this.deviceRepository.findById(reservation.deviceId)
        if (!device) continue

        // 사용자 정보 조회
        const user = await this.userRepository.findById(reservation.userId)
        if (!user) continue

        // 알림 설정 확인
        const preferences = user.notificationPreferences
        if (!preferences.isEnabled('reservation_reminder')) {
          continue
        }

        // 리마인더 알림 생성
        const notification = Notification.createReservationNotification(
          user.id,
          'reservation_reminder',
          {
            reservationId: reservation.id,
            deviceNumber: device.deviceNumber,
            date: reservation.date.dateString,
            timeSlot: `${reservation.timeSlot.startHour}:00 - ${reservation.timeSlot.endHour}:00`
          }
        )

        // 예약 1시간 전으로 발송 시간 설정
        notification.props.scheduledFor = reservation.startDateTime.addHours(-1)
        
        notifications.push(notification)
      } catch (error) {
        console.error(`Failed to create reminder for reservation ${reservation.id}:`, error)
      }
    }

    // 4. 알림 일괄 저장
    if (notifications.length > 0) {
      await this.notificationRepository.saveMany(notifications)
    }

    return {
      created: notifications.length
    }
  }
}