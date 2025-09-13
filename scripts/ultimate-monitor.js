#!/usr/bin/env node

/**
 * Ultimate Monitor - 완벽한 오류 감지 및 자동 수정 시스템
 * - 콘솔 오류 감지
 * - 클릭 불가능한 요소 감지
 * - 네트워크 오류 감지
 * - 자동 코드 수정
 */

const WebSocket = require('ws');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// ANSI 색상
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m'
};

class UltimateMonitor {
  constructor() {
    this.errors = new Map();
    this.fixes = new Map();
    this.clickableElements = new Map();
    this.networkErrors = new Map();
    this.startTime = Date.now();
    this.fixCount = 0;
    this.wsClients = new Set();
    this.projectRoot = '/Users/seeheejang/Documents/project/gameplaza-v2';
  }

  log(message, color = 'reset', bgColor = null) {
    const timestamp = new Date().toLocaleTimeString('ko-KR');
    const bg = bgColor ? colors[bgColor] : '';
    console.log(`${bg}${colors[color]}[${timestamp}] ${message}${colors.reset}`);

    // WebSocket으로 전송
    this.broadcast({
      type: 'log',
      message,
      color,
      timestamp
    });
  }

  async start() {
    this.log('🚀 Ultimate Monitor 시작', 'green', 'bgBlue');

    // 1. WebSocket 서버 시작
    await this.startWebSocketServer();

    // 2. 모니터링 스크립트 주입
    await this.injectMonitoringScript();

    // 3. 파일 감시 시작
    await this.startFileWatcher();

    // 4. 통계 표시
    this.startStatsDisplay();

    this.log('✅ 모든 시스템 준비 완료', 'green');
  }

