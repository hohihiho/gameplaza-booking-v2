/**
 * 분산 시스템 모니터링
 *
 * 기능:
 * - 헬스 체크 관리
 * - 메트릭스 수집
 * - 로그 집계
 * - 알람 시스템
 * - 추적 및 스팬
 */

import { EventEmitter } from 'events';

type MetricType = 'counter' | 'gauge' | 'histogram' | 'summary';
type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';
type AlertSeverity = 'info' | 'warning' | 'critical' | 'emergency';

/**
 * 메트릭 정의
 */
interface Metric {
  name: string;
  type: MetricType;
  value: number;
  timestamp: Date;
  labels: Record<string, string>;
  unit?: string;
  description?: string;
}

/**
 * 로그 엔트리
 */
interface LogEntry {
  id: string;
  level: LogLevel;
  message: string;
  timestamp: Date;
  service: string;
  host: string;
  metadata: Record<string, any>;
  stackTrace?: string;
  correlationId?: string;
}

/**
 * 헬스 체크 결과
 */
interface HealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  checks: Array<{
    name: string;
    status: 'pass' | 'fail' | 'warn';
    message?: string;
    duration: number;
  }>;
  metadata: {
    version: string;
    uptime: number;
    cpu: number;
    memory: number;
    diskSpace: number;
  };
}

/**
 * 추적 스팬
 */
interface Span {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  service: string;
  operation: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: 'ok' | 'error' | 'cancelled';
  tags: Record<string, any>;
  logs: Array<{
    timestamp: Date;
    message: string;
    fields?: Record<string, any>;
  }>;
}

/**
 * 알림 규칙
 */
interface AlertRule {
  id: string;
  name: string;
  condition: {
    metric?: string;
    operator: '>' | '<' | '=' | '>=' | '<=' | '!=';
    threshold: number;
    duration?: number;  // seconds
  };
  severity: AlertSeverity;
  notification: {
    channels: Array<'email' | 'sms' | 'slack' | 'webhook'>;
    message: string;
    cooldown: number;  // seconds
  };
  enabled: boolean;
}

/**
 * 알림
 */
interface Alert {
  id: string;
  rule: AlertRule;
  triggeredAt: Date;
  resolvedAt?: Date;
  status: 'firing' | 'resolved';
  value: number;
  message: string;
  notificationsSent: number;
}

/**
 * 대시보드 패널
 */
interface DashboardPanel {
  id: string;
  title: string;
  type: 'line' | 'bar' | 'pie' | 'gauge' | 'heatmap' | 'table' | 'log';
  metrics: string[];
  timeRange: {
    from: Date | string;
    to: Date | string;
  };
  refreshInterval: number;  // seconds
  options: Record<string, any>;
}

/**
 * 분산 모니터링 시스템
 */
export class DistributedMonitor extends EventEmitter {
  private metrics: Map<string, Metric[]> = new Map();
  private logs: LogEntry[] = [];
  private healthChecks: Map<string, HealthCheck> = new Map();
  private traces: Map<string, Span[]> = new Map();
  private alertRules: Map<string, AlertRule> = new Map();
  private activeAlerts: Map<string, Alert> = new Map();
  private dashboards: Map<string, DashboardPanel[]> = new Map();

  constructor() {
    super();
    this.initializeDefaultRules();
    this.startMonitoring();
  }

  /**
   * 기본 알림 규칙 초기화
   */
  private initializeDefaultRules(): void {
    // CPU 사용률 알림
    this.addAlertRule({
      id: 'high-cpu',
      name: 'High CPU Usage',
      condition: {
        metric: 'system.cpu.usage',
        operator: '>',
        threshold: 80,
        duration: 300,  // 5분
      },
      severity: 'warning',
      notification: {
        channels: ['email', 'slack'],
        message: 'CPU usage is above 80% for more than 5 minutes',
        cooldown: 1800,  // 30분
      },
      enabled: true,
    });

    // 메모리 사용률 알림
    this.addAlertRule({
      id: 'high-memory',
      name: 'High Memory Usage',
      condition: {
        metric: 'system.memory.usage',
        operator: '>',
        threshold: 90,
        duration: 180,  // 3분
      },
      severity: 'critical',
      notification: {
        channels: ['email', 'slack', 'sms'],
        message: 'Memory usage is above 90% for more than 3 minutes',
        cooldown: 900,  // 15분
      },
      enabled: true,
    });

    // 에러율 알림
    this.addAlertRule({
      id: 'high-error-rate',
      name: 'High Error Rate',
      condition: {
        metric: 'http.request.error_rate',
        operator: '>',
        threshold: 5,  // 5%
        duration: 60,  // 1분
      },
      severity: 'critical',
      notification: {
        channels: ['email', 'slack'],
        message: 'Error rate is above 5% for more than 1 minute',
        cooldown: 600,  // 10분
      },
      enabled: true,
    });

    // 응답 시간 알림
    this.addAlertRule({
      id: 'slow-response',
      name: 'Slow Response Time',
      condition: {
        metric: 'http.request.duration.p95',
        operator: '>',
        threshold: 1000,  // 1초
        duration: 120,  // 2분
      },
      severity: 'warning',
      notification: {
        channels: ['slack'],
        message: 'P95 response time is above 1s for more than 2 minutes',
        cooldown: 1200,  // 20분
      },
      enabled: true,
    });
  }

