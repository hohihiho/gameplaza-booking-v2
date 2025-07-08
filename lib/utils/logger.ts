/**
 * 로깅 유틸리티
 * 프로덕션 환경에서는 console.log를 비활성화하고,
 * 개발 환경에서만 로그를 출력합니다.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: Date;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isClient = typeof window !== 'undefined';

  private log(level: LogLevel, message: string, data?: any) {
    // 프로덕션 환경에서는 error와 warn만 출력
    if (!this.isDevelopment && level !== 'error' && level !== 'warn') {
      return;
    }

    const logEntry: LogEntry = {
      level,
      message,
      data,
      timestamp: new Date(),
    };

    // 서버 사이드에서는 더 상세한 로그 출력
    if (!this.isClient) {
      const formattedTime = logEntry.timestamp.toISOString();
      const prefix = `[${formattedTime}] [${level.toUpperCase()}]`;
      
      switch (level) {
        case 'error':
          console.error(prefix, message, data || '');
          break;
        case 'warn':
          console.warn(prefix, message, data || '');
          break;
        case 'info':
          console.info(prefix, message, data || '');
          break;
        case 'debug':
          console.log(prefix, message, data || '');
          break;
      }
    } else {
      // 클라이언트 사이드에서는 간단한 로그 출력
      switch (level) {
        case 'error':
          console.error(message, data || '');
          break;
        case 'warn':
          console.warn(message, data || '');
          break;
        case 'info':
          console.info(message, data || '');
          break;
        case 'debug':
          console.log(message, data || '');
          break;
      }
    }
  }

  debug(message: string, data?: any) {
    this.log('debug', message, data);
  }

  info(message: string, data?: any) {
    this.log('info', message, data);
  }

  warn(message: string, data?: any) {
    this.log('warn', message, data);
  }

  error(message: string, data?: any) {
    this.log('error', message, data);
  }

  // 성능 측정을 위한 특별한 메서드
  time(label: string) {
    if (this.isDevelopment) {
      console.time(label);
    }
  }

  timeEnd(label: string) {
    if (this.isDevelopment) {
      console.timeEnd(label);
    }
  }
}

// 싱글톤 인스턴스 생성
export const logger = new Logger();

// 기본 export로도 제공
export default logger;