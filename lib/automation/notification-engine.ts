/**
 * 알림 자동화 엔진
 *
 * 기능:
 * - 다채널 알림 전송 (푸시, 이메일, SMS, 카카오톡)
 * - 알림 템플릿 관리
 * - 개인화된 알림
 * - 알림 스케줄링
 * - 알림 이력 추적
 */

import { EventEmitter } from 'events';

type NotificationChannel = 'push' | 'email' | 'sms' | 'kakao' | 'inapp';
type NotificationType =
  | 'reservation_confirmed'
  | 'reservation_reminder'
  | 'reservation_cancelled'
  | 'checkin_reminder'
  | 'maintenance_notice'
  | 'promotion'
  | 'birthday'
  | 'achievement'
  | 'system';

interface NotificationTemplate {
  id: string;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  body: string;
  variables: string[];
  priority: 'high' | 'medium' | 'low';
  ttl?: number;  // Time to live (초)
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

interface NotificationRecipient {
  userId: string;
  channels: {
    push?: string;    // FCM token
    email?: string;
    phone?: string;
    kakao?: string;
  };
  preferences: {
    channels: NotificationChannel[];
    types: NotificationType[];
    quietHours?: {
      start: number;  // 0-23
      end: number;    // 0-23
    };
    frequency: 'all' | 'important' | 'minimal';
  };
  timezone: string;
  language: string;
}

interface NotificationPayload {
  id: string;
  type: NotificationType;
  recipient: NotificationRecipient;
  channels: NotificationChannel[];
  data: Record<string, any>;
  scheduledAt?: Date;
  expiresAt?: Date;
  priority: 'high' | 'medium' | 'low';
  metadata?: Record<string, any>;
}

interface NotificationResult {
  id: string;
  success: boolean;
  channel: NotificationChannel;
  timestamp: Date;
  error?: string;
  deliveryStatus?: 'pending' | 'delivered' | 'failed' | 'opened';
  openedAt?: Date;
}

interface NotificationRule {
  id: string;
  name: string;
  trigger: {
    event?: string;
    schedule?: string;  // Cron expression
    condition?: (data: any) => boolean;
  };
  action: {
    type: NotificationType;
    template: string;
    channels: NotificationChannel[];
    delay?: number;  // 지연 시간 (초)
  };
  enabled: boolean;
}

interface NotificationBatch {
  id: string;
  notifications: NotificationPayload[];
  scheduledAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  results?: NotificationResult[];
}

/**
 * 알림 자동화 엔진
 */
export class NotificationEngine extends EventEmitter {
  private templates: Map<string, NotificationTemplate> = new Map();
  private rules: NotificationRule[] = [];
  private queue: NotificationPayload[] = [];
  private history: NotificationResult[] = [];
  private batches: Map<string, NotificationBatch> = new Map();
  private processing = false;

  constructor() {
    super();
    this.initializeTemplates();
    this.initializeRules();
    this.startProcessor();
  }

  /**
   * 템플릿 초기화
   */
  private initializeTemplates(): void {
    const templates: NotificationTemplate[] = [
      {
        id: 'reservation_confirmed',
        type: 'reservation_confirmed',
        channel: 'push',
        title: '예약이 확정되었습니다',
        body: '{{deviceName}} 예약이 {{date}} {{time}}에 확정되었습니다.',
        variables: ['deviceName', 'date', 'time'],
        priority: 'high',
        ttl: 86400,
        actions: [
          { action: 'view', title: '예약 확인' },
          { action: 'calendar', title: '캘린더 추가' },
        ],
      },
      {
        id: 'reservation_reminder',
        type: 'reservation_reminder',
        channel: 'push',
        title: '예약 알림',
        body: '{{deviceName}} 이용 시간이 {{remainingTime}} 남았습니다.',
        variables: ['deviceName', 'remainingTime'],
        priority: 'high',
        ttl: 3600,
      },
      {
        id: 'checkin_reminder',
        type: 'checkin_reminder',
        channel: 'kakao',
        title: '체크인 안내',
        body: '{{userName}}님, 곧 도착 예정이신가요? 체크인 준비가 완료되었습니다.',
        variables: ['userName'],
        priority: 'medium',
      },
      {
        id: 'promotion',
        type: 'promotion',
        channel: 'email',
        title: '{{promotionTitle}}',
        body: '{{promotionContent}}',
        variables: ['promotionTitle', 'promotionContent'],
        priority: 'low',
      },
      {
        id: 'birthday',
        type: 'birthday',
        channel: 'push',
        title: '🎉 생일 축하드립니다!',
        body: '{{userName}}님의 생일을 축하드립니다! 특별 할인 쿠폰을 확인하세요.',
        variables: ['userName'],
        priority: 'medium',
      },
      {
        id: 'achievement',
        type: 'achievement',
        channel: 'inapp',
        title: '🏆 업적 달성!',
        body: '{{achievementName}} 업적을 달성하셨습니다!',
        variables: ['achievementName'],
        priority: 'low',
      },
    ];

    for (const template of templates) {
      this.templates.set(template.id, template);
    }
  }