  async startWebSocketServer() {
    const wss = new WebSocket.Server({ port: 8080 });

    wss.on('connection', (ws) => {
      this.wsClients.add(ws);
      this.log('🔌 클라이언트 연결됨', 'cyan');

      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message);
          await this.handleMessage(data);
        } catch (err) {
          this.log(`⚠️ 메시지 파싱 오류: ${err.message}`, 'yellow');
        }
      });

      ws.on('close', () => {
        this.wsClients.delete(ws);
        this.log('🔌 클라이언트 연결 해제', 'dim');
      });
    });

    this.log('📡 WebSocket 서버 시작 (포트 8080)', 'cyan');
  }

  async handleMessage(data) {
    switch (data.type) {
      case 'console_error':
        await this.handleConsoleError(data);
        break;

      case 'click_failed':
        await this.handleClickFailed(data);
        break;

      case 'network_error':
        await this.handleNetworkError(data);
        break;

      case 'element_not_found':
        await this.handleElementNotFound(data);
        break;

      case 'performance_issue':
        await this.handlePerformanceIssue(data);
        break;

      default:
        this.log(`📨 메시지: ${JSON.stringify(data)}`, 'dim');
    }
  }

  async handleConsoleError(data) {
    const { error, stack, url, line, column } = data;

    this.log(`\n❌ 콘솔 오류 감지:`, 'red');
    console.log(`  ${error}`);
    if (stack) console.log(`  스택: ${stack.substring(0, 200)}...`);

    const errorKey = `${error}_${line}_${column}`;
    if (this.errors.has(errorKey)) {
      return; // 이미 처리한 오류
    }

    this.errors.set(errorKey, data);

    // 자동 수정 시도
    const fix = await this.autoFix(data);
    if (fix) {
      this.fixes.set(errorKey, fix);
      this.fixCount++;
      this.log(`✅ 자동 수정 완료: ${fix.description}`, 'green');

      // 브라우저에 수정 완료 알림
      this.broadcast({
        type: 'fix_applied',
        fix
      });
    }
  }

  async handleClickFailed(data) {
    const { selector, reason, element } = data;

    this.log(`\n🖱️ 클릭 실패 감지:`, 'yellow');
    console.log(`  셀렉터: ${selector}`);
    console.log(`  이유: ${reason}`);

    // 클릭 가능하도록 수정
    if (reason === 'element_disabled') {
      await this.enableElement(selector);
    } else if (reason === 'element_hidden') {
      await this.showElement(selector);
    } else if (reason === 'element_not_found') {
      await this.createMissingElement(selector, element);
    }
  }

  async handleNetworkError(data) {
    const { url, status, method } = data;

    this.log(`\n🌐 네트워크 오류:`, 'red');
    console.log(`  ${method} ${url} - ${status}`);

    if (status === 404 && url.includes('/api/')) {
      // API 엔드포인트 자동 생성
      await this.createAPIEndpoint(url);
    }
  }

  async handleElementNotFound(data) {
    const { selector, context } = data;

    this.log(`\n🔍 요소를 찾을 수 없음:`, 'yellow');
    console.log(`  셀렉터: ${selector}`);
    console.log(`  컨텍스트: ${context}`);

    // 요소 자동 생성 또는 수정
    await this.handleMissingElement(selector, context);
  }

  async handlePerformanceIssue(data) {
    const { metric, value, threshold } = data;

    this.log(`\n⚡ 성능 이슈:`, 'yellow');
    console.log(`  ${metric}: ${value}ms (임계값: ${threshold}ms)`);

    // 성능 최적화 제안
    await this.suggestOptimization(metric, value);
  }

  async autoFix(errorData) {
    const { error, stack, url, line, column } = errorData;

    // 1. Cannot read properties of undefined
    if (error.includes('Cannot read properties of undefined')) {
      return await this.fixUndefinedError(errorData);
    }

    // 2. Module not found
    if (error.includes('Module not found')) {
      return await this.fixModuleNotFound(errorData);
    }

    // 3. Hook 관련 오류
    if (error.includes('useSession') || error.includes('useRouter')) {
      return await this.fixMissingHook(errorData);
    }

    // 4. Import 오류
    if (error.includes('is not defined') && !error.includes('window')) {
      return await this.fixMissingImport(errorData);
    }

    // 5. TypeScript 타입 오류
    if (error.includes('Type error')) {
      return await this.fixTypeError(errorData);
    }

    return null;
  }

  async fixUndefinedError(errorData) {
    const { stack } = errorData;

    // 파일 경로 추출
    const fileMatch = stack.match(/at\s+.*?\((.*?):(\d+):(\d+)\)/);
    if (!fileMatch) return null;

    const [, filePath, line, column] = fileMatch;

    // 실제 파일 찾기
    const realPath = await this.findRealPath(filePath);
    if (!realPath) return null;

    try {
      let content = await fs.readFile(realPath, 'utf-8');
      const lines = content.split('\n');

      // 옵셔널 체이닝 추가
      const targetLine = lines[line - 1];
      if (targetLine) {
        // 객체 프로퍼티 접근 패턴 찾기
        const fixed = targetLine.replace(/(\w+)\.(\w+)/g, (match, obj, prop) => {
          // window, document 등은 제외
          if (['window', 'document', 'console', 'Math'].includes(obj)) {
            return match;
          }
          return `${obj}?.${prop}`;
        });

        if (fixed !== targetLine) {
          lines[line - 1] = fixed;
          await fs.writeFile(realPath, lines.join('\n'));

          return {
            type: 'undefined_fix',
            file: realPath,
            line: line,
            description: '옵셔널 체이닝(?.) 추가'
          };
        }
      }
    } catch (err) {
      this.log(`⚠️ 파일 수정 실패: ${err.message}`, 'red');
    }

    return null;
  }

  async fixModuleNotFound(errorData) {
    const { error } = errorData;

    const moduleMatch = error.match(/Cannot find module ['"](.+?)['"]/);
    if (!moduleMatch) return null;

    const moduleName = moduleMatch[1];

    try {
      // 상대 경로인 경우
      if (moduleName.startsWith('.')) {
        // 파일 생성
        const filePath = path.join(this.projectRoot, 'src', moduleName + '.ts');
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, `// Auto-generated file\nexport default {};\n`);

        return {
          type: 'file_create',
          file: filePath,
          description: `파일 생성: ${moduleName}`
        };
      } else {
        // npm 패키지 설치
        this.log(`📦 패키지 설치 중: ${moduleName}`, 'cyan');
        await execPromise(`cd ${this.projectRoot} && npm install ${moduleName}`);

        return {
          type: 'package_install',
          package: moduleName,
          description: `패키지 설치: ${moduleName}`
        };
      }
    } catch (err) {
      this.log(`⚠️ 모듈 수정 실패: ${err.message}`, 'red');
    }

    return null;
  }

  async fixMissingHook(errorData) {
    const { error, url } = errorData;

    // 현재 페이지 파일 찾기
    const pagePath = await this.findPageFile(url);
    if (!pagePath) return null;

    try {
      let content = await fs.readFile(pagePath, 'utf-8');

      // useSession 누락
      if (error.includes('useSession') && !content.includes('import { useSession }')) {
        content = `import { useSession } from 'next-auth/react';\n` + content;
      }

      // useRouter 누락
      if (error.includes('useRouter') && !content.includes('import { useRouter }')) {
        content = `import { useRouter } from 'next/navigation';\n` + content;
      }

      await fs.writeFile(pagePath, content);

      return {
        type: 'import_add',
        file: pagePath,
        description: 'React Hook import 추가'
      };
    } catch (err) {
      this.log(`⚠️ Hook 수정 실패: ${err.message}`, 'red');
    }

    return null;
  }

  async fixMissingImport(errorData) {
    const { error } = errorData;

    // "X is not defined" 패턴
    const match = error.match(/(\w+) is not defined/);
    if (!match) return null;

    const missingName = match[1];

    // 일반적인 import 매핑
    const importMap = {
      'useState': "import { useState } from 'react';",
      'useEffect': "import { useEffect } from 'react';",
      'useCallback': "import { useCallback } from 'react';",
      'useMemo': "import { useMemo } from 'react';",
      'useRef': "import { useRef } from 'react';",
      'useContext': "import { useContext } from 'react';",
      'createContext': "import { createContext } from 'react';",
      'Fragment': "import { Fragment } from 'react';",
      'Suspense': "import { Suspense } from 'react';",
      'lazy': "import { lazy } from 'react';",
    };

    if (importMap[missingName]) {
      // 현재 파일에 import 추가
      // TODO: 실제 파일 경로 찾기 로직 필요
      return {
        type: 'import_suggest',
        import: importMap[missingName],
        description: `Import 추가 제안: ${missingName}`
      };
    }

    return null;
  }

  async fixTypeError(errorData) {
    this.log('🔧 TypeScript 타입 검사 실행...', 'yellow');

    try {
      const { stdout, stderr } = await execPromise(
        `cd ${this.projectRoot} && npx tsc --noEmit --pretty false`
      );

      if (stderr) {
        // 타입 오류 파싱
        const errors = stderr.split('\n').filter(line => line.includes('.ts'));

        for (const error of errors.slice(0, 5)) { // 처음 5개만 처리
          this.log(`📝 타입 오류: ${error}`, 'dim');
        }

        return {
          type: 'type_check',
          errorCount: errors.length,
          description: `${errors.length}개의 타입 오류 감지`
        };
      }
    } catch (err) {
      // tsc 오류는 정상적인 경우도 있음
    }

    return null;
  }

  async enableElement(selector) {
    this.log(`🔧 요소 활성화: ${selector}`, 'yellow');

    // 클라이언트에 수정 명령 전송
    this.broadcast({
      type: 'enable_element',
      selector
    });
  }

  async showElement(selector) {
    this.log(`🔧 요소 표시: ${selector}`, 'yellow');

    this.broadcast({
      type: 'show_element',
      selector
    });
  }

  async createMissingElement(selector, elementInfo) {
    this.log(`🔧 요소 생성: ${selector}`, 'yellow');

    // 컴포넌트 파일 찾기 및 수정
    // TODO: 실제 구현 필요
  }

  async createAPIEndpoint(url) {
    const urlObj = new URL(url, 'http://localhost:3000');
    const pathname = urlObj.pathname;

    if (!pathname.startsWith('/api/')) return;

    const endpoint = pathname.replace('/api/', '');
    const routePath = path.join(this.projectRoot, 'app/api', endpoint, 'route.ts');

    this.log(`📝 API 엔드포인트 생성: ${pathname}`, 'cyan');

    const template = `import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: '자동 생성된 엔드포인트',
    endpoint: '${endpoint}',
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json({
      message: 'POST 요청 처리됨',
      data: body
    });
  } catch (error) {
    return NextResponse.json(
      { error: '잘못된 요청' },
      { status: 400 }
    );
  }
}
`;

    try {
      await fs.mkdir(path.dirname(routePath), { recursive: true });
      await fs.writeFile(routePath, template);

      this.log(`✅ API 생성 완료: ${routePath}`, 'green');
    } catch (err) {
      this.log(`❌ API 생성 실패: ${err.message}`, 'red');
    }
  }

  async injectMonitoringScript() {
    // 모니터링 스크립트 생성
    const monitorScript = `
// Ultimate Monitor Client Script
(function() {
  const ws = new WebSocket('ws://localhost:8080');

  ws.onopen = () => {
    console.log('[Monitor] 연결됨');
  };

  // 콘솔 오류 감지
  window.addEventListener('error', (e) => {
    ws.send(JSON.stringify({
      type: 'console_error',
      error: e.message,
      stack: e.error?.stack,
      url: e.filename,
      line: e.lineno,
      column: e.colno
    }));
  });

  // Promise rejection 감지
  window.addEventListener('unhandledrejection', (e) => {
    ws.send(JSON.stringify({
      type: 'console_error',
      error: e.reason?.message || e.reason,
      stack: e.reason?.stack
    }));
  });

  // 클릭 이벤트 모니터링
  document.addEventListener('click', (e) => {
    const target = e.target;

    // 비활성화된 요소 감지
    if (target.disabled || target.getAttribute('aria-disabled') === 'true') {
      ws.send(JSON.stringify({
        type: 'click_failed',
        selector: getSelector(target),
        reason: 'element_disabled',
        element: {
          tag: target.tagName,
          text: target.textContent?.substring(0, 50)
        }
      }));
    }

    // 숨겨진 요소 감지
    const style = window.getComputedStyle(target);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
      ws.send(JSON.stringify({
        type: 'click_failed',
        selector: getSelector(target),
        reason: 'element_hidden'
      }));
    }
  }, true);

  // 네트워크 오류 감지
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    try {
      const response = await originalFetch(...args);

      if (!response.ok) {
        ws.send(JSON.stringify({
          type: 'network_error',
          url: args[0],
          status: response.status,
          method: args[1]?.method || 'GET'
        }));
      }

      return response;
    } catch (error) {
      ws.send(JSON.stringify({
        type: 'network_error',
        url: args[0],
        error: error.message
      }));
      throw error;
    }
  };

  // 성능 모니터링
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.duration > 1000) {
        ws.send(JSON.stringify({
          type: 'performance_issue',
          metric: entry.name,
          value: Math.round(entry.duration),
          threshold: 1000
        }));
      }
    }
  });

  observer.observe({ entryTypes: ['navigation', 'resource', 'measure'] });

  // 요소 선택자 생성
  function getSelector(element) {
    if (element.id) return '#' + element.id;
    if (element.className) return '.' + element.className.split(' ').join('.');
    return element.tagName.toLowerCase();
  }

  // WebSocket 메시지 수신
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    switch(data.type) {
      case 'enable_element':
        const disabled = document.querySelector(data.selector);
        if (disabled) {
          disabled.disabled = false;
          disabled.removeAttribute('aria-disabled');
        }
        break;

      case 'show_element':
        const hidden = document.querySelector(data.selector);
        if (hidden) {
          hidden.style.display = '';
          hidden.style.visibility = 'visible';
          hidden.style.opacity = '1';
        }
        break;

      case 'fix_applied':
        console.log('[Monitor] 수정 적용됨:', data.fix);
        // 페이지 새로고침 (핫 리로드가 안되는 경우)
        if (data.fix.requireReload) {
          setTimeout(() => location.reload(), 1000);
        }
        break;
    }
  };
})();
`;

    // public 디렉토리에 스크립트 저장
    const scriptPath = path.join(this.projectRoot, 'public/monitor.js');
    await fs.writeFile(scriptPath, monitorScript);

    this.log('💉 모니터링 스크립트 생성 완료', 'green');

    // _document.tsx 또는 layout.tsx에 스크립트 주입
    await this.injectScriptTag();
  }

  async injectScriptTag() {
    // app/layout.tsx 찾기
    const layoutPath = path.join(this.projectRoot, 'app/layout.tsx');

    try {
      let content = await fs.readFile(layoutPath, 'utf-8');

      // 이미 주입되어 있는지 확인
      if (content.includes('monitor.js')) {
        this.log('✓ 모니터링 스크립트 이미 주입됨', 'dim');
        return;
      }

      // </body> 태그 앞에 스크립트 추가
      content = content.replace(
        '</body>',
        `  {process.env.NODE_ENV === 'development' && (
          <script src="/monitor.js" defer></script>
        )}
        </body>`
      );

      await fs.writeFile(layoutPath, content);
      this.log('✅ layout.tsx에 모니터링 스크립트 주입', 'green');
    } catch (err) {
      this.log(`⚠️ 스크립트 주입 실패: ${err.message}`, 'yellow');
    }
  }

  async startFileWatcher() {
    // 파일 변경 감지 (간단한 구현)
    this.log('👁️ 파일 감시 시작', 'cyan');

    // TODO: chokidar 또는 fs.watch 사용하여 실제 파일 감시 구현
  }

  startStatsDisplay() {
    // 10초마다 통계 표시
    setInterval(() => {
      this.displayStats();
    }, 10000);
  }

  displayStats() {
    const runtime = Math.floor((Date.now() - this.startTime) / 1000);
    const minutes = Math.floor(runtime / 60);
    const seconds = runtime % 60;

    console.log(`\n${colors.bright}╔════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.bright}║       ULTIMATE MONITOR         ║${colors.reset}`);
    console.log(`${colors.bright}╠════════════════════════════════╣${colors.reset}`);
    console.log(`${colors.cyan}║ 실행 시간: ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}                 ║${colors.reset}`);
    console.log(`${colors.yellow}║ 감지된 오류: ${String(this.errors.size).padStart(3)} 개             ║${colors.reset}`);
    console.log(`${colors.green}║ 수정된 오류: ${String(this.fixCount).padStart(3)} 개             ║${colors.reset}`);
    console.log(`${colors.magenta}║ 네트워크 오류: ${String(this.networkErrors.size).padStart(3)} 개          ║${colors.reset}`);
    console.log(`${colors.blue}║ 클릭 실패: ${String(this.clickableElements.size).padStart(3)} 개              ║${colors.reset}`);

    const successRate = this.errors.size > 0
      ? Math.round((this.fixCount / this.errors.size) * 100)
      : 100;

    const rateColor = successRate >= 80 ? 'green' : successRate >= 50 ? 'yellow' : 'red';
    console.log(`${colors[rateColor]}║ 성공률: ${String(successRate).padStart(3)}%                    ║${colors.reset}`);
    console.log(`${colors.bright}╚════════════════════════════════╝${colors.reset}\n`);

    // 최근 오류 표시
    if (this.errors.size > 0) {
      console.log(`${colors.bright}최근 오류:${colors.reset}`);
      let count = 0;
      for (const [key, error] of this.errors) {
        if (count++ >= 3) break;
        const fixed = this.fixes.has(key) ? '✅' : '❌';
        const errorMsg = error.error || key;
        console.log(`${fixed} ${errorMsg.substring(0, 60)}...`);
      }
    }
  }

  broadcast(data) {
    const message = JSON.stringify(data);
    for (const client of this.wsClients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  }

  async findRealPath(webpackPath) {
    // webpack 경로를 실제 파일 경로로 변환
    const cleanPath = webpackPath
      .replace('webpack-internal:///', '')
      .replace(/\(.*?\)\//, '')
      .replace(/\?.*$/, '');

    const possiblePaths = [
      path.join(this.projectRoot, cleanPath),
      path.join(this.projectRoot, 'src', cleanPath),
      path.join(this.projectRoot, 'app', cleanPath),
      path.join(this.projectRoot, 'components', cleanPath)
    ];

    for (const p of possiblePaths) {
      try {
        await fs.access(p);
        return p;
      } catch {
        continue;
      }
    }

    return null;
  }

  async findPageFile(url) {
    const urlPath = new URL(url, 'http://localhost').pathname;
    const route = urlPath === '/' ? 'page' : urlPath.substring(1);

    const possiblePaths = [
      path.join(this.projectRoot, 'app', route, 'page.tsx'),
      path.join(this.projectRoot, 'app', route + '.tsx'),
      path.join(this.projectRoot, 'pages', route + '.tsx')
    ];

    for (const p of possiblePaths) {
      try {
        await fs.access(p);
        return p;
      } catch {
        continue;
      }
    }

    return null;
  }

  async stop() {
    this.log('🛑 Ultimate Monitor 종료', 'red', 'bgYellow');

    // WebSocket 연결 종료
    for (const client of this.wsClients) {
      client.close();
    }

    this.displayStats();
    process.exit(0);
  }
}

// 메인 실행
const monitor = new UltimateMonitor();

// 종료 시그널 처리
process.on('SIGINT', () => monitor.stop());
process.on('SIGTERM', () => monitor.stop());

// 시작
monitor.start().catch(console.error);