#!/usr/bin/env npx tsx

/**
 * 클로드 코드용 로그 조회 스크립트
 * 개발 중 서버 로그를 빠르게 확인할 수 있습니다.
 * 
 * 사용법:
 * npx tsx scripts/check-logs.ts
 * npx tsx scripts/check-logs.ts --level=error
 * npx tsx scripts/check-logs.ts --source=api --limit=50
 * npx tsx scripts/check-logs.ts --recent=5m
 */

import { readFile, existsSync } from 'fs';
import { join } from 'path';
import { promisify } from 'util';

const readFileAsync = promisify(readFile);

interface ServerLogEntry {
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

interface LogQueryOptions {
  level?: string;
  source?: string;
  limit?: number;
  recent?: string; // 5m, 1h, 1d
  search?: string;
  requestId?: string;
  userId?: string;
}

function parseArgs(): LogQueryOptions {
  const args = process.argv.slice(2);
  const options: LogQueryOptions = {};

  args.forEach(arg => {
    if (arg.startsWith('--level=')) {
      options.level = arg.split('=')[1];
    } else if (arg.startsWith('--source=')) {
      options.source = arg.split('=')[1];
    } else if (arg.startsWith('--limit=')) {
      options.limit = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--recent=')) {
      options.recent = arg.split('=')[1];
    } else if (arg.startsWith('--search=')) {
      options.search = arg.split('=')[1];
    } else if (arg.startsWith('--requestId=')) {
      options.requestId = arg.split('=')[1];
    } else if (arg.startsWith('--userId=')) {
      options.userId = arg.split('=')[1];
    }
  });

  return options;
}

function parseRecentTime(recent: string): Date {
  const now = new Date();
  const match = recent.match(/^(\d+)([mhd])$/);
  
  if (!match) {
    throw new Error('잘못된 recent 형식입니다. 예: 5m, 2h, 1d');
  }

  const amount = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case 'm':
      return new Date(now.getTime() - amount * 60 * 1000);
    case 'h':
      return new Date(now.getTime() - amount * 60 * 60 * 1000);
    case 'd':
      return new Date(now.getTime() - amount * 24 * 60 * 60 * 1000);
    default:
      throw new Error('지원하지 않는 시간 단위입니다');
  }
}

function getLogLevelColor(level: string): string {
  switch (level) {
    case 'error': return '\x1b[31m'; // 빨간색
    case 'warn': return '\x1b[33m';  // 노란색
    case 'debug': return '\x1b[36m'; // 청록색
    case 'info': return '\x1b[32m';  // 녹색
    default: return '\x1b[0m';       // 기본색
  }
}

function formatLogEntry(log: ServerLogEntry): string {
  const color = getLogLevelColor(log.level);
  const timestamp = new Date(log.timestamp).toLocaleString('ko-KR');
  const reset = '\x1b[0m';
  
  let output = `${color}[${log.level.toUpperCase()}]${reset} ${timestamp} | ${log.source} | ${log.message}`;
  
  if (log.duration) {
    output += ` (${log.duration}ms)`;
  }
  
  if (log.statusCode) {
    const statusColor = log.statusCode >= 400 ? '\x1b[31m' : '\x1b[32m';
    output += ` | ${statusColor}${log.statusCode}${reset}`;
  }
  
  if (log.endpoint) {
    output += ` | ${log.method} ${log.endpoint}`;
  }
  
  return output;
}

