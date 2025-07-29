import { test, expect, BrowserContext, Page } from '@playwright/test';
import { ReservationPage } from '../pages/reservation.page';
import { TestHelpers } from '../utils/test-helpers';

test.describe('실시간 동기화 테스트', () => {
  let context1: BrowserContext;
  let context2: BrowserContext;
  let page1: Page;
  let page2: Page;

  test.beforeEach(async ({ browser }) => {
    // 두 개의 독립적인 브라우저 컨텍스트 생성
    context1 = await browser.newContext();
    context2 = await browser.newContext();
    
    page1 = await context1.newPage();
    page2 = await context2.newPage();
    
    // 두 사용자 모두 로그인
    await TestHelpers.login(page1, 'user1@example.com');
    await TestHelpers.login(page2, 'user2@example.com');
  });

  test.afterEach(async () => {
    await context1.close();
    await context2.close();
  });

  test('동시 예약 충돌 방지', async () => {
    const reservationPage1 = new ReservationPage(page1);
    const reservationPage2 = new ReservationPage(page2);
    
    // 두 사용자가 같은 예약 페이지에 접속
    await reservationPage1.navigateToReservation();
    await reservationPage2.navigateToReservation();
    
    // 동일한 시간대 선택
    const tomorrow = TestHelpers.getTomorrowDate();
    const targetTime = '15:00';
    const targetDevice = 'ps5-001';
    
    // 사용자 1이 먼저 선택
    await reservationPage1.selectDevice(targetDevice);
    await reservationPage1.selectDate(tomorrow);
    await reservationPage1.selectTime(targetTime);
    await reservationPage1.selectDuration('120');
    
    // 사용자 2도 같은 시간 선택
    await reservationPage2.selectDevice(targetDevice);
    await reservationPage2.selectDate(tomorrow);
    await reservationPage2.selectTime(targetTime);
    await reservationPage2.selectDuration('120');
    
    // 동시에 예약 제출
    const [result1, result2] = await Promise.all([
      reservationPage1.submitReservation().then(() => reservationPage1.isSuccessful()),
      reservationPage2.submitReservation().then(() => reservationPage2.isSuccessful())
    ]);
    
    // 한 명만 성공해야 함
    expect(result1 !== result2).toBeTruthy();
    
    // 실패한 쪽에서 에러 메시지 확인
    if (!result1) {
      const error = await reservationPage1.getErrorMessage();
      expect(error).toContain('이미 예약된');
    } else {
      const error = await reservationPage2.getErrorMessage();
      expect(error).toContain('이미 예약된');
    }
  });

  test('예약 목록 실시간 업데이트', async () => {
    // 사용자 1은 예약 목록 페이지에서 대기
    await page1.goto('/reservations');
    const initialCount = await page1.$$eval('[data-testid="reservation-item"]', items => items.length);
    
    // 사용자 2가 새 예약 생성
    const reservationPage2 = new ReservationPage(page2);
    await reservationPage2.navigateToReservation();
    const tomorrow = TestHelpers.getTomorrowDate();
    await reservationPage2.createReservation('nintendo-001', tomorrow, '18:00', '60');
    
    // 사용자 1의 화면에서 실시간 업데이트 확인
    await page1.waitForSelector(`[data-testid="reservation-item"]:nth-child(${initialCount + 1})`, {
      timeout: 5000
    });
    
    const newCount = await page1.$$eval('[data-testid="reservation-item"]', items => items.length);
    expect(newCount).toBe(initialCount + 1);
    
    // 새로 추가된 예약 정보 확인
    const latestReservation = await page1.textContent('[data-testid="reservation-item"]:first-child');
    expect(latestReservation).toContain('18:00');
    expect(latestReservation).toContain('Nintendo Switch');
  });

  test('예약 취소 실시간 반영', async () => {
    // 먼저 예약 생성
    const reservationPage1 = new ReservationPage(page1);
    await reservationPage1.navigateToReservation();
    const tomorrow = TestHelpers.getTomorrowDate();
    await reservationPage1.createReservation('ps5-002', tomorrow, '20:00', '120');
    
    // 두 사용자 모두 예약 목록 페이지로 이동
    await page1.goto('/reservations');
    await page2.goto('/reservations');
    
    // 사용자 2의 화면에서 예약 확인
    const reservationItem = page2.locator('[data-testid="reservation-item"]').filter({
      hasText: '20:00'
    });
    await expect(reservationItem).toBeVisible();
    
    // 사용자 1이 예약 취소
    await page1.click('[data-testid="reservation-item"]:has-text("20:00") [data-testid="cancel-button"]');
    await page1.click('[data-testid="confirm-cancel"]');
    
    // 사용자 2의 화면에서 예약이 사라지는지 확인
    await expect(reservationItem).toBeHidden({ timeout: 5000 });
  });

  test('기기 상태 실시간 동기화', async () => {
    // 두 사용자 모두 기기 목록 페이지로 이동
    await page1.goto('/devices');
    await page2.goto('/devices');
    
    // 초기 상태 확인
    const device1Status = page1.locator('[data-testid="device-ps5-001-status"]');
    const device2Status = page2.locator('[data-testid="device-ps5-001-status"]');
    
    await expect(device1Status).toContainText('사용 가능');
    await expect(device2Status).toContainText('사용 가능');
    
    // 사용자 1이 체크인
    await page1.click('[data-testid="device-ps5-001-checkin"]');
    await page1.click('[data-testid="confirm-checkin"]');
    
    // 사용자 2의 화면에서 상태 변경 확인
    await expect(device2Status).toContainText('사용 중', { timeout: 5000 });
    
    // 버튼 비활성화 확인
    const checkinButton2 = page2.locator('[data-testid="device-ps5-001-checkin"]');
    await expect(checkinButton2).toBeDisabled();
  });

  test('시간대별 예약 현황 실시간 업데이트', async () => {
    // 두 사용자 모두 예약 현황 페이지로 이동
    await page1.goto('/schedule');
    await page2.goto('/schedule');
    
    const tomorrow = TestHelpers.getTomorrowDate();
    const dateString = tomorrow.toISOString().split('T')[0];
    
    // 사용자 1의 화면에서 특정 시간대 확인
    const timeSlot1 = page1.locator(`[data-date="${dateString}"][data-time="16:00"]`);
    await expect(timeSlot1).toHaveAttribute('data-status', 'available');
    
    // 사용자 2가 해당 시간대 예약
    const reservationPage2 = new ReservationPage(page2);
    await reservationPage2.navigateToReservation();
    await reservationPage2.createReservation('ps5-001', tomorrow, '16:00', '60');
    
    // 사용자 1의 화면에서 상태 변경 확인
    await expect(timeSlot1).toHaveAttribute('data-status', 'booked', { timeout: 5000 });
    await expect(timeSlot1).toHaveClass(/booked|occupied|unavailable/);
  });

  test('알림 실시간 전송', async () => {
    // 사용자 1은 알림 설정 페이지에서 대기
    await page1.goto('/notifications');
    const notificationCount = page1.locator('[data-testid="notification-count"]');
    const initialCount = await notificationCount.textContent() || '0';
    
    // 사용자 2가 예약 생성 (사용자 1이 관심 있는 기기)
    const reservationPage2 = new ReservationPage(page2);
    await reservationPage2.navigateToReservation();
    const tomorrow = TestHelpers.getTomorrowDate();
    await reservationPage2.createReservation('ps5-001', tomorrow, '14:00', '120');
    
    // 사용자 1에게 알림 도착 확인
    await expect(notificationCount).not.toHaveText(initialCount, { timeout: 5000 });
    
    // 알림 내용 확인
    await page1.click('[data-testid="notification-bell"]');
    const latestNotification = page1.locator('[data-testid="notification-item"]:first-child');
    await expect(latestNotification).toContainText('PS5');
    await expect(latestNotification).toContainText('14:00');
  });

  test('실시간 대기열 업데이트', async () => {
    // 예약이 꽉 찬 시간대 설정
    const tomorrow = TestHelpers.getTomorrowDate();
    
    // 사용자 1이 대기열 등록
    await page1.goto('/waitlist');
    await page1.click('[data-testid="join-waitlist-ps5-14:00"]');
    
    // 사용자 2의 대기열 페이지
    await page2.goto('/waitlist');
    const waitlistCount = page2.locator('[data-testid="waitlist-ps5-14:00-count"]');
    await expect(waitlistCount).toContainText('1명', { timeout: 5000 });
    
    // 사용자 2도 대기열 등록
    await page2.click('[data-testid="join-waitlist-ps5-14:00"]');
    
    // 사용자 1의 화면에서 순위 변경 확인
    const myPosition = page1.locator('[data-testid="my-waitlist-position"]');
    await expect(myPosition).toContainText('1번째');
    
    // 전체 대기 인원 업데이트 확인
    const totalWaiting = page1.locator('[data-testid="total-waiting"]');
    await expect(totalWaiting).toContainText('2명', { timeout: 5000 });
  });
});