import { test, expect } from '@playwright/test';
import { KSTDateTime } from '@/domain/value-objects/kst-datetime';
import { 
  waitBeforeApiCall, 
  waitBetweenTests, 
  waitForApiResponse, 
  retryOnRateLimit,
  checkForApiErrors,
  startNetworkMonitoring,
  setTestEnvironmentHeaders,
  waitForApiType
} from '../utils/api-helpers';

test.describe('완전한 예약 플로우 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 테스트 환경 헤더 설정
    await setTestEnvironmentHeaders(page);
    
    // 네트워크 모니터링 시작
    const monitoring = startNetworkMonitoring(page);
    
    // 테스트 환경 초기화
    await page.goto('/');
    await waitForApiType('devices'); // 초기 페이지 로딩 시 기기 목록 API 호출 대기
    
    // API 에러 확인
    await checkForApiErrors(page);
  });
  
  test.afterEach(async ({ page }) => {
    // 테스트 간 대기시간
    await waitBetweenTests();
  });

  test('TC-E2E-001: 신규 사용자 전체 여정', async ({ page }) => {
    // Step 1: 회원가입
    await test.step('회원가입', async () => {
      await page.click('text=시작하기');
      await page.waitForURL('/signup');
      await waitForApiType('auth'); // 인증 관련 API 대기
      
      // Google OAuth 모의
      await page.click('button:has-text("Google로 계속하기")');
      await waitForApiType('auth'); // OAuth API 대기
      
      // OAuth 콜백 처리 (테스트 환경에서는 모의 처리)
      await page.waitForURL('/signup?step=nickname');
      
      // 닉네임 설정
      await page.fill('input[name="nickname"]', '게임러123');
      await page.click('button:has-text("확인")');
      await waitForApiType('auth'); // 닉네임 검증 API 대기
      
      // AI 모더레이션 통과 대기
      await expect(page.locator('text=사용 가능한 닉네임입니다')).toBeVisible();
      
      // 마케팅 동의
      await page.check('input[name="marketing"]');
      await page.click('button:has-text("가입 완료")');
      await waitForApiType('auth'); // 회원가입 완료 API 대기
      
      await page.waitForURL('/');
      await expect(page.locator('text=게임러123')).toBeVisible();
      await checkForApiErrors(page); // API 에러 확인
    });

    // Step 2: 예약 생성
    await test.step('예약 생성', async () => {
      await page.click('button:has-text("예약하기")');
      await page.waitForURL('/reservations/new');
      await waitForApiType('devices'); // 기기 목록 API 대기
      await waitForApiType('timeslots'); // 시간슬롯 API 대기
      
      // 날짜 선택 (2일 후)
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2);
      const dateString = KSTDateTime.toDateString(futureDate);
      
      await page.click(`[data-date="${dateString}"]`);
      await waitForApiType('timeslots'); // 날짜별 시간슬롯 API 대기
      
      // 기기 선택
      await page.click('text=철권8');
      await expect(page.locator('.device-selected')).toHaveText('철권8');
      await waitForApiType('devices'); // 기기 상태 확인 API 대기
      
      // 시간 선택 (14:00-18:00)
      await page.click('[data-time="14:00-18:00"]');
      await expect(page.locator('.time-selected')).toHaveText('14:00-18:00');
      await waitForApiType('timeslots'); // 시간 가용성 확인 API 대기
      
      // 옵션 선택
      await page.click('text=무한크레딧');
      
      // 예약 신청
      await page.click('button:has-text("예약 신청")');
      await waitForApiType('reservations'); // 예약 생성 API 대기
      
      // 확인 모달
      await expect(page.locator('.modal-title')).toHaveText('예약 확인');
      await page.click('button:has-text("확인")');
      await waitForApiType('reservations'); // 예약 확정 API 대기
      
      // 완료 페이지
      await page.waitForURL('/reservations/complete');
      await expect(page.locator('text=예약이 신청되었습니다')).toBeVisible();
      await checkForApiErrors(page); // API 에러 확인
    });

    // Step 3: 예약 목록 확인
    await test.step('예약 목록 확인', async () => {
      await page.goto('/mypage');
      await waitForApiType('auth'); // 사용자 정보 API 대기
      
      await page.click('text=예약 내역');
      await waitForApiType('reservations'); // 예약 목록 API 대기
      
      await expect(page.locator('.reservation-item').first()).toContainText('철권8');
      await expect(page.locator('.reservation-status').first()).toHaveText('대기중');
      await checkForApiErrors(page); // API 에러 확인
    });
  });

  test('TC-E2E-002: 체크인 및 결제 플로우', async ({ page, context }) => {
    // 관리자로 로그인 (별도 컨텍스트)
    const adminPage = await context.newPage();
    
    await test.step('관리자 로그인', async () => {
      await adminPage.goto('/admin/login');
      await adminPage.fill('input[name="email"]', 'admin@gameplaza.com');
      await adminPage.fill('input[name="password"]', 'admin123!');
      await adminPage.click('button:has-text("로그인")');
      
      await adminPage.waitForURL('/admin');
      await expect(adminPage.locator('text=관리자 대시보드')).toBeVisible();
    });

    await test.step('예약 승인', async () => {
      await adminPage.goto('/admin/reservations');
      
      // 대기중 예약 찾기
      const pendingReservation = adminPage.locator('.reservation-row').filter({
        hasText: '대기중'
      }).first();
      
      await pendingReservation.locator('button:has-text("승인")').click();
      await expect(pendingReservation.locator('.status')).toHaveText('승인됨');
    });

    await test.step('체크인 처리', async () => {
      await adminPage.goto('/admin/checkin');
      
      // QR 코드 스캔 시뮬레이션
      await adminPage.fill('input[name="reservationCode"]', 'RES-123456');
      await adminPage.click('button:has-text("조회")');
      
      // 예약 정보 확인
      await expect(adminPage.locator('.reservation-info')).toContainText('철권8');
      await expect(adminPage.locator('.time-info')).toContainText('14:00-18:00');
      
      // 체크인
      await adminPage.click('button:has-text("체크인")');
      await expect(adminPage.locator('.checkin-status')).toHaveText('체크인 완료');
    });

    await test.step('결제 처리', async () => {
      // 결제 화면 표시
      await expect(adminPage.locator('.payment-amount')).toHaveText('₩50,000');
      
      // 카드 결제 선택
      await adminPage.click('button:has-text("카드 결제")');
      
      // 결제 완료 대기
      await adminPage.waitForSelector('.payment-complete', { state: 'visible' });
      await expect(adminPage.locator('.payment-status')).toHaveText('결제 완료');
      
      // 기기 활성화 확인
      await expect(adminPage.locator('.device-status')).toHaveText('사용중');
    });
  });

  test('TC-E2E-003: 시간 연장 플로우', async ({ page }) => {
    // 사용자 페이지에서 연장 요청
    await test.step('연장 요청', async () => {
      await page.goto('/mypage/reservations');
      
      // 현재 사용중인 예약 찾기
      const activeReservation = page.locator('.reservation-item').filter({
        hasText: '사용중'
      }).first();
      
      await activeReservation.locator('button:has-text("시간 연장")').click();
      
      // 연장 옵션 선택
      await page.click('text=2시간 연장');
      await expect(page.locator('.additional-amount')).toHaveText('₩20,000');
      
      await page.click('button:has-text("연장 신청")');
      
      // 성공 메시지
      await expect(page.locator('.toast-success')).toHaveText('연장이 신청되었습니다');
    });

    await test.step('추가 결제', async () => {
      // 결제 페이지로 이동
      await page.waitForURL(/\/payment/);
      
      await page.click('button:has-text("카드 결제")');
      await page.waitForSelector('.payment-processing');
      
      // 결제 완료
      await expect(page.locator('.payment-success')).toBeVisible();
      await expect(page.locator('.new-end-time')).toHaveText('20:00');
    });
  });

  test('TC-E2E-004: 노쇼 처리 플로우', async ({ page, context }) => {
    // 시간 조작을 위한 mock
    await page.addInitScript(() => {
      // 예약 시간 15분 후로 시간 설정
      const mockTime = new Date('2025-07-26 14:15:00');
      Date.now = () => mockTime.getTime();
    });

    const adminPage = await context.newPage();
    
    await test.step('자동 노쇼 처리 확인', async () => {
      await adminPage.goto('/admin/reservations');
      
      // 노쇼 처리된 예약 확인
      const noShowReservation = adminPage.locator('.reservation-row').filter({
        hasText: '노쇼'
      });
      
      await expect(noShowReservation).toBeVisible();
      await expect(noShowReservation.locator('.auto-processed')).toHaveText('자동 처리');
    });

    await test.step('대기자 자동 배정', async () => {
      // 대기자에게 알림 발송 확인
      await page.goto('/');
      await expect(page.locator('.notification-badge')).toHaveText('1');
      
      await page.click('.notification-icon');
      await expect(page.locator('.notification-item').first()).toContainText('예약 가능');
      
      // 30초 내 응답
      await page.click('button:has-text("예약하기")');
      await expect(page.locator('.reservation-confirmed')).toBeVisible();
    });
  });

  test('TC-E2E-005: 모바일 환경 예약 플로우', async ({ page, browserName }) => {
    // 모바일 뷰포트 설정
    await page.setViewportSize({ width: 375, height: 812 });

    await test.step('모바일 네비게이션', async () => {
      await page.goto('/');
      
      // 하단 탭바 확인
      await expect(page.locator('.bottom-tab-bar')).toBeVisible();
      
      // 예약 탭 클릭
      await page.click('[data-tab="reservation"]');
      await page.waitForURL('/reservations/new');
    });

    await test.step('터치 인터랙션', async () => {
      // 스와이프로 날짜 선택
      const calendar = page.locator('.calendar-container');
      await calendar.evaluate(el => {
        const touch = new Touch({
          identifier: 1,
          target: el,
          clientX: 300,
          clientY: 200,
        });
        
        el.dispatchEvent(new TouchEvent('touchstart', { touches: [touch] }));
        el.dispatchEvent(new TouchEvent('touchmove', { 
          touches: [new Touch({ ...touch, clientX: 100 })] 
        }));
        el.dispatchEvent(new TouchEvent('touchend', { touches: [] }));
      });

      // 기기 카드 탭
      await page.tap('.device-card:has-text("철권8")');
      await expect(page.locator('.device-selected')).toBeVisible();

      // 시간 슬롯 스크롤
      await page.locator('.time-slots').evaluate(el => el.scrollTo(0, 200));
      await page.tap('[data-time="14:00-18:00"]');
    });

    await test.step('PWA 기능', async () => {
      // 설치 프롬프트 확인
      if (browserName === 'chromium') {
        await expect(page.locator('.pwa-install-banner')).toBeVisible({ timeout: 5000 });
      }

      // 오프라인 상태 시뮬레이션
      await context.setOffline(true);
      await expect(page.locator('.offline-indicator')).toBeVisible();
      
      // 캐시된 데이터 표시 확인
      await expect(page.locator('.device-list')).toBeVisible();
      
      await context.setOffline(false);
    });
  });

  test('TC-E2E-006: 실시간 동기화 테스트', async ({ context }) => {
    // 두 개의 브라우저 창 열기
    const page1 = await context.newPage();
    const page2 = await context.newPage();

    await test.step('실시간 예약 상태 동기화', async () => {
      // 첫 번째 창에서 예약 목록 열기
      await page1.goto('/schedule');
      
      // 두 번째 창에서 예약 생성
      await page2.goto('/reservations/new');
      
      // 예약 생성 프로세스...
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2);
      await page2.click(`[data-date="${KSTDateTime.toDateString(futureDate)}"]`);
      await page2.click('text=철권8');
      await page2.click('[data-time="14:00-18:00"]');
      await page2.click('button:has-text("예약 신청")');
      
      // 첫 번째 창에서 실시간 업데이트 확인
      await expect(page1.locator('.schedule-item').filter({
        hasText: '철권8'
      }).filter({
        hasText: '14:00-18:00'
      })).toBeVisible({ timeout: 3000 });
    });

    await test.step('실시간 기기 상태 동기화', async () => {
      // 관리자가 기기 상태 변경
      const adminPage = await context.newPage();
      await adminPage.goto('/admin/devices');
      
      await adminPage.click('.device-row:has-text("PC-01") button:has-text("점검")');
      
      // 사용자 페이지에서 즉시 반영 확인
      await expect(page1.locator('.device-status:has-text("PC-01")')).toHaveClass(/maintenance/);
      await expect(page2.locator('[data-device="PC-01"]')).toBeDisabled();
    });
  });
});