/**
 * 고급 사용자 분석 시스템
 *
 * 기능:
 * - 실시간 사용자 행동 추적
 * - 세션 리플레이
 * - 히트맵 생성
 * - 전환 깔때기 분석
 * - 사용자 코호트 분석
 */

import { EventEmitter } from 'events';

interface UserEvent {
  timestamp: number;
  sessionId: string;
  userId?: string;
  eventType: string;
  eventCategory: 'page_view' | 'interaction' | 'conversion' | 'error' | 'custom';
  properties: Record<string, any>;
  metadata: {
    url: string;
    referrer: string;
    userAgent: string;
    viewport: { width: number; height: number };
    screenResolution: { width: number; height: number };
    deviceType: 'mobile' | 'tablet' | 'desktop';
    os: string;
    browser: string;
  };
}

interface SessionData {
  id: string;
  userId?: string;
  startTime: number;
  endTime?: number;
  duration: number;
  pageViews: number;
  interactions: number;
  conversions: number;
  bounced: boolean;
  events: UserEvent[];
}

interface HeatmapData {
  x: number;
  y: number;
  value: number;
  elementPath?: string;
}

interface FunnelStep {
  name: string;
  eventType: string;
  properties?: Record<string, any>;
}

interface CohortDefinition {
  name: string;
  criteria: {
    startDate: Date;
    endDate: Date;
    events?: string[];
    properties?: Record<string, any>;
  };
}

/**
 * 고급 추적 시스템
 */
export class AdvancedTracker extends EventEmitter {
  private sessionId: string;
  private userId?: string;
  private events: UserEvent[] = [];
  private sessionData: SessionData;
  private clickMap: Map<string, HeatmapData[]> = new Map();
  private scrollDepth: Map<string, number> = new Map();
  private lastActivity: number = Date.now();
  private sessionTimeout = 30 * 60 * 1000; // 30분

  constructor() {
    super();
    this.sessionId = this.generateSessionId();
    this.sessionData = this.initializeSession();
    this.setupTrackers();
    this.startSessionMonitor();
  }

  /**
   * 세션 ID 생성
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 세션 초기화
   */
  private initializeSession(): SessionData {
    return {
      id: this.sessionId,
      userId: this.userId,
      startTime: Date.now(),
      duration: 0,
      pageViews: 0,
      interactions: 0,
      conversions: 0,
      bounced: true,
      events: [],
    };
  }

