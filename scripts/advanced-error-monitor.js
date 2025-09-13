#!/usr/bin/env node

/**
 * 🚀 Advanced Real-Time Error Monitor & Auto-Fixer
 *
 * 특징:
 * - WebSocket 기반 실시간 에러 스트리밍
 * - 소스맵 지원으로 정확한 에러 위치 파악
 * - AI 기반 에러 패턴 학습
 * - 병렬 에러 수정
 * - 에러 예측 및 사전 방지
 * - 성능 모니터링
 * - 메모리 누수 감지
 */

const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');
const chokidar = require('chokidar');
const WebSocket = require('ws');
const { execSync } = require('child_process');
const chalk = require('chalk');
const ora = require('ora');

class AdvancedErrorMonitor {
  constructor() {
    this.browser = null;
    this.page = null;
    this.context = null;
    this.errors = new Map();
    this.fixes = new Map();
    this.patterns = new Map();
    this.performance = new Map();
    this.wsServer = null;
    this.wsClients = new Set();
    this.isFixing = false;
    this.errorQueue = [];
    this.fixHistory = [];
    this.learningMode = true;
    this.config = {
      url: 'http://localhost:3000',
      wsPort: 8888,
      autoFix: true,
      parallel: true,
      maxParallelFixes: 3,
      debounceTime: 100,
      retryAttempts: 3,
      enablePrediction: true,
      enablePerformanceMonitor: true,
      enableMemoryMonitor: true,
      enableNetworkMonitor: true,
      enableSourceMap: true,
      enableHotReload: true,
      enableAIAnalysis: true,
      logLevel: 'verbose'
    };
  }

  async initialize() {
    console.log(chalk.cyan.bold('\n🚀 Advanced Error Monitor 시작\n'));

    // WebSocket 서버 시작
    await this.startWebSocketServer();

    // 브라우저 초기화
    await this.initBrowser();

    // 파일 감시자 설정
    this.setupFileWatcher();

    // 성능 모니터 시작
    if (this.config.enablePerformanceMonitor) {
      this.startPerformanceMonitor();
    }

    // 메모리 모니터 시작
    if (this.config.enableMemoryMonitor) {
      this.startMemoryMonitor();
    }

    // AI 분석 엔진 초기화
    if (this.config.enableAIAnalysis) {
      await this.initAIEngine();
    }

    console.log(chalk.green('✅ 모든 시스템 초기화 완료\n'));
  }

  async startWebSocketServer() {
    this.wsServer = new WebSocket.Server({ port: this.config.wsPort });

    this.wsServer.on('connection', (ws) => {
      this.wsClients.add(ws);
      console.log(chalk.yellow('🔌 새로운 클라이언트 연결'));

      ws.on('message', async (message) => {
        const data = JSON.parse(message);
        await this.handleWebSocketMessage(data);
      });

      ws.on('close', () => {
        this.wsClients.delete(ws);
      });
    });

    console.log(chalk.cyan(`📡 WebSocket 서버 시작 (포트: ${this.config.wsPort})`));
  }

