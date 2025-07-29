/**
 * 🟡 MEDIUM RISK: 알림 시스템 기능 테스트
 * 
 * 리스크 레벨: 6/10 (Medium-High)
 * 
 * 테스트 범위:
 * 1. 예약 관련 알림 (확인, 취소, 변경)
 * 2. 시스템 알림 (점검, 업데이트)
 * 3. 실시간 푸시 알림
 * 4. 이메일 알림 발송
 * 5. SMS 알림 기능  
 * 6. 알림 설정 및 관리
 * 7. 알림 히스토리 및 읽음 처리
 */

import { test, expect } from '@playwright/test';

test.describe('🟡 MEDIUM RISK: 알림 시스템 기능', () => {

  test('🎯 Notification #1: 예약 관련 알림 시스템', async ({ page }) => {
    console.log('📅 예약 관련 알림 시스템 테스트 시작...');
    
    // 1. 알림 센터 접근
    console.log('1️⃣ 알림 센터 접근...');
    
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // 알림 아이콘이나 버튼 찾기
    const notificationIcon = page.locator('.notification, .bell, .alert, [data-testid="notification"]');
    const notificationButton = page.locator('button:has-text("알림"), button[aria-label*="알림"], .notification-button');
    
    const hasNotificationIcon = await notificationIcon.count() > 0;
    const hasNotificationButton = await notificationButton.count() > 0;
    
    console.log(`🔔 알림 아이콘: ${hasNotificationIcon ? '있음' : '없음'}`);
    console.log(`🔘 알림 버튼: ${hasNotificationButton ? '있음' : '없음'}`);
    
    // 2. 알림 목록 확인
    console.log('2️⃣ 알림 목록 확인...');
    
    if (hasNotificationIcon || hasNotificationButton) {
      const clickTarget = hasNotificationIcon ? notificationIcon.first() : notificationButton.first();
      
      try {
        await clickTarget.click();
        await page.waitForTimeout(1000);
        
        // 알림 드롭다운이나 팝업 확인
        const notificationDropdown = page.locator('.notification-dropdown, .notification-popup, .alert-list');
        const hasDropdown = await notificationDropdown.count() > 0;
        console.log(`📋 알림 드롭다운: ${hasDropdown ? '표시됨' : '없음'}`);
        
        if (hasDropdown) {
          // 알림 항목들 확인
          const notificationItems = notificationDropdown.locator('.notification-item, .alert-item, li');
          const itemCount = await notificationItems.count();
          console.log(`📝 알림 항목: ${itemCount}개`);
          
          if (itemCount > 0) {
            // 첫 번째 알림 내용 확인
            const firstNotification = await notificationItems.first().textContent();
            console.log(`📄 첫 번째 알림: ${firstNotification?.substring(0, 50)}...`);
          }
        }
      } catch (error) {
        console.log(`⚠️ 알림 클릭 오류: ${error.message}`);
      }
    }
    
    // 3. 예약 알림 타입별 확인
    console.log('3️⃣ 예약 알림 타입별 확인...');
    
    // 알림 페이지로 직접 이동
    await page.goto('http://localhost:3000/notifications');
    await page.waitForLoadState('networkidle');
    
    // 알림 카테고리별 확인
    const notificationTypes = {
      reservation: page.locator('text=/예약|reservation/i'),
      confirmation: page.locator('text=/확인|confirm/i'),
      cancellation: page.locator('text=/취소|cancel/i'),
      reminder: page.locator('text=/알림|reminder/i'),
      system: page.locator('text=/시스템|system/i')
    };
    
    for (const [type, locator] of Object.entries(notificationTypes)) {
      const count = await locator.count();
      console.log(`📨 ${type} 알림: ${count}개`);
    }
    
    // 4. 알림 상태 확인 (읽음/안읽음)
    console.log('4️⃣ 알림 상태 확인...');
    
    const unreadNotifications = page.locator('.unread, .new, [data-status="unread"]');
    const readNotifications = page.locator('.read, [data-status="read"]');
    
    const unreadCount = await unreadNotifications.count();
    const readCount = await readNotifications.count();
    
    console.log(`📬 읽지 않은 알림: ${unreadCount}개`);
    console.log(`📭 읽은 알림: ${readCount}개`);
    
    // 5. 알림 액션 버튼 확인
    console.log('5️⃣ 알림 액션 버튼 확인...');
    
    const actionButtons = {
      markAsRead: page.locator('button:has-text("읽음"), button:has-text("읽기"), .mark-read'),
      delete: page.locator('button:has-text("삭제"), .delete-notification'),
      viewDetails: page.locator('button:has-text("자세히"), button:has-text("보기"), .view-details')
    };
    
    for (const [action, locator] of Object.entries(actionButtons)) {
      const count = await locator.count();
      console.log(`🔘 ${action} 버튼: ${count}개`);
    }
    
    console.log('✅ 예약 관련 알림 시스템 테스트 완료!');
  });

  test('🎯 Notification #2: 실시간 푸시 알림', async ({ page, context }) => {
    console.log('🔔 실시간 푸시 알림 테스트 시작...');
    
    // 1. 푸시 알림 권한 확인
    console.log('1️⃣ 푸시 알림 권한 확인...');
    
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // 브라우저 알림 권한 상태 확인
    const notificationPermission = await page.evaluate(() => {
      if ('Notification' in window) {
        return {
          supported: true,
          permission: Notification.permission,
          requestAvailable: typeof Notification.requestPermission === 'function'
        };
      }
      return { supported: false };
    });
    
    console.log(`🌐 알림 지원: ${notificationPermission.supported ? '지원됨' : '미지원'}`);
    if (notificationPermission.supported) {
      console.log(`🔐 알림 권한: ${notificationPermission.permission}`);
      console.log(`📝 권한 요청: ${notificationPermission.requestAvailable ? '가능' : '불가능'}`);
    }
    
    // 2. Service Worker 알림 기능 확인
    console.log('2️⃣ Service Worker 알림 기능 확인...');
    
    const serviceWorkerNotification = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          return {
            hasServiceWorker: !!registration,
            showNotification: !!(registration && registration.showNotification)
          };
        } catch (error) {
          return { hasServiceWorker: false, error: error.message };
        }
      }
      return { hasServiceWorker: false, reason: 'Service Worker not supported' };
    });
    
    console.log(`⚙️ Service Worker: ${serviceWorkerNotification.hasServiceWorker ? '등록됨' : '미등록'}`);
    if (serviceWorkerNotification.hasServiceWorker) {
      console.log(`🔔 SW 알림 기능: ${serviceWorkerNotification.showNotification ? '지원됨' : '미지원'}`);
    }
    
    // 3. 알림 설정 페이지 확인
    console.log('3️⃣ 알림 설정 페이지 확인...');
    
    await page.goto('http://localhost:3000/settings/notifications');
    await page.waitForLoadState('networkidle');
    
    // 푸시 알림 설정 옵션 확인
    const pushSettings = {
      enable: page.locator('input[name*="push"], input[type="checkbox"]').first(),
      browser: page.locator('input[name*="browser"], input[type="checkbox"]').nth(1),
      sound: page.locator('input[name*="sound"], input[type="checkbox"]').nth(2),
      vibration: page.locator('input[name*="vibration"], input[type="checkbox"]').nth(3)
    };
    
    for (const [setting, locator] of Object.entries(pushSettings)) {
      const count = await locator.count();
      if (count > 0) {
        const isChecked = await locator.first().isChecked();
        console.log(`🔔 ${setting} 설정: ${isChecked ? '활성화' : '비활성화'}`);
      } else {
        console.log(`🔔 ${setting} 설정: 없음`);
      }
    }
    
    // 4. 실시간 알림 테스트 (시뮬레이션)
    console.log('4️⃣ 실시간 알림 시뮬레이션...');
    
    // 새 탭에서 관리자 작업 시뮬레이션
    const adminPage = await context.newPage();
    
    try {
      await adminPage.goto('http://localhost:3000/admin');
      await adminPage.waitForLoadState('networkidle');
      
      // 관리자 페이지에서 알림을 발생시킬 수 있는 액션 찾기
      const adminActions = adminPage.locator('button:has-text("승인"), button:has-text("거절"), button:has-text("알림")');
      const actionCount = await adminActions.count();
      console.log(`👨‍💼 관리자 액션 버튼: ${actionCount}개`);
      
      // 사용자 페이지에서 실시간 변화 감지
      await page.waitForTimeout(2000);
      
      // 새로운 알림이 나타났는지 확인
      const newNotifications = page.locator('.notification.new, .alert.new, [data-status="new"]');
      const newCount = await newNotifications.count();
      console.log(`🆕 새 알림: ${newCount}개`);
      
    } finally {
      await adminPage.close();
    }
    
    // 5. 알림 수신 히스토리 확인
    console.log('5️⃣ 알림 수신 히스토리 확인...');
    
    await page.goto('http://localhost:3000/notifications/history');
    await page.waitForLoadState('networkidle');
    
    // 알림 히스토리 목록 확인
    const historyItems = page.locator('.notification-history, .alert-history, .notification-item');
    const historyCount = await historyItems.count();
    console.log(`📜 알림 히스토리: ${historyCount}개`);
    
    if (historyCount > 0) {
      // 최근 알림 확인
      const recentNotification = await historyItems.first().textContent();
      console.log(`📄 최근 알림: ${recentNotification?.substring(0, 80)}...`);
      
      // 시간 정보 확인
      const timeStamps = page.locator('time, .timestamp, .date');
      const timeCount = await timeStamps.count();
      console.log(`⏰ 시간 정보: ${timeCount}개`);
    }
    
    console.log('✅ 실시간 푸시 알림 테스트 완료!');
  });

  test('🎯 Notification #3: 이메일 알림 발송', async ({ page, request }) => {
    console.log('📧 이메일 알림 발송 테스트 시작...');
    
    // 1. 이메일 알림 설정 확인
    console.log('1️⃣ 이메일 알림 설정 확인...');
    
    await page.goto('http://localhost:3000/settings/email');
    await page.waitForLoadState('networkidle');
    
    // 이메일 설정 옵션들 확인
    const emailSettings = {
      reservation: page.locator('input[name*="reservation"], input[type="checkbox"]').first(),
      reminder: page.locator('input[name*="reminder"], input[type="checkbox"]').nth(1),
      marketing: page.locator('input[name*="marketing"], input[type="checkbox"]').nth(2),
      system: page.locator('input[name*="system"], input[type="checkbox"]').nth(3)
    };
    
    for (const [type, locator] of Object.entries(emailSettings)) {
      const exists = await locator.count() > 0;
      if (exists) {
        try {
          const isChecked = await locator.isChecked();
          console.log(`📧 ${type} 이메일 알림: ${isChecked ? '활성화' : '비활성화'}`);
        } catch (error) {
          console.log(`📧 ${type} 이메일 알림: 상태 확인 불가`);
        }
      } else {
        console.log(`📧 ${type} 이메일 알림: 설정 없음`);
      }
    }
    
    // 2. 이메일 주소 설정 확인
    console.log('2️⃣ 이메일 주소 설정 확인...');
    
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const emailCount = await emailInput.count();
    
    if (emailCount > 0) {
      const emailValue = await emailInput.first().inputValue();
      console.log(`📮 설정된 이메일: ${emailValue || '미설정'}`);
      
      // 이메일 유효성 검사
      if (emailValue) {
        const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue);
        console.log(`✉️ 이메일 형식: ${isValidEmail ? '유효함' : '무효함'}`);
      }
    } else {
      console.log('📮 이메일 입력 필드: 없음');
    }
    
    // 3. 이메일 발송 API 테스트
    console.log('3️⃣ 이메일 발송 API 테스트...');
    
    // 예약 확인 이메일 발송 시뮬레이션
    const emailApis = [
      '/api/notifications/email/reservation',
      '/api/notifications/email/reminder',
      '/api/notifications/email/cancellation'
    ];
    
    for (const apiEndpoint of emailApis) {
      try {
        const response = await request.post(`http://localhost:3000${apiEndpoint}`, {
          data: {
            to: 'test@example.com',
            type: 'reservation',
            data: {
              reservationId: 'test-123',
              customerName: 'Test User',
              date: '2025-01-01',
              time: '14:00'
            }
          }
        });
        
        console.log(`📤 ${apiEndpoint}: ${response.status()}`);
        
        if (response.status() === 200) {
          console.log('✅ 이메일 발송 API 정상');
        } else if (response.status() === 404) {
          console.log('⚠️ 이메일 발송 API 미구현');
        } else {
          console.log(`⚠️ 이메일 발송 API 응답: ${response.status()}`);
        }
        
      } catch (error) {
        console.log(`⚠️ ${apiEndpoint} 테스트 오류: ${error.message}`);
      }
    }
    
    // 4. 이메일 템플릿 확인
    console.log('4️⃣ 이메일 템플릿 확인...');
    
    // 이메일 미리보기 기능이 있는지 확인
    const previewButton = page.locator('button:has-text("미리보기"), button:has-text("preview"), .email-preview');
    const hasPreview = await previewButton.count() > 0;
    console.log(`👁️ 이메일 미리보기: ${hasPreview ? '지원됨' : '미지원'}`);
    
    if (hasPreview) {
      try {
        await previewButton.first().click();
        await page.waitForTimeout(1000);
        
        // 미리보기 모달이나 새 창 확인
        const previewModal = page.locator('.modal, .preview-modal, .email-template');
        const hasModal = await previewModal.count() > 0;
        console.log(`📧 템플릿 미리보기: ${hasModal ? '표시됨' : '없음'}`);
        
      } catch (error) {
        console.log(`⚠️ 미리보기 클릭 오류: ${error.message}`);
      }
    }
    
    // 5. 이메일 발송 로그 확인
    console.log('5️⃣ 이메일 발송 로그 확인...');
    
    await page.goto('http://localhost:3000/admin/email-logs');
    await page.waitForLoadState('networkidle');
    
    // 발송 기록 테이블 확인
    const emailLogs = page.locator('table tr, .log-item, .email-record');
    const logCount = await emailLogs.count();
    console.log(`📊 이메일 발송 기록: ${logCount}개`);
    
    if (logCount > 0) {
      // 발송 상태별 확인
      const statusElements = page.locator('.success, .failed, .pending, [data-status]');
      const statusCount = await statusElements.count();
      console.log(`📈 상태 표시: ${statusCount}개`);
      
      // 최근 발송 기록 확인
      const recentLog = await emailLogs.first().textContent();
      console.log(`📄 최근 발송: ${recentLog?.substring(0, 100)}...`);
    }
    
    // 6. 이메일 발송 실패 처리
    console.log('6️⃣ 이메일 발송 실패 처리 확인...');
    
    const failureHandling = {
      retry: page.locator('button:has-text("재시도"), button:has-text("retry")'),
      error: page.locator('.error, .failed, .failure'),
      bounce: page.locator('text=/bounce|반송/i')
    };
    
    for (const [type, locator] of Object.entries(failureHandling)) {
      const count = await locator.count();
      console.log(`🔄 ${type} 처리: ${count > 0 ? '구현됨' : '미구현'}`);
    }
    
    console.log('✅ 이메일 알림 발송 테스트 완료!');
  });

  test('🎯 Notification #4: SMS 알림 기능', async ({ page, request }) => {
    console.log('📱 SMS 알림 기능 테스트 시작...');
    
    // 1. SMS 설정 페이지 접근
    console.log('1️⃣ SMS 설정 페이지 접근...');
    
    await page.goto('http://localhost:3000/settings/sms');
    await page.waitForLoadState('networkidle');
    
    // SMS 설정 옵션 확인
    const smsSettings = {
      enabled: page.locator('input[name*="sms"], input[type="checkbox"]').first(),
      reservation: page.locator('input[name*="reservation"], input[type="checkbox"]').nth(1),
      reminder: page.locator('input[name*="reminder"], input[type="checkbox"]').nth(2)
    };
    
    for (const [type, locator] of Object.entries(smsSettings)) {
      const exists = await locator.count() > 0;
      if (exists) {
        try {
          const isChecked = await locator.isChecked();
          console.log(`📱 ${type} SMS: ${isChecked ? '활성화' : '비활성화'}`);
        } catch (error) {
          console.log(`📱 ${type} SMS: 상태 확인 불가`);
        }
      } else {
        console.log(`📱 ${type} SMS: 설정 없음`);
      }
    }
    
    // 2. 전화번호 설정 확인
    console.log('2️⃣ 전화번호 설정 확인...');
    
    const phoneInput = page.locator('input[type="tel"], input[name="phone"], input[placeholder*="전화"]');
    const phoneCount = await phoneInput.count();
    
    if (phoneCount > 0) {
      const phoneValue = await phoneInput.first().inputValue();
      console.log(`📞 설정된 전화번호: ${phoneValue || '미설정'}`);
      
      // 전화번호 형식 검사
      if (phoneValue) {
        const isValidPhone = /^010-?\d{4}-?\d{4}$/.test(phoneValue);
        console.log(`📱 전화번호 형식: ${isValidPhone ? '유효함' : '무효함'}`);
      }
    } else {
      console.log('📞 전화번호 입력 필드: 없음');
    }
    
    // 3. SMS 발송 API 테스트
    console.log('3️⃣ SMS 발송 API 테스트...');
    
    const smsApis = [
      '/api/notifications/sms/reservation',
      '/api/notifications/sms/reminder',
      '/api/notifications/sms/verification'
    ];
    
    for (const apiEndpoint of smsApis) {
      try {
        const response = await request.post(`http://localhost:3000${apiEndpoint}`, {
          data: {
            to: '010-1234-5678',
            message: '게임플라자 예약 확인 문자입니다.',
            type: 'reservation'
          }
        });
        
        console.log(`📤 ${apiEndpoint}: ${response.status()}`);
        
        if (response.status() === 200) {
          console.log('✅ SMS 발송 API 정상');
        } else if (response.status() === 404) {
          console.log('⚠️ SMS 발송 API 미구현');
        } else {
          console.log(`⚠️ SMS 발송 API 응답: ${response.status()}`);
        }
        
      } catch (error) {
        console.log(`⚠️ ${apiEndpoint} 테스트 오류: ${error.message}`);
      }
    }
    
    // 4. SMS 인증 기능 테스트
    console.log('4️⃣ SMS 인증 기능 테스트...');
    
    // 전화번호 인증 페이지로 이동
    await page.goto('http://localhost:3000/auth/phone-verification');
    await page.waitForLoadState('networkidle');
    
    const verificationElements = {
      phoneInput: page.locator('input[type="tel"], input[name="phone"]'),
      sendButton: page.locator('button:has-text("전송"), button:has-text("인증")'),
      codeInput: page.locator('input[name="code"], input[name="verification"]'),
      verifyButton: page.locator('button:has-text("확인"), button:has-text("인증확인")')
    };
    
    for (const [element, locator] of Object.entries(verificationElements)) {
      const count = await locator.count();
      console.log(`📝 ${element}: ${count > 0 ? '있음' : '없음'}`);
    }
    
    // 5. SMS 발송 제한 확인
    console.log('5️⃣ SMS 발송 제한 확인...');
    
    // 연속 발송 시도로 제한 테스트
    const sendButton = page.locator('button:has-text("전송"), button:has-text("인증")').first();
    
    if (await sendButton.count() > 0) {
      try {
        // 빠른 연속 클릭 시도
        await sendButton.click();
        await page.waitForTimeout(500);
        await sendButton.click();
        await page.waitForTimeout(500);
        await sendButton.click();
        
        // 제한 메시지 확인
        const limitMessage = page.locator('text=/제한|limit|너무 많이/i');
        const hasLimit = await limitMessage.count() > 0;
        console.log(`🚫 발송 제한: ${hasLimit ? '적용됨' : '미적용'}`);
        
        if (hasLimit) {
          const limitText = await limitMessage.first().textContent();
          console.log(`📵 제한 메시지: ${limitText?.substring(0, 50)}...`);
        }
        
      } catch (error) {
        console.log(`⚠️ 발송 제한 테스트 오류: ${error.message}`);
      }
    }
    
    // 6. SMS 발송 기록 확인
    console.log('6️⃣ SMS 발송 기록 확인...');
    
    await page.goto('http://localhost:3000/admin/sms-logs');
    await page.waitForLoadState('networkidle');
    
    const smsLogs = page.locator('table tr, .sms-log, .message-record');
    const logCount = await smsLogs.count();
    console.log(`📊 SMS 발송 기록: ${logCount}개`);
    
    if (logCount > 0) {
      // 발송 상태 확인
      const statusTypes = {
        success: page.locator('.success, [data-status="success"]'),
        failed: page.locator('.failed, [data-status="failed"]'),
        pending: page.locator('.pending, [data-status="pending"]')
      };
      
      for (const [status, locator] of Object.entries(statusTypes)) {
        const count = await locator.count();
        console.log(`📈 ${status} 상태: ${count}개`);
      }
    }
    
    console.log('✅ SMS 알림 기능 테스트 완료!');
  });

  test('🎯 Notification #5: 알림 설정 및 관리', async ({ page }) => {
    console.log('⚙️ 알림 설정 및 관리 테스트 시작...');
    
    // 1. 통합 알림 설정 페이지 접근
    console.log('1️⃣ 통합 알림 설정 페이지 접근...');
    
    await page.goto('http://localhost:3000/settings/notifications');
    await page.waitForLoadState('networkidle');
    
    // 설정 카테고리 확인
    const settingCategories = {
      general: page.locator('h2:has-text("일반"), h3:has-text("기본")'),
      push: page.locator('h2:has-text("푸시"), h3:has-text("실시간")'),
      email: page.locator('h2:has-text("이메일"), h3:has-text("메일")'),
      sms: page.locator('h2:has-text("SMS"), h3:has-text("문자")'),
      privacy: page.locator('h2:has-text("개인정보"), h3:has-text("프라이버시")')
    };
    
    for (const [category, locator] of Object.entries(settingCategories)) {
      const count = await locator.count();
      console.log(`📂 ${category} 설정: ${count > 0 ? '있음' : '없음'}`);
    }
    
    // 2. 알림 채널별 세부 설정
    console.log('2️⃣ 알림 채널별 세부 설정...');
    
    const channelSettings = {
      browser: page.locator('input[name*="browser"], input[type="checkbox"]').first(),
      mobile: page.locator('input[name*="mobile"], input[type="checkbox"]').nth(1),
      desktop: page.locator('input[name*="desktop"], input[type="checkbox"]').nth(2)
    };
    
    for (const [channel, locator] of Object.entries(channelSettings)) {
      const exists = await locator.count() > 0;
      if (exists) {
        try {
          const isEnabled = await locator.isChecked();
          console.log(`📺 ${channel} 알림: ${isEnabled ? '활성화' : '비활성화'}`);
        } catch (error) {
          console.log(`📺 ${channel} 알림: 상태 확인 불가`);
        }
      }
    }
    
    // 3. 알림 시간 설정
    console.log('3️⃣ 알림 시간 설정...');
    
    const timeSettings = {
      startTime: page.locator('input[type="time"], select[name*="start"]'),
      endTime: page.locator('input[type="time"], select[name*="end"]'),
      timezone: page.locator('select[name*="timezone"], select[name*="지역"]'),
      frequency: page.locator('select[name*="frequency"], select[name*="빈도"]')
    };
    
    for (const [setting, locator] of Object.entries(timeSettings)) {
      const count = await locator.count();
      if (count > 0) {
        try {
          const value = await locator.first().inputValue();
          console.log(`⏰ ${setting}: ${value || '미설정'}`);
        } catch (error) {
          console.log(`⏰ ${setting}: 있음 (값 확인 불가)`);
        }
      } else {
        console.log(`⏰ ${setting}: 없음`);
      }
    }
    
    // 4. 알림 우선순위 설정
    console.log('4️⃣ 알림 우선순위 설정...');
    
    const prioritySettings = {
      high: page.locator('input[value="high"], option[value="high"]'),
      medium: page.locator('input[value="medium"], option[value="medium"]'),
      low: page.locator('input[value="low"], option[value="low"]')
    };
    
    for (const [priority, locator] of Object.entries(prioritySettings)) {
      const count = await locator.count();
      console.log(`🔥 ${priority} 우선순위: ${count > 0 ? '설정 가능' : '설정 없음'}`);
    }
    
    // 5. 일괄 설정 기능
    console.log('5️⃣ 일괄 설정 기능...');
    
    const bulkActions = {
      enableAll: page.locator('button:has-text("모두 활성화"), button:has-text("전체 켜기")'),
      disableAll: page.locator('button:has-text("모두 비활성화"), button:has-text("전체 끄기")'),
      reset: page.locator('button:has-text("초기화"), button:has-text("기본값")'),
      save: page.locator('button:has-text("저장"), button[type="submit"]')
    };
    
    for (const [action, locator] of Object.entries(bulkActions)) {
      const count = await locator.count();
      console.log(`🔘 ${action} 버튼: ${count > 0 ? '있음' : '없음'}`);
    }
    
    // 6. 설정 변경 테스트
    console.log('6️⃣ 설정 변경 테스트...');
    
    // 첫 번째 체크박스 토글 테스트
    const firstCheckbox = page.locator('input[type="checkbox"]').first();
    
    if (await firstCheckbox.count() > 0) {
      try {
        const initialState = await firstCheckbox.isChecked();
        console.log(`🔄 초기 상태: ${initialState ? '활성화' : '비활성화'}`);
        
        // 상태 변경
        await firstCheckbox.click();
        await page.waitForTimeout(500);
        
        const newState = await firstCheckbox.isChecked();
        console.log(`🔄 변경 후 상태: ${newState ? '활성화' : '비활성화'}`);
        
        const changed = initialState !== newState;
        console.log(`✅ 설정 변경: ${changed ? '성공' : '실패'}`);
        
        // 원래 상태로 복구
        if (changed) {
          await firstCheckbox.click();
        }
        
      } catch (error) {
        console.log(`⚠️ 설정 변경 테스트 오류: ${error.message}`);
      }
    }
    
    // 7. 설정 저장 및 복원
    console.log('7️⃣ 설정 저장 및 복원...');
    
    const saveButton = page.locator('button:has-text("저장"), button[type="submit"]');
    
    if (await saveButton.count() > 0) {
      try {
        await saveButton.click();
        await page.waitForTimeout(1000);
        
        // 저장 완료 메시지 확인
        const successMessage = page.locator('.success, .saved, text=/저장.*완료/');
        const hasSaveMessage = await successMessage.count() > 0;
        console.log(`💾 저장 완료 메시지: ${hasSaveMessage ? '표시됨' : '없음'}`);
        
        if (hasSaveMessage) {
          const messageText = await successMessage.first().textContent();
          console.log(`📝 저장 메시지: ${messageText?.substring(0, 30)}...`);
        }
        
      } catch (error) {
        console.log(`⚠️ 설정 저장 오류: ${error.message}`);
      }
    }
    
    console.log('✅ 알림 설정 및 관리 테스트 완료!');
  });

  test('🎯 Notification #6: 알림 히스토리 및 읽음 처리', async ({ page }) => {
    console.log('📜 알림 히스토리 및 읽음 처리 테스트 시작...');
    
    // 1. 알림 히스토리 페이지 접근
    console.log('1️⃣ 알림 히스토리 페이지 접근...');
    
    await page.goto('http://localhost:3000/notifications/history');
    await page.waitForLoadState('networkidle');
    
    // 히스토리 항목들 확인
    const historyItems = page.locator('.notification-item, .alert-item, .history-item, tr');
    const itemCount = await historyItems.count();
    console.log(`📋 히스토리 항목: ${itemCount}개`);
    
    // 2. 읽음/안읽음 상태 관리
    console.log('2️⃣ 읽음/안읽음 상태 관리...');
    
    if (itemCount > 0) {
      // 읽음 상태별 분류
      const readItems = page.locator('.read, [data-status="read"]');
      const unreadItems = page.locator('.unread, [data-status="unread"]');
      
      const readCount = await readItems.count();
      const unreadCount = await unreadItems.count();
      
      console.log(`📖 읽은 알림: ${readCount}개`);
      console.log(`📬 안읽은 알림: ${unreadCount}개`);
      
      // 첫 번째 안읽은 알림 클릭 테스트
      if (unreadCount > 0) {
        try {
          await unreadItems.first().click();
          await page.waitForTimeout(500);
          
          // 읽음 상태로 변경되었는지 확인
          const updatedUnreadCount = await unreadItems.count();
          const statusChanged = updatedUnreadCount < unreadCount;
          console.log(`📝 읽음 처리: ${statusChanged ? '성공' : '실패'}`);
          
        } catch (error) {
          console.log(`⚠️ 읽음 처리 오류: ${error.message}`);
        }
      }
    }
    
    // 3. 일괄 읽음 처리
    console.log('3️⃣ 일괄 읽음 처리...');
    
    const bulkReadActions = {
      markAllRead: page.locator('button:has-text("모두 읽음"), button:has-text("전체 읽음")'),
      selectAll: page.locator('input[type="checkbox"][name="selectAll"], .select-all'),
      markSelected: page.locator('button:has-text("선택 읽음"), button:has-text("선택 항목")')
    };
    
    for (const [action, locator] of Object.entries(bulkReadActions)) {
      const count = await locator.count();
      console.log(`🔘 ${action}: ${count > 0 ? '있음' : '없음'}`);
    }
    
    // 모두 읽음 버튼 테스트
    const markAllButton = bulkReadActions.markAllRead;
    if (await markAllButton.count() > 0) {
      try {
        const initialUnread = await page.locator('.unread, [data-status="unread"]').count();
        
        await markAllButton.click();
        await page.waitForTimeout(1000);
        
        const finalUnread = await page.locator('.unread, [data-status="unread"]').count();
        const allMarked = finalUnread === 0;
        
        console.log(`📚 일괄 읽음 처리: ${allMarked ? '성공' : '부분적'}`);
        console.log(`📊 처리 전후: ${initialUnread} → ${finalUnread}`);
        
      } catch (error) {
        console.log(`⚠️ 일괄 읽음 처리 오류: ${error.message}`);
      }
    }
    
    // 4. 알림 필터링 기능
    console.log('4️⃣ 알림 필터링 기능...');
    
    const filterOptions = {
      all: page.locator('button:has-text("전체"), option[value="all"]'),
      unread: page.locator('button:has-text("안읽음"), option[value="unread"]'),
      read: page.locator('button:has-text("읽음"), option[value="read"]'),
      type: page.locator('select[name*="type"], select[name*="category"]'),
      date: page.locator('input[type="date"], .date-filter')
    };
    
    for (const [filter, locator] of Object.entries(filterOptions)) {
      const count = await locator.count();
      console.log(`🔍 ${filter} 필터: ${count > 0 ? '있음' : '없음'}`);
    }
    
    // 필터 적용 테스트
    const unreadFilter = filterOptions.unread;
    if (await unreadFilter.count() > 0) {
      try {
        const initialCount = await historyItems.count();
        
        await unreadFilter.click();
        await page.waitForTimeout(500);
        
        const filteredCount = await historyItems.count();
        console.log(`🔍 필터 적용 결과: ${initialCount} → ${filteredCount}개`);
        
      } catch (error) {
        console.log(`⚠️ 필터 적용 오류: ${error.message}`);
      }
    }
    
    // 5. 알림 삭제 기능
    console.log('5️⃣ 알림 삭제 기능...');
    
    const deleteActions = {
      single: page.locator('.delete-btn, button:has-text("삭제")'),
      bulk: page.locator('button:has-text("선택 삭제"), button:has-text("일괄 삭제")'),
      clear: page.locator('button:has-text("전체 삭제"), button:has-text("모두 삭제")')
    };
    
    for (const [action, locator] of Object.entries(deleteActions)) {
      const count = await locator.count();
      console.log(`🗑️ ${action} 삭제: ${count > 0 ? '가능' : '불가능'}`);
    }
    
    // 6. 알림 검색 기능
    console.log('6️⃣ 알림 검색 기능...');
    
    const searchElements = {
      input: page.locator('input[type="search"], input[placeholder*="검색"]'),
      button: page.locator('button:has-text("검색"), .search-btn'),
      clear: page.locator('button:has-text("지우기"), .clear-search')
    };
    
    for (const [element, locator] of Object.entries(searchElements)) {
      const count = await locator.count();
      console.log(`🔍 검색 ${element}: ${count > 0 ? '있음' : '없음'}`);
    }
    
    // 검색 기능 테스트
    const searchInput = searchElements.input;
    if (await searchInput.count() > 0) {
      try {
        await searchInput.fill('예약');
        await page.waitForTimeout(500);
        
        const searchResults = await historyItems.count();
        console.log(`🔍 검색 결과: ${searchResults}개`);
        
        // 검색어 지우기
        await searchInput.fill('');
        
      } catch (error) {
        console.log(`⚠️ 검색 기능 오류: ${error.message}`);
      }
    }
    
    // 7. 페이지네이션 확인
    console.log('7️⃣ 페이지네이션 확인...');
    
    const pagination = {
      prev: page.locator('button:has-text("이전"), .prev-page, [aria-label*="Previous"]'),
      next: page.locator('button:has-text("다음"), .next-page, [aria-label*="Next"]'),
      numbers: page.locator('.page-number, .pagination button'),
      info: page.locator('.page-info, .total-count')
    };
    
    for (const [element, locator] of Object.entries(pagination)) {
      const count = await locator.count();
      console.log(`📄 페이지 ${element}: ${count > 0 ? '있음' : '없음'}`);
    }
    
    // 페이지 정보 확인
    const pageInfo = pagination.info;
    if (await pageInfo.count() > 0) {
      const infoText = await pageInfo.first().textContent();
      console.log(`📊 페이지 정보: ${infoText?.substring(0, 50)}...`);
    }
    
    console.log('✅ 알림 히스토리 및 읽음 처리 테스트 완료!');
  });

});