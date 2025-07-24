import { Notification, NotificationChannel } from '../entities/notification'

export interface NotificationSendResult {
  success: boolean
  sentChannels: NotificationChannel[]
  failedChannels: NotificationChannel[]
  errors?: Record<NotificationChannel, string>
}

export interface PushNotificationPayload {
  title: string
  body: string
  data?: Record<string, any>
  badge?: number
  sound?: string
  icon?: string
  image?: string
  clickAction?: string
}

export interface EmailNotificationPayload {
  to: string
  subject: string
  html: string
  text?: string
  attachments?: Array<{
    filename: string
    content: Buffer | string
  }>
}

export interface SmsNotificationPayload {
  to: string
  message: string
}

/**
 * 알림 발송 서비스 인터페이스
 * 실제 알림 발송을 담당하는 외부 서비스와의 통신을 추상화
 */
export interface NotificationService {
  /**
   * 푸시 알림 발송
   */
  sendPushNotification(
    userId: string,
    payload: PushNotificationPayload
  ): Promise<boolean>

  /**
   * 이메일 발송
   */
  sendEmail(payload: EmailNotificationPayload): Promise<boolean>

  /**
   * SMS 발송
   */
  sendSms(payload: SmsNotificationPayload): Promise<boolean>

  /**
   * 인앱 알림 발송 (실시간 알림)
   */
  sendInAppNotification(
    userId: string,
    notification: Notification
  ): Promise<boolean>

  /**
   * 여러 채널로 알림 발송
   */
  sendNotification(
    notification: Notification,
    userEmail?: string,
    userPhone?: string
  ): Promise<NotificationSendResult>

  /**
   * 푸시 토큰 등록
   */
  registerPushToken(userId: string, token: string, platform: 'ios' | 'android' | 'web'): Promise<void>

  /**
   * 푸시 토큰 제거
   */
  unregisterPushToken(userId: string, token: string): Promise<void>

  /**
   * 사용자의 모든 푸시 토큰 조회
   */
  getUserPushTokens(userId: string): Promise<Array<{
    token: string
    platform: 'ios' | 'android' | 'web'
    createdAt: Date
  }>>
}