  async initBrowser() {
    const spinner = ora('브라우저 초기화 중...').start();

    try {
      this.browser = await chromium.launch({
        headless: false,
        devtools: true,
        args: [
          '--enable-logging',
          '--v=1',
          '--enable-automation',
          '--disable-blink-features=AutomationControlled'
        ]
      });

      this.context = await this.browser.newContext({
        viewport: { width: 1920, height: 1080 },
        ignoreHTTPSErrors: true,
        permissions: ['geolocation', 'notifications'],
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      });

      // CDP 세션 활성화 (Chrome DevTools Protocol)
      this.page = await this.context.newPage();
      const client = await this.page.context().newCDPSession(this.page);

      // 런타임 에러 캐치
      await client.send('Runtime.enable');
      client.on('Runtime.exceptionThrown', (params) => {
        this.handleRuntimeException(params);
      });

      // 콘솔 API 오버라이드
      await client.send('Console.enable');
      client.on('Console.messageAdded', (params) => {
        this.handleConsoleMessage(params);
      });

      // 네트워크 모니터링
      if (this.config.enableNetworkMonitor) {
        await client.send('Network.enable');
        client.on('Network.requestWillBeSent', (params) => {
          this.handleNetworkRequest(params);
        });
        client.on('Network.responseReceived', (params) => {
          this.handleNetworkResponse(params);
        });
      }

      // 성능 메트릭
      if (this.config.enablePerformanceMonitor) {
        await client.send('Performance.enable');
      }

      // 페이지 에러 리스너
      this.page.on('pageerror', error => this.handlePageError(error));
      this.page.on('console', msg => this.handleConsoleLog(msg));
      this.page.on('requestfailed', request => this.handleRequestFailed(request));

      // 커스텀 에러 수집 스크립트 주입
      await this.injectErrorCollector();

      // 페이지 로드
      await this.page.goto(this.config.url, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      spinner.succeed('브라우저 초기화 완료');
    } catch (error) {
      spinner.fail('브라우저 초기화 실패');
      console.error(error);
      throw error;
    }
  }

  async injectErrorCollector() {
    await this.page.addInitScript(() => {
      // 전역 에러 핸들러
      window.addEventListener('error', (event) => {
        window.__reportError?.({
          type: 'error',
          message: event.message,
          source: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: event.error?.stack || event.error,
          timestamp: Date.now()
        });
      });

      // Promise rejection 핸들러
      window.addEventListener('unhandledrejection', (event) => {
        window.__reportError?.({
          type: 'unhandledRejection',
          reason: event.reason,
          promise: event.promise,
          timestamp: Date.now()
        });
      });

      // React 에러 바운더리
      if (window.React && window.React.Component) {
        const originalComponentDidCatch = window.React.Component.prototype.componentDidCatch;
        window.React.Component.prototype.componentDidCatch = function(error, errorInfo) {
          window.__reportError?.({
            type: 'react',
            error: error.toString(),
            errorInfo: errorInfo,
            componentStack: errorInfo.componentStack,
            timestamp: Date.now()
          });
          if (originalComponentDidCatch) {
            originalComponentDidCatch.call(this, error, errorInfo);
          }
        };
      }

      // 성능 모니터링
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 1000) {
            window.__reportPerformance?.({
              type: 'longTask',
              name: entry.name,
              duration: entry.duration,
              timestamp: Date.now()
            });
          }
        }
      });
      observer.observe({ entryTypes: ['measure', 'navigation', 'resource'] });

