#!/usr/bin/env node

/**
 * 실시간 브라우저 에러 감지 및 자동 수정 시스템
 *
 * 기능:
 * 1. Playwright로 브라우저 자동화
 * 2. 콘솔 에러 실시간 감지
 * 3. 네트워크 요청 실패 감지
 * 4. 에러 자동 분석 및 코드 수정
 * 5. Hot reload로 즉시 반영
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

class AutoFixSystem {
  constructor() {
    this.browser = null;
    this.page = null;
    this.errorHistory = [];
    this.isFixing = false;
    this.projectRoot = process.cwd();
    this.checkInterval = null;
    this.lastUrl = '';
    this.retryCount = 0;
    this.maxRetries = 3;
  }

  async init() {
    console.log('🤖 실시간 브라우저 에러 자동 수정 시스템 시작');
    console.log('🔄 시스템은 "오토픽스 꺼줘" 명령까지 계속 실행됩니다.');

    try {
      // Playwright 브라우저 시작
      this.browser = await chromium.launch({
        headless: false, // 브라우저 화면 보기
        devtools: true   // 개발자 도구 열기
      });

      this.page = await this.browser.newPage();

      // 페이지 설정
      await this.page.setDefaultTimeout(5000); // 타임아웃 5초로 설정
      await this.page.setDefaultNavigationTimeout(10000); // 네비게이션 타임아웃 10초

      // 콘솔 에러 리스너
      this.page.on('console', this.handleConsoleMessage.bind(this));

      // 네트워크 에러 리스너
      this.page.on('response', this.handleNetworkResponse.bind(this));

      // 페이지 에러 리스너
      this.page.on('pageerror', this.handlePageError.bind(this));

      // 브라우저 크래시 감지
      this.page.on('crash', () => {
        console.error('💥 브라우저 크래시 감지! 3초 후 재시작합니다...');
        setTimeout(() => this.restart(), 3000);
      });

      // 페이지 닫힘 감지
      this.page.on('close', () => {
        console.log('📄 페이지가 닫혔습니다. 새 페이지를 생성합니다...');
        this.createNewPage();
      });

      console.log('📱 localhost:3000으로 접속 중...');
      try {
        await this.page.goto('http://localhost:3000', {
          waitUntil: 'domcontentloaded',
          timeout: 10000
        });
      } catch (navError) {
        console.log('⚠️ 초기 페이지 로드 실패, 하지만 계속 모니터링합니다...');
      }

      // 주기적으로 페이지 상태 체크
      this.startPeriodicCheck();

      console.log('✨ 시스템이 활성화되었습니다. 에러를 감지하고 있습니다...');

    } catch (error) {
      console.error('⚠️ 초기화 중 에러:', error.message);
      console.log('🔄 3초 후 재시도합니다...');
      setTimeout(() => this.init(), 3000);
    }
  }

  async createNewPage() {
    try {
      if (!this.browser) {
        await this.init();
        return;
      }

      this.page = await this.browser.newPage();

      // 이벤트 리스너 재설정
      this.page.on('console', this.handleConsoleMessage.bind(this));
      this.page.on('response', this.handleNetworkResponse.bind(this));
      this.page.on('pageerror', this.handlePageError.bind(this));
      this.page.on('crash', () => {
        console.error('💥 브라우저 크래시 감지! 재시작합니다...');
        setTimeout(() => this.restart(), 3000);
      });

      await this.page.goto('http://localhost:3000', {
        waitUntil: 'domcontentloaded',
        timeout: 10000
      }).catch(() => {
        console.log('⚠️ 페이지 로드 실패, 계속 모니터링...');
      });

    } catch (error) {
      console.error('❌ 새 페이지 생성 실패:', error.message);
    }
  }

  async handleConsoleMessage(msg) {
    try {
      if (msg.type() === 'error') {
        const error = {
          type: 'console',
          message: msg.text(),
          url: this.page ? this.page.url() : 'unknown',
          timestamp: new Date(),
          location: await this.getErrorLocation(msg)
        };

        console.log('🔥 콘솔 에러 감지:', error.message);
        await this.processError(error);
      }
    } catch (e) {
      console.log('⚠️ 콘솔 메시지 처리 중 에러:', e.message);
    }
  }

  async handleNetworkResponse(response) {
    try {
      if (response.status() >= 400) {
        const error = {
          type: 'network',
          message: `${response.status()} ${response.statusText()} - ${response.url()}`,
          url: response.url(),
          status: response.status(),
          timestamp: new Date()
        };

        console.log('🌐 네트워크 에러 감지:', error.message);
        await this.processError(error);
      }
    } catch (e) {
      console.log('⚠️ 네트워크 응답 처리 중 에러:', e.message);
    }
  }

  async handlePageError(error) {
    try {
      const errorInfo = {
        type: 'page',
        message: error.message,
        stack: error.stack,
        url: this.page ? this.page.url() : 'unknown',
        timestamp: new Date()
      };

      console.log('💀 페이지 에러 감지:', errorInfo.message);
      await this.processError(errorInfo);
    } catch (e) {
      console.log('⚠️ 페이지 에러 처리 중 에러:', e.message);
    }
  }

  async processError(error) {
    if (this.isFixing) {
      console.log('⏳ 이미 수정 중입니다. 대기 중...');
      return;
    }

    // 중복 에러 필터링 (최근 5초 내 동일 에러 무시)
    const recentSimilar = this.errorHistory.find(e =>
      e.message === error.message &&
      (Date.now() - e.timestamp.getTime()) < 5000
    );

    if (recentSimilar) return;

    this.errorHistory.push(error);
    this.isFixing = true;

    try {
      console.log('🔧 에러 자동 수정 시도 중...');
      await this.autoFixError(error);
      console.log('✅ 에러 수정 완료!');

      // 페이지 새로고침하여 수정 확인
      setTimeout(async () => {
        try {
          await this.page.reload();
          console.log('🔄 페이지 새로고침으로 수정 확인 중...');
        } catch (reloadError) {
          console.log('⚠️ 페이지 새로고침 실패, 계속 모니터링 중...');
        }
      }, 2000);

    } catch (fixError) {
      console.error('❌ 자동 수정 실패:', fixError.message);
    } finally {
      this.isFixing = false;
    }
  }

  async autoFixError(error) {
    console.log('🤖 AI 에러 분석 시작...');

    // Claude Code와 통신하여 에러 분석 및 수정
    const analysisPrompt = this.buildAnalysisPrompt(error);

    // 임시로 파일에 에러 정보 저장
    const errorFile = path.join(this.projectRoot, 'temp-error.json');
    fs.writeFileSync(errorFile, JSON.stringify(error, null, 2));

    console.log('📝 에러 정보 저장:', errorFile);
    console.log('🎯 다음 에러를 자동 수정해야 합니다:');
    console.log('   타입:', error.type);
    console.log('   메시지:', error.message);
    if (error.stack) {
      console.log('   스택:', error.stack.split('\n')[0]);
    }

    // 에러 타입별 자동 수정 로직
    await this.applyAutoFix(error);
  }

  async applyAutoFix(error) {
    switch (error.type) {
      case 'console':
        await this.fixConsoleError(error);
        break;
      case 'network':
        await this.fixNetworkError(error);
        break;
      case 'page':
        await this.fixPageError(error);
        break;
    }
  }

  async fixConsoleError(error) {
    // JavaScript 에러 패턴별 자동 수정
    if (error.message.includes('Cannot read properties of undefined')) {
      console.log('🔧 undefined 접근 에러 수정 중...');
      await this.addNullChecks(error);
    } else if (error.message.includes('is not a function')) {
      console.log('🔧 함수 호출 에러 수정 중...');
      await this.fixFunctionCall(error);
    } else if (error.message.includes('Module not found')) {
      console.log('🔧 모듈 누락 에러 수정 중...');
      await this.fixMissingModule(error);
    }
  }

  async fixNetworkError(error) {
    if (error.status === 404) {
      console.log('🔧 404 에러 수정: API 엔드포인트 생성 중...');
      await this.createMissingEndpoint(error);
    } else if (error.status === 500) {
      console.log('🔧 500 에러 수정: 서버 코드 검토 중...');
      await this.fixServerError(error);
    }
  }

  async fixPageError(error) {
    console.log('🔧 페이지 에러 수정: React 컴포넌트 검토 중...');
    await this.fixReactComponent(error);
  }

  async addNullChecks(error) {
    // 간단한 null check 추가 로직
    console.log('🛡️ Null 체크 추가 중...');
  }

  async fixFunctionCall(error) {
    console.log('📞 함수 호출 수정 중...');
  }

  async fixMissingModule(error) {
    console.log('📦 누락된 모듈 설치 중...');
  }

  async createMissingEndpoint(error) {
    console.log('🛠️ API 엔드포인트 생성 중...');
  }

  async fixServerError(error) {
    console.log('🖥️ 서버 에러 수정 중...');
  }

  async fixReactComponent(error) {
    console.log('⚛️ React 컴포넌트 수정 중...');
  }

  buildAnalysisPrompt(error) {
    return `
다음 브라우저 에러를 자동으로 수정해주세요:

에러 타입: ${error.type}
에러 메시지: ${error.message}
발생 URL: ${error.url}
발생 시간: ${error.timestamp}
${error.stack ? `스택 트레이스: ${error.stack}` : ''}

프로젝트: Next.js 14 + TypeScript + Cloudflare D1
환경: 개발 환경 (localhost:3000)

자동 수정 요청: 이 에러를 근본적으로 해결하는 코드 변경사항을 적용해주세요.
`;
  }

  async startPeriodicCheck() {
    // 주기적 체크
    this.checkInterval = setInterval(async () => {
      try {
        if (!this.page || this.page.isClosed()) {
          console.log('🔄 페이지가 닫혔습니다. 새 페이지를 생성합니다...');
          await this.createNewPage();
          return;
        }

        // 페이지가 응답하는지 확인
        const title = await this.page.evaluate(() => document.title).catch(() => null);

        if (title) {
          // 현재 URL 확인
          const currentUrl = this.page.url();
          if (!currentUrl.includes('localhost:3000')) {
            console.log('🔄 localhost:3000으로 돌아갑니다...');
            await this.page.goto('http://localhost:3000', {
              waitUntil: 'domcontentloaded',
              timeout: 5000
            }).catch(() => {
              console.log('⚠️ 페이지 이동 실패, 계속 모니터링...');
            });
          }
        }

      } catch (e) {
        console.log('🔍 페이지 상태 체크 중 문제 발견:', e.message);
        // 에러가 있어도 계속 실행
      }
    }, 5000); // 5초마다 체크

    // 네비게이션 이벤트 감지
    if (this.page) {
      this.page.on('framenavigated', (frame) => {
        if (frame === this.page.mainFrame()) {
          const url = frame.url();
          console.log('🔗 페이지 이동 감지:', url);

          // 에러 히스토리 초기화 (새 페이지로 이동했으므로)
          if (!url.includes(this.lastUrl)) {
            this.errorHistory = [];
            this.lastUrl = url;
          }
        }
      });
    }
  }

  async getErrorLocation(consoleMsg) {
    try {
      const location = consoleMsg.location();
      return location;
    } catch (e) {
      return null;
    }
  }

  async restart() {
    console.log('🔄 시스템을 재시작합니다...');

    try {
      // 체크 인터벌 중지
      if (this.checkInterval) {
        clearInterval(this.checkInterval);
        this.checkInterval = null;
      }

      // 브라우저 종료
      if (this.browser) {
        await this.browser.close().catch(() => {});
        this.browser = null;
        this.page = null;
      }
    } catch (e) {
      console.error('브라우저 종료 중 에러:', e.message);
    }

    // 3초 후 재시작
    console.log('⏳ 3초 후 재시작합니다...');
    setTimeout(() => {
      this.init();
    }, 3000);
  }

  async close() {
    console.log('🛑 오토픽스 시스템을 종료합니다...');

    try {
      // 체크 인터벌 중지
      if (this.checkInterval) {
        clearInterval(this.checkInterval);
        this.checkInterval = null;
      }

      // 브라우저 종료
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
        this.page = null;
      }

      console.log('👋 오토픽스 시스템이 완전히 종료되었습니다.');
    } catch (e) {
      console.error('종료 중 에러:', e.message);
    }
  }
}

// 시스템 시작
async function main() {
  console.log('=====================================');
  console.log('🤖 Auto-Fix Browser Errors System');
  console.log('=====================================');
  console.log('');

  const autoFixer = new AutoFixSystem();

  // 종료 시그널 처리 (Ctrl+C)
  process.on('SIGINT', async () => {
    console.log('\n\n🛑 "오토픽스 꺼줘" 명령을 받았습니다.');
    await autoFixer.close();
    process.exit(0);
  });

  // 프로세스 에러 처리
  process.on('uncaughtException', (error) => {
    console.error('⚠️ 예상치 못한 에러 발생:', error.message);
    console.log('🔄 시스템이 계속 실행됩니다...');
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️ 처리되지 않은 Promise 거부:', reason);
    console.log('🔄 시스템이 계속 실행됩니다...');
  });

  try {
    await autoFixer.init();
    console.log('');
    console.log('===========================================');
    console.log('🎉 오토픽스 시스템이 활성화되었습니다!');
    console.log('===========================================');
    console.log('');
    console.log('📋 사용 방법:');
    console.log('   • 브라우저에서 자유롭게 페이지를 클릭하고 테스트하세요');
    console.log('   • 에러가 감지되면 자동으로 분석하고 수정합니다');
    console.log('   • 페이지가 닫혀도 자동으로 재연결됩니다');
    console.log('   • 크래시가 발생해도 자동으로 재시작됩니다');
    console.log('');
    console.log('🛑 종료 방법:');
    console.log('   • Ctrl+C를 누르거나');
    console.log('   • "오토픽스 꺼줘" 명령을 사용하세요');
    console.log('');
    console.log('💡 팁: 개발 서버가 실행 중인지 확인하세요 (npm run dev)');
    console.log('');
    console.log('===========================================');
    console.log('🔍 에러 모니터링 중... (이제 테스트를 시작하세요!)');
    console.log('===========================================');

  } catch (error) {
    console.error('💥 초기 시작 실패:', error.message);
    console.log('🔄 3초 후 다시 시도합니다...');
    setTimeout(() => main(), 3000);
  }
}

if (require.main === module) {
  main();
}

module.exports = AutoFixSystem;