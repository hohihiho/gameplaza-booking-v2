#!/usr/bin/env node

/**
 * 게임플라자 오류 추적 및 자동 분석 도구
 * 개발 중 발생하는 오류들을 자동으로 수집하고 해결책을 제안합니다.
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class ErrorTracker {
  constructor() {
    this.logFile = path.join(__dirname, '../logs/error-tracker.log');
    this.errorPatterns = {
      // 포트 충돌
      'EADDRINUSE': {
        pattern: /EADDRINUSE.*:(\d+)/,
        solution: '포트가 이미 사용 중입니다. 다른 프로세스를 종료하거나 다른 포트를 사용하세요.',
        autoFix: (match) => this.fixPortConflict(match[1])
      },
      
      // TypeScript 에러
      'TS_ERROR': {
        pattern: /TS\d+:\s*(.*)/,
        solution: 'TypeScript 타입 오류가 발생했습니다. 타입 정의를 확인하세요.',
        autoFix: null
      },
      
      // 모듈 없음 에러
      'MODULE_NOT_FOUND': {
        pattern: /Cannot find module ['"]([^'"]+)['"]/,
        solution: '모듈을 찾을 수 없습니다. npm install로 의존성을 설치하세요.',
        autoFix: (match) => this.installMissingModule(match[1])
      },
      
      // ESLint 에러
      'ESLINT_ERROR': {
        pattern: /\d+:\d+\s+error\s+(.*)/,
        solution: 'ESLint 규칙 위반입니다. 코드 스타일을 수정하세요.',
        autoFix: () => this.runEslintFix()
      },
      
      // Next.js 빌드 에러
      'NEXT_BUILD_ERROR': {
        pattern: /Error occurred prerendering page/,
        solution: 'Next.js 프리렌더링 오류입니다. SSR/SSG 관련 코드를 확인하세요.',
        autoFix: null
      },
      
      // Supabase 연결 에러
      'SUPABASE_ERROR': {
        pattern: /(SUPABASE|supabase).*(?:connection|auth|invalid)/i,
        solution: 'Supabase 연결 문제입니다. 환경 변수와 API 키를 확인하세요.',
        autoFix: () => this.checkSupabaseConfig()
      }
    };
    
    this.initLogDirectory();
  }

  initLogDirectory() {
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}\n`;
    
    console.log(logEntry.trim());
    fs.appendFileSync(this.logFile, logEntry);
  }

  analyzeError(errorText) {
    this.log('새로운 오류 분석 시작', 'INFO');
    this.log(`오류 내용: ${errorText}`, 'DEBUG');

    for (const [errorType, config] of Object.entries(this.errorPatterns)) {
      const match = errorText.match(config.pattern);
      if (match) {
        this.log(`오류 유형 감지: ${errorType}`, 'WARN');
        this.log(`해결책: ${config.solution}`, 'INFO');
        
        if (config.autoFix) {
          this.log('자동 수정을 시도합니다...', 'INFO');
          try {
            config.autoFix(match);
          } catch (error) {
            this.log(`자동 수정 실패: ${error.message}`, 'ERROR');
          }
        }
        
        return {
          type: errorType,
          solution: config.solution,
          canAutoFix: !!config.autoFix
        };
      }
    }

    this.log('알려지지 않은 오류 유형입니다', 'WARN');
    return {
      type: 'UNKNOWN',
      solution: '수동으로 오류를 확인하고 해결해주세요.',
      canAutoFix: false
    };
  }

  async fixPortConflict(port) {
    this.log(`포트 ${port} 충돌 해결 시도`, 'INFO');
    
    return new Promise((resolve, reject) => {
      const kill = spawn('lsof', ['-ti', `:${port}`]);
      let pids = '';
      
      kill.stdout.on('data', (data) => {
        pids += data.toString();
      });
      
      kill.on('close', (code) => {
        if (pids.trim()) {
          const pidList = pids.trim().split('\n');
          this.log(`포트 ${port}를 사용하는 프로세스 발견: ${pidList.join(', ')}`, 'INFO');
          
          const killCmd = spawn('kill', ['-9', ...pidList]);
          killCmd.on('close', () => {
            this.log(`포트 ${port} 해제 완료`, 'INFO');
            resolve();
          });
        } else {
          this.log(`포트 ${port}는 현재 사용되지 않습니다`, 'INFO');
          resolve();
        }
      });
    });
  }

  async installMissingModule(moduleName) {
    this.log(`누락된 모듈 설치 시도: ${moduleName}`, 'INFO');
    
    return new Promise((resolve, reject) => {
      const npm = spawn('npm', ['install', moduleName], {
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      npm.on('close', (code) => {
        if (code === 0) {
          this.log(`모듈 ${moduleName} 설치 완료`, 'INFO');
          resolve();
        } else {
          this.log(`모듈 ${moduleName} 설치 실패`, 'ERROR');
          reject(new Error(`npm install failed with code ${code}`));
        }
      });
    });
  }

  async runEslintFix() {
    this.log('ESLint 자동 수정 실행', 'INFO');
    
    return new Promise((resolve, reject) => {
      const eslint = spawn('npx', ['eslint', '--fix', '.'], {
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      eslint.on('close', (code) => {
        if (code === 0) {
          this.log('ESLint 자동 수정 완료', 'INFO');
          resolve();
        } else {
          this.log('ESLint 자동 수정 일부 실패 (수동 확인 필요)', 'WARN');
          resolve(); // ESLint는 일부 오류만 자동 수정 가능하므로 resolve
        }
      });
    });
  }

  checkSupabaseConfig() {
    this.log('Supabase 설정 확인', 'INFO');
    
    const envFile = path.join(process.cwd(), '.env.local');
    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY'
    ];
    
    if (!fs.existsSync(envFile)) {
      this.log('.env.local 파일이 없습니다. .env.example을 참고하여 생성하세요.', 'ERROR');
      return;
    }
    
    const envContent = fs.readFileSync(envFile, 'utf8');
    const missingVars = requiredVars.filter(varName => 
      !envContent.includes(varName) || envContent.match(new RegExp(`${varName}=\\s*$`, 'm'))
    );
    
    if (missingVars.length > 0) {
      this.log(`다음 환경 변수가 누락되었거나 비어있습니다: ${missingVars.join(', ')}`, 'ERROR');
    } else {
      this.log('Supabase 환경 변수 설정이 올바릅니다', 'INFO');
    }
  }

  // 실시간 로그 모니터링
  watchLogs() {
    this.log('실시간 오류 모니터링 시작', 'INFO');
    
    // stdin에서 오류 입력 받기
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (data) => {
      const errorText = data.toString().trim();
      if (errorText) {
        this.analyzeError(errorText);
      }
    });

    this.log('오류 텍스트를 입력하거나 붙여넣으세요 (Ctrl+C로 종료):', 'INFO');
  }

  // 최근 오류 기록 보기
  showRecentErrors(count = 10) {
    if (!fs.existsSync(this.logFile)) {
      this.log('아직 오류 로그가 없습니다.', 'INFO');
      return;
    }

    const logContent = fs.readFileSync(this.logFile, 'utf8');
    const lines = logContent.trim().split('\n');
    const recentLines = lines.slice(-count);
    
    this.log(`최근 ${count}개 로그:`, 'INFO');
    recentLines.forEach(line => console.log(line));
  }
}

// CLI 인터페이스
const args = process.argv.slice(2);
const tracker = new ErrorTracker();

if (args.length === 0) {
  tracker.watchLogs();
} else if (args[0] === 'recent') {
  const count = parseInt(args[1]) || 10;
  tracker.showRecentErrors(count);
} else if (args[0] === 'analyze') {
  const errorText = args.slice(1).join(' ');
  tracker.analyzeError(errorText);
} else {
  console.log(`
사용법:
  node error-tracker.js              # 실시간 모니터링 모드
  node error-tracker.js recent [n]   # 최근 n개 로그 보기
  node error-tracker.js analyze "오류 메시지"  # 특정 오류 분석
  `);
}

module.exports = ErrorTracker;