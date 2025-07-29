/**
 * 🤖 Puppeteer 브라우저 자동화 테스트
 * 
 * 목적: 실제 사용자 행동을 완벽히 시뮬레이션
 * - 실제 타이핑, 클릭, 스크롤 동작
 * - 네트워크 상태 모니터링
 * - JavaScript 실행 상태 추적
 * - 실시간 스크린샷 캡처
 */

const puppeteer = require('puppeteer');
const path = require('path');

describe('🤖 Puppeteer: 게임플라자 브라우저 자동화 테스트', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: false, // 실제 브라우저 창으로 확인
      slowMo: 100,     // 액션 간 딜레이
      devtools: true,  // 개발자 도구 자동 열기
      args: [
        '--window-size=390,844', // iPhone 12 Pro 해상도
        '--device-scale-factor=3'
      ]
    });
    
    page = await browser.newPage();
    
    // 모바일 환경 시뮬레이션
    await page.setViewport({ width: 390, height: 844 });
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15');
    
    // 네트워크 모니터링 활성화
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      console.log(`📡 REQUEST: ${req.method()} ${req.url()}`);
      req.continue();
    });
    
    page.on('response', (res) => {
      console.log(`📥 RESPONSE: ${res.status()} ${res.url()}`);
    });
    
    console.log('🚀 Puppeteer 브라우저 자동화 환경 준비 완료');
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  test('🎮 시나리오 1: 완전한 예약 프로세스 자동화', async () => {
    console.log('🎯 전체 예약 프로세스 자동화 테스트 시작...');
    
    // 1. 홈페이지 접속
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: 'tests/screenshots/puppeteer-homepage.png' });
    
    // 2. 로그인 버튼 찾기 및 클릭 (실제 사용자처럼)
    const loginButton = await page.waitForSelector('[data-testid="login-button"], a[href*="login"], button:contains("로그인")', {
      visible: true,
      timeout: 10000
    });
    
    if (loginButton) {
      console.log('🔐 로그인 버튼 발견, 클릭 중...');
      await loginButton.click();
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
      await page.screenshot({ path: 'tests/screenshots/puppeteer-login-page.png' });
    }
    
    // 3. 구글 로그인 시뮬레이션 (실제 계정 없이 UI만 테스트)
    const googleLoginBtn = await page.$('[data-provider="google"], button:contains("Google")');
    if (googleLoginBtn) {
      console.log('🔍 구글 로그인 버튼 확인됨');
      // 실제 로그인 대신 UI 상호작용만 확인
      await googleLoginBtn.hover();
      await page.screenshot({ path: 'tests/screenshots/puppeteer-google-login-hover.png' });
    }
    
    // 4. 예약 페이지로 직접 이동 (테스트용)
    await page.goto('http://localhost:3000/reservations/new');
    await page.waitForLoadState('networkidle');
    
    // 5. 시간 선택 UI 인터랙션
    console.log('⏰ 시간 선택 인터페이스 테스트...');
    const timeSlots = await page.$$('[data-testid="time-slot"], .time-slot, button[data-time]');
    
    if (timeSlots.length > 0) {
      console.log(`📅 ${timeSlots.length}개의 시간 슬롯 발견`);
      
      // 첫 번째 가능한 시간 슬롯 선택
      await timeSlots[0].click();
      await page.screenshot({ path: 'tests/screenshots/puppeteer-time-selected.png' });
      
      // 선택 상태 확인
      const selectedSlot = await page.$('.time-slot.selected, [data-selected="true"]');
      expect(selectedSlot).toBeTruthy();
    }
    
    // 6. 폼 입력 시뮬레이션 (실제 타이핑)
    const nameInput = await page.$('input[name="name"], input[placeholder*="이름"]');
    if (nameInput) {
      await nameInput.click();
      await nameInput.type('테스트 사용자', { delay: 100 }); // 실제 타이핑 속도
      console.log('✍️ 이름 입력 완료');
    }
    
    const phoneInput = await page.$('input[name="phone"], input[placeholder*="전화"]');
    if (phoneInput) {
      await phoneInput.click();
      await phoneInput.type('010-1234-5678', { delay: 50 });
      console.log('📞 전화번호 입력 완료');
    }
    
    // 7. 스크롤 테스트 (모바일 환경)
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 2);
    });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'tests/screenshots/puppeteer-scrolled.png' });
    
    // 8. 최종 상태 확인
    const pageTitle = await page.title();
    expect(pageTitle).toContain('게임플라자');
    
    console.log('✅ 완전한 예약 프로세스 자동화 테스트 완료');
  });

  test('🚀 시나리오 2: 성능 및 리소스 모니터링', async () => {
    console.log('📊 성능 모니터링 테스트 시작...');
    
    // 성능 메트릭 추적 시작
    await page.tracing.start({ path: 'tests/reports/puppeteer-performance-trace.json' });
    
    const startTime = Date.now();
    
    // 페이지 로드
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    
    const loadTime = Date.now() - startTime;
    console.log(`⚡ 페이지 로드 시간: ${loadTime}ms`);
    
    // JavaScript 힙 사용량 확인
    const metrics = await page.metrics();
    console.log('📈 성능 메트릭:', {
      JSHeapUsedSize: `${Math.round(metrics.JSHeapUsedSize / 1024 / 1024)}MB`,
      JSHeapTotalSize: `${Math.round(metrics.JSHeapTotalSize / 1024 / 1024)}MB`,
      Nodes: metrics.Nodes,
      Documents: metrics.Documents
    });
    
    // 성능 추적 종료
    await page.tracing.stop();
    
    // 성능 기준 검증
    expect(loadTime).toBeLessThan(5000); // 5초 이내 로드
    expect(metrics.JSHeapUsedSize).toBeLessThan(50 * 1024 * 1024); // 50MB 이내
    
    console.log('✅ 성능 모니터링 테스트 완료');
  });

  test('🌐 시나리오 3: 네트워크 상태별 테스트', async () => {
    console.log('📶 네트워크 상태별 테스트 시작...');
    
    // 느린 3G 환경 시뮬레이션
    const slow3G = {
      offline: false,
      downloadThroughput: 500 * 1024 / 8, // 500kb/s
      uploadThroughput: 500 * 1024 / 8,
      latency: 400 // 400ms 지연
    };
    
    await page.emulateNetworkConditions(slow3G);
    console.log('📶 3G 네트워크 환경 시뮬레이션 활성화');
    
    const startTime = Date.now();
    await page.goto('http://localhost:3000');
    const slow3GLoadTime = Date.now() - startTime;
    
    console.log(`🐌 3G 환경 로드 시간: ${slow3GLoadTime}ms`);
    
    // 오프라인 상태 테스트
    await page.setOfflineMode(true);
    console.log('📴 오프라인 모드 활성화');
    
    try {
      await page.goto('http://localhost:3000', { timeout: 3000 });
    } catch (error) {
      console.log('✅ 오프라인 상태에서 정상적으로 연결 실패');
      expect(error.message).toContain('net::ERR_INTERNET_DISCONNECTED');
    }
    
    // 네트워크 복구
    await page.setOfflineMode(false);
    await page.emulateNetworkConditions(null);
    console.log('🔄 네트워크 상태 복구');
    
    console.log('✅ 네트워크 상태별 테스트 완료');
  });

  test('📱 시나리오 4: 모바일 터치 인터랙션', async () => {
    console.log('👆 모바일 터치 인터랙션 테스트 시작...');
    
    await page.goto('http://localhost:3000');
    
    // 터치 이벤트 시뮬레이션
    await page.touchscreen.tap(195, 100); // 화면 중앙 터치
    
    // 스와이프 동작 시뮬레이션
    await page.touchscreen.swipe(100, 400, 300, 400); // 좌→우 스와이프
    await page.waitForTimeout(1000);
    
    // 핀치 줌 시뮬레이션 (가능한 경우)
    await page.evaluate(() => {
      // 터치 이벤트 강제 발생
      const touchEvent = new TouchEvent('touchstart', {
        touches: [
          { clientX: 100, clientY: 100 },
          { clientX: 200, clientY: 200 }
        ]
      });
      document.dispatchEvent(touchEvent);
    });
    
    await page.screenshot({ path: 'tests/screenshots/puppeteer-mobile-interaction.png' });
    
    console.log('✅ 모바일 터치 인터랙션 테스트 완료');
  });
});