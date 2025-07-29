import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/home.page';
import { ReservationPage } from '../pages/reservation.page';
import { TestHelpers } from '../utils/test-helpers';
import { 
  waitBeforeApiCall, 
  waitBetweenTests, 
  waitForApiResponse, 
  checkForApiErrors,
  setTestEnvironmentHeaders,
  waitForApiType
} from '../utils/api-helpers';

test.describe('예약 시스템 전체 플로우', () => {
  let homePage: HomePage;
  let reservationPage: ReservationPage;

  test.beforeEach(async ({ page }) => {
    // 테스트 환경 헤더 설정
    await setTestEnvironmentHeaders(page);
    
    homePage = new HomePage(page);
    reservationPage = new ReservationPage(page);
    
    // 로그인 상태로 시작
    await TestHelpers.login(page);
    await waitForApiType('auth'); // 로그인 API 대기
    await checkForApiErrors(page);
  });
  
  test.afterEach(async ({ page }) => {
    // 테스트 간 대기시간
    await waitBetweenTests();
  });

  test('기본 예약 생성 플로우', async ({ page }) => {
    // 1. 홈페이지에서 예약 버튼 클릭
    await homePage.navigateToHome();
    await homePage.clickReservation();
    
    // 2. 예약 페이지로 이동 확인
    await expect(page).toHaveURL('/reservations/new');
    
    // 3. 예약 정보 입력
    const tomorrow = TestHelpers.getTomorrowDate();
    await reservationPage.selectDevice('ps5-001');
    await reservationPage.selectDate(tomorrow);
    await reservationPage.selectTime('14:00');
    await reservationPage.selectDuration('120'); // 2시간
    
    // 4. 가격 표시 확인
    const price = await reservationPage.getPrice();
    expect(price).toContain('20,000원'); // 2시간 기준 가격
    
    // 5. 예약 제출
    await reservationPage.submitReservation();
    
    // 6. 성공 메시지 확인
    const isSuccess = await reservationPage.isSuccessful();
    expect(isSuccess).toBeTruthy();
    
    // 7. 예약 목록 페이지로 리다이렉트 확인
    await expect(page).toHaveURL('/reservations');
  });

  test('새벽 시간대(24-29시) 예약', async ({ page }) => {
    await reservationPage.navigateToReservation();
    
    // 새벽 2시(26시) 예약
    await reservationPage.createLateNightReservation('ps5-001', 26);
    
    // 시간 표시 확인
    const selectedTime = await reservationPage.getSelectedTime();
    expect(selectedTime).toContain('26시');
    
    // 예약 성공 확인
    const isSuccess = await reservationPage.isSuccessful();
    expect(isSuccess).toBeTruthy();
  });

  test('중복 예약 방지', async ({ page }) => {
    // 첫 번째 예약 생성
    await reservationPage.navigateToReservation();
    const tomorrow = TestHelpers.getTomorrowDate();
    await reservationPage.createReservation('ps5-001', tomorrow, '15:00', '60');
    
    // 같은 시간대에 다시 예약 시도
    await reservationPage.navigateToReservation();
    await reservationPage.createReservation('ps5-001', tomorrow, '15:00', '60');
    
    // 에러 메시지 확인
    const errorMessage = await reservationPage.getErrorMessage();
    expect(errorMessage).toContain('이미 예약된 시간');
  });

  test('예약 취소', async ({ page }) => {
    // 예약 생성
    await reservationPage.navigateToReservation();
    const tomorrow = TestHelpers.getTomorrowDate();
    await reservationPage.createReservation('nintendo-001', tomorrow, '10:00', '60');
    
    // 예약 목록에서 취소 버튼 클릭
    await page.goto('/reservations');
    await page.click('[data-testid="reservation-item"]:first-child [data-testid="cancel-button"]');
    
    // 취소 확인 다이얼로그
    await page.click('[data-testid="confirm-cancel"]');
    
    // 취소 성공 메시지 확인
    const toast = await TestHelpers.waitForToast(page);
    expect(toast).toContain('예약이 취소되었습니다');
  });

  test('24시간 제한 규칙 확인', async ({ page }) => {
    // 24시간 이내 예약 시도
    const today = new Date();
    today.setHours(today.getHours() + 20); // 20시간 후
    
    await reservationPage.navigateToReservation();
    await reservationPage.selectDevice('ps5-001');
    await reservationPage.selectDate(today);
    await reservationPage.selectTime(`${today.getHours()}:00`);
    await reservationPage.selectDuration('60');
    await reservationPage.submitReservation();
    
    // 에러 메시지 확인
    const errorMessage = await reservationPage.getErrorMessage();
    expect(errorMessage).toContain('24시간 전에 예약');
  });

  test('빠른 예약 위젯 사용', async ({ page }) => {
    await homePage.navigateToHome();
    
    // 빠른 예약 위젯으로 예약
    await homePage.quickReserve('PS5', '14:00');
    
    // 예약 확인 페이지로 이동
    await expect(page).toHaveURL(/\/reservations\/confirm/);
    
    // 예약 정보 확인
    const deviceInfo = await page.textContent('[data-testid="confirm-device"]');
    expect(deviceInfo).toContain('PS5');
    
    const timeInfo = await page.textContent('[data-testid="confirm-time"]');
    expect(timeInfo).toContain('14:00');
  });
});

test.describe('예약 상태 관리', () => {
  test.beforeEach(async ({ page }) => {
    await TestHelpers.login(page);
  });

  test('예약 상태 실시간 업데이트', async ({ page, context }) => {
    // 두 개의 탭 열기
    const page2 = await context.newPage();
    
    // 첫 번째 탭에서 예약 목록 열기
    await page.goto('/reservations');
    
    // 두 번째 탭에서 새 예약 생성
    const reservationPage2 = new ReservationPage(page2);
    await reservationPage2.navigateToReservation();
    const tomorrow = TestHelpers.getTomorrowDate();
    await reservationPage2.createReservation('ps5-001', tomorrow, '16:00', '120');
    
    // 첫 번째 탭에서 실시간 업데이트 확인
    await TestHelpers.waitForRealtimeUpdate(page);
    const reservationItems = await page.$$('[data-testid="reservation-item"]');
    expect(reservationItems.length).toBeGreaterThan(0);
    
    // 새로 추가된 예약 확인
    const latestReservation = await page.textContent('[data-testid="reservation-item"]:first-child');
    expect(latestReservation).toContain('16:00');
  });
});