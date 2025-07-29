/**
 * 알림 서비스
 * 다양한 알림 채널을 통해 사용자에게 알림을 전송하는 서비스
 */

import { NotificationChannel } from '@/src/domain/value-objects/notification-channel'

export interface NotificationData {
  id: string
  userId: string
  title: string
  message: string
  type: 'info' | 'warning' | 'error' | 'success'
  channel: NotificationChannel
  metadata?: Record<string, any>
  createdAt: Date
}

export interface SendNotificationRequest {
  userId: string
  title: string
  message: string
  type: 'info' | 'warning' | 'error' | 'success'
  channels: NotificationChannel[]
  metadata?: Record<string, any>
}

/**
 * 알림 서비스 클래스
 */
export class NotificationService {
  constructor() {
    // 생성자에서 필요한 의존성 주입
  }

  /**
   * 알림 전송
   */
  async sendNotification(request: SendNotificationRequest): Promise<NotificationData[]> {
    const notifications: NotificationData[] = []

    for (const channel of request.channels) {
      const notification: NotificationData = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: request.userId,
        title: request.title,
        message: request.message,
        type: request.type,
        channel,
        metadata: request.metadata,
        createdAt: new Date()
      }

      try {
        await this.sendToChannel(notification)
        notifications.push(notification)
      } catch (error) {
        console.error(`Failed to send notification via ${channel}:`, error)
        // 에러가 발생해도 다른 채널로는 계속 전송 시도
      }
    }

    return notifications
  }

  /**
   * 예약 관련 알림 전송
   */
  async sendReservationNotification(
    userId: string,
    reservationId: string,
    type: 'created' | 'approved' | 'rejected' | 'cancelled' | 'reminder',
    additionalData?: Record<string, any>
  ): Promise<NotificationData[]> {
    const titleMap = {
      created: '예약이 생성되었습니다',
      approved: '예약이 승인되었습니다',
      rejected: '예약이 거절되었습니다',
      cancelled: '예약이 취소되었습니다',
      reminder: '예약 시간이 다가왔습니다'
    }

    const messageMap = {
      created: `예약 ${reservationId}이 생성되었습니다. 승인을 기다려주세요.`,
      approved: `예약 ${reservationId}이 승인되었습니다. 시간에 맞춰 방문해주세요.`,
      rejected: `예약 ${reservationId}이 거절되었습니다. 다른 시간대를 선택해주세요.`,
      cancelled: `예약 ${reservationId}이 취소되었습니다.`,
      reminder: `예약 ${reservationId}의 시간이 30분 후입니다. 준비해주세요.`
    }

    return this.sendNotification({
      userId,
      title: titleMap[type],
      message: messageMap[type],
      type: type === 'rejected' ? 'error' : type === 'reminder' ? 'warning' : 'info',
      channels: ['push', 'email'], // 기본 채널
      metadata: {
        reservationId,
        notificationType: 'reservation',
        ...additionalData
      }
    })
  }

  /**
   * 시스템 알림 전송
   */
  async sendSystemNotification(
    userId: string,
    title: string,
    message: string,
    type: 'info' | 'warning' | 'error' | 'success' = 'info'
  ): Promise<NotificationData[]> {
    return this.sendNotification({
      userId,
      title,
      message,
      type,
      channels: ['push'],
      metadata: {
        notificationType: 'system'
      }
    })
  }

  /**
   * 특정 채널로 알림 전송
   */
  private async sendToChannel(notification: NotificationData): Promise<void> {
    switch (notification.channel) {
      case 'push':
        await this.sendPushNotification(notification)
        break
      case 'email':
        await this.sendEmailNotification(notification)
        break
      case 'sms':
        await this.sendSMSNotification(notification)
        break
      case 'in_app':
        await this.sendInAppNotification(notification)
        break
      default:
        throw new Error(`Unsupported notification channel: ${notification.channel}`)
    }
  }

  /**
   * 푸시 알림 전송
   */
  private async sendPushNotification(notification: NotificationData): Promise<void> {
    // TODO: 실제 푸시 알림 서비스 (FCM, APNs 등) 연동
    console.log('Push notification sent:', notification)
  }

  /**
   * 이메일 알림 전송
   */
  private async sendEmailNotification(notification: NotificationData): Promise<void> {
    // TODO: 실제 이메일 서비스 (SendGrid, SES 등) 연동
    console.log('Email notification sent:', notification)
  }

  /**
   * SMS 알림 전송
   */
  private async sendSMSNotification(notification: NotificationData): Promise<void> {
    // TODO: 실제 SMS 서비스 연동
    console.log('SMS notification sent:', notification)
  }

  /**
   * 인앱 알림 전송
   */
  private async sendInAppNotification(notification: NotificationData): Promise<void> {
    // TODO: 인앱 알림 저장 및 실시간 전송
    console.log('In-app notification sent:', notification)
  }
}

// 싱글톤 인스턴스 생성
export const notificationService = new NotificationService()