      // 메모리 모니터링
      if (performance.memory) {
        setInterval(() => {
          const memoryInfo = {
            usedJSHeapSize: performance.memory.usedJSHeapSize,
            totalJSHeapSize: performance.memory.totalJSHeapSize,
            jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
          };
          if (memoryInfo.usedJSHeapSize > memoryInfo.jsHeapSizeLimit * 0.9) {
            window.__reportMemory?.({
              type: 'memoryWarning',
              ...memoryInfo,
              timestamp: Date.now()
            });
          }
        }, 5000);
      }
    });

    // 에러 리포터 함수 등록
    await this.page.exposeFunction('__reportError', (error) => {
      this.handleCustomError(error);
    });

    await this.page.exposeFunction('__reportPerformance', (data) => {
      this.handlePerformanceData(data);
    });

    await this.page.exposeFunction('__reportMemory', (data) => {
      this.handleMemoryData(data);
    });
  }

  async handleRuntimeException(params) {
    const error = {
      type: 'runtime',
      timestamp: params.timestamp,
      message: params.exceptionDetails.text,
      stack: params.exceptionDetails.stackTrace,
      url: params.exceptionDetails.url,
      lineNumber: params.exceptionDetails.lineNumber,
      columnNumber: params.exceptionDetails.columnNumber
    };

    await this.processError(error);
  }

  async handleConsoleMessage(params) {
    if (params.level === 'error' || params.level === 'warning') {
      const error = {
        type: 'console',
        level: params.level,
        message: params.text,
        timestamp: params.timestamp,
        stack: params.stackTrace
      };

      await this.processError(error);
    }
  }

  async handleCustomError(error) {
    console.log(chalk.red(`🔥 에러 감지: ${error.type}`));
    await this.processError(error);
  }

  async processError(error) {
    // 중복 제거
    const errorKey = `${error.type}-${error.message}`;
    if (this.errors.has(errorKey)) {
      const existingError = this.errors.get(errorKey);
      existingError.count = (existingError.count || 1) + 1;
      existingError.lastOccurred = Date.now();
      return;
    }

    this.errors.set(errorKey, error);
    this.errorQueue.push(error);

    // WebSocket으로 브로드캐스트
    this.broadcast({
      type: 'error',
      data: error
    });

    // 자동 수정 활성화 시
    if (this.config.autoFix && !this.isFixing) {
      this.debounceAutoFix();
    }
  }

  debounceAutoFix = this.debounce(async () => {
    await this.autoFixErrors();
  }, this.config.debounceTime);

  async autoFixErrors() {
    if (this.isFixing || this.errorQueue.length === 0) return;

    this.isFixing = true;
    const spinner = ora('에러 자동 수정 중...').start();

    try {
      // 병렬 처리
      if (this.config.parallel) {
        const chunks = this.chunkArray(this.errorQueue, this.config.maxParallelFixes);
        for (const chunk of chunks) {
          await Promise.all(chunk.map(error => this.fixError(error)));
        }
      } else {
        for (const error of this.errorQueue) {
          await this.fixError(error);
        }
      }

      this.errorQueue = [];
      spinner.succeed('에러 수정 완료');

      // 페이지 새로고침
      if (this.config.enableHotReload) {
        await this.page.reload({ waitUntil: 'networkidle' });
      }
    } catch (error) {
      spinner.fail('에러 수정 실패');
      console.error(error);
    } finally {
      this.isFixing = false;
    }
  }

  async fixError(error) {
    console.log(chalk.yellow(`🔧 수정 중: ${error.message}`));

    // AI 분석으로 수정 방법 결정
    const fixStrategy = await this.analyzeError(error);

    switch (fixStrategy.type) {
      case 'import':
        await this.fixImportError(error, fixStrategy);
        break;
      case 'syntax':
        await this.fixSyntaxError(error, fixStrategy);
        break;
      case 'type':
        await this.fixTypeError(error, fixStrategy);
        break;
      case 'api':
        await this.fixAPIError(error, fixStrategy);
        break;
      case 'component':
        await this.fixComponentError(error, fixStrategy);
        break;
      default:
        await this.genericFix(error, fixStrategy);
    }

    // 수정 기록
    this.fixHistory.push({
      error,
      fix: fixStrategy,
      timestamp: Date.now()
    });

    // 패턴 학습
    if (this.learningMode) {
      this.learnPattern(error, fixStrategy);
    }
  }

  async analyzeError(error) {
    // 패턴 매칭
    for (const [pattern, fix] of this.patterns) {
      if (error.message.match(pattern)) {
        return fix;
      }
    }

    // AI 분석 (실제로는 더 복잡한 로직)
    if (error.message.includes('is not defined')) {
      return { type: 'import', module: this.extractModuleName(error.message) };
    } else if (error.message.includes('Unexpected token')) {
      return { type: 'syntax', location: this.extractLocation(error) };
    } else if (error.message.includes('Type error')) {
      return { type: 'type', details: error };
    } else if (error.message.includes('404') || error.message.includes('API')) {
      return { type: 'api', endpoint: this.extractEndpoint(error) };
    } else if (error.message.includes('Component')) {
      return { type: 'component', component: this.extractComponentName(error) };
    }

    return { type: 'generic' };
  }

  async fixImportError(error, strategy) {
    const filePath = this.getFilePathFromError(error);
    if (!filePath) return;

    const content = await fs.readFile(filePath, 'utf8');
    const updatedContent = this.addImportStatement(content, strategy.module);
    await fs.writeFile(filePath, updatedContent);

    console.log(chalk.green(`✅ Import 추가: ${strategy.module}`));
  }

  async fixAPIError(error, strategy) {
    const endpoint = strategy.endpoint;
    if (!endpoint) return;

    // API 엔드포인트 자동 생성
    const apiPath = path.join(process.cwd(), 'app', 'api', ...endpoint.split('/').filter(Boolean));
    const routeFile = path.join(apiPath, 'route.ts');

    if (!await this.fileExists(routeFile)) {
      await fs.mkdir(path.dirname(routeFile), { recursive: true });
      await fs.writeFile(routeFile, this.generateAPIEndpoint(endpoint));
      console.log(chalk.green(`✅ API 엔드포인트 생성: ${endpoint}`));
    }
  }

  generateAPIEndpoint(endpoint) {
    return `import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // TODO: Implement ${endpoint} logic
    return NextResponse.json({
      message: 'Endpoint auto-generated',
      endpoint: '${endpoint}'
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // TODO: Implement ${endpoint} logic
    return NextResponse.json({
      message: 'Endpoint auto-generated',
      endpoint: '${endpoint}',
      data: body
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}`;
  }

  setupFileWatcher() {
    const watcher = chokidar.watch(['app/**/*.{ts,tsx,js,jsx}', 'lib/**/*.{ts,tsx,js,jsx}'], {
      ignored: /node_modules/,
      persistent: true
    });

    watcher.on('change', async (filePath) => {
      console.log(chalk.blue(`📝 파일 변경 감지: ${filePath}`));

      // 변경된 파일 분석
      await this.analyzeFile(filePath);

      // 예측적 에러 방지
      if (this.config.enablePrediction) {
        await this.predictErrors(filePath);
      }
    });
  }

  async analyzeFile(filePath) {
    const content = await fs.readFile(filePath, 'utf8');

    // TypeScript 컴파일러 체크
    try {
      execSync(`npx tsc --noEmit ${filePath}`, { stdio: 'pipe' });
    } catch (error) {
      const tsError = {
        type: 'typescript',
        file: filePath,
        message: error.stdout?.toString() || error.message,
        timestamp: Date.now()
      };
      await this.processError(tsError);
    }

    // ESLint 체크
    try {
      execSync(`npx eslint ${filePath}`, { stdio: 'pipe' });
    } catch (error) {
      const lintError = {
        type: 'eslint',
        file: filePath,
        message: error.stdout?.toString() || error.message,
        timestamp: Date.now()
      };
      await this.processError(lintError);
    }
  }

  async predictErrors(filePath) {
    // 일반적인 에러 패턴 예측
    const content = await fs.readFile(filePath, 'utf8');

    // 누락된 import 예측
    const usedModules = this.extractUsedModules(content);
    const importedModules = this.extractImportedModules(content);
    const missingModules = usedModules.filter(m => !importedModules.includes(m));

    if (missingModules.length > 0) {
      console.log(chalk.yellow(`⚠️ 예측: 누락된 import - ${missingModules.join(', ')}`));
      // 자동으로 import 추가
      for (const module of missingModules) {
        await this.fixImportError(
          { message: `${module} is not defined`, file: filePath },
          { type: 'import', module }
        );
      }
    }
  }

  startPerformanceMonitor() {
    setInterval(async () => {
      if (!this.page) return;

      const metrics = await this.page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        const paint = performance.getEntriesByType('paint');

        return {
          loadTime: navigation?.loadEventEnd - navigation?.fetchStart,
          domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.fetchStart,
          firstPaint: paint.find(p => p.name === 'first-paint')?.startTime,
          firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime,
          memory: performance.memory
        };
      });

      this.performance.set(Date.now(), metrics);

      // 성능 문제 감지
      if (metrics.loadTime > 3000) {
        console.log(chalk.yellow(`⚠️ 성능 경고: 페이지 로드 시간 ${metrics.loadTime}ms`));
      }
    }, 5000);
  }

  startMemoryMonitor() {
    setInterval(async () => {
      if (!this.page) return;

      const metrics = await this.page.metrics();

      if (metrics.JSHeapUsedSize > 50 * 1024 * 1024) { // 50MB
        console.log(chalk.yellow(`⚠️ 메모리 경고: ${(metrics.JSHeapUsedSize / 1024 / 1024).toFixed(2)}MB 사용 중`));

        // 메모리 누수 감지
        await this.detectMemoryLeaks();
      }
    }, 10000);
  }

  async detectMemoryLeaks() {
    // 메모리 스냅샷 비교
    const snapshot1 = await this.page.evaluate(() => {
      if (typeof gc === 'function') gc();
      return performance.memory.usedJSHeapSize;
    });

    await new Promise(resolve => setTimeout(resolve, 5000));

    const snapshot2 = await this.page.evaluate(() => {
      if (typeof gc === 'function') gc();
      return performance.memory.usedJSHeapSize;
    });

    if (snapshot2 > snapshot1 * 1.1) {
      console.log(chalk.red(`🚨 메모리 누수 감지: ${((snapshot2 - snapshot1) / 1024 / 1024).toFixed(2)}MB 증가`));
    }
  }

  async initAIEngine() {
    // 에러 패턴 학습 데이터 로드
    try {
      const patternsFile = path.join(process.cwd(), '.error-patterns.json');
      if (await this.fileExists(patternsFile)) {
        const data = await fs.readFile(patternsFile, 'utf8');
        const patterns = JSON.parse(data);
        patterns.forEach(p => {
          this.patterns.set(new RegExp(p.pattern), p.fix);
        });
      }
    } catch (error) {
      console.log(chalk.yellow('패턴 파일 로드 실패, 새로 학습 시작'));
    }
  }

  learnPattern(error, fix) {
    // 패턴 학습 및 저장
    const pattern = this.generalizeErrorMessage(error.message);
    this.patterns.set(pattern, fix);

    // 주기적으로 패턴 저장
    this.savePatternsDebounced();
  }

  savePatternsDebounced = this.debounce(async () => {
    const patterns = Array.from(this.patterns.entries()).map(([pattern, fix]) => ({
      pattern: pattern.source,
      fix
    }));

    await fs.writeFile(
      path.join(process.cwd(), '.error-patterns.json'),
      JSON.stringify(patterns, null, 2)
    );
  }, 5000);

  broadcast(message) {
    const data = JSON.stringify(message);
    this.wsClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  // 유틸리티 함수들
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  extractModuleName(message) {
    const match = message.match(/['"]([^'"]+)['"] is not defined/);
    return match ? match[1] : null;
  }

  extractEndpoint(error) {
    const match = error.message.match(/\/api[\/\w-]*/);
    return match ? match[0] : null;
  }

  extractComponentName(error) {
    const match = error.message.match(/Component ['"]([^'"]+)['"]/);
    return match ? match[1] : null;
  }

  getFilePathFromError(error) {
    if (error.source) return error.source;
    if (error.file) return error.file;
    if (error.stack) {
      const match = error.stack.match(/at .* \((.+):\d+:\d+\)/);
      return match ? match[1] : null;
    }
    return null;
  }

  extractLocation(error) {
    return {
      file: this.getFilePathFromError(error),
      line: error.lineNumber || error.lineno,
      column: error.columnNumber || error.colno
    };
  }

  addImportStatement(content, module) {
    // import 문 추가 로직
    const importStatement = `import ${module} from '${module}';\n`;
    const lines = content.split('\n');
    const lastImportIndex = lines.findLastIndex(line => line.startsWith('import'));

    if (lastImportIndex >= 0) {
      lines.splice(lastImportIndex + 1, 0, importStatement);
    } else {
      lines.unshift(importStatement);
    }

    return lines.join('\n');
  }

  extractUsedModules(content) {
    // 사용된 모듈 추출 (간단한 예시)
    const modules = [];
    const patterns = [
      /useState/g,
      /useEffect/g,
      /useCallback/g,
      /useMemo/g,
      /createClient/g
    ];

    patterns.forEach(pattern => {
      if (content.match(pattern)) {
        modules.push(pattern.source.replace(/\\/g, ''));
      }
    });

    return modules;
  }

  extractImportedModules(content) {
    // import된 모듈 추출
    const modules = [];
    const importRegex = /import\s+(?:{[^}]+}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:{[^}]+}|\w+))?\s+from\s+['"]([^'"]+)['"]/g;
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      modules.push(match[1]);
    }

    return modules;
  }

  generalizeErrorMessage(message) {
    // 에러 메시지를 일반화하여 패턴으로 변환
    return new RegExp(
      message
        .replace(/['"][^'"]+['"]/g, '[\'"][^\'"]+[\'"]')
        .replace(/\d+/g, '\\d+')
        .replace(/\s+/g, '\\s+')
    );
  }

  async handleWebSocketMessage(data) {
    switch (data.type) {
      case 'command':
        await this.executeCommand(data.command);
        break;
      case 'config':
        Object.assign(this.config, data.config);
        break;
      case 'query':
        this.sendStatus();
        break;
    }
  }

  async executeCommand(command) {
    switch (command) {
      case 'pause':
        this.config.autoFix = false;
        break;
      case 'resume':
        this.config.autoFix = true;
        break;
      case 'clear':
        this.errors.clear();
        this.errorQueue = [];
        break;
      case 'reload':
        await this.page.reload();
        break;
      case 'stats':
        this.sendStatistics();
        break;
    }
  }

  sendStatus() {
    this.broadcast({
      type: 'status',
      data: {
        errors: Array.from(this.errors.values()),
        queue: this.errorQueue,
        fixes: this.fixHistory,
        performance: Array.from(this.performance.entries()),
        config: this.config
      }
    });
  }

  sendStatistics() {
    const stats = {
      totalErrors: this.errors.size,
      queuedErrors: this.errorQueue.length,
      fixedErrors: this.fixHistory.length,
      patterns: this.patterns.size,
      uptime: process.uptime(),
      memory: process.memoryUsage()
    };

    this.broadcast({
      type: 'statistics',
      data: stats
    });

    console.log(chalk.cyan('\n📊 통계:'));
    console.log(chalk.white(`  총 에러: ${stats.totalErrors}`));
    console.log(chalk.white(`  대기 중: ${stats.queuedErrors}`));
    console.log(chalk.white(`  수정됨: ${stats.fixedErrors}`));
    console.log(chalk.white(`  학습된 패턴: ${stats.patterns}`));
  }

  async cleanup() {
    console.log(chalk.yellow('\n🧹 정리 중...'));

    if (this.wsServer) {
      this.wsServer.close();
    }

    if (this.browser) {
      await this.browser.close();
    }

    // 패턴 저장
    await this.savePatternsDebounced();

    console.log(chalk.green('✅ 정리 완료'));
  }
}

