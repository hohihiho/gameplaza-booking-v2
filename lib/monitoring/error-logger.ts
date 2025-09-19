/**
 * 에러 추적 시스템
 * 런타임 에러를 캡처하고 분류하여 모니터링
 */

export interface ErrorInfo {
  message: string;
  stack?: string;
  timestamp: number;
  url: string;
  userAgent: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
}

export enum ErrorCategory {
  NETWORK = 'network',
  JAVASCRIPT = 'javascript',
  API = 'api',
  AUTH = 'auth',
  DATABASE = 'database',
  VALIDATION = 'validation',
  BUSINESS_LOGIC = 'business_logic',
  UNKNOWN = 'unknown'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export class ErrorLogger {
  private static instance: ErrorLogger;
  private errorQueue: ErrorInfo[] = [];
  private maxQueueSize = 50;
  private flushInterval = 30000; // 30초
  private flushTimer: NodeJS.Timeout | null = null;
  private isInitialized = false;
  private sessionId: string;
  private userId?: string;

  private constructor() {
    this.sessionId = this.generateSessionId();
  }

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  /**
   * 에러 로거 초기화
   */
  initialize(options?: {
    maxQueueSize?: number;
    flushInterval?: number;
    userId?: string;
  }) {
    if (this.isInitialized) return;

    if (options?.maxQueueSize) this.maxQueueSize = options.maxQueueSize;
    if (options?.flushInterval) this.flushInterval = options.flushInterval;
    if (options?.userId) this.userId = options.userId;

    // 전역 에러 핸들러 설정
    if (typeof window !== 'undefined') {
      this.setupBrowserErrorHandlers();
    } else {
      this.setupNodeErrorHandlers();
    }

    // 주기적 플러시 설정
    this.startAutoFlush();
    this.isInitialized = true;

    console.log('[ErrorLogger] 초기화 완료');
  }

  /**
   * 브라우저 에러 핸들러 설정
   */
  private setupBrowserErrorHandlers() {
    // 일반 JavaScript 에러
    window.addEventListener('error', (event) => {
      this.logError({
        message: event.message,
        stack: event.error?.stack,
        category: ErrorCategory.JAVASCRIPT,
        severity: this.determineSeverity(event.error),
        context: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        }
      });
    });

    // Promise rejection 에러
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        category: ErrorCategory.JAVASCRIPT,
        severity: ErrorSeverity.HIGH,
        context: {
          promise: event.promise,
          reason: event.reason
        }
      });
    });

    // 네트워크 에러 모니터링
    this.interceptFetch();
    this.interceptXHR();
  }

  /**
   * Node.js 에러 핸들러 설정
   */
  private setupNodeErrorHandlers() {
    process.on('uncaughtException', (error) => {
      this.logError({
        message: error.message,
        stack: error.stack,
        category: ErrorCategory.JAVASCRIPT,
        severity: ErrorSeverity.CRITICAL,
        context: {
          type: 'uncaughtException'
        }
      });
    });

    process.on('unhandledRejection', (reason, promise) => {
      this.logError({
        message: `Unhandled Promise Rejection: ${reason}`,
        stack: reason instanceof Error ? reason.stack : undefined,
        category: ErrorCategory.JAVASCRIPT,
        severity: ErrorSeverity.HIGH,
        context: {
          type: 'unhandledRejection',
          promise
        }
      });
    });
  }

  /**
   * Fetch API 인터셉트
   */
  private interceptFetch() {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      const [resource, config] = args;
      const url = typeof resource === 'string' ? resource : resource.url;

      try {
        const response = await originalFetch(...args);

        // 4xx, 5xx 에러 로깅
        if (!response.ok) {
          this.logError({
            message: `HTTP ${response.status}: ${response.statusText}`,
            category: ErrorCategory.NETWORK,
            severity: this.determineHttpSeverity(response.status),
            context: {
              url,
              method: config?.method || 'GET',
              status: response.status,
              statusText: response.statusText,
              duration: performance.now() - startTime
            }
          });
        }

        return response;
      } catch (error) {
        this.logError({
          message: `Network Error: ${error instanceof Error ? error.message : String(error)}`,
          stack: error instanceof Error ? error.stack : undefined,
          category: ErrorCategory.NETWORK,
          severity: ErrorSeverity.HIGH,
          context: {
            url,
            method: config?.method || 'GET',
            duration: performance.now() - startTime
          }
        });
        throw error;
      }
    };
  }

  /**
   * XMLHttpRequest 인터셉트
   */
  private interceptXHR() {
    const XHROpen = XMLHttpRequest.prototype.open;
    const XHRSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(method: string, url: string | URL, ...args: any[]) {
      this._method = method;
      this._url = url;
      return XHROpen.apply(this, [method, url, ...args] as any);
    };

    XMLHttpRequest.prototype.send = function(...args: any[]) {
      const startTime = performance.now();

      this.addEventListener('error', () => {
        ErrorLogger.getInstance().logError({
          message: `XHR Network Error: ${this._url}`,
          category: ErrorCategory.NETWORK,
          severity: ErrorSeverity.HIGH,
          context: {
            url: this._url,
            method: this._method,
            duration: performance.now() - startTime
          }
        });
      });

      this.addEventListener('load', () => {
        if (this.status >= 400) {
          ErrorLogger.getInstance().logError({
            message: `XHR HTTP ${this.status}: ${this.statusText}`,
            category: ErrorCategory.NETWORK,
            severity: ErrorLogger.getInstance().determineHttpSeverity(this.status),
            context: {
              url: this._url,
              method: this._method,
              status: this.status,
              statusText: this.statusText,
              duration: performance.now() - startTime
            }
          });
        }
      });

      return XHRSend.apply(this, args);
    };
  }

  /**
   * 에러 로깅
   */
  logError(error: Partial<ErrorInfo>) {
    const errorInfo: ErrorInfo = {
      message: error.message || 'Unknown error',
      stack: error.stack,
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : 'server',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'node',
      category: error.category || ErrorCategory.UNKNOWN,
      severity: error.severity || ErrorSeverity.MEDIUM,
      context: error.context,
      userId: this.userId,
      sessionId: this.sessionId
    };

    // 큐에 추가
    this.errorQueue.push(errorInfo);

    // 크리티컬 에러는 즉시 전송
    if (errorInfo.severity === ErrorSeverity.CRITICAL) {
      this.flush();
    } else if (this.errorQueue.length >= this.maxQueueSize) {
      this.flush();
    }

    // 콘솔에도 출력
    if (errorInfo.severity === ErrorSeverity.CRITICAL || errorInfo.severity === ErrorSeverity.HIGH) {
      console.error('[ErrorLogger]', errorInfo);
    } else {
      console.warn('[ErrorLogger]', errorInfo);
    }
  }

  /**
   * 에러 심각도 결정
   */
  private determineSeverity(error: any): ErrorSeverity {
    if (!error) return ErrorSeverity.LOW;

    const message = error.message || '';

    // 크리티컬 패턴
    if (
      message.includes('Cannot read properties of null') ||
      message.includes('Cannot read properties of undefined') ||
      message.includes('Maximum call stack') ||
      message.includes('out of memory')
    ) {
      return ErrorSeverity.CRITICAL;
    }

    // 높음 패턴
    if (
      message.includes('Failed to fetch') ||
      message.includes('Network') ||
      message.includes('401') ||
      message.includes('403')
    ) {
      return ErrorSeverity.HIGH;
    }

    // 중간 패턴
    if (
      message.includes('400') ||
      message.includes('404') ||
      message.includes('validation')
    ) {
      return ErrorSeverity.MEDIUM;
    }

    return ErrorSeverity.LOW;
  }

  /**
   * HTTP 상태 코드별 심각도 결정
   */
  private determineHttpSeverity(status: number): ErrorSeverity {
    if (status >= 500) return ErrorSeverity.CRITICAL;
    if (status === 401 || status === 403) return ErrorSeverity.HIGH;
    if (status >= 400) return ErrorSeverity.MEDIUM;
    return ErrorSeverity.LOW;
  }

  /**
   * 에러 큐 플러시
   */
  async flush() {
    if (this.errorQueue.length === 0) return;

    const errors = [...this.errorQueue];
    this.errorQueue = [];

    try {
      // API로 에러 전송
      const response = await fetch('/api/monitoring/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ errors })
      });

      if (!response.ok) {
        // 전송 실패시 큐에 다시 추가 (최대 크기 제한)
        this.errorQueue = [...errors, ...this.errorQueue].slice(0, this.maxQueueSize * 2);
        console.error('[ErrorLogger] 에러 전송 실패:', response.status);
      }
    } catch (error) {
      // 네트워크 에러시 로컬 스토리지에 저장
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('error_queue') || '[]';
          const storedErrors = JSON.parse(stored);
          const combined = [...storedErrors, ...errors].slice(-100); // 최대 100개
          localStorage.setItem('error_queue', JSON.stringify(combined));
        } catch (e) {
          console.error('[ErrorLogger] 로컬 스토리지 저장 실패:', e);
        }
      }
    }
  }

  /**
   * 자동 플러시 시작
   */
  private startAutoFlush() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);

    // 페이지 언로드시 플러시
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flush();
      });

      // 페이지 숨김시 플러시 (모바일 대응)
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.flush();
        }
      });
    }
  }

  /**
   * 세션 ID 생성
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 사용자 ID 설정
   */
  setUserId(userId: string) {
    this.userId = userId;
  }

  /**
   * 에러 통계 조회
   */
  getStats() {
    return {
      queueSize: this.errorQueue.length,
      sessionId: this.sessionId,
      userId: this.userId,
      isInitialized: this.isInitialized
    };
  }

  /**
   * 수동 에러 로깅 헬퍼
   */
  static logNetworkError(url: string, status: number, message: string, context?: any) {
    ErrorLogger.getInstance().logError({
      message: `${message} (${status})`,
      category: ErrorCategory.NETWORK,
      severity: ErrorLogger.getInstance().determineHttpSeverity(status),
      context: {
        url,
        status,
        ...context
      }
    });
  }

  static logAPIError(endpoint: string, error: Error, context?: any) {
    ErrorLogger.getInstance().logError({
      message: error.message,
      stack: error.stack,
      category: ErrorCategory.API,
      severity: ErrorSeverity.HIGH,
      context: {
        endpoint,
        ...context
      }
    });
  }

  static logAuthError(message: string, context?: any) {
    ErrorLogger.getInstance().logError({
      message,
      category: ErrorCategory.AUTH,
      severity: ErrorSeverity.HIGH,
      context
    });
  }

  static logDatabaseError(query: string, error: Error, context?: any) {
    ErrorLogger.getInstance().logError({
      message: error.message,
      stack: error.stack,
      category: ErrorCategory.DATABASE,
      severity: ErrorSeverity.CRITICAL,
      context: {
        query,
        ...context
      }
    });
  }

  static logValidationError(field: string, message: string, context?: any) {
    ErrorLogger.getInstance().logError({
      message: `Validation Error: ${field} - ${message}`,
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.LOW,
      context: {
        field,
        ...context
      }
    });
  }

  static logBusinessLogicError(message: string, context?: any) {
    ErrorLogger.getInstance().logError({
      message,
      category: ErrorCategory.BUSINESS_LOGIC,
      severity: ErrorSeverity.MEDIUM,
      context
    });
  }
}

// 싱글톤 인스턴스 export
export const errorLogger = ErrorLogger.getInstance();