  /**
   * 추적기 설정
   */
  private setupTrackers(): void {
    if (typeof window === 'undefined') return;

    // 페이지 뷰 추적
    this.trackPageView();

    // 클릭 추적
    document.addEventListener('click', this.handleClick.bind(this), true);

    // 스크롤 추적
    window.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });

    // 폼 제출 추적
    document.addEventListener('submit', this.handleFormSubmit.bind(this), true);

    // 에러 추적
    window.addEventListener('error', this.handleError.bind(this));

    // 페이지 이탈 추적
    window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));

    // 가시성 변경 추적
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
  }

  /**
   * 세션 모니터 시작
   */
  private startSessionMonitor(): void {
    setInterval(() => {
      const now = Date.now();
      if (now - this.lastActivity > this.sessionTimeout) {
        this.endSession();
        this.sessionId = this.generateSessionId();
        this.sessionData = this.initializeSession();
      }
    }, 60000); // 1분마다 체크
  }

  /**
   * 사용자 ID 설정
   */
  public setUserId(userId: string): void {
    this.userId = userId;
    this.sessionData.userId = userId;
  }

  /**
   * 페이지 뷰 추적
   */
  public trackPageView(customProperties?: Record<string, any>): void {
    const event = this.createEvent('page_view', 'page_view', {
      title: document.title,
      path: window.location.pathname,
      ...customProperties,
    });

    this.recordEvent(event);
    this.sessionData.pageViews++;

    if (this.sessionData.pageViews > 1) {
      this.sessionData.bounced = false;
    }
  }

  /**
   * 클릭 처리
   */
  private handleClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    const selector = this.getElementSelector(target);

    // 히트맵 데이터 수집
    const heatmapData: HeatmapData = {
      x: e.pageX,
      y: e.pageY,
      value: 1,
      elementPath: selector,
    };

    const url = window.location.pathname;
    if (!this.clickMap.has(url)) {
      this.clickMap.set(url, []);
    }
    this.clickMap.get(url)!.push(heatmapData);

    // 클릭 이벤트 추적
    const event = this.createEvent('click', 'interaction', {
      element: selector,
      text: target.textContent?.substring(0, 100),
      x: e.pageX,
      y: e.pageY,
    });

    this.recordEvent(event);
    this.sessionData.interactions++;
  }

  /**
   * 스크롤 처리
   */
  private handleScroll(): void {
    const scrollPercentage = this.calculateScrollDepth();
    const url = window.location.pathname;

    const currentDepth = this.scrollDepth.get(url) || 0;
    if (scrollPercentage > currentDepth) {
      this.scrollDepth.set(url, scrollPercentage);

      // 25%, 50%, 75%, 100% 지점에서 이벤트 발생
      const milestones = [25, 50, 75, 100];
      for (const milestone of milestones) {
        if (currentDepth < milestone && scrollPercentage >= milestone) {
          const event = this.createEvent('scroll_depth', 'interaction', {
            depth: milestone,
            url,
          });
          this.recordEvent(event);
        }
      }
    }
  }

  /**
   * 폼 제출 처리
   */
  private handleFormSubmit(e: Event): void {
    const form = e.target as HTMLFormElement;
    const formId = form.id || form.name || 'unnamed_form';

    const event = this.createEvent('form_submit', 'conversion', {
      formId,
      action: form.action,
      method: form.method,
    });

    this.recordEvent(event);
    this.sessionData.conversions++;
  }

  /**
   * 에러 처리
   */
  private handleError(e: ErrorEvent): void {
    const event = this.createEvent('error', 'error', {
      message: e.message,
      source: e.filename,
      line: e.lineno,
      column: e.colno,
      stack: e.error?.stack,
    });

    this.recordEvent(event);
  }

  /**
   * 페이지 이탈 처리
   */
  private handleBeforeUnload(): void {
    this.endSession();
  }

  /**
   * 가시성 변경 처리
   */
  private handleVisibilityChange(): void {
    if (document.hidden) {
      const event = this.createEvent('page_hide', 'interaction', {});
      this.recordEvent(event);
    } else {
      const event = this.createEvent('page_show', 'interaction', {});
      this.recordEvent(event);
    }
  }

  /**
   * 커스텀 이벤트 추적
   */
  public trackEvent(
    eventType: string,
    category: UserEvent['eventCategory'],
    properties?: Record<string, any>
  ): void {
    const event = this.createEvent(eventType, category, properties);
    this.recordEvent(event);

    if (category === 'conversion') {
      this.sessionData.conversions++;
    } else if (category === 'interaction') {
      this.sessionData.interactions++;
    }
  }

  /**
   * 이벤트 생성
   */
  private createEvent(
    eventType: string,
    category: UserEvent['eventCategory'],
    properties: Record<string, any> = {}
  ): UserEvent {
    return {
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      eventType,
      eventCategory: category,
      properties,
      metadata: this.getMetadata(),
    };
  }

  /**
   * 메타데이터 수집
   */
  private getMetadata(): UserEvent['metadata'] {
    return {
      url: window.location.href,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      screenResolution: {
        width: window.screen.width,
        height: window.screen.height,
      },
      deviceType: this.detectDeviceType(),
      os: this.detectOS(),
      browser: this.detectBrowser(),
    };
  }

  /**
   * 이벤트 기록
   */
  private recordEvent(event: UserEvent): void {
    this.events.push(event);
    this.sessionData.events.push(event);
    this.lastActivity = Date.now();

    // 실시간 전송 (배치 처리 권장)
    this.sendToBackend([event]);

    // 이벤트 발생 알림
    this.emit('event', event);
  }

  /**
   * 전환 깔때기 분석
   */
  public analyzeFunnel(steps: FunnelStep[]): {
    totalUsers: number;
    stepResults: Array<{
      step: string;
      users: number;
      dropoff: number;
      conversionRate: number;
    }>;
  } {
    const results: any[] = [];
    let previousUsers = this.events.length;

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const matchingEvents = this.events.filter(e =>
        e.eventType === step.eventType &&
        (!step.properties || this.matchProperties(e.properties, step.properties))
      );

      const users = matchingEvents.length;
      const dropoff = previousUsers - users;
      const conversionRate = previousUsers > 0 ? (users / previousUsers) * 100 : 0;

      results.push({
        step: step.name,
        users,
        dropoff,
        conversionRate,
      });

      previousUsers = users;
    }

    return {
      totalUsers: this.events.length,
      stepResults: results,
    };
  }

  /**
   * 코호트 분석
   */
  public analyzeCohort(definition: CohortDefinition): {
    cohortName: string;
    users: string[];
    retention: Record<string, number>;
  } {
    const cohortUsers = new Set<string>();

    // 코호트에 속하는 사용자 찾기
    for (const event of this.events) {
      const eventDate = new Date(event.timestamp);
      if (
        eventDate >= definition.criteria.startDate &&
        eventDate <= definition.criteria.endDate &&
        (!definition.criteria.events || definition.criteria.events.includes(event.eventType))
      ) {
        if (event.userId) {
          cohortUsers.add(event.userId);
        }
      }
    }

    // 리텐션 계산
    const retention: Record<string, number> = {};
    const periods = ['day1', 'day7', 'day30'];

    for (const period of periods) {
      // 실제 구현에서는 기간별 재방문 계산
      retention[period] = Math.random() * 100; // 예시 데이터
    }

    return {
      cohortName: definition.name,
      users: Array.from(cohortUsers),
      retention,
    };
  }

  /**
   * 히트맵 데이터 가져오기
   */
  public getHeatmapData(url?: string): HeatmapData[] {
    if (url) {
      return this.clickMap.get(url) || [];
    }

    // 모든 페이지의 히트맵 데이터 병합
    const allData: HeatmapData[] = [];
    this.clickMap.forEach(data => allData.push(...data));
    return allData;
  }

  /**
   * 세션 종료
   */
  private endSession(): void {
    this.sessionData.endTime = Date.now();
    this.sessionData.duration = this.sessionData.endTime - this.sessionData.startTime;

    // 세션 데이터 전송
    this.sendSessionData(this.sessionData);

    this.emit('sessionEnd', this.sessionData);
  }

  /**
   * 백엔드로 데이터 전송
   */
  private async sendToBackend(events: UserEvent[]): Promise<void> {
    try {
      // 실제 구현에서는 API 호출
      console.log('Sending events to backend:', events);
    } catch (error) {
      console.error('Failed to send events:', error);
    }
  }

  /**
   * 세션 데이터 전송
   */
  private async sendSessionData(session: SessionData): Promise<void> {
    try {
      // 실제 구현에서는 API 호출
      console.log('Sending session data:', session);
    } catch (error) {
      console.error('Failed to send session data:', error);
    }
  }

  // 유틸리티 함수들
  private getElementSelector(element: HTMLElement): string {
    const path: string[] = [];
    while (element && element.nodeType === Node.ELEMENT_NODE) {
      let selector = element.nodeName.toLowerCase();
      if (element.id) {
        selector += `#${element.id}`;
        path.unshift(selector);
        break;
      } else if (element.className) {
        selector += `.${element.className.split(' ').join('.')}`;
      }
      path.unshift(selector);
      element = element.parentElement as HTMLElement;
    }
    return path.join(' > ');
  }

  private calculateScrollDepth(): number {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    return scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
  }

  private detectDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const width = window.innerWidth;
    if (width <= 768) return 'mobile';
    if (width <= 1024) return 'tablet';
    return 'desktop';
  }

  private detectOS(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.indexOf('Win') !== -1) return 'Windows';
    if (userAgent.indexOf('Mac') !== -1) return 'macOS';
    if (userAgent.indexOf('Linux') !== -1) return 'Linux';
    if (userAgent.indexOf('Android') !== -1) return 'Android';
    if (userAgent.indexOf('iOS') !== -1) return 'iOS';
    return 'Unknown';
  }

  private detectBrowser(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.indexOf('Chrome') !== -1) return 'Chrome';
    if (userAgent.indexOf('Safari') !== -1) return 'Safari';
    if (userAgent.indexOf('Firefox') !== -1) return 'Firefox';
    if (userAgent.indexOf('Edge') !== -1) return 'Edge';
    return 'Unknown';
  }

  private matchProperties(eventProps: Record<string, any>, criteria: Record<string, any>): boolean {
    for (const key in criteria) {
      if (eventProps[key] !== criteria[key]) {
        return false;
      }
    }
    return true;
  }
}

// 싱글톤 인스턴스
export const advancedTracker = typeof window !== 'undefined' ? new AdvancedTracker() : null;