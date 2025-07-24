import { Notification, NotificationType } from '../entities/notification'
import { KSTDateTime } from '../value-objects/kst-datetime'

export interface NotificationFilterOptions {
  type?: NotificationType[]
  read?: boolean
  sent?: boolean
  dateFrom?: Date
  dateTo?: Date
  page?: number
  pageSize?: number
}

export interface NotificationListResult {
  notifications: Notification[]
  totalCount: number
}

export interface NotificationRepository {
  findById(id: string): Promise<Notification | null>
  findByUserId(userId: string, options?: NotificationFilterOptions): Promise<NotificationListResult>
  findScheduledNotifications(before: KSTDateTime): Promise<Notification[]>
  findUnsentNotifications(): Promise<Notification[]>
  save(notification: Notification): Promise<Notification>
  saveMany(notifications: Notification[]): Promise<Notification[]>
  update(notification: Notification): Promise<Notification>
  delete(id: string): Promise<void>
  markAsRead(userId: string, notificationIds: string[]): Promise<void>
  markAllAsRead(userId: string): Promise<void>
  countUnread(userId: string): Promise<number>
}