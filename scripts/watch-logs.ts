#!/usr/bin/env npx tsx

/**
 * 실시간 로그 모니터링 스크립트
 * 클로드 코드에서 실시간으로 서버 로그를 모니터링할 수 있습니다.
 * 
 * 사용법:
 * npx tsx scripts/watch-logs.ts
 * npx tsx scripts/watch-logs.ts --level=error
 * npx tsx scripts/watch-logs.ts --source=api
 */

import { watchFile, readFile, existsSync } from 'fs';
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

interface WatchOptions {
  level?: string;
  source?: string;
  search?: string;
}

function parseArgs(): WatchOptions {
  const args = process.argv.slice(2);
  const options: WatchOptions = {};

  args.forEach(arg => {
    if (arg.startsWith('--level=')) {
      options.level = arg.split('=')[1];
    } else if (arg.startsWith('--source=')) {
      options.source = arg.split('=')[1];
    } else if (arg.startsWith('--search=')) {
      options.search = arg.split('=')[1];
    }
  });

  return options;
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
  const timestamp = new Date(log.timestamp).toLocaleTimeString('ko-KR');
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

function shouldShowLog(log: ServerLogEntry, options: WatchOptions): boolean {
  if (options.level && log.level !== options.level) {
    return false;
  }
  
  if (options.source && log.source !== options.source) {
    return false;
  }
  
  if (options.search) {
    const searchLower = options.search.toLowerCase();
    const matchMessage = log.message.toLowerCase().includes(searchLower);
    const matchData = JSON.stringify(log.data || {}).toLowerCase().includes(searchLower);
    
    if (!matchMessage && !matchData) {
      return false;
    }
  }
  
  return true;
}

async function readCurrentLogs(): Promise<ServerLogEntry[]> {
  const logDir = join(process.cwd(), 'logs');
  const date = new Date().toISOString().split('T')[0];
  const logFile = join(logDir, `server-logs-${date}.json`);

  if (!existsSync(logFile)) {
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

async function startWatching(options: WatchOptions) {
  const logDir = join(process.cwd(), 'logs');
  const date = new Date().toISOString().split('T')[0];
  const logFile = join(logDir, `server-logs-${date}.json`);
  
  let lastLogCount = 0;
  
  console.log('🔍 실시간 로그 모니터링 시작...');
  console.log(`📁 모니터링 파일: ${logFile}`);
  
  if (Object.keys(options).length > 0) {
    console.log('🔧 적용된 필터:', JSON.stringify(options, null, 2));
  }
  
  console.log('📋 실시간 로그 (Ctrl+C로 종료):\n');
  
  // 초기 로그 수 설정
  const initialLogs = await readCurrentLogs();
  lastLogCount = initialLogs.length;
  
  // 파일 변화 감지
  watchFile(logFile, { interval: 1000 }, async () => {
    try {
      const currentLogs = await readCurrentLogs();
      
      if (currentLogs.length > lastLogCount) {
        // 새로운 로그만 표시
        const newLogs = currentLogs.slice(lastLogCount);
        
        newLogs.forEach(log => {
          if (shouldShowLog(log, options)) {
            console.log(formatLogEntry(log));
            
            if (log.data && Object.keys(log.data).length > 0) {
              console.log('   📄 데이터:', JSON.stringify(log.data, null, 2).replace(/\n/g, '\n   '));
            }
            
            if (log.stack && log.level === 'error') {
              console.log('   🔥 스택 트레이스:');
              log.stack.split('\n').slice(0, 5).forEach(line => {
                console.log(`   ${line}`);
              });
              console.log('   ... (트레이스 생략)');
            }
            
            console.log();
          }
        });
        
        lastLogCount = currentLogs.length;
      }
    } catch (error) {
      console.error('❌ 로그 읽기 실패:', error);
    }
  });
  
  // 프로세스 종료 시 정리
  process.on('SIGINT', () => {
    console.log('\n\n👋 로그 모니터링을 종료합니다.');
    process.exit(0);
  });
}

async function main() {
  try {
    const options = parseArgs();
    await startWatching(options);
    
    // 무한 대기
    await new Promise(() => {});
    
  } catch (error) {
    console.error('❌ 로그 모니터링 실패:', error);
    process.exit(1);
  }
}

// 도움말 표시
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
📋 실시간 로그 모니터링 스크립트

사용법:
  npx tsx scripts/watch-logs.ts [옵션]

옵션:
  --level=<level>      로그 레벨 필터 (info, warn, error, debug)
  --source=<source>    소스 필터 (api, database, auth, system, performance)
  --search=<term>      메시지나 데이터에서 검색
  --help, -h           이 도움말 표시

예시:
  npx tsx scripts/watch-logs.ts
  npx tsx scripts/watch-logs.ts --level=error
  npx tsx scripts/watch-logs.ts --source=api
  npx tsx scripts/watch-logs.ts --search="예약"

종료:
  Ctrl+C로 모니터링을 종료할 수 있습니다.
`);
  process.exit(0);
}

main();