async function readLogs(): Promise<ServerLogEntry[]> {
  const logDir = join(process.cwd(), 'logs');
  const date = new Date().toISOString().split('T')[0];
  const logFile = join(logDir, `server-logs-${date}.json`);

  if (!existsSync(logFile)) {
    console.log('오늘 날짜의 로그 파일이 없습니다:', logFile);
    return [];
  }

  try {
    const content = await readFileAsync(logFile, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('로그 파일 읽기 실패:', error);
    return [];
  }
}

function filterLogs(logs: ServerLogEntry[], options: LogQueryOptions): ServerLogEntry[] {
  let filtered = logs;

  if (options.level) {
    filtered = filtered.filter(log => log.level === options.level);
  }

  if (options.source) {
    filtered = filtered.filter(log => log.source === options.source);
  }

  if (options.recent) {
    const since = parseRecentTime(options.recent);
    filtered = filtered.filter(log => new Date(log.timestamp) >= since);
  }

  if (options.search) {
    const searchLower = options.search.toLowerCase();
    filtered = filtered.filter(log => 
      log.message.toLowerCase().includes(searchLower) ||
      JSON.stringify(log.data || {}).toLowerCase().includes(searchLower)
    );
  }

  if (options.requestId) {
    filtered = filtered.filter(log => log.requestId === options.requestId);
  }

  if (options.userId) {
    filtered = filtered.filter(log => log.userId === options.userId);
  }

  // 최신순 정렬
  filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  if (options.limit) {
    filtered = filtered.slice(0, options.limit);
  }

  return filtered;
}

function printStats(logs: ServerLogEntry[], filtered: ServerLogEntry[]) {
  console.log('\n📊 로그 통계:');
  console.log(`전체 로그: ${logs.length}개`);
  console.log(`필터된 로그: ${filtered.length}개`);
  
  if (filtered.length > 0) {
    const byLevel = filtered.reduce((acc, log) => {
      acc[log.level] = (acc[log.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('레벨별 분포:', Object.entries(byLevel)
      .map(([level, count]) => `${level}: ${count}`)
      .join(', '));
    
    const timeRange = {
      earliest: filtered[filtered.length - 1]?.timestamp,
      latest: filtered[0]?.timestamp,
    };
    
    if (timeRange.earliest && timeRange.latest) {
      console.log(`시간 범위: ${new Date(timeRange.earliest).toLocaleString('ko-KR')} ~ ${new Date(timeRange.latest).toLocaleString('ko-KR')}`);
    }
  }
  console.log();
}

async function main() {
  try {
    const options = parseArgs();
    
    console.log('🔍 서버 로그 조회 중...\n');
    
    if (Object.keys(options).length > 0) {
      console.log('적용된 필터:', JSON.stringify(options, null, 2));
      console.log();
    }
    
    const logs = await readLogs();
    const filtered = filterLogs(logs, options);
    
    printStats(logs, filtered);
    
    if (filtered.length === 0) {
      console.log('조건에 맞는 로그가 없습니다.');
      return;
    }
    
    console.log('📋 로그 목록:\n');
    
    filtered.forEach((log, index) => {
      console.log(`${index + 1}. ${formatLogEntry(log)}`);
      
      if (log.data && Object.keys(log.data).length > 0) {
        console.log('   📄 데이터:', JSON.stringify(log.data, null, 2).replace(/\n/g, '\n   '));
      }
      
      if (log.stack) {
        console.log('   🔥 스택 트레이스:');
        log.stack.split('\n').forEach(line => {
          console.log(`   ${line}`);
        });
      }
      
      console.log();
    });
    
  } catch (error) {
    console.error('❌ 로그 조회 실패:', error);
    process.exit(1);
  }
}

// 도움말 표시
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
📋 서버 로그 조회 스크립트

사용법:
  npx tsx scripts/check-logs.ts [옵션]

옵션:
  --level=<level>      로그 레벨 필터 (info, warn, error, debug)
  --source=<source>    소스 필터 (api, database, auth, system, performance)
  --limit=<number>     출력할 로그 수 제한
  --recent=<time>      최근 시간 필터 (5m, 2h, 1d)
  --search=<term>      메시지나 데이터에서 검색
  --requestId=<id>     특정 요청 ID 필터
  --userId=<id>        특정 사용자 ID 필터
  --help, -h           이 도움말 표시

예시:
  npx tsx scripts/check-logs.ts
  npx tsx scripts/check-logs.ts --level=error --recent=1h
  npx tsx scripts/check-logs.ts --source=api --limit=20
  npx tsx scripts/check-logs.ts --search="예약" --recent=30m
`);
  process.exit(0);
}

main();