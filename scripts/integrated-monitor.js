#!/usr/bin/env node

/**
 * 통합 모니터링 시스템
 * 브라우저 + 대시보드 + 웹소켓 서버 한번에 실행
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

class IntegratedMonitor {
  constructor() {
    this.processes = [];
    this.devServer = null;
    this.wsServer = null;
    this.stableMonitor = null;
    this.isRunning = false;
  }

  async init() {
    console.log('🚀 통합 모니터링 시스템 시작');
    console.log('━'.repeat(50));
    console.log('📦 구성 요소:');
    console.log('  1. 개발 서버 (포트 3000)');
    console.log('  2. WebSocket 서버 (포트 8888)');
    console.log('  3. 안정 모니터 (스크롤/클릭 문제 해결)');
    console.log('  4. 에러 대시보드 (브라우저)');
    console.log('━'.repeat(50));
    console.log('');

    try {
      // 1. 개발 서버 확인 및 시작
      await this.ensureDevServer();

      // 5초 대기 (개발 서버 완전 시작)
      await this.wait(5000);

      // 2. WebSocket 서버 시작
      await this.startWebSocketServer();

      // 2초 대기 (서버 안정화)
      await this.wait(2000);

      // 3. 안정 모니터 시작
      await this.startStableMonitor();

      // 2초 대기 (모니터 초기화)
      await this.wait(2000);

      // 4. 대시보드 열기
      await this.openDashboard();

      console.log('');
      console.log('✅ 모든 구성 요소가 성공적으로 실행되었습니다!');
      console.log('');
      console.log('📋 사용 가이드:');
      console.log('  • WebSocket: ws://localhost:8888 에서 실행 중');
      console.log('  • 모니터: localhost:3000 모니터링 중');
      console.log('  • 대시보드: 브라우저에서 자동으로 열림');
      console.log('');
      console.log('종료하려면 Ctrl+C를 누르세요');
      console.log('━'.repeat(50));

      this.isRunning = true;

    } catch (error) {
      console.error('❌ 초기화 실패:', error);
      await this.cleanup();
      process.exit(1);
    }
  }

  // 개발 서버 확인 및 시작
  async ensureDevServer() {
    console.log('🖥️  개발 서버 확인 중...');

    // localhost:3000이 응답하는지 확인
    const isRunning = await this.checkPort(3000);

    if (isRunning) {
      console.log('  ✅ 개발 서버가 이미 실행 중입니다');
      return;
    }

    console.log('  🚀 개발 서버 시작 중...');

    // 개발 서버 시작
    this.devServer = spawn('npm', ['run', 'dev'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true
    });

    this.devServer.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Ready in') || output.includes('ready -')) {
        console.log('  ✅ 개발 서버 준비 완료');
      }
    });

    this.devServer.stderr.on('data', (data) => {
      // Next.js 경고는 무시
      const error = data.toString();
      if (!error.includes('Warning') && !error.includes('Experimental')) {
        console.error('  ⚠️ 개발 서버 에러:', error);
      }
    });

    this.processes.push(this.devServer);
  }

  // 포트 확인
  async checkPort(port) {
    return new Promise((resolve) => {
      const net = require('net');
      const socket = new net.Socket();

      socket.setTimeout(1000);
      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });

      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });

      socket.on('error', () => {
        resolve(false);
      });

      socket.connect(port, 'localhost');
    });
  }

  // WebSocket 서버 시작
  async startWebSocketServer() {
    console.log('🔌 WebSocket 서버 시작 중...');

    const wsServerPath = path.join(__dirname, 'simple-ws-server.js');

    // 서버 파일 존재 확인
    if (!fs.existsSync(wsServerPath)) {
      throw new Error('WebSocket 서버 파일을 찾을 수 없습니다: ' + wsServerPath);
    }

    // 기존 프로세스 종료
    await this.killPort(8888);

    // 새 서버 시작
    this.wsServer = spawn('node', [wsServerPath], {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    this.wsServer.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('WebSocket 서버가 포트')) {
        console.log('  ✅ WebSocket 서버 준비 완료');
      }
    });

    this.wsServer.stderr.on('data', (data) => {
      console.error('  ⚠️ WebSocket 에러:', data.toString());
    });

    this.wsServer.on('error', (error) => {
      console.error('  ❌ WebSocket 서버 실행 실패:', error);
    });

    this.processes.push(this.wsServer);
  }

  // 안정 모니터 시작
  async startStableMonitor() {
    console.log('📊 안정 모니터 시작 중...');

    const monitorPath = path.join(__dirname, 'stable-monitor.js');

    // 모니터 파일 존재 확인
    if (!fs.existsSync(monitorPath)) {
      throw new Error('안정 모니터 파일을 찾을 수 없습니다: ' + monitorPath);
    }

    // 새 모니터 시작
    this.stableMonitor = spawn('node', [monitorPath], {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    this.stableMonitor.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('모니터링 시작됨')) {
        console.log('  ✅ 안정 모니터 준비 완료');
      }
      // 에러 감지 시 출력
      if (output.includes('에러')) {
        console.log('  🔴', output.trim());
      }
    });

    this.stableMonitor.stderr.on('data', (data) => {
      console.error('  ⚠️ 모니터 에러:', data.toString());
    });

    this.stableMonitor.on('error', (error) => {
      console.error('  ❌ 안정 모니터 실행 실패:', error);
    });

    this.processes.push(this.stableMonitor);
  }

  // 대시보드 열기
  async openDashboard() {
    console.log('🌐 대시보드 열기...');

    const dashboardPath = path.join(__dirname, 'error-dashboard.html');

    // 대시보드 파일 존재 확인
    if (!fs.existsSync(dashboardPath)) {
      console.warn('  ⚠️ 대시보드 파일을 찾을 수 없습니다');
      return;
    }

    // OS에 따라 다른 명령어 사용
    const openCommand = process.platform === 'darwin' ? 'open' :
                       process.platform === 'win32' ? 'start' : 'xdg-open';

    exec(`${openCommand} "${dashboardPath}"`, (error) => {
      if (error) {
        console.error('  ⚠️ 대시보드 자동 열기 실패');
        console.log('  📝 수동으로 열기:', dashboardPath);
      } else {
        console.log('  ✅ 대시보드가 브라우저에서 열렸습니다');
      }
    });
  }

  // 포트 종료
  async killPort(port) {
    return new Promise((resolve) => {
      const kill = spawn('lsof', ['-ti:' + port], {
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let pids = '';
      kill.stdout.on('data', (data) => {
        pids += data.toString();
      });

      kill.on('close', () => {
        if (pids) {
          const pidList = pids.trim().split('\n');
          pidList.forEach(pid => {
            try {
              process.kill(pid, 'SIGTERM');
            } catch (e) {
              // 이미 종료된 프로세스 무시
            }
          });
        }
        resolve();
      });
    });
  }

  // 대기 함수
  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 정리
  async cleanup() {
    console.log('\n🛑 모니터링 시스템 종료 중...');

    this.isRunning = false;

    // 모든 프로세스 종료
    this.processes.forEach(proc => {
      if (proc && !proc.killed) {
        proc.kill('SIGTERM');
      }
    });

    // 포트 정리
    await this.killPort(8888);

    console.log('👋 모니터링 시스템이 종료되었습니다');
  }

  // 상태 체크 (주기적으로 프로세스 상태 확인)
  startHealthCheck() {
    setInterval(() => {
      if (!this.isRunning) return;

      // WebSocket 서버 체크
      if (this.wsServer && this.wsServer.killed) {
        console.log('⚠️ WebSocket 서버가 종료되었습니다. 재시작 중...');
        this.startWebSocketServer();
      }

      // 안정 모니터 체크
      if (this.stableMonitor && this.stableMonitor.killed) {
        console.log('⚠️ 안정 모니터가 종료되었습니다. 재시작 중...');
        this.startStableMonitor();
      }
    }, 10000); // 10초마다 체크
  }
}

// 실행
const monitor = new IntegratedMonitor();

// 종료 시그널 처리
process.on('SIGINT', async () => {
  await monitor.cleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await monitor.cleanup();
  process.exit(0);
});

// 시작
monitor.init()
  .then(() => {
    monitor.startHealthCheck();
  })
  .catch(error => {
    console.error('시작 실패:', error);
    process.exit(1);
  });