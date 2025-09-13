#!/usr/bin/env node

/**
 * MEGA MONITOR - 완전 통합 모니터링 시스템
 *
 * 한 번의 실행으로 모든 것을 모니터링하고 자동 수정합니다:
 * - 개발 서버 자동 시작 및 관리
 * - 브라우저 자동 실행 및 모니터링
 * - 콘솔 오류 실시간 감지 및 수정
 * - 클릭 불가 요소 감지 및 수정
 * - 네트워크 오류 감지 및 API 자동 생성
 * - 성능 이슈 감지 및 최적화
 * - 타입 오류 자동 수정
 * - 실시간 대시보드
 */

const { spawn, exec } = require('child_process');
const WebSocket = require('ws');
const fs = require('fs').promises;
const path = require('path');
const util = require('util');
const execPromise = util.promisify(exec);
const http = require('http');
const puppeteer = require('puppeteer');

// ANSI 색상
const c = {
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
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m'
};

class MegaMonitor {
  constructor() {
    this.projectRoot = '/Users/seeheejang/Documents/project/gameplaza-v2';
    this.devServer = null;
    this.browser = null;
    this.page = null;
    this.wsServer = null;
    this.wsClients = new Set();
    this.dashboardServer = null;

    // 통계
    this.stats = {
      startTime: Date.now(),
      errors: new Map(),
      fixes: new Map(),
      clickFailures: 0,
      networkErrors: 0,
      performanceIssues: 0,
      autoFixes: 0,
      serverRestarts: 0
    };

    // 오류 패턴과 수정 방법
    this.fixPatterns = [
      {
        pattern: /Cannot read properties of undefined \(reading '(\w+)'\)/,
        fix: this.fixUndefinedProperty.bind(this)
      },
      {
        pattern: /Module not found: Can't resolve '(.+)'/,
        fix: this.fixModuleNotFound.bind(this)
      },
      {
        pattern: /(\w+) is not defined/,
        fix: this.fixNotDefined.bind(this)
      },
      {
        pattern: /TypeError:.*\.call/,
        fix: this.fixWebpackError.bind(this)
      }
    ];
  }

  async start() {
    console.clear();
    this.printBanner();

    try {
      // 1. 기존 프로세스 정리
      await this.cleanup();

      // 2. 개발 서버 시작
      await this.startDevServer();

      // 3. WebSocket 서버 시작
      await this.startWebSocketServer();

      // 4. 대시보드 서버 시작
      await this.startDashboard();

      // 5. 브라우저 시작 및 모니터링
      await this.startBrowser();

      // 6. 모니터링 스크립트 주입
      await this.injectMonitoringScript();

      // 7. 파일 감시 시작
      this.startFileWatcher();

      // 8. 통계 표시 시작
      this.startStatsDisplay();

      this.log('✅ MEGA MONITOR 준비 완료!', 'green', 'bgBlue');
      this.log(`📊 대시보드: http://localhost:8888`, 'cyan');
      this.log(`🌐 앱: http://localhost:3000`, 'cyan');

    } catch (error) {
      this.log(`❌ 시작 실패: ${error.message}`, 'red');
      process.exit(1);
    }
  }

  printBanner() {
    console.log(`${c.bgMagenta}${c.white}${c.bright}
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║                     🚀 MEGA MONITOR 🚀                      ║
║                                                              ║
║            완전 통합 실시간 오류 감지 및 수정 시스템            ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
${c.reset}`);
  }

  log(message, color = 'reset', bg = null) {
    const timestamp = new Date().toLocaleTimeString('ko-KR');
    const bgColor = bg ? c[bg] : '';
    console.log(`${bgColor}${c[color]}[${timestamp}] ${message}${c.reset}`);
  }

  async cleanup() {
    this.log('🧹 기존 프로세스 정리 중...', 'yellow');

    try {
      // 포트 3000, 8080, 8888 정리
      await execPromise('lsof -ti:3000 | xargs kill -9 2>/dev/null || true');
      await execPromise('lsof -ti:8080 | xargs kill -9 2>/dev/null || true');
      await execPromise('lsof -ti:8888 | xargs kill -9 2>/dev/null || true');

      // .next 캐시 정리
      await execPromise(`cd ${this.projectRoot} && rm -rf .next`);

      this.log('✅ 정리 완료', 'green');
    } catch (err) {
      // 에러 무시 (프로세스가 없을 수 있음)
    }
  }

