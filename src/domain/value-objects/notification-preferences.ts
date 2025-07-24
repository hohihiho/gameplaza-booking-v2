import { NotificationType, NotificationChannel } from '../entities/notification'

/**
 * 사용자 알림 설정
 */
export interface NotificationPreference {
  type: NotificationType
  channels: NotificationChannel[]
  enabled: boolean
}

/**
 * 알림 설정 값 객체
 */
export class NotificationPreferences {
  private preferences: Map<NotificationType, NotificationPreference>

  constructor(preferences: NotificationPreference[]) {
    this.preferences = new Map(
      preferences.map(pref => [pref.type, pref])
    )
  }

  /**
   * 기본 알림 설정 생성
   */
  static createDefault(): NotificationPreferences {
    const defaultPreferences: NotificationPreference[] = [
      {
        type: 'reservation_created',
        channels: ['push', 'email', 'in_app'],
        enabled: true
      },
      {
        type: 'reservation_approved',
        channels: ['push', 'in_app'],
        enabled: true
      },
      {
        type: 'reservation_rejected',
        channels: ['push', 'email', 'in_app'],
        enabled: true
      },
      {
        type: 'reservation_cancelled',
        channels: ['push', 'email', 'in_app'],
        enabled: true
      },
      {
        type: 'reservation_reminder',
        channels: ['push', 'in_app'],
        enabled: true
      },
      {
        type: 'check_in_reminder',
        channels: ['push', 'in_app'],
        enabled: true
      },
      {
        type: 'no_show_warning',
        channels: ['push', 'sms', 'in_app'],
        enabled: true
      },
      {
        type: 'system_announcement',
        channels: ['email', 'in_app'],
        enabled: true
      },
      {
        type: 'maintenance_notice',
        channels: ['email', 'in_app'],
        enabled: true
      }
    ]

    return new NotificationPreferences(defaultPreferences)
  }

  /**
   * 특정 알림 타입의 설정 조회
   */
  getPreference(type: NotificationType): NotificationPreference | undefined {
    return this.preferences.get(type)
  }

  /**
   * 특정 알림 타입이 활성화되어 있는지 확인
   */
  isEnabled(type: NotificationType): boolean {
    const pref = this.preferences.get(type)
    return pref?.enabled ?? false
  }

  /**
   * 특정 알림 타입의 활성 채널 조회
   */
  getEnabledChannels(type: NotificationType): NotificationChannel[] {
    const pref = this.preferences.get(type)
    if (!pref || !pref.enabled) {
      return []
    }
    return pref.channels
  }

  /**
   * 알림 설정 업데이트
   */
  updatePreference(
    type: NotificationType,
    update: Partial<NotificationPreference>
  ): NotificationPreferences {
    const current = this.preferences.get(type)
    if (!current) {
      throw new Error(`Unknown notification type: ${type}`)
    }

    const updated = { ...current, ...update }
    const newPreferences = Array.from(this.preferences.values())
      .map(pref => pref.type === type ? updated : pref)

    return new NotificationPreferences(newPreferences)
  }

  /**
   * 특정 채널 전체 활성화/비활성화
   */
  toggleChannel(channel: NotificationChannel, enabled: boolean): NotificationPreferences {
    const newPreferences = Array.from(this.preferences.values()).map(pref => {
      if (enabled && !pref.channels.includes(channel)) {
        return {
          ...pref,
          channels: [...pref.channels, channel]
        }
      } else if (!enabled && pref.channels.includes(channel)) {
        return {
          ...pref,
          channels: pref.channels.filter(ch => ch !== channel)
        }
      }
      return pref
    })

    return new NotificationPreferences(newPreferences)
  }

  /**
   * 모든 알림 활성화/비활성화
   */
  toggleAll(enabled: boolean): NotificationPreferences {
    const newPreferences = Array.from(this.preferences.values()).map(pref => ({
      ...pref,
      enabled
    }))

    return new NotificationPreferences(newPreferences)
  }

  /**
   * 설정을 배열로 변환
   */
  toArray(): NotificationPreference[] {
    return Array.from(this.preferences.values())
  }

  /**
   * 설정을 JSON으로 변환
   */
  toJSON(): Record<NotificationType, NotificationPreference> {
    const result: Record<string, NotificationPreference> = {}
    this.preferences.forEach((pref, type) => {
      result[type] = pref
    })
    return result as Record<NotificationType, NotificationPreference>
  }
}