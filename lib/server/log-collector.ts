/**
 * 서버사이드 로그 수집 시스템
 * - API 요청/응답 로그
 * - 에러 로그  
 * - 성능 메트릭
 * - 데이터베이스 쿼리 로그
 * 클로드 코드에서 접근 가능한 형태로 저장
 */

import { writeFile, readFile, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { promisify } from 'util';

const writeFileAsync = promisify(writeFile);
const readFileAsync = promisify(readFile);

export interface ServerLogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  source: 'api' | 'database' | 'auth' | 'system' | 'performance';
  message: string;
  data?: any;
  stack?: string;
  requestId?: string;
  userId?: string;
  duration?: number;
  endpoint?: string;
  method?: string;
  statusCode?: number;
}

class ServerLogCollector {
  private logDir: string;
  private maxLogFiles = 10;
  private maxLogsPerFile = 1000;

  constructor() {
    this.logDir = join(process.cwd(), 'logs');
    this.ensureLogDirectory();
  }

  private ensureLogDirectory() {
    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true });
    }
  }

  private generateLogId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCurrentLogFile(): string {
    const date = new Date().toISOString().split('T')[0];
    return join(this.logDir, `server-logs-${date}.json`);
  }

  async addLog(entry: Omit<ServerLogEntry, 'id' | 'timestamp'>) {
    const logEntry: ServerLogEntry = {
      ...entry,
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
    };

    try {
      const logFile = this.getCurrentLogFile();
      let logs: ServerLogEntry[] = [];

      // 기존 로그 파일 읽기
      if (existsSync(logFile)) {
        const content = await readFileAsync(logFile, 'utf-8');
        logs = JSON.parse(content);
      }

      // 새 로그 추가
      logs.push(logEntry);

      // 최대 로그 수 제한
      if (logs.length > this.maxLogsPerFile) {
        logs = logs.slice(-this.maxLogsPerFile);
      }

      // 파일에 저장
      await writeFileAsync(logFile, JSON.stringify(logs, null, 2));

      // 콘솔에도 출력 (개발 환경)
      if (process.env.NODE_ENV === 'development') {
        const color = this.getConsoleColor(entry.level);
        console.log(`${color}[${entry.level.toUpperCase()}] ${entry.source}: ${entry.message}\x1b[0m`);
        if (entry.data) {
          console.log('Data:', entry.data);
        }
      }
    } catch (error) {
      console.error('로그 저장 실패:', error);
    }
  }

  private getConsoleColor(level: string): string {
    switch (level) {
      case 'error': return '\x1b[31m'; // 빨간색
      case 'warn': return '\x1b[33m';  // 노란색
      case 'debug': return '\x1b[36m'; // 청록색
      default: return '\x1b[32m';      // 녹색
    }
  }

  async getLogs(options?: {
    level?: string;
    source?: string;
    since?: Date;
    limit?: number;
    requestId?: string;
    userId?: string;
  }): Promise<ServerLogEntry[]> {
    try {
      const logFile = this.getCurrentLogFile();
      
      if (!existsSync(logFile)) {
        return [];
      }

      const content = await readFileAsync(logFile, 'utf-8');
      let logs: ServerLogEntry[] = JSON.parse(content);

      // 필터링
      if (options) {
        logs = logs.filter(log => {
          if (options.level && log.level !== options.level) return false;
          if (options.source && log.source !== options.source) return false;
          if (options.requestId && log.requestId !== options.requestId) return false;
          if (options.userId && log.userId !== options.userId) return false;
          if (options.since && new Date(log.timestamp) < options.since) return false;
          return true;
        });
      }

      // 최신순 정렬
      logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // 제한
      if (options?.limit) {
        logs = logs.slice(0, options.limit);
      }

      return logs;
    } catch (error) {
      console.error('로그 읽기 실패:', error);
      return [];
    }
  }

  // API 요청 로깅 미들웨어용
  logApiRequest(req: any, res: any, duration: number, error?: Error) {
    this.addLog({
      level: error ? 'error' : 'info',
      source: 'api',
      message: `${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`,
      data: {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        userAgent: req.headers['user-agent'],
        ip: req.ip || req.connection.remoteAddress,
        body: req.method === 'POST' ? req.body : undefined,
        query: Object.keys(req.query || {}).length > 0 ? req.query : undefined,
      },
      duration,
      endpoint: req.url,
      method: req.method,
      statusCode: res.statusCode,
      requestId: req.headers['x-request-id'],
      stack: error?.stack,
    });
  }

  // 데이터베이스 쿼리 로깅
  logDatabaseQuery(query: string, duration: number, error?: Error) {
    this.addLog({
      level: error ? 'error' : 'debug',
      source: 'database',
      message: error ? `DB 쿼리 실패: ${error.message}` : `DB 쿼리 완료 (${duration}ms)`,
      data: {
        query: query.substring(0, 500), // 쿼리 길이 제한
        duration,
      },
      duration,
      stack: error?.stack,
    });
  }

  // 인증 관련 로깅
  logAuth(event: string, userId?: string, details?: any) {
    this.addLog({
      level: 'info',
      source: 'auth',
      message: `인증 이벤트: ${event}`,
      data: details,
      userId,
    });
  }

  // 시스템 이벤트 로깅
  logSystem(message: string, level: 'info' | 'warn' | 'error' = 'info', data?: any) {
    this.addLog({
      level,
      source: 'system',
      message,
      data,
    });
  }

  // 성능 메트릭 로깅
  logPerformance(metric: string, value: number, unit: string = 'ms') {
    this.addLog({
      level: 'debug',
      source: 'performance',
      message: `성능 메트릭: ${metric} = ${value}${unit}`,
      data: {
        metric,
        value,
        unit,
      },
    });
  }
}

// 싱글톤 인스턴스
export const serverLogCollector = new ServerLogCollector();