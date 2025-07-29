import { Notification, NotificationChannel, NotificationPriority, NotificationType } from '@/src/domain/entities/notification'
import { NotificationRepository, NotificationFilterOptions, NotificationListResult } from '@/src/domain/repositories/notification.repository.interface'
import { SupabaseClient } from '@supabase/supabase-js'
import { KSTDateTime } from '@/src/domain/value-objects/kst-datetime'

/**
 * Notification Supabase Repository 구현
 */
export class NotificationSupabaseRepository implements NotificationRepository {
  constructor(
    private readonly supabase: SupabaseClient<any, 'public', any>
  ) {}

  async findById(id: string): Promise<Notification | null> {
    const { data, error } = await this.supabase
      .from('notifications')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return null
    }

    return this.toDomainEntity(data)
  }

  async findByUserId(userId: string, options?: NotificationFilterOptions): Promise<NotificationListResult> {
    let query = this.supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)

    // 필터 적용
    if (options?.type) {
      query = query.in('type', options.type)
    }

    if (options?.read !== undefined) {
      if (options.read) {
        query = query.not('read_at', 'is', null)
      } else {
        query = query.is('read_at', null)
      }
    }

    if (options?.sent !== undefined) {
      if (options.sent) {
        query = query.not('sent_at', 'is', null)
      } else {
        query = query.is('sent_at', null)
      }
    }

    if (options?.dateFrom) {
      query = query.gte('created_at', options.dateFrom.toISOString())
    }

    if (options?.dateTo) {
      query = query.lte('created_at', options.dateTo.toISOString())
    }

    // 정렬
    query = query.order('created_at', { ascending: false })

    // 페이지네이션
    const page = options?.page || 1
    const pageSize = options?.pageSize || 20
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      throw error
    }

    const notifications = (data || []).map(item => this.toDomainEntity(item))

    return {
      notifications,
      totalCount: count || 0
    }
  }

  async findScheduledNotifications(before: KSTDateTime): Promise<Notification[]> {
    const { data, error } = await this.supabase
      .from('notifications')
      .select('*')
      .not('scheduled_for', 'is', null)
      .is('sent_at', null)
      .lte('scheduled_for', before.toISOString())
      .order('scheduled_for', { ascending: true })

    if (error) {
      throw error
    }

    return (data || []).map(item => this.toDomainEntity(item))
  }

  async findUnsentNotifications(): Promise<Notification[]> {
    const { data, error } = await this.supabase
      .from('notifications')
      .select('*')
      .is('sent_at', null)
      .or('scheduled_for.is.null,scheduled_for.lte.' + new Date().toISOString())
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(100) // 배치 처리를 위한 제한

    if (error) {
      throw error
    }

    return (data || []).map(item => this.toDomainEntity(item))
  }

  async save(notification: Notification): Promise<Notification> {
    const dto = this.toDTO(notification)
    
    const { data, error } = await this.supabase
      .from('notifications')
      .insert(dto)
      .select()
      .single()

    if (error) {
      throw error
    }

    return this.toDomainEntity(data)
  }

  async saveMany(notifications: Notification[]): Promise<Notification[]> {
    const dtos = notifications.map(n => this.toDTO(n))
    
    const { data, error } = await this.supabase
      .from('notifications')
      .insert(dtos)
      .select()

    if (error) {
      throw error
    }

    return (data || []).map(item => this.toDomainEntity(item))
  }

  async update(notification: Notification): Promise<Notification> {
    const dto = this.toDTO(notification)
    const { id, ...updateData } = dto
    
    const { data, error } = await this.supabase
      .from('notifications')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return this.toDomainEntity(data)
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('notifications')
      .delete()
      .eq('id', id)

    if (error) {
      throw error
    }
  }

  async markAsRead(userId: string, notificationIds: string[]): Promise<void> {
    const { error } = await this.supabase
      .from('notifications')
      .update({ 
        read_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .in('id', notificationIds)

    if (error) {
      throw error
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('notifications')
      .update({ 
        read_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .is('read_at', null)

    if (error) {
      throw error
    }
  }

  async countUnread(userId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('read_at', null)

    if (error) {
      throw error
    }

    return count || 0
  }

  /**
   * DB 데이터를 도메인 엔티티로 변환
   */
  private toDomainEntity(data: any): Notification {
    return new Notification({
      id: data.id,
      userId: data.user_id,
      type: data.type as NotificationType,
      title: data.title,
      body: data.body,
      data: data.data,
      channels: data.channels as NotificationChannel[],
      priority: data.priority as NotificationPriority,
      scheduledFor: data.scheduled_for ? KSTDateTime.create(new Date(data.scheduled_for)) : undefined,
      sentAt: data.sent_at ? KSTDateTime.create(new Date(data.sent_at)) : undefined,
      readAt: data.read_at ? KSTDateTime.create(new Date(data.read_at)) : undefined,
      failedChannels: data.failed_channels as NotificationChannel[] | undefined,
      createdAt: KSTDateTime.create(new Date(data.created_at)),
      updatedAt: KSTDateTime.create(new Date(data.updated_at))
    })
  }

  /**
   * 도메인 엔티티를 DB DTO로 변환
   */
  private toDTO(notification: Notification): any {
    return {
      id: notification.id,
      user_id: notification.userId,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      data: notification.data,
      channels: notification.channels,
      priority: notification.priority,
      scheduled_for: notification.scheduledFor?.toISOString(),
      sent_at: notification.sentAt?.toISOString(),
      read_at: notification.readAt?.toISOString(),
      failed_channels: notification.failedChannels,
      created_at: notification.createdAt.toISOString(),
      updated_at: notification.updatedAt.toISOString()
    }
  }
}