  /**
   * 메트릭 기록
   */
  public recordMetric(metric: Metric): void {
    const key = this.getMetricKey(metric.name, metric.labels);

    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }

    const metrics = this.metrics.get(key)!;
    metrics.push(metric);

    // 메모리 관리 (최근 1시간 데이터만 유지)
    const oneHourAgo = new Date(Date.now() - 3600000);
    this.metrics.set(
      key,
      metrics.filter(m => m.timestamp > oneHourAgo)
    );

    // 알림 규칙 평가
    this.evaluateAlertRules(metric);

    this.emit('metric-recorded', metric);
  }

  /**
   * 카운터 증가
   */
  public incrementCounter(
    name: string,
    value: number = 1,
    labels: Record<string, string> = {}
  ): void {
    this.recordMetric({
      name,
      type: 'counter',
      value,
      timestamp: new Date(),
      labels,
    });
  }

  /**
   * 게이지 설정
   */
  public setGauge(
    name: string,
    value: number,
    labels: Record<string, string> = {}
  ): void {
    this.recordMetric({
      name,
      type: 'gauge',
      value,
      timestamp: new Date(),
      labels,
    });
  }

  /**
   * 히스토그램 관측
   */
  public observeHistogram(
    name: string,
    value: number,
    labels: Record<string, string> = {}
  ): void {
    this.recordMetric({
      name,
      type: 'histogram',
      value,
      timestamp: new Date(),
      labels,
    });
  }

  /**
   * 로그 기록
   */
  public log(
    level: LogLevel,
    message: string,
    metadata: Record<string, any> = {}
  ): void {
    const entry: LogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      level,
      message,
      timestamp: new Date(),
      service: metadata.service || 'unknown',
      host: metadata.host || 'localhost',
      metadata,
    };

    this.logs.push(entry);

    // 로그 레벨별 메트릭 업데이트
    this.incrementCounter(`logs.${level}`, 1, { service: entry.service });

    // 에러 로그 알림
    if (level === 'error' || level === 'fatal') {
      this.handleErrorLog(entry);
    }

    // 메모리 관리 (최근 10000개 로그만 유지)
    if (this.logs.length > 10000) {
      this.logs = this.logs.slice(-10000);
    }

    this.emit('log-recorded', entry);
  }

  /**
   * 헬스 체크 업데이트
   */
  public updateHealthCheck(healthCheck: HealthCheck): void {
    this.healthChecks.set(healthCheck.service, healthCheck);

    // 헬스 상태 메트릭 기록
    const statusValue = healthCheck.status === 'healthy' ? 1 :
                       healthCheck.status === 'degraded' ? 0.5 : 0;

    this.setGauge('service.health', statusValue, { service: healthCheck.service });

    // 메타데이터 메트릭
    this.setGauge('service.cpu', healthCheck.metadata.cpu, { service: healthCheck.service });
    this.setGauge('service.memory', healthCheck.metadata.memory, { service: healthCheck.service });
    this.setGauge('service.uptime', healthCheck.metadata.uptime, { service: healthCheck.service });

    this.emit('health-updated', healthCheck);
  }

  /**
   * 추적 시작
   */
  public startSpan(
    traceId: string,
    operation: string,
    service: string,
    parentSpanId?: string
  ): Span {
    const span: Span = {
      traceId,
      spanId: `span_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      parentSpanId,
      service,
      operation,
      startTime: new Date(),
      status: 'ok',
      tags: {},
      logs: [],
    };

    if (!this.traces.has(traceId)) {
      this.traces.set(traceId, []);
    }

    this.traces.get(traceId)!.push(span);

    return span;
  }

  /**
   * 추적 종료
   */
  public endSpan(span: Span, status: 'ok' | 'error' | 'cancelled' = 'ok'): void {
    span.endTime = new Date();
    span.duration = span.endTime.getTime() - span.startTime.getTime();
    span.status = status;

    // 추적 메트릭 기록
    this.observeHistogram(
      'trace.duration',
      span.duration,
      {
        service: span.service,
        operation: span.operation,
        status: span.status,
      }
    );

    this.emit('span-ended', span);
  }

  /**
   * 알림 규칙 추가
   */
  public addAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
    this.emit('alert-rule-added', rule);
  }

  /**
   * 알림 규칙 평가
   */
  private evaluateAlertRules(metric: Metric): void {
    for (const rule of this.alertRules.values()) {
      if (!rule.enabled) continue;

      if (rule.condition.metric && metric.name === rule.condition.metric) {
        const shouldTrigger = this.evaluateCondition(
          metric.value,
          rule.condition.operator,
          rule.condition.threshold
        );

        if (shouldTrigger) {
          this.triggerAlert(rule, metric.value);
        } else {
          this.resolveAlert(rule.id);
        }
      }
    }
  }

  /**
   * 조건 평가
   */
  private evaluateCondition(
    value: number,
    operator: string,
    threshold: number
  ): boolean {
    switch (operator) {
      case '>': return value > threshold;
      case '<': return value < threshold;
      case '=': return value === threshold;
      case '>=': return value >= threshold;
      case '<=': return value <= threshold;
      case '!=': return value !== threshold;
      default: return false;
    }
  }

  /**
   * 알림 트리거
   */
  private triggerAlert(rule: AlertRule, value: number): void {
    let alert = this.activeAlerts.get(rule.id);

    if (!alert) {
      alert = {
        id: `alert_${Date.now()}`,
        rule,
        triggeredAt: new Date(),
        status: 'firing',
        value,
        message: rule.notification.message,
        notificationsSent: 0,
      };

      this.activeAlerts.set(rule.id, alert);
      this.sendAlertNotification(alert);
    }

    this.emit('alert-triggered', alert);
  }

  /**
   * 알림 해제
   */
  private resolveAlert(ruleId: string): void {
    const alert = this.activeAlerts.get(ruleId);

    if (alert && alert.status === 'firing') {
      alert.status = 'resolved';
      alert.resolvedAt = new Date();

      this.activeAlerts.delete(ruleId);
      this.emit('alert-resolved', alert);
    }
  }

  /**
   * 알림 전송
   */
  private sendAlertNotification(alert: Alert): void {
    for (const channel of alert.rule.notification.channels) {
      switch (channel) {
        case 'email':
          console.log(`[EMAIL] Alert: ${alert.message}`);
          break;
        case 'sms':
          console.log(`[SMS] Alert: ${alert.message}`);
          break;
        case 'slack':
          console.log(`[SLACK] Alert: ${alert.message}`);
          break;
        case 'webhook':
          console.log(`[WEBHOOK] Alert: ${alert.message}`);
          break;
      }
    }

    alert.notificationsSent++;
  }

  /**
   * 에러 로그 처리
   */
  private handleErrorLog(entry: LogEntry): void {
    // 에러율 계산
    const recentLogs = this.logs.filter(
      l => l.timestamp > new Date(Date.now() - 60000)  // 최근 1분
    );

    const errorCount = recentLogs.filter(
      l => l.level === 'error' || l.level === 'fatal'
    ).length;

    const errorRate = recentLogs.length > 0
      ? (errorCount / recentLogs.length) * 100
      : 0;

    this.setGauge('logs.error_rate', errorRate, { service: entry.service });
  }

  /**
   * 모니터링 시작
   */
  private startMonitoring(): void {
    // 시스템 메트릭 수집
    setInterval(() => {
      this.collectSystemMetrics();
    }, 10000);  // 10초마다

    // 알림 규칙 정기 평가
    setInterval(() => {
      this.evaluateAllAlertRules();
    }, 30000);  // 30초마다

    // 메모리 정리
    setInterval(() => {
      this.cleanup();
    }, 3600000);  // 1시간마다
  }

  /**
   * 시스템 메트릭 수집
   */
  private collectSystemMetrics(): void {
    // CPU 사용률 (시뮬레이션)
    this.setGauge('system.cpu.usage', Math.random() * 100);

    // 메모리 사용률 (시뮬레이션)
    this.setGauge('system.memory.usage', Math.random() * 100);

    // 디스크 사용률 (시뮬레이션)
    this.setGauge('system.disk.usage', Math.random() * 100);

    // 네트워크 (시뮬레이션)
    this.incrementCounter('system.network.bytes_in', Math.random() * 1000000);
    this.incrementCounter('system.network.bytes_out', Math.random() * 1000000);
  }

  /**
   * 모든 알림 규칙 평가
   */
  private evaluateAllAlertRules(): void {
    for (const rule of this.alertRules.values()) {
      if (!rule.enabled || !rule.condition.metric) continue;

      const metrics = this.getMetricsByName(rule.condition.metric);
      if (metrics.length > 0) {
        const latestValue = metrics[metrics.length - 1].value;

        // 지속 시간 확인
        if (rule.condition.duration) {
          const startTime = new Date(Date.now() - rule.condition.duration * 1000);
          const recentMetrics = metrics.filter(m => m.timestamp > startTime);

          const allMatch = recentMetrics.every(m =>
            this.evaluateCondition(m.value, rule.condition.operator, rule.condition.threshold)
          );

          if (allMatch && recentMetrics.length > 0) {
            this.triggerAlert(rule, latestValue);
          } else {
            this.resolveAlert(rule.id);
          }
        } else {
          // 즉시 평가
          if (this.evaluateCondition(latestValue, rule.condition.operator, rule.condition.threshold)) {
            this.triggerAlert(rule, latestValue);
          } else {
            this.resolveAlert(rule.id);
          }
        }
      }
    }
  }

  /**
   * 메모리 정리
   */
  private cleanup(): void {
    const oneHourAgo = new Date(Date.now() - 3600000);

    // 오래된 메트릭 제거
    for (const [key, metrics] of this.metrics) {
      const filtered = metrics.filter(m => m.timestamp > oneHourAgo);
      if (filtered.length > 0) {
        this.metrics.set(key, filtered);
      } else {
        this.metrics.delete(key);
      }
    }

    // 오래된 추적 제거
    for (const [traceId, spans] of this.traces) {
      const hasRecentSpan = spans.some(s => s.startTime > oneHourAgo);
      if (!hasRecentSpan) {
        this.traces.delete(traceId);
      }
    }
  }

  /**
   * 메트릭 키 생성
   */
  private getMetricKey(name: string, labels: Record<string, string>): string {
    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(',');

    return `${name}{${labelStr}}`;
  }

  /**
   * 이름으로 메트릭 조회
   */
  private getMetricsByName(name: string): Metric[] {
    const results: Metric[] = [];

    for (const [key, metrics] of this.metrics) {
      if (key.startsWith(name)) {
        results.push(...metrics);
      }
    }

    return results.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * 대시보드 생성
   */
  public createDashboard(name: string, panels: DashboardPanel[]): void {
    this.dashboards.set(name, panels);
    this.emit('dashboard-created', { name, panels });
  }

  /**
   * 통계 조회
   */
  public getStatistics(): {
    metrics: {
      total: number;
      types: Record<MetricType, number>;
    };
    logs: {
      total: number;
      levels: Record<LogLevel, number>;
    };
    alerts: {
      active: number;
      resolved: number;
      bySeversity: Record<AlertSeverity, number>;
    };
    health: {
      healthy: number;
      degraded: number;
      unhealthy: number;
    };
    traces: {
      total: number;
      active: number;
      averageDuration: number;
    };
  } {
    const stats = {
      metrics: {
        total: 0,
        types: { counter: 0, gauge: 0, histogram: 0, summary: 0 } as Record<MetricType, number>,
      },
      logs: {
        total: this.logs.length,
        levels: { debug: 0, info: 0, warn: 0, error: 0, fatal: 0 } as Record<LogLevel, number>,
      },
      alerts: {
        active: this.activeAlerts.size,
        resolved: 0,
        bySeversity: { info: 0, warning: 0, critical: 0, emergency: 0 } as Record<AlertSeverity, number>,
      },
      health: {
        healthy: 0,
        degraded: 0,
        unhealthy: 0,
      },
      traces: {
        total: this.traces.size,
        active: 0,
        averageDuration: 0,
      },
    };

    // 메트릭 통계
    for (const metrics of this.metrics.values()) {
      stats.metrics.total += metrics.length;
      for (const metric of metrics) {
        stats.metrics.types[metric.type]++;
      }
    }

    // 로그 레벨 통계
    for (const log of this.logs) {
      stats.logs.levels[log.level]++;
    }

    // 알림 통계
    for (const alert of this.activeAlerts.values()) {
      stats.alerts.bySeversity[alert.rule.severity]++;
    }

    // 헬스 통계
    for (const health of this.healthChecks.values()) {
      if (health.status === 'healthy') stats.health.healthy++;
      else if (health.status === 'degraded') stats.health.degraded++;
      else stats.health.unhealthy++;
    }

    // 추적 통계
    let totalDuration = 0;
    let completedSpans = 0;

    for (const spans of this.traces.values()) {
      for (const span of spans) {
        if (span.duration) {
          totalDuration += span.duration;
          completedSpans++;
        } else {
          stats.traces.active++;
        }
      }
    }

    stats.traces.averageDuration = completedSpans > 0 ? totalDuration / completedSpans : 0;

    return stats;
  }
}

// 싱글톤 인스턴스
export const monitor = new DistributedMonitor();