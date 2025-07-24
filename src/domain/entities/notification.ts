import { Entity } from './entity'
import { KSTDateTime } from '../value-objects/kst-datetime'

export type NotificationType = 
  | 'reservation_created'      // 예약 생성됨
  | 'reservation_approved'     // 예약 승인됨
  | 'reservation_rejected'     // 예약 거절됨
  | 'reservation_cancelled'    // 예약 취소됨
  | 'reservation_reminder'     // 예약 리마인더
  | 'check_in_reminder'        // 체크인 리마인더
  | 'no_show_warning'          // 노쇼 경고
  | 'system_announcement'      // 시스템 공지
  | 'maintenance_notice'       // 점검 안내

export type NotificationChannel = 'push' | 'email' | 'sms' | 'in_app'

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface NotificationData {
  reservationId?: string
  deviceId?: string
  deviceNumber?: string
  date?: string
  timeSlot?: string
  message?: string
  [key: string]: any
}

export interface NotificationProps {
  id: string
  userId: string
  type: NotificationType
  title: string
  body: string
  data?: NotificationData
  channels: NotificationChannel[]
  priority: NotificationPriority
  scheduledFor?: KSTDateTime
  sentAt?: KSTDateTime
  readAt?: KSTDateTime
  failedChannels?: NotificationChannel[]
  createdAt: KSTDateTime
  updatedAt: KSTDateTime
}

/**
 * 알림 엔티티
 */
export class Notification extends Entity<NotificationProps> {
  get userId(): string {
    return this.props.userId
  }

  get type(): NotificationType {
    return this.props.type
  }

  get title(): string {
    return this.props.title
  }

  get body(): string {
    return this.props.body
  }

  get data(): NotificationData | undefined {
    return this.props.data
  }

  get channels(): NotificationChannel[] {
    return this.props.channels
  }

  get priority(): NotificationPriority {
    return this.props.priority
  }

  get scheduledFor(): KSTDateTime | undefined {
    return this.props.scheduledFor
  }

  get sentAt(): KSTDateTime | undefined {
    return this.props.sentAt
  }

  get readAt(): KSTDateTime | undefined {
    return this.props.readAt
  }

  get failedChannels(): NotificationChannel[] | undefined {
    return this.props.failedChannels
  }

  get createdAt(): KSTDateTime {
    return this.props.createdAt
  }

  get updatedAt(): KSTDateTime {
    return this.props.updatedAt
  }

  /**
   * 알림 생성
   */
  static create(props: Omit<NotificationProps, 'createdAt' | 'updatedAt'>): Notification {
    const now = KSTDateTime.now()
    
    return new Notification({
      ...props,
      createdAt: now,
      updatedAt: now
    })
  }

  /**
   * 예약 알림 생성 헬퍼
   */
  static createReservationNotification(
    userId: string,
    type: NotificationType,
    reservationData: {
      reservationId: string
      deviceNumber: string
      date: string
      timeSlot: string
    }
  ): Notification {
    const templates = {
      reservation_created: {
        title: '예약이 완료되었습니다',
        body: `${reservationData.deviceNumber}번 기기 ${reservationData.date} ${reservationData.timeSlot} 예약이 완료되었습니다.`
      },
      reservation_approved: {
        title: '예약이 승인되었습니다',
        body: `${reservationData.deviceNumber}번 기기 ${reservationData.date} ${reservationData.timeSlot} 예약이 승인되었습니다.`
      },
      reservation_rejected: {
        title: '예약이 거절되었습니다',
        body: `${reservationData.deviceNumber}번 기기 ${reservationData.date} ${reservationData.timeSlot} 예약이 거절되었습니다.`
      },
      reservation_cancelled: {
        title: '예약이 취소되었습니다',
        body: `${reservationData.deviceNumber}번 기기 ${reservationData.date} ${reservationData.timeSlot} 예약이 취소되었습니다.`
      },
      reservation_reminder: {
        title: '예약 알림',
        body: `${reservationData.deviceNumber}번 기기 ${reservationData.date} ${reservationData.timeSlot} 예약 시간이 다가왔습니다.`
      },
      check_in_reminder: {
        title: '체크인 알림',
        body: `${reservationData.deviceNumber}번 기기 예약 체크인 시간입니다. 10분 내에 체크인해주세요.`
      },
      no_show_warning: {
        title: '노쇼 경고',
        body: `체크인하지 않으면 노쇼 처리됩니다. 지금 바로 체크인해주세요.`
      }
    }

    const template = templates[type as keyof typeof templates]
    if (!template) {
      throw new Error(`Unknown notification type: ${type}`)
    }

    return Notification.create({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type,
      title: template.title,
      body: template.body,
      data: reservationData,
      channels: ['push', 'in_app'],
      priority: type === 'no_show_warning' ? 'urgent' : 'medium'
    })
  }

  /**
   * 알림 발송 처리
   */
  markAsSent(sentChannels: NotificationChannel[], failedChannels?: NotificationChannel[]): void {
    this.props.sentAt = KSTDateTime.now()
    this.props.failedChannels = failedChannels
    this.props.updatedAt = KSTDateTime.now()
  }

  /**
   * 알림 읽음 처리
   */
  markAsRead(): void {
    if (this.isRead()) {
      return
    }
    
    this.props.readAt = KSTDateTime.now()
    this.props.updatedAt = KSTDateTime.now()
  }

  /**
   * 알림이 발송되었는지 확인
   */
  isSent(): boolean {
    return !!this.props.sentAt
  }

  /**
   * 알림이 읽혔는지 확인
   */
  isRead(): boolean {
    return !!this.props.readAt
  }

  /**
   * 알림이 예약되었는지 확인
   */
  isScheduled(): boolean {
    return !!this.props.scheduledFor && !this.isSent()
  }

  /**
   * 알림 발송 시간이 되었는지 확인
   */
  isReadyToSend(): boolean {
    if (!this.isScheduled() || this.isSent()) {
      return false
    }

    const now = KSTDateTime.now()
    return !this.props.scheduledFor!.isAfter(now)
  }

  /**
   * 알림 발송이 실패했는지 확인
   */
  hasFailedChannels(): boolean {
    return !!this.props.failedChannels && this.props.failedChannels.length > 0
  }

  /**
   * 특정 채널로 발송이 필요한지 확인
   */
  shouldSendToChannel(channel: NotificationChannel): boolean {
    return this.props.channels.includes(channel)
  }
}