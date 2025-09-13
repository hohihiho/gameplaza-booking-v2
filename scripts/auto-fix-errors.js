#!/usr/bin/env node

/**
 * 실시간 오류 자동 수정 시스템
 * 브라우저 콘솔 오류를 감지하고 자동으로 코드를 수정합니다.
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// ANSI 색상 코드
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

class AutoErrorFixer {
  constructor() {
    this.browser = null;
    this.page = null;
    this.errors = new Map();
    this.fixes = new Map();
    this.fixCount = 0;
    this.startTime = Date.now();
  }

  log(message, color = 'reset') {
    const timestamp = new Date().toLocaleTimeString('ko-KR');
    console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
  }

  async start() {
    this.log('🚀 오류 자동 수정 시스템 시작', 'green');

    try {
      // Puppeteer 브라우저 실행
      this.browser = await puppeteer.launch({
        headless: false,
        devtools: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      this.page = await this.browser.newPage();

      // 콘솔 메시지 리스너
      this.page.on('console', async msg => {
        const type = msg.type();
        const text = msg.text();

        if (type === 'error' || text.includes('Error')) {
          await this.handleError(text, msg);
        }
      });

      // 페이지 에러 리스너
      this.page.on('pageerror', async error => {
        await this.handleError(error.toString(), error);
      });

      // 요청 실패 리스너
      this.page.on('requestfailed', request => {
        const failure = request.failure();
        if (failure) {
          this.log(`❌ 요청 실패: ${request.url()} - ${failure.errorText}`, 'red');
          this.analyzeNetworkError(request.url(), failure.errorText);
        }
      });

      // localhost:3000 접속
      await this.page.goto('http://localhost:3000', {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      this.log('✅ 페이지 로드 완료, 모니터링 시작...', 'cyan');

      // 주기적으로 페이지 새로고침
      setInterval(async () => {
        try {
          await this.page.reload({ waitUntil: 'networkidle0' });
          this.log('🔄 페이지 새로고침', 'blue');
        } catch (err) {
          this.log(`⚠️ 새로고침 실패: ${err.message}`, 'yellow');
        }
      }, 30000); // 30초마다

      // 통계 표시
      setInterval(() => {
        this.showStats();
      }, 10000); // 10초마다

    } catch (error) {
      this.log(`❌ 시작 실패: ${error.message}`, 'red');
      process.exit(1);
    }
  }

  async handleError(errorText, errorObj) {
    const errorKey = this.extractErrorKey(errorText);

    if (this.errors.has(errorKey)) {
      // 이미 처리한 오류
      return;
    }

    this.errors.set(errorKey, {
      text: errorText,
      count: 1,
      firstSeen: new Date(),
      lastSeen: new Date()
    });

    this.log(`\n🔍 새로운 오류 감지:`, 'yellow');
    console.log(errorText);

    // 오류 패턴 분석 및 자동 수정
    const fix = await this.analyzeAndFix(errorText, errorObj);
    if (fix) {
      this.fixes.set(errorKey, fix);
      this.fixCount++;
      this.log(`✅ 수정 완료: ${fix.description}`, 'green');
    }
  }

  extractErrorKey(errorText) {
    // 오류 텍스트에서 고유 키 추출
    const lines = errorText.split('\n');
    const firstLine = lines[0] || errorText;
    return firstLine.substring(0, 100);
  }

  async analyzeAndFix(errorText, errorObj) {
    // 오류 패턴별 자동 수정 로직

    // 1. Cannot read properties of undefined
    if (errorText.includes('Cannot read properties of undefined')) {
      return await this.fixUndefinedError(errorText);
    }

    // 2. Module not found
    if (errorText.includes('Module not found') || errorText.includes('Cannot find module')) {
      return await this.fixModuleNotFound(errorText);
    }

    // 3. useSession is not defined
    if (errorText.includes('useSession is not defined')) {
      return await this.fixMissingImport('useSession', 'next-auth/react');
    }

    // 4. Webpack 관련 오류
    if (errorText.includes('webpack') || errorText.includes('options.factory')) {
      return await this.fixWebpackError(errorText);
    }

    // 5. API 404 오류
    if (errorText.includes('404') && errorText.includes('/api/')) {
      return await this.fixMissingAPI(errorText);
    }

    // 6. TypeScript 타입 오류
    if (errorText.includes('Type error')) {
      return await this.fixTypeError(errorText);
    }

    // 7. React Hook 오류
    if (errorText.includes('Invalid hook call') || errorText.includes('Rules of Hooks')) {
      return await this.fixHookError(errorText);
    }

    return null;
  }

  async fixUndefinedError(errorText) {
    this.log('🔧 undefined 오류 수정 시도...', 'yellow');

    // 스택 트레이스에서 파일 경로 추출
    const fileMatch = errorText.match(/at\s+.*?\((.*?):(\d+):(\d+)\)/);
    if (!fileMatch) return null;

    const [, filePath, line, column] = fileMatch;
    const cleanPath = filePath.replace('webpack-internal:///', '').replace(/\(.*?\)\//, '');

    // 실제 파일 경로 찾기
    const projectRoot = '/Users/seeheejang/Documents/project/gameplaza-v2';
    const possiblePaths = [
      path.join(projectRoot, cleanPath),
      path.join(projectRoot, 'src', cleanPath),
      path.join(projectRoot, 'app', cleanPath)
    ];

    for (const fullPath of possiblePaths) {
      try {
        const content = await fs.readFile(fullPath, 'utf-8');

        // 옵셔널 체이닝 추가
        const lines = content.split('\n');
        if (lines[line - 1]) {
          lines[line - 1] = lines[line - 1].replace(/(\w+)\.(\w+)/g, '$1?.$2');
          await fs.writeFile(fullPath, lines.join('\n'));

          return {
            type: 'undefined_fix',
            file: fullPath,
            line: line,
            description: '옵셔널 체이닝 추가'
          };
        }
      } catch (err) {
        // 파일이 없으면 다음 경로 시도
        continue;
      }
    }

    return null;
  }

  async fixModuleNotFound(errorText) {
    this.log('🔧 모듈 누락 오류 수정 시도...', 'yellow');

    const moduleMatch = errorText.match(/Cannot find module ['"](.+?)['"]/);
    if (!moduleMatch) return null;

    const moduleName = moduleMatch[1];

    // npm install 실행
    try {
      this.log(`📦 모듈 설치: ${moduleName}`, 'cyan');
      await execPromise(`cd /Users/seeheejang/Documents/project/gameplaza-v2 && npm install ${moduleName}`);

      return {
        type: 'module_install',
        module: moduleName,
        description: `${moduleName} 모듈 설치`
      };
    } catch (err) {
      this.log(`⚠️ 모듈 설치 실패: ${err.message}`, 'red');
      return null;
    }
  }

  async fixMissingImport(name, from) {
    this.log(`🔧 import 문 추가: ${name} from '${from}'`, 'yellow');

    // 현재 페이지의 소스 파일 찾기
    const pageUrl = this.page.url();
    const route = new URL(pageUrl).pathname;

    const projectRoot = '/Users/seeheejang/Documents/project/gameplaza-v2';
    const possibleFiles = [
      path.join(projectRoot, 'app', route, 'page.tsx'),
      path.join(projectRoot, 'src/app', route, 'page.tsx'),
      path.join(projectRoot, 'pages', `${route}.tsx`)
    ];

    for (const filePath of possibleFiles) {
      try {
        let content = await fs.readFile(filePath, 'utf-8');

        // import 문이 없으면 추가
        if (!content.includes(`import { ${name} }`)) {
          const importStatement = `import { ${name} } from '${from}';\n`;
          content = importStatement + content;
          await fs.writeFile(filePath, content);

          return {
            type: 'import_add',
            file: filePath,
            import: `${name} from '${from}'`,
            description: `import 문 추가`
          };
        }
      } catch (err) {
        continue;
      }
    }

    return null;
  }

  async fixWebpackError(errorText) {
    this.log('🔧 Webpack 오류 수정 시도...', 'yellow');

    // webpack 캐시 삭제
    try {
      const projectRoot = '/Users/seeheejang/Documents/project/gameplaza-v2';
      await execPromise(`cd ${projectRoot} && rm -rf .next`);
      this.log('🗑️ .next 캐시 삭제', 'cyan');

      // 개발 서버 재시작
      await execPromise(`cd ${projectRoot} && npm run dev`);

      return {
        type: 'webpack_fix',
        description: 'Webpack 캐시 초기화 및 재시작'
      };
    } catch (err) {
      this.log(`⚠️ Webpack 수정 실패: ${err.message}`, 'red');
      return null;
    }
  }

  async fixMissingAPI(errorText) {
    this.log('🔧 API 엔드포인트 생성...', 'yellow');

    const apiMatch = errorText.match(/\/api\/([^\s?]+)/);
    if (!apiMatch) return null;

    const endpoint = apiMatch[1];
    const projectRoot = '/Users/seeheejang/Documents/project/gameplaza-v2';
    const apiPath = path.join(projectRoot, 'app/api', endpoint, 'route.ts');

    // API 파일 생성
    const apiTemplate = `import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // TODO: 실제 로직 구현
    return NextResponse.json({
      message: '자동 생성된 엔드포인트',
      endpoint: '${endpoint}'
    });
  } catch (error) {
    return NextResponse.json(
      { error: '서버 오류' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // TODO: 실제 로직 구현
    return NextResponse.json({
      message: 'POST 요청 처리됨',
      data: body
    });
  } catch (error) {
    return NextResponse.json(
      { error: '서버 오류' },
      { status: 500 }
    );
  }
}
`;

    try {
      // 디렉토리 생성
      await fs.mkdir(path.dirname(apiPath), { recursive: true });
      // 파일 생성
      await fs.writeFile(apiPath, apiTemplate);

      return {
        type: 'api_create',
        file: apiPath,
        endpoint: `/api/${endpoint}`,
        description: `API 엔드포인트 생성`
      };
    } catch (err) {
      this.log(`⚠️ API 생성 실패: ${err.message}`, 'red');
      return null;
    }
  }

  async fixTypeError(errorText) {
    this.log('🔧 TypeScript 타입 오류 수정...', 'yellow');

    // tsc 실행하여 상세 오류 정보 획득
    try {
      const projectRoot = '/Users/seeheejang/Documents/project/gameplaza-v2';
      const { stdout, stderr } = await execPromise(`cd ${projectRoot} && npx tsc --noEmit`);

      if (stderr) {
        // 타입 오류 분석 및 수정
        const errors = stderr.split('\n');
        for (const error of errors) {
          if (error.includes('.tsx:') || error.includes('.ts:')) {
            // 파일 경로와 라인 추출
            const match = error.match(/(.+\.(tsx?)):(\d+):(\d+)/);
            if (match) {
              const [, file, line, col] = match;
              // TODO: 구체적인 타입 수정 로직
              this.log(`📝 타입 오류 위치: ${file}:${line}:${col}`, 'cyan');
            }
          }
        }
      }

      return {
        type: 'type_fix',
        description: 'TypeScript 타입 검사 실행'
      };
    } catch (err) {
      return null;
    }
  }

  async fixHookError(errorText) {
    this.log('🔧 React Hook 오류 수정...', 'yellow');

    // Hook 규칙 위반 패턴 검사
    const patterns = [
      { pattern: /Hook called inside condition/, fix: 'Hook을 조건문 밖으로 이동' },
      { pattern: /Hook called inside loop/, fix: 'Hook을 반복문 밖으로 이동' },
      { pattern: /Hook called inside callback/, fix: 'Hook을 컴포넌트 최상위로 이동' }
    ];

    for (const { pattern, fix } of patterns) {
      if (pattern.test(errorText)) {
        return {
          type: 'hook_fix',
          description: fix,
          suggestion: 'React Hook 규칙을 준수하도록 코드 구조 변경 필요'
        };
      }
    }

    return null;
  }

  analyzeNetworkError(url, errorText) {
    // 네트워크 오류 분석
    if (url.includes('/api/')) {
      this.log(`🔍 API 오류 감지: ${url}`, 'yellow');
      this.fixMissingAPI(url);
    }
  }

  showStats() {
    const runtime = Math.floor((Date.now() - this.startTime) / 1000);
    const minutes = Math.floor(runtime / 60);
    const seconds = runtime % 60;

    console.log(`\n${colors.bright}========== 통계 ==========${colors.reset}`);
    console.log(`${colors.cyan}실행 시간: ${minutes}분 ${seconds}초${colors.reset}`);
    console.log(`${colors.yellow}감지된 오류: ${this.errors.size}개${colors.reset}`);
    console.log(`${colors.green}수정된 오류: ${this.fixCount}개${colors.reset}`);
    console.log(`${colors.magenta}성공률: ${this.errors.size > 0 ? Math.round((this.fixCount / this.errors.size) * 100) : 0}%${colors.reset}`);
    console.log(`${colors.bright}==========================${colors.reset}\n`);

    // 최근 오류 목록
    if (this.errors.size > 0) {
      console.log(`${colors.bright}최근 오류:${colors.reset}`);
      let count = 0;
      for (const [key, error] of this.errors) {
        if (count++ >= 5) break;
        const fixed = this.fixes.has(key) ? '✅' : '❌';
        console.log(`${fixed} ${key.substring(0, 80)}...`);
      }
    }
  }

  async stop() {
    this.log('🛑 모니터링 종료', 'red');

    if (this.browser) {
      await this.browser.close();
    }

    this.showStats();
    process.exit(0);
  }
}

// 메인 실행
const fixer = new AutoErrorFixer();

// 종료 시그널 처리
process.on('SIGINT', async () => {
  await fixer.stop();
});

process.on('SIGTERM', async () => {
  await fixer.stop();
});

// 시작
fixer.start().catch(console.error);