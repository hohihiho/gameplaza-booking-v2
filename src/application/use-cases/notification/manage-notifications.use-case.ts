import { Notification, NotificationType } from '@/src/domain/entities/notification'
import { NotificationRepository } from '@/src/domain/repositories/notification.repository.interface'
import { UserRepository } from '@/src/domain/repositories/user.repository.interface'

/**
 * 사용자 알림 목록 조회 유스케이스
 */
export interface GetUserNotificationsRequest {
  userId: string
  type?: NotificationType[]
  read?: boolean
  page?: number
  pageSize?: number
}

export interface GetUserNotificationsResponse {
  notifications: Notification[]
  totalCount: number
  unreadCount: number
  page: number
  pageSize: number
  totalPages: number
}

export class GetUserNotificationsUseCase {
  constructor(
    private notificationRepository: NotificationRepository,
    private userRepository: UserRepository
  ) {}

  async execute(request: GetUserNotificationsRequest): Promise<GetUserNotificationsResponse> {
    // 1. 사용자 확인
    const user = await this.userRepository.findById(request.userId)
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다')
    }

    // 2. 페이징 설정
    const page = request.page || 1
    const pageSize = request.pageSize || 20

    // 3. 알림 목록 조회
    const result = await this.notificationRepository.findByUserId(
      request.userId,
      {
        type: request.type,
        read: request.read,
        page,
        pageSize
      }
    )

    // 4. 읽지 않은 알림 수 조회
    const unreadCount = await this.notificationRepository.countUnread(request.userId)

    // 5. 페이지 정보 계산
    const totalPages = Math.ceil(result.totalCount / pageSize)

    return {
      notifications: result.notifications,
      totalCount: result.totalCount,
      unreadCount,
      page,
      pageSize,
      totalPages
    }
  }
}

/**
 * 알림 읽음 처리 유스케이스
 */
export interface MarkNotificationsAsReadRequest {
  userId: string
  notificationIds?: string[] // 없으면 모든 알림 읽음 처리
}

export interface MarkNotificationsAsReadResponse {
  markedCount: number
}

export class MarkNotificationsAsReadUseCase {
  constructor(
    private notificationRepository: NotificationRepository,
    private userRepository: UserRepository
  ) {}

  async execute(request: MarkNotificationsAsReadRequest): Promise<MarkNotificationsAsReadResponse> {
    // 1. 사용자 확인
    const user = await this.userRepository.findById(request.userId)
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다')
    }

    // 2. 읽음 처리
    if (request.notificationIds && request.notificationIds.length > 0) {
      // 특정 알림들만 읽음 처리
      await this.notificationRepository.markAsRead(request.userId, request.notificationIds)
      return { markedCount: request.notificationIds.length }
    } else {
      // 모든 알림 읽음 처리
      const unreadCount = await this.notificationRepository.countUnread(request.userId)
      await this.notificationRepository.markAllAsRead(request.userId)
      return { markedCount: unreadCount }
    }
  }
}

/**
 * 알림 설정 조회 유스케이스
 */
export interface GetNotificationPreferencesRequest {
  userId: string
}

export interface GetNotificationPreferencesResponse {
  preferences: Array<{
    type: NotificationType
    channels: string[]
    enabled: boolean
  }>
}

export class GetNotificationPreferencesUseCase {
  constructor(
    private userRepository: UserRepository
  ) {}

  async execute(request: GetNotificationPreferencesRequest): Promise<GetNotificationPreferencesResponse> {
    // 1. 사용자 조회
    const user = await this.userRepository.findById(request.userId)
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다')
    }

    // 2. 알림 설정 반환
    const preferences = user.notificationPreferences.toArray()

    return {
      preferences
    }
  }
}

/**
 * 알림 설정 업데이트 유스케이스
 */
export interface UpdateNotificationPreferencesRequest {
  userId: string
  type: NotificationType
  channels?: string[]
  enabled?: boolean
}

export interface UpdateNotificationPreferencesResponse {
  updated: boolean
}

export class UpdateNotificationPreferencesUseCase {
  constructor(
    private userRepository: UserRepository
  ) {}

  async execute(request: UpdateNotificationPreferencesRequest): Promise<UpdateNotificationPreferencesResponse> {
    // 1. 사용자 조회
    const user = await this.userRepository.findById(request.userId)
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다')
    }

    // 2. 알림 설정 업데이트
    const updatedPreferences = user.notificationPreferences.updatePreference(
      request.type,
      {
        channels: request.channels as any,
        enabled: request.enabled
      }
    )

    // 3. 사용자 엔티티 업데이트
    user.updateNotificationPreferences(updatedPreferences)

    // 4. 저장
    await this.userRepository.update(user)

    return {
      updated: true
    }
  }
}

/**
 * 알림 삭제 유스케이스
 */
export interface DeleteNotificationRequest {
  userId: string
  notificationId: string
}

export interface DeleteNotificationResponse {
  deleted: boolean
}

export class DeleteNotificationUseCase {
  constructor(
    private notificationRepository: NotificationRepository,
    private userRepository: UserRepository
  ) {}

  async execute(request: DeleteNotificationRequest): Promise<DeleteNotificationResponse> {
    // 1. 사용자 확인
    const user = await this.userRepository.findById(request.userId)
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다')
    }

    // 2. 알림 조회
    const notification = await this.notificationRepository.findById(request.notificationId)
    if (!notification) {
      throw new Error('알림을 찾을 수 없습니다')
    }

    // 3. 권한 확인
    if (notification.userId !== request.userId) {
      throw new Error('알림을 삭제할 권한이 없습니다')
    }

    // 4. 삭제
    await this.notificationRepository.delete(request.notificationId)

    return {
      deleted: true
    }
  }
}