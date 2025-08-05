#!/usr/bin/env node

/**
 * 실시간 개발 대시보드
 * 진행률, 에러율, 성능 지표를 실시간으로 모니터링
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');
const WebSocket = require('ws');

class DevDashboard {
  constructor() {
    this.port = 3001;
    this.wsPort = 3002;
    this.metrics = {
      development: {
        totalFiles: 0,
        completedFiles: 0,
        progressPercentage: 0,
        todosCount: 0,
        fixmesCount: 0
      },
      errors: {
        total: 0,
        critical: 0,
        warnings: 0,
        recent: []
      },
      performance: {
        buildTime: 0,
        testTime: 0,
        bundleSize: 0,
        memoryUsage: 0
      },
      git: {
        currentBranch: '',
        commitsToday: 0,
        uncommittedChanges: 0,
        lastCommit: ''
      },
      quality: {
        testCoverage: 0,
        codeComplexity: 0,
        duplications: 0,
        maintainabilityIndex: 100
      }
    };
    
    this.watchers = [];
    this.clients = [];
  }

  log(message, level = 'INFO') {
    const colors = {
      INFO: '\x1b[36m',
      SUCCESS: '\x1b[32m',
      WARNING: '\x1b[33m',
      ERROR: '\x1b[31m',
      RESET: '\x1b[0m'
    };
    
    const timestamp = new Date().toLocaleTimeString('ko-KR');
    console.log(`${colors[level]}[${timestamp}] ${message}${colors.RESET}`);
  }

  async runCommand(command, args = []) {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, { stdio: 'pipe' });
      
      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve(stdout.trim());
        } else {
          reject(new Error(stderr || `Command failed with code ${code}`));
        }
      });
    });
  }

  // 개발 진행률 계산
  async updateDevelopmentMetrics() {
    try {
      // 전체 파일 수 계산
      const files = await this.runCommand('find', ['.', '-name', '*.ts', '-o', '-name', '*.tsx', '-o', '-name', '*.js', '-o', '-name', '*.jsx']);
      const fileList = files.split('\n').filter(f => f.trim() && !f.includes('node_modules') && !f.includes('.next'));
      
      this.metrics.development.totalFiles = fileList.length;

      // TODO, FIXME 카운트
      let todosCount = 0;
      let fixmesCount = 0;
      let completedFiles = 0;

      for (const file of fileList) {
        try {
          const content = fs.readFileSync(file, 'utf8');
          
          // TODO/FIXME 카운트
          const todos = (content.match(/\/\/\s*TODO:/gi) || []).length;
          const fixmes = (content.match(/\/\/\s*FIXME:/gi) || []).length;
          
          todosCount += todos;
          fixmesCount += fixmes;
          
          // 완성도 평가 (TODO, FIXME가 없고, 기본적인 구조가 있으면 완료로 간주)
          if (todos === 0 && fixmes === 0 && content.length > 100) {
            completedFiles++;
          }
        } catch (error) {
          // 파일 읽기 실패는 무시
        }
      }

      this.metrics.development.completedFiles = completedFiles;
      this.metrics.development.progressPercentage = Math.round((completedFiles / this.metrics.development.totalFiles) * 100);
      this.metrics.development.todosCount = todosCount;
      this.metrics.development.fixmesCount = fixmesCount;

    } catch (error) {
      this.log(`개발 메트릭 업데이트 실패: ${error.message}`, 'ERROR');
    }
  }

  // 에러 메트릭 업데이트
  async updateErrorMetrics() {
    try {
      // TypeScript 에러 확인
      const tscOutput = await this.runCommand('npx', ['tsc', '--noEmit']).catch(err => err.message || '');
      const eslintOutput = await this.runCommand('npx', ['eslint', '.', '--ext', '.ts,.tsx,.js,.jsx']).catch(err => err.message || '');
      
      // 에러 파싱
      const tsErrors = (tscOutput.match(/error TS\d+:/g) || []).length;
      const eslintErrors = (eslintOutput.match(/✖ \d+ problems?/g) || []).length;
      
      this.metrics.errors.total = tsErrors + eslintErrors;
      this.metrics.errors.critical = tsErrors; // TypeScript 에러는 심각한 것으로 분류
      this.metrics.errors.warnings = eslintErrors;

      // 최근 에러 로그 (에러 로그 파일이 있다면)
      const errorLogPath = path.join(process.cwd(), 'logs', 'error-tracker.log');
      if (fs.existsSync(errorLogPath)) {
        const errorLog = fs.readFileSync(errorLogPath, 'utf8');
        const recentErrors = errorLog.split('\n')
          .filter(line => line.includes('[ERROR]'))
          .slice(-5)
          .map(line => {
            const match = line.match(/\[(.*?)\] \[ERROR\] (.*)/);
            return match ? { timestamp: match[1], message: match[2] } : null;
          })
          .filter(Boolean);
        
        this.metrics.errors.recent = recentErrors;
      }

    } catch (error) {
      this.log(`에러 메트릭 업데이트 실패: ${error.message}`, 'ERROR');
    }
  }

  // 성능 메트릭 업데이트
  async updatePerformanceMetrics() {
    try {
      // 빌드 시간 측정
      const buildStart = Date.now();
      await this.runCommand('npm', ['run', 'build']).catch(() => {});
      this.metrics.performance.buildTime = Date.now() - buildStart;

      // 번들 크기 확인
      const nextDir = path.join(process.cwd(), '.next');
      if (fs.existsSync(nextDir)) {
        const buildManifest = path.join(nextDir, 'build-manifest.json');
        if (fs.existsSync(buildManifest)) {
          const manifest = JSON.parse(fs.readFileSync(buildManifest, 'utf8'));
          // 대략적인 번들 크기 계산
          this.metrics.performance.bundleSize = Object.keys(manifest.pages).length * 50; // KB 단위 추정
        }
      }

      // 메모리 사용량
      const memUsage = process.memoryUsage();
      this.metrics.performance.memoryUsage = Math.round(memUsage.heapUsed / 1024 / 1024); // MB

      // 테스트 시간 (간단한 테스트 실행)
      const testStart = Date.now();
      await this.runCommand('npm', ['test', '--', '--passWithNoTests', '--silent']).catch(() => {});
      this.metrics.performance.testTime = Date.now() - testStart;

    } catch (error) {
      this.log(`성능 메트릭 업데이트 실패: ${error.message}`, 'ERROR');
    }
  }

  // Git 메트릭 업데이트
  async updateGitMetrics() {
    try {
      // 현재 브랜치
      this.metrics.git.currentBranch = await this.runCommand('git', ['branch', '--show-current']);

      // 오늘의 커밋 수
      const today = new Date().toISOString().split('T')[0];
      const commitsToday = await this.runCommand('git', ['log', '--oneline', `--since=${today}`]);
      this.metrics.git.commitsToday = commitsToday.split('\n').filter(line => line.trim()).length;

      // 커밋되지 않은 변경사항
      const status = await this.runCommand('git', ['status', '--porcelain']);
      this.metrics.git.uncommittedChanges = status.split('\n').filter(line => line.trim()).length;

      // 마지막 커밋
      const lastCommit = await this.runCommand('git', ['log', '-1', '--pretty=format:%h %s']);
      this.metrics.git.lastCommit = lastCommit;

    } catch (error) {
      this.log(`Git 메트릭 업데이트 실패: ${error.message}`, 'ERROR');
    }
  }

  // 코드 품질 메트릭 업데이트
  async updateQualityMetrics() {
    try {
      // 테스트 커버리지
      const coverageOutput = await this.runCommand('npm', ['run', 'test:coverage', '--silent']).catch(() => '');
      const coverageMatch = coverageOutput.match(/All files\s+\|\s+(\d+\.?\d*)/);
      this.metrics.quality.testCoverage = coverageMatch ? parseFloat(coverageMatch[1]) : 0;

      // 코드 복잡도 계산 (간단한 추정)
      const files = await this.runCommand('find', ['.', '-name', '*.ts', '-o', '-name', '*.tsx']);
      const fileList = files.split('\n').filter(f => f.trim() && !f.includes('node_modules'));
      
      let totalComplexity = 0;
      let duplications = 0;

      for (const file of fileList.slice(0, 10)) { // 처음 10개 파일만 샘플링
        try {
          const content = fs.readFileSync(file, 'utf8');
          
          // 복잡도 추정 (if, for, while 등의 개수)
          const complexity = (content.match(/(if|for|while|catch|case)\s*\(/g) || []).length;
          totalComplexity += complexity;
          
          // 중복 코드 간단 검사 (동일한 줄이 여러 번 나타나는지)
          const lines = content.split('\n');
          const uniqueLines = new Set(lines.filter(line => line.trim().length > 10));
          if (lines.length - uniqueLines.size > 5) {
            duplications++;
          }
        } catch (error) {
          // 파일 읽기 실패는 무시
        }
      }

      this.metrics.quality.codeComplexity = Math.round(totalComplexity / Math.max(fileList.length, 1));
      this.metrics.quality.duplications = duplications;
      
      // 유지보수성 지수 계산
      const complexityPenalty = this.metrics.quality.codeComplexity * 2;
      const errorPenalty = this.metrics.errors.total * 3;
      const coverageBonus = this.metrics.quality.testCoverage;
      
      this.metrics.quality.maintainabilityIndex = Math.max(0, Math.min(100, 
        100 - complexityPenalty - errorPenalty + (coverageBonus / 2)
      ));

    } catch (error) {
      this.log(`품질 메트릭 업데이트 실패: ${error.message}`, 'ERROR');
    }
  }

  // 모든 메트릭 업데이트
  async updateAllMetrics() {
    this.log('📊 메트릭 업데이트 중...', 'INFO');
    
    await Promise.all([
      this.updateDevelopmentMetrics(),
      this.updateErrorMetrics(), 
      this.updatePerformanceMetrics(),
      this.updateGitMetrics(),
      this.updateQualityMetrics()
    ]);

    // WebSocket으로 클라이언트에 전송
    this.broadcastMetrics();
    
    this.log('✅ 메트릭 업데이트 완료', 'SUCCESS');
  }

  // WebSocket으로 메트릭 브로드캐스트
  broadcastMetrics() {
    const message = JSON.stringify({
      type: 'metrics',
      data: this.metrics,
      timestamp: new Date().toISOString()
    });

    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  // 대시보드 HTML 생성
  generateDashboardHTML() {
    return `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🚀 게임플라자 개발 대시보드</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          min-height: 100vh;
          padding: 20px;
        }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { font-size: 2.5rem; margin-bottom: 10px; }
        .last-update { opacity: 0.8; font-size: 0.9rem; }
        .dashboard { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .card { 
          background: rgba(255,255,255,0.1); 
          backdrop-filter: blur(10px);
          border-radius: 15px;
          padding: 25px;
          border: 1px solid rgba(255,255,255,0.2);
        }
        .card h2 { font-size: 1.3rem; margin-bottom: 20px; display: flex; align-items: center; }
        .card h2::before { content: attr(data-emoji); margin-right: 10px; font-size: 1.5rem; }
        .metric { display: flex; justify-content: space-between; margin-bottom: 15px; }
        .metric-label { opacity: 0.9; }
        .metric-value { font-weight: bold; font-size: 1.1rem; }
        .progress-bar { 
          background: rgba(255,255,255,0.2);
          border-radius: 10px;
          height: 8px;
          margin-top: 8px;
          overflow: hidden;
        }
        .progress-fill { 
          height: 100%;
          background: linear-gradient(90deg, #4CAF50, #8BC34A);
          transition: width 0.3s ease;
        }
        .error-list { max-height: 200px; overflow-y: auto; }
        .error-item { 
          background: rgba(244,67,54,0.2);
          padding: 10px;
          border-radius: 8px;
          margin-bottom: 8px;
          font-size: 0.9rem;
        }
        .status-good { color: #4CAF50; }
        .status-warning { color: #FF9800; }
        .status-error { color: #F44336; }
        .real-time { 
          position: fixed;
          top: 20px;
          right: 20px;
          background: rgba(0,0,0,0.3);
          padding: 10px 15px;
          border-radius: 20px;
          font-size: 0.8rem;
        }
        .pulse { animation: pulse 2s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    </style>
</head>
<body>
    <div class="real-time">
        <span id="connection-status" class="pulse">🟢 실시간 연결됨</span>
    </div>

    <div class="header">
        <h1>🚀 게임플라자 개발 대시보드</h1>
        <div class="last-update">마지막 업데이트: <span id="last-update">-</span></div>
    </div>

    <div class="dashboard">
        <!-- 개발 진행률 -->
        <div class="card">
            <h2 data-emoji="📈">개발 진행률</h2>
            <div class="metric">
                <span class="metric-label">전체 파일</span>
                <span class="metric-value" id="total-files">0</span>
            </div>
            <div class="metric">
                <span class="metric-label">완료된 파일</span>
                <span class="metric-value" id="completed-files">0</span>
            </div>
            <div class="metric">
                <span class="metric-label">진행률</span>
                <span class="metric-value" id="progress-percent">0%</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" id="progress-bar" style="width: 0%"></div>
            </div>
            <div class="metric" style="margin-top: 15px;">
                <span class="metric-label">TODO 항목</span>
                <span class="metric-value" id="todos-count">0</span>
            </div>
            <div class="metric">
                <span class="metric-label">FIXME 항목</span>
                <span class="metric-value" id="fixmes-count">0</span>
            </div>
        </div>

        <!-- 에러 현황 -->
        <div class="card">
            <h2 data-emoji="🚨">에러 현황</h2>
            <div class="metric">
                <span class="metric-label">총 에러</span>
                <span class="metric-value" id="total-errors">0</span>
            </div>
            <div class="metric">
                <span class="metric-label">심각한 에러</span>
                <span class="metric-value status-error" id="critical-errors">0</span>
            </div>
            <div class="metric">
                <span class="metric-label">경고</span>
                <span class="metric-value status-warning" id="warnings">0</span>
            </div>
            <div class="error-list" id="recent-errors">
                <!-- 최근 에러 목록 -->
            </div>
        </div>

        <!-- 성능 지표 -->
        <div class="card">
            <h2 data-emoji="⚡">성능 지표</h2>
            <div class="metric">
                <span class="metric-label">빌드 시간</span>
                <span class="metric-value" id="build-time">0ms</span>
            </div>
            <div class="metric">
                <span class="metric-label">테스트 시간</span>
                <span class="metric-value" id="test-time">0ms</span>
            </div>
            <div class="metric">
                <span class="metric-label">번들 크기</span>
                <span class="metric-value" id="bundle-size">0KB</span>
            </div>
            <div class="metric">
                <span class="metric-label">메모리 사용량</span>
                <span class="metric-value" id="memory-usage">0MB</span>
            </div>
        </div>

        <!-- Git 현황 -->
        <div class="card">
            <h2 data-emoji="🌿">Git 현황</h2>
            <div class="metric">
                <span class="metric-label">현재 브랜치</span>
                <span class="metric-value" id="current-branch">-</span>
            </div>
            <div class="metric">
                <span class="metric-label">오늘 커밋</span>
                <span class="metric-value" id="commits-today">0</span>
            </div>
            <div class="metric">
                <span class="metric-label">미커밋 변경</span>
                <span class="metric-value" id="uncommitted-changes">0</span>
            </div>
            <div style="margin-top: 15px; font-size: 0.9rem; opacity: 0.8;">
                <div>마지막 커밋:</div>
                <div id="last-commit" style="margin-top: 5px;">-</div>
            </div>
        </div>

        <!-- 코드 품질 -->
        <div class="card">
            <h2 data-emoji="✨">코드 품질</h2>
            <div class="metric">
                <span class="metric-label">테스트 커버리지</span>
                <span class="metric-value" id="test-coverage">0%</span>
            </div>
            <div class="metric">
                <span class="metric-label">코드 복잡도</span>
                <span class="metric-value" id="code-complexity">0</span>
            </div>
            <div class="metric">
                <span class="metric-label">중복 코드</span>
                <span class="metric-value" id="duplications">0</span>
            </div>
            <div class="metric">
                <span class="metric-label">유지보수성</span>
                <span class="metric-value" id="maintainability">100</span>
            </div>
        </div>
    </div>

    <script>
        const ws = new WebSocket('ws://localhost:${this.wsPort}');
        
        ws.onopen = function() {
            document.getElementById('connection-status').innerHTML = '🟢 실시간 연결됨';
        };
        
        ws.onclose = function() {
            document.getElementById('connection-status').innerHTML = '🔴 연결 끊김';
        };
        
        ws.onmessage = function(event) {
            const message = JSON.parse(event.data);
            if (message.type === 'metrics') {
                updateDashboard(message.data);
                document.getElementById('last-update').textContent = new Date(message.timestamp).toLocaleString('ko-KR');
            }
        };

        function updateDashboard(metrics) {
            // 개발 진행률
            document.getElementById('total-files').textContent = metrics.development.totalFiles;
            document.getElementById('completed-files').textContent = metrics.development.completedFiles;
            document.getElementById('progress-percent').textContent = metrics.development.progressPercentage + '%';
            document.getElementById('progress-bar').style.width = metrics.development.progressPercentage + '%';
            document.getElementById('todos-count').textContent = metrics.development.todosCount;
            document.getElementById('fixmes-count').textContent = metrics.development.fixmesCount;

            // 에러 현황
            document.getElementById('total-errors').textContent = metrics.errors.total;
            document.getElementById('critical-errors').textContent = metrics.errors.critical;
            document.getElementById('warnings').textContent = metrics.errors.warnings;
            
            const errorsList = document.getElementById('recent-errors');
            errorsList.innerHTML = '';
            metrics.errors.recent.forEach(error => {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-item';
                errorDiv.innerHTML = \`<strong>\${error.timestamp}</strong><br>\${error.message}\`;
                errorsList.appendChild(errorDiv);
            });

            // 성능 지표
            document.getElementById('build-time').textContent = metrics.performance.buildTime + 'ms';
            document.getElementById('test-time').textContent = metrics.performance.testTime + 'ms';
            document.getElementById('bundle-size').textContent = metrics.performance.bundleSize + 'KB';
            document.getElementById('memory-usage').textContent = metrics.performance.memoryUsage + 'MB';

            // Git 현황
            document.getElementById('current-branch').textContent = metrics.git.currentBranch;
            document.getElementById('commits-today').textContent = metrics.git.commitsToday;
            document.getElementById('uncommitted-changes').textContent = metrics.git.uncommittedChanges;
            document.getElementById('last-commit').textContent = metrics.git.lastCommit;

            // 코드 품질
            document.getElementById('test-coverage').textContent = metrics.quality.testCoverage + '%';
            document.getElementById('code-complexity').textContent = metrics.quality.codeComplexity;
            document.getElementById('duplications').textContent = metrics.quality.duplications;
            document.getElementById('maintainability').textContent = Math.round(metrics.quality.maintainabilityIndex);
        }
    </script>
</body>
</html>`;
  }

  // HTTP 서버 시작
  startHTTPServer() {
    const server = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(this.generateDashboardHTML());
    });

    server.listen(this.port, () => {
      this.log(`🌐 대시보드 서버 시작: http://localhost:${this.port}`, 'SUCCESS');
    });
  }

  // WebSocket 서버 시작
  startWebSocketServer() {
    const wss = new WebSocket.Server({ port: this.wsPort });

    wss.on('connection', (ws) => {
      this.clients.push(ws);
      this.log('🔌 클라이언트 연결됨', 'INFO');

      // 연결 시 현재 메트릭 전송
      ws.send(JSON.stringify({
        type: 'metrics',
        data: this.metrics,
        timestamp: new Date().toISOString()
      }));

      ws.on('close', () => {
        this.clients = this.clients.filter(client => client !== ws);
        this.log('🔌 클라이언트 연결 해제됨', 'INFO');
      });
    });

    this.log(`📡 WebSocket 서버 시작: ws://localhost:${this.wsPort}`, 'SUCCESS');
  }

  // 파일 변경 감시
  startFileWatcher() {
    const watchPaths = ['app', 'components', 'lib', 'src'];
    
    watchPaths.forEach(watchPath => {
      if (fs.existsSync(watchPath)) {
        fs.watch(watchPath, { recursive: true }, (eventType, filename) => {
          if (filename && (filename.endsWith('.ts') || filename.endsWith('.tsx') || filename.endsWith('.js') || filename.endsWith('.jsx'))) {
            this.log(`📝 파일 변경 감지: ${filename}`, 'INFO');
            // 5초 후 메트릭 업데이트 (변경사항이 안정화된 후)
            clearTimeout(this.updateTimeout);
            this.updateTimeout = setTimeout(() => {
              this.updateAllMetrics();
            }, 5000);
          }
        });
      }
    });

    this.log('👀 파일 변경 감시 시작', 'INFO');
  }

  // 대시보드 시작
  async start() {
    this.log('🚀 개발 대시보드 시작', 'INFO');

    // 초기 메트릭 업데이트
    await this.updateAllMetrics();

    // 서버 시작
    this.startHTTPServer();
    this.startWebSocketServer();
    this.startFileWatcher();

    // 정기적 업데이트 (5분마다)
    setInterval(() => {
      this.updateAllMetrics();
    }, 5 * 60 * 1000);

    // 브라우저에서 대시보드 열기
    const open = await import('open');
    setTimeout(() => {
      open.default(`http://localhost:${this.port}`);
    }, 2000);

    this.log(`✨ 대시보드 준비 완료! http://localhost:${this.port}`, 'SUCCESS');
  }

  // 대시보드 중지
  stop() {
    this.log('🛑 대시보드 중지 중...', 'INFO');
    
    this.watchers.forEach(watcher => watcher.close());
    this.clients.forEach(client => client.close());
    
    process.exit(0);
  }
}

// CLI 실행
async function main() {
  const dashboard = new DevDashboard();

  // 종료 시그널 처리
  process.on('SIGINT', () => dashboard.stop());
  process.on('SIGTERM', () => dashboard.stop());

  try {
    await dashboard.start();
  } catch (error) {
    console.error('❌ 대시보드 시작 오류:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = DevDashboard;