  /**
   * 규칙 초기화
   */
  private initializeRules(): void {
    this.rules = [
      {
        id: 'reservation_confirmation',
        name: '예약 확정 알림',
        trigger: { event: 'reservation.created' },
        action: {
          type: 'reservation_confirmed',
          template: 'reservation_confirmed',
          channels: ['push', 'email'],
        },
        enabled: true,
      },
      {
        id: 'reservation_reminder_1h',
        name: '1시간 전 예약 알림',
        trigger: { event: 'reservation.reminder.1h' },
        action: {
          type: 'reservation_reminder',
          template: 'reservation_reminder',
          channels: ['push', 'kakao'],
        },
        enabled: true,
      },
      {
        id: 'daily_promotion',
        name: '일일 프로모션',
        trigger: { schedule: '0 10 * * *' },  // 매일 오전 10시
        action: {
          type: 'promotion',
          template: 'promotion',
          channels: ['email'],
        },
        enabled: true,
      },
      {
        id: 'birthday_greeting',
        name: '생일 축하',
        trigger: { schedule: '0 9 * * *' },  // 매일 오전 9시
        action: {
          type: 'birthday',
          template: 'birthday',
          channels: ['push', 'email'],
        },
        enabled: true,
      },
    ];
  }

  /**
   * 알림 전송
   */
  public async send(
    type: NotificationType,
    recipient: NotificationRecipient,
    data: Record<string, any>,
    options?: Partial<NotificationPayload>
  ): Promise<NotificationResult[]> {
    // 수신자 선호 확인
    if (!this.shouldSendToRecipient(recipient, type)) {
      return [];
    }

    // 알림 페이로드 생성
    const payload: NotificationPayload = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      recipient,
      channels: this.selectChannels(recipient, type),
      data,
      priority: options?.priority || 'medium',
      ...options,
    };

    // 스케줄링 처리
    if (payload.scheduledAt && payload.scheduledAt > new Date()) {
      this.scheduleNotification(payload);
      return [{
        id: payload.id,
        success: true,
        channel: 'push',
        timestamp: new Date(),
        deliveryStatus: 'pending'
      }];
    }

    // 즉시 전송
    return this.sendImmediate(payload);
  }