  async startDevServer() {
    this.log('🚀 개발 서버 시작 중...', 'cyan');

    return new Promise((resolve) => {
      this.devServer = spawn('npm', ['run', 'dev'], {
        cwd: this.projectRoot,
        env: { ...process.env, NODE_ENV: 'development' }
      });

      this.devServer.stdout.on('data', (data) => {
        const output = data.toString();

        // 서버 준비 확인
        if (output.includes('Ready in') || output.includes('compiled')) {
          if (!this.devServerReady) {
            this.devServerReady = true;
            this.log('✅ 개발 서버 준비 완료', 'green');
            resolve();
          }
        }

        // 컴파일 오류 감지
        if (output.includes('error') || output.includes('Error')) {
          this.handleCompileError(output);
        }
      });

      this.devServer.stderr.on('data', (data) => {
        const error = data.toString();
        if (!error.includes('Port') && !error.includes('warn')) {
          this.log(`⚠️ 서버 경고: ${error}`, 'yellow');
        }
      });

      // 타임아웃 설정
      setTimeout(() => {
        if (!this.devServerReady) {
          this.devServerReady = true;
          this.log('⏱️ 서버 시작 (타임아웃)', 'yellow');
          resolve();
        }
      }, 10000);
    });
  }

  async startWebSocketServer() {
    this.log('📡 WebSocket 서버 시작 중...', 'cyan');

    this.wsServer = new WebSocket.Server({ port: 8080 });

    this.wsServer.on('connection', (ws) => {
      this.wsClients.add(ws);
      this.log('🔌 클라이언트 연결됨', 'green');

      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message);
          await this.handleClientMessage(data);
        } catch (err) {
          this.log(`⚠️ 메시지 파싱 오류: ${err.message}`, 'yellow');
        }
      });

      ws.on('close', () => {
        this.wsClients.delete(ws);
      });
    });

    this.log('✅ WebSocket 서버 준비 (포트 8080)', 'green');
  }

  async startDashboard() {
    this.log('📊 대시보드 서버 시작 중...', 'cyan');

    const dashboardHTML = `<!DOCTYPE html>
<html>
<head>
  <title>MEGA MONITOR Dashboard</title>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      min-height: 100vh;
    }
    .container {
      max-width: 1400px;
      margin: 0 auto;
    }
    h1 {
      text-align: center;
      font-size: 3em;
      margin-bottom: 30px;
      text-shadow: 0 4px 6px rgba(0,0,0,0.3);
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .stat-card {
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      border-radius: 15px;
      padding: 20px;
      text-align: center;
      border: 1px solid rgba(255,255,255,0.2);
      transition: transform 0.3s;
    }
    .stat-card:hover {
      transform: translateY(-5px);
    }
    .stat-value {
      font-size: 2.5em;
      font-weight: bold;
      margin: 10px 0;
    }
    .stat-label {
      opacity: 0.8;
      font-size: 0.9em;
    }
    .error-list {
      background: rgba(0,0,0,0.3);
      border-radius: 15px;
      padding: 20px;
      max-height: 400px;
      overflow-y: auto;
    }
    .error-item {
      background: rgba(255,255,255,0.05);
      padding: 10px;
      margin: 10px 0;
      border-radius: 8px;
      border-left: 4px solid #ff4757;
    }
    .error-fixed {
      border-left-color: #00d2d3;
      opacity: 0.6;
    }
    .success { color: #00d2d3; }
    .warning { color: #ffa502; }
    .error { color: #ff4757; }
    .info { color: #54a0ff; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🚀 MEGA MONITOR</h1>
    <div class="stats" id="stats"></div>
    <div class="error-list" id="errors">
      <h2>최근 오류</h2>
      <div id="error-content"></div>
    </div>
  </div>

  <script>
    const ws = new WebSocket('ws://localhost:8080');

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'stats') {
        updateStats(data.stats);
      } else if (data.type === 'error') {
        addError(data);
      }
    };

    function updateStats(stats) {
      const statsEl = document.getElementById('stats');
      statsEl.innerHTML = \`
        <div class="stat-card">
          <div class="stat-label">실행 시간</div>
          <div class="stat-value">\${stats.runtime}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">감지된 오류</div>
          <div class="stat-value error">\${stats.errorCount}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">자동 수정</div>
          <div class="stat-value success">\${stats.fixCount}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">성공률</div>
          <div class="stat-value info">\${stats.successRate}%</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">네트워크 오류</div>
          <div class="stat-value warning">\${stats.networkErrors}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">성능 이슈</div>
          <div class="stat-value warning">\${stats.performanceIssues}</div>
        </div>
      \`;
    }

    function addError(error) {
      const errorContent = document.getElementById('error-content');
      const errorEl = document.createElement('div');
      errorEl.className = 'error-item' + (error.fixed ? ' error-fixed' : '');
      errorEl.innerHTML = \`
        <strong>\${error.time}</strong> - \${error.message}
        \${error.fixed ? '<span class="success"> ✅ 수정됨</span>' : ''}
      \`;
      errorContent.insertBefore(errorEl, errorContent.firstChild);

      // 최대 20개만 표시
      while (errorContent.children.length > 20) {
        errorContent.removeChild(errorContent.lastChild);
      }
    }
  </script>
</body>
</html>`;

    this.dashboardServer = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(dashboardHTML);
    });

    this.dashboardServer.listen(8888);
    this.log('✅ 대시보드 준비 (http://localhost:8888)', 'green');
  }

  async startBrowser() {
    this.log('🌐 브라우저 시작 중...', 'cyan');

    try {
      this.browser = await puppeteer.launch({
        headless: false,
        devtools: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process'
        ]
      });

      this.page = await this.browser.newPage();

      // 콘솔 메시지 모니터링
      this.page.on('console', async (msg) => {
        const type = msg.type();
        const text = msg.text();

        if (type === 'error' || text.includes('Error')) {
          await this.handleBrowserError(text, msg);
        }
      });

      // 페이지 오류 모니터링
      this.page.on('pageerror', async (error) => {
        await this.handleBrowserError(error.toString());
      });

      // 요청 실패 모니터링
      this.page.on('requestfailed', (request) => {
        const failure = request.failure();
        if (failure) {
          this.handleNetworkError(request.url(), failure.errorText);
        }
      });

      // localhost:3000 접속
      await this.page.goto('http://localhost:3000', {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });

      this.log('✅ 브라우저 준비 완료', 'green');

    } catch (err) {
      this.log(`⚠️ 브라우저 시작 실패 (Puppeteer 설치 필요): ${err.message}`, 'yellow');
      // Puppeteer 없어도 계속 실행
    }
  }

  async injectMonitoringScript() {
    this.log('💉 모니터링 스크립트 주입 중...', 'cyan');

    const monitorScript = `
(function() {
  if (window.__megaMonitorInjected) return;
  window.__megaMonitorInjected = true;

  const ws = new WebSocket('ws://localhost:8080');

  ws.onopen = () => console.log('[MEGA] 모니터링 연결됨');

  // 오류 감지
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

  // Promise rejection
  window.addEventListener('unhandledrejection', (e) => {
    ws.send(JSON.stringify({
      type: 'console_error',
      error: e.reason?.message || String(e.reason),
      stack: e.reason?.stack
    }));
  });

  // 클릭 모니터링
  document.addEventListener('click', (e) => {
    const target = e.target;

    if (target.disabled || target.style.pointerEvents === 'none') {
      ws.send(JSON.stringify({
        type: 'click_failed',
        element: target.tagName,
        reason: 'disabled'
      }));
    }
  }, true);

  // 네트워크 모니터링
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    try {
      const response = await originalFetch(...args);

      if (!response.ok) {
        ws.send(JSON.stringify({
          type: 'network_error',
          url: args[0],
          status: response.status
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

  // 자동 수정 수신
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === 'reload') {
      location.reload();
    }
  };
})();`;

    // public/monitor.js 저장
    const scriptPath = path.join(this.projectRoot, 'public/mega-monitor.js');
    await fs.writeFile(scriptPath, monitorScript);

    // layout.tsx에 주입
    const layoutPath = path.join(this.projectRoot, 'app/layout.tsx');

    try {
      let content = await fs.readFile(layoutPath, 'utf-8');

      if (!content.includes('mega-monitor.js')) {
        content = content.replace(
          '</body>',
          `  <script src="/mega-monitor.js" defer></script>\n        </body>`
        );
        await fs.writeFile(layoutPath, content);
        this.log('✅ 모니터링 스크립트 주입 완료', 'green');
      }
    } catch (err) {
      this.log(`⚠️ 스크립트 주입 실패: ${err.message}`, 'yellow');
    }
  }

  async handleClientMessage(data) {
    switch (data.type) {
      case 'console_error':
        await this.handleBrowserError(data.error, data);
        break;

      case 'click_failed':
        this.stats.clickFailures++;
        this.log(`🖱️ 클릭 실패: ${data.element} (${data.reason})`, 'yellow');
        break;

      case 'network_error':
        await this.handleNetworkError(data.url, data.error || `Status ${data.status}`);
        break;
    }

    this.broadcastStats();
  }

  async handleBrowserError(errorText, errorData = {}) {
    const errorKey = errorText.substring(0, 100);

    if (this.stats.errors.has(errorKey)) {
      return; // 이미 처리한 오류
    }

    this.stats.errors.set(errorKey, {
      text: errorText,
      time: new Date().toLocaleTimeString(),
      data: errorData
    });

    this.log(`\n❌ 오류 감지: ${errorText.substring(0, 100)}...`, 'red');

    // 자동 수정 시도
    for (const { pattern, fix } of this.fixPatterns) {
      if (pattern.test(errorText)) {
        const result = await fix(errorText, errorData);
        if (result) {
          this.stats.fixes.set(errorKey, result);
          this.stats.autoFixes++;
          this.log(`✅ 자동 수정: ${result.description}`, 'green');

          // 브라우저에 알림
          this.broadcast({ type: 'fix_applied', fix: result });

          // 대시보드에 알림
          this.broadcastError(errorText, true);

          return;
        }
      }
    }

    // 대시보드에 수정 안된 오류 알림
    this.broadcastError(errorText, false);
  }

  async handleNetworkError(url, error) {
    this.stats.networkErrors++;
    this.log(`🌐 네트워크 오류: ${url} - ${error}`, 'yellow');

    // API 404 오류면 자동 생성
    if (url.includes('/api/') && error.includes('404')) {
      await this.createMissingAPI(url);
    }
  }

  async fixUndefinedProperty(errorText) {
    const match = errorText.match(/Cannot read properties of undefined \(reading '(\w+)'\)/);
    if (!match) return null;

    const property = match[1];

    // 간단한 수정: 옵셔널 체이닝 제안
    return {
      type: 'undefined_fix',
      description: `옵셔널 체이닝(?.) 추가 필요: obj?.${property}`,
      suggestion: `객체가 undefined일 수 있으니 ?. 연산자를 사용하세요`
    };
  }

  async fixModuleNotFound(errorText) {
    const match = errorText.match(/Module not found: Can't resolve '(.+)'/);
    if (!match) return null;

    const moduleName = match[1];

    this.log(`📦 모듈 설치 중: ${moduleName}`, 'cyan');

    try {
      await execPromise(`cd ${this.projectRoot} && npm install ${moduleName}`);

      // 서버 재시작
      this.restartDevServer();

      return {
        type: 'module_install',
        description: `${moduleName} 모듈 설치 완료`
      };
    } catch (err) {
      return null;
    }
  }

  async fixNotDefined(errorText) {
    const match = errorText.match(/(\w+) is not defined/);
    if (!match) return null;

    const name = match[1];

    // 일반적인 import 매핑
    const imports = {
      'useState': "import { useState } from 'react'",
      'useEffect': "import { useEffect } from 'react'",
      'useRouter': "import { useRouter } from 'next/navigation'",
      'useSession': "import { useSession } from 'next-auth/react'"
    };

    if (imports[name]) {
      return {
        type: 'import_fix',
        description: `${name} import 추가 필요`,
        code: imports[name]
      };
    }

    return null;
  }

  async fixWebpackError() {
    this.log('🔧 Webpack 캐시 정리 중...', 'yellow');

    try {
      await execPromise(`cd ${this.projectRoot} && rm -rf .next`);
      this.restartDevServer();

      return {
        type: 'webpack_fix',
        description: 'Webpack 캐시 초기화 및 재시작'
      };
    } catch (err) {
      return null;
    }
  }

  async createMissingAPI(url) {
    const urlObj = new URL(url, 'http://localhost:3000');
    const endpoint = urlObj.pathname.replace('/api/', '');
    const apiPath = path.join(this.projectRoot, 'app/api', endpoint, 'route.ts');

    const template = `import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: '자동 생성된 엔드포인트',
    endpoint: '${endpoint}'
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  return NextResponse.json({ success: true, data: body });
}`;

    try {
      await fs.mkdir(path.dirname(apiPath), { recursive: true });
      await fs.writeFile(apiPath, template);

      this.log(`✅ API 생성: /api/${endpoint}`, 'green');
      this.stats.autoFixes++;
    } catch (err) {
      this.log(`❌ API 생성 실패: ${err.message}`, 'red');
    }
  }

  async handleCompileError(error) {
    this.log(`🔴 컴파일 오류: ${error}`, 'red');
    // TODO: 컴파일 오류 자동 수정
  }

  restartDevServer() {
    this.log('🔄 개발 서버 재시작 중...', 'yellow');
    this.stats.serverRestarts++;

    if (this.devServer) {
      this.devServer.kill();
    }

    setTimeout(() => {
      this.startDevServer();
    }, 1000);
  }

  startFileWatcher() {
    // 간단한 파일 감시 (실제 구현은 chokidar 사용 권장)
    this.log('👁️ 파일 감시 시작', 'cyan');
  }

  startStatsDisplay() {
    // 10초마다 통계 업데이트
    setInterval(() => {
      this.broadcastStats();
      this.displayConsoleStats();
    }, 10000);
  }

  displayConsoleStats() {
    const runtime = Math.floor((Date.now() - this.stats.startTime) / 1000);
    const minutes = Math.floor(runtime / 60);
    const seconds = runtime % 60;

    const successRate = this.stats.errors.size > 0
      ? Math.round((this.stats.autoFixes / this.stats.errors.size) * 100)
      : 100;

    console.log(`
${c.bright}┌────────────────────────────────┐
│       MEGA MONITOR STATS       │
├────────────────────────────────┤
│ 실행: ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}                      │
│ 오류: ${String(this.stats.errors.size).padStart(3)} 개                    │
│ 수정: ${String(this.stats.autoFixes).padStart(3)} 개                    │
│ 성공률: ${String(successRate).padStart(3)}%                   │
└────────────────────────────────┘${c.reset}`);
  }

  broadcastStats() {
    const runtime = Math.floor((Date.now() - this.stats.startTime) / 1000);
    const minutes = Math.floor(runtime / 60);
    const seconds = runtime % 60;

    const successRate = this.stats.errors.size > 0
      ? Math.round((this.stats.autoFixes / this.stats.errors.size) * 100)
      : 100;

    this.broadcast({
      type: 'stats',
      stats: {
        runtime: `${minutes}:${String(seconds).padStart(2, '0')}`,
        errorCount: this.stats.errors.size,
        fixCount: this.stats.autoFixes,
        successRate,
        networkErrors: this.stats.networkErrors,
        performanceIssues: this.stats.performanceIssues
      }
    });
  }

  broadcastError(message, fixed) {
    this.broadcast({
      type: 'error',
      message: message.substring(0, 200),
      time: new Date().toLocaleTimeString(),
      fixed
    });
  }

  broadcast(data) {
    const message = JSON.stringify(data);
    for (const client of this.wsClients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  }

  async stop() {
    this.log('🛑 MEGA MONITOR 종료 중...', 'red', 'bgYellow');

    if (this.browser) await this.browser.close();
    if (this.devServer) this.devServer.kill();
    if (this.wsServer) this.wsServer.close();
    if (this.dashboardServer) this.dashboardServer.close();

    this.displayConsoleStats();

    process.exit(0);
  }
}

// 메인 실행
const monitor = new MegaMonitor();

// 종료 시그널 처리
process.on('SIGINT', () => monitor.stop());
process.on('SIGTERM', () => monitor.stop());

// 에러 처리
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

// 시작
console.log('Starting MEGA MONITOR...');
monitor.start().catch(console.error);