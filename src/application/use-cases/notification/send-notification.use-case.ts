import { Notification, NotificationType, NotificationChannel } from '@/src/domain/entities/notification'
import { NotificationRepository } from '@/src/domain/repositories/notification.repository.interface'
import { UserRepository } from '@/src/domain/repositories/user.repository.interface'
import { NotificationService } from '@/src/domain/services/notification.service.interface'
import { KSTDateTime } from '@/src/domain/value-objects/kst-datetime'

export interface SendNotificationRequest {
  userId: string
  type: NotificationType
  title: string
  body: string
  data?: Record<string, any>
  channels?: NotificationChannel[]
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  scheduledFor?: string // ISO string
}

export interface SendNotificationResponse {
  notification: Notification
  sendResult?: {
    success: boolean
    sentChannels: NotificationChannel[]
    failedChannels: NotificationChannel[]
  }
}

/**
 * 알림 발송 유스케이스
 * 즉시 발송 또는 예약 발송 지원
 */
export class SendNotificationUseCase {
  constructor(
    private notificationRepository: NotificationRepository,
    private userRepository: UserRepository,
    private notificationService: NotificationService
  ) {}

  async execute(request: SendNotificationRequest): Promise<SendNotificationResponse> {
    // 1. 사용자 확인
    const user = await this.userRepository.findById(request.userId)
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다')
    }

    // 2. 사용자 알림 설정 확인
    const preferences = user.notificationPreferences
    const enabledChannels = preferences.getEnabledChannels(request.type)
    
    if (enabledChannels.length === 0) {
      throw new Error('해당 알림 타입이 비활성화되어 있습니다')
    }

    // 3. 발송 채널 결정
    const channels = request.channels 
      ? request.channels.filter(ch => enabledChannels.includes(ch))
      : enabledChannels

    if (channels.length === 0) {
      throw new Error('활성화된 발송 채널이 없습니다')
    }

    // 4. 알림 엔티티 생성
    const notification = Notification.create({
      id: this.generateId(),
      userId: request.userId,
      type: request.type,
      title: request.title,
      body: request.body,
      data: request.data,
      channels,
      priority: request.priority || 'medium',
      scheduledFor: request.scheduledFor 
        ? KSTDateTime.fromString(request.scheduledFor)
        : undefined
    })

    // 5. 알림 저장
    const savedNotification = await this.notificationRepository.save(notification)

    // 6. 즉시 발송인 경우 발송 처리
    let sendResult
    if (!notification.isScheduled()) {
      sendResult = await this.sendNotification(savedNotification, user)
    }

    return {
      notification: savedNotification,
      sendResult
    }
  }

  /**
   * 알림 발송 처리
   */
  private async sendNotification(
    notification: Notification,
    user: any
  ): Promise<any> {
    try {
      // 알림 서비스를 통해 발송
      const result = await this.notificationService.sendNotification(
        notification,
        user.email,
        user.phoneNumber
      )

      // 발송 결과 업데이트
      notification.markAsSent(result.sentChannels, result.failedChannels)
      await this.notificationRepository.update(notification)

      return result
    } catch (error) {
      console.error('Notification send error:', error)
      
      // 발송 실패 처리
      notification.markAsSent([], notification.channels)
      await this.notificationRepository.update(notification)

      throw error
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}