  /**
   * 즉시 전송
   */
  private async sendImmediate(payload: NotificationPayload): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];

    for (const channel of payload.channels) {
      try {
        const result = await this.sendToChannel(channel, payload);
        results.push(result);
        this.history.push(result);
      } catch (error) {
        results.push({
          id: payload.id,
          success: false,
          channel,
          timestamp: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error',
          deliveryStatus: 'failed',
        });
      }
    }

    this.emit('notification-sent', { payload, results });
    return results;
  }

  /**
   * 채널별 전송
   */
  private async sendToChannel(
    channel: NotificationChannel,
    payload: NotificationPayload
  ): Promise<NotificationResult> {
    const template = this.getTemplate(payload.type, channel);
    if (!template) {
      throw new Error(`No template found for ${payload.type} on ${channel}`);
    }

    const content = this.renderTemplate(template, payload.data);

    switch (channel) {
      case 'push':
        return this.sendPushNotification(payload.recipient, content, payload);
      case 'email':
        return this.sendEmailNotification(payload.recipient, content, payload);
      case 'sms':
        return this.sendSMSNotification(payload.recipient, content, payload);
      case 'kakao':
        return this.sendKakaoNotification(payload.recipient, content, payload);
      case 'inapp':
        return this.sendInAppNotification(payload.recipient, content, payload);
      default:
        throw new Error(`Unsupported channel: ${channel}`);
    }
  }

  /**
   * 푸시 알림 전송
   */
  private async sendPushNotification(
    recipient: NotificationRecipient,
    content: { title: string; body: string; actions?: any[] },
    payload: NotificationPayload
  ): Promise<NotificationResult> {
    // FCM 전송 시뮬레이션
    console.log('Sending push notification:', {
      token: recipient.channels.push,
      ...content,
    });

    return {
      id: payload.id,
      success: true,
      channel: 'push',
      timestamp: new Date(),
      deliveryStatus: 'delivered',
    };
  }

  /**
   * 이메일 알림 전송
   */
  private async sendEmailNotification(
    recipient: NotificationRecipient,
    content: { title: string; body: string },
    payload: NotificationPayload
  ): Promise<NotificationResult> {
    // 이메일 전송 시뮬레이션
    console.log('Sending email:', {
      to: recipient.channels.email,
      subject: content.title,
      body: content.body,
    });

    return {
      id: payload.id,
      success: true,
      channel: 'email',
      timestamp: new Date(),
      deliveryStatus: 'delivered',
    };
  }

  /**
   * SMS 알림 전송
   */
  private async sendSMSNotification(
    recipient: NotificationRecipient,
    content: { title: string; body: string },
    payload: NotificationPayload
  ): Promise<NotificationResult> {
    // SMS 전송 시뮬레이션
    console.log('Sending SMS:', {
      to: recipient.channels.phone,
      message: `${content.title}\n${content.body}`,
    });

    return {
      id: payload.id,
      success: true,
      channel: 'sms',
      timestamp: new Date(),
      deliveryStatus: 'delivered',
    };
  }

  /**
   * 카카오톡 알림 전송
   */
  private async sendKakaoNotification(
    recipient: NotificationRecipient,
    content: { title: string; body: string },
    payload: NotificationPayload
  ): Promise<NotificationResult> {
    // 카카오톡 알림톡 시뮬레이션
    console.log('Sending Kakao notification:', {
      to: recipient.channels.kakao,
      template: content,
    });

    return {
      id: payload.id,
      success: true,
      channel: 'kakao',
      timestamp: new Date(),
      deliveryStatus: 'delivered',
    };
  }

  /**
   * 인앱 알림 전송
   */
  private async sendInAppNotification(
    recipient: NotificationRecipient,
    content: { title: string; body: string },
    payload: NotificationPayload
  ): Promise<NotificationResult> {
    // 인앱 알림 저장
    this.emit('inapp-notification', {
      userId: recipient.userId,
      notification: content,
      payload,
    });

    return {
      id: payload.id,
      success: true,
      channel: 'inapp',
      timestamp: new Date(),
      deliveryStatus: 'delivered',
    };
  }

  /**
   * 배치 알림 전송
   */
  public async sendBatch(
    notifications: Array<{
      type: NotificationType;
      recipient: NotificationRecipient;
      data: Record<string, any>;
    }>
  ): Promise<NotificationBatch> {
    const batch: NotificationBatch = {
      id: `batch_${Date.now()}`,
      notifications: notifications.map(n => ({
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: n.type,
        recipient: n.recipient,
        channels: this.selectChannels(n.recipient, n.type),
        data: n.data,
        priority: 'medium',
      })),
      scheduledAt: new Date(),
      status: 'pending',
    };

    this.batches.set(batch.id, batch);
    this.processBatch(batch);

    return batch;
  }

  /**
   * 배치 처리
   */
  private async processBatch(batch: NotificationBatch): Promise<void> {
    batch.status = 'processing';
    batch.results = [];

    for (const notification of batch.notifications) {
      const results = await this.sendImmediate(notification);
      batch.results.push(...results);

      // Rate limiting
      await this.delay(100);
    }

    batch.status = 'completed';
    this.emit('batch-completed', batch);
  }

  /**
   * 알림 스케줄링
   */
  private scheduleNotification(payload: NotificationPayload): void {
    this.queue.push(payload);
    this.queue.sort((a, b) => {
      const timeA = a.scheduledAt?.getTime() || 0;
      const timeB = b.scheduledAt?.getTime() || 0;
      return timeA - timeB;
    });
  }

  /**
   * 알림 처리기 시작
   */
  private startProcessor(): void {
    setInterval(() => {
      this.processQueue();
      this.processScheduledRules();
    }, 1000);  // 1초마다 체크
  }

  /**
   * 큐 처리
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;

    const now = new Date();
    const due = this.queue.filter(n =>
      !n.scheduledAt || n.scheduledAt <= now
    );

    if (due.length === 0) return;

    this.processing = true;

    for (const notification of due) {
      await this.sendImmediate(notification);
      this.queue = this.queue.filter(n => n.id !== notification.id);
    }

    this.processing = false;
  }

  /**
   * 스케줄된 규칙 처리
   */
  private processScheduledRules(): void {
    for (const rule of this.rules) {
      if (!rule.enabled || !rule.trigger.schedule) continue;

      // Cron 표현식 처리 (간단한 구현)
      if (this.shouldTriggerRule(rule)) {
        this.executeRule(rule);
      }
    }
  }

  /**
   * 규칙 실행
   */
  private async executeRule(rule: NotificationRule): Promise<void> {
    // 규칙에 따라 알림 전송
    this.emit('rule-executed', rule);
  }

  /**
   * 알림 개인화
   */
  public personalizeContent(
    template: NotificationTemplate,
    recipient: NotificationRecipient,
    data: Record<string, any>
  ): { title: string; body: string } {
    let title = template.title;
    let body = template.body;

    // 변수 치환
    for (const variable of template.variables) {
      const value = data[variable] || '';
      title = title.replace(`{{${variable}}}`, value);
      body = body.replace(`{{${variable}}}`, value);
    }

    // 언어별 처리
    if (recipient.language !== 'ko') {
      // 번역 처리
    }

    // 개인화 추가
    if (recipient.userId) {
      body = body.replace('{{userName}}', data.userName || '고객');
    }

    return { title, body };
  }

  /**
   * 알림 이력 조회
   */
  public getHistory(
    filters?: {
      userId?: string;
      channel?: NotificationChannel;
      type?: NotificationType;
      startDate?: Date;
      endDate?: Date;
    }
  ): NotificationResult[] {
    let results = [...this.history];

    if (filters?.userId) {
      // userId로 필터링
    }

    if (filters?.channel) {
      results = results.filter(r => r.channel === filters.channel);
    }

    if (filters?.startDate) {
      results = results.filter(r => r.timestamp >= filters.startDate!);
    }

    if (filters?.endDate) {
      results = results.filter(r => r.timestamp <= filters.endDate!);
    }

    return results;
  }

  /**
   * 알림 통계
   */
  public getStatistics(): {
    total: number;
    byChannel: Record<NotificationChannel, number>;
    byType: Record<NotificationType, number>;
    deliveryRate: number;
    openRate: number;
  } {
    const stats = {
      total: this.history.length,
      byChannel: {} as Record<NotificationChannel, number>,
      byType: {} as Record<NotificationType, number>,
      deliveryRate: 0,
      openRate: 0,
    };

    const delivered = this.history.filter(h => h.deliveryStatus === 'delivered').length;
    const opened = this.history.filter(h => h.deliveryStatus === 'opened').length;

    stats.deliveryRate = this.history.length > 0 ? (delivered / this.history.length) * 100 : 0;
    stats.openRate = delivered > 0 ? (opened / delivered) * 100 : 0;

    return stats;
  }

  // 유틸리티 메서드
  private shouldSendToRecipient(recipient: NotificationRecipient, type: NotificationType): boolean {
    // 수신 동의 확인
    if (!recipient.preferences.types.includes(type)) {
      return false;
    }

    // 방해 금지 시간 확인
    if (recipient.preferences.quietHours) {
      const now = new Date();
      const hour = now.getHours();
      const { start, end } = recipient.preferences.quietHours;

      if (start <= end) {
        if (hour >= start && hour < end) return false;
      } else {
        if (hour >= start || hour < end) return false;
      }
    }

    // 빈도 설정 확인
    if (recipient.preferences.frequency === 'minimal') {
      // 중요한 알림만
      return ['reservation_confirmed', 'reservation_reminder', 'checkin_reminder'].includes(type);
    }

    if (recipient.preferences.frequency === 'important') {
      // 프로모션 제외
      return type !== 'promotion';
    }

    return true;
  }

  private selectChannels(recipient: NotificationRecipient, type: NotificationType): NotificationChannel[] {
    const preferredChannels = recipient.preferences.channels;
    const availableChannels = Object.keys(recipient.channels).filter(ch =>
      recipient.channels[ch as keyof typeof recipient.channels]
    ) as NotificationChannel[];

    return preferredChannels.filter(ch => availableChannels.includes(ch));
  }

  private getTemplate(type: NotificationType, channel: NotificationChannel): NotificationTemplate | null {
    for (const template of this.templates.values()) {
      if (template.type === type && template.channel === channel) {
        return template;
      }
    }
    return null;
  }

  private renderTemplate(template: NotificationTemplate, data: Record<string, any>): {
    title: string;
    body: string;
    actions?: any[]
  } {
    let title = template.title;
    let body = template.body;

    for (const variable of template.variables) {
      const value = data[variable] || '';
      title = title.replace(`{{${variable}}}`, value);
      body = body.replace(`{{${variable}}}`, value);
    }

    return { title, body, actions: template.actions };
  }

  private shouldTriggerRule(rule: NotificationRule): boolean {
    // 간단한 cron 구현 (실제로는 node-cron 등 사용)
    return false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 싱글톤 인스턴스
export const notificationEngine = new NotificationEngine();