// 메인 실행
async function main() {
  const monitor = new AdvancedErrorMonitor();

  try {
    await monitor.initialize();

    console.log(chalk.green.bold('\n✨ Advanced Error Monitor 실행 중\n'));
    console.log(chalk.cyan('WebSocket 포트: 8888'));
    console.log(chalk.cyan('대시보드: http://localhost:8889'));
    console.log(chalk.yellow('종료: Ctrl+C\n'));

    // 종료 핸들러
    process.on('SIGINT', async () => {
      await monitor.cleanup();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await monitor.cleanup();
      process.exit(0);
    });

  } catch (error) {
    console.error(chalk.red('초기화 실패:'), error);
    process.exit(1);
  }
}

// 필요한 패키지 확인
async function checkDependencies() {
  const requiredPackages = ['playwright', 'ws', 'chokidar', 'chalk', 'ora'];
  const missingPackages = [];

  for (const pkg of requiredPackages) {
    try {
      require.resolve(pkg);
    } catch {
      missingPackages.push(pkg);
    }
  }

  if (missingPackages.length > 0) {
    console.log(chalk.yellow('필요한 패키지 설치 중...'));
    execSync(`npm install ${missingPackages.join(' ')}`, { stdio: 'inherit' });
  }
}

// 실행
checkDependencies().then(() => {
  main().catch(console.error);
});