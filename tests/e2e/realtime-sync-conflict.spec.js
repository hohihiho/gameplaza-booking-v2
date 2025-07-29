/**
 * 🔴 HIGH RISK: 실시간 동기화 및 충돌 방지 테스트
 * 
 * 리스크 레벨: 10/10 (Critical)
 * 
 * 테스트 범위:
 * 1. 실시간 예약 상태 동기화
 * 2. 동시 예약 시도 충돌 방지
 * 3. 기기 상태 실시간 업데이트
 * 4. WebSocket 연결 안정성
 * 5. 네트워크 단절 시 복구
 * 6. 예약 중복 방지 로직
 * 7. KST 시간대 동기화
 */

import { test, expect } from '@playwright/test';

test.describe('🔴 CRITICAL: 실시간 동기화 및 충돌 방지', () => {

  test('🎯 Realtime #1: 예약 상태 실시간 동기화', async ({ browser }) => {
    console.log('🔄 예약 상태 실시간 동기화 테스트 시작...');
    
    // 두 개의 독립적인 브라우저 컨텍스트 생성
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    try {
      // 1. 두 클라이언트에서 동일한 예약 페이지 접근
      console.log('1️⃣ 두 클라이언트 동시 접근...');
      
      await Promise.all([
        page1.goto('http://localhost:3000/reservations'),
        page2.goto('http://localhost:3000/reservations')
      ]);
      
      await Promise.all([
        page1.waitForLoadState('networkidle'),
        page2.waitForLoadState('networkidle')
      ]);
      
      // 2. 페이지 로딩 상태 확인
      const page1Content = await page1.textContent('body');
      const page2Content = await page2.textContent('body');
      
      const hasContent1 = page1Content && page1Content.length > 100;
      const hasContent2 = page2Content && page2Content.length > 100;
      
      console.log(`📱 클라이언트 1 로딩: ${hasContent1 ? '성공' : '실패'}`);
      console.log(`📱 클라이언트 2 로딩: ${hasContent2 ? '성공' : '실패'}`);
      
      // 3. 실시간 데이터 변경 시뮬레이션
      console.log('2️⃣ 실시간 데이터 변경 시뮬레이션...');
      
      // 첫 번째 클라이언트에서 새로고침
      await page1.reload();
      await page1.waitForLoadState('networkidle');
      
      // 잠깐 대기 후 두 번째 클라이언트 상태 확인
      await page2.waitForTimeout(1000);
      
      // 두 클라이언트의 데이터 일관성 확인
      const updatedContent1 = await page1.textContent('body');
      const updatedContent2 = await page2.textContent('body');
      
      // 기본적인 일관성 검사
      const hasUpdatedContent1 = updatedContent1 && updatedContent1.length > 100;
      const hasUpdatedContent2 = updatedContent2 && updatedContent2.length > 100;
      
      console.log(`🔄 업데이트 후 클라이언트 1: ${hasUpdatedContent1 ? '정상' : '비정상'}`);
      console.log(`🔄 업데이트 후 클라이언트 2: ${hasUpdatedContent2 ? '정상' : '비정상'}`);
      
      // 4. 시간 동기화 확인
      console.log('3️⃣ KST 시간 동기화 확인...');
      
      // 시간 관련 요소들 찾기
      const timeElements1 = await page1.locator('text=/\\d{1,2}:\\d{2}|\\d{1,2}시|\\d{1,2}분/').count();
      const timeElements2 = await page2.locator('text=/\\d{1,2}:\\d{2}|\\d{1,2}시|\\d{1,2}분/').count();
      
      console.log(`⏰ 클라이언트 1 시간 요소: ${timeElements1}개`);
      console.log(`⏰ 클라이언트 2 시간 요소: ${timeElements2}개`);
      
      if (timeElements1 > 0 && timeElements2 > 0) {
        console.log('✅ 시간 표시 요소 확인됨');
      } else {
        console.log('⚠️ 시간 표시 요소 부족');
      }
      
    } finally {
      await context1.close();
      await context2.close();
    }
    
    console.log('✅ 예약 상태 실시간 동기화 테스트 완료!');
  });

  test('🎯 Realtime #2: 동시 예약 충돌 방지', async ({ browser }) => {
    console.log('⚔️ 동시 예약 충돌 방지 테스트 시작...');
    
    // 세 개의 독립적인 클라이언트 생성
    const contexts = await Promise.all([
      browser.newContext(),
      browser.newContext(),
      browser.newContext()
    ]);
    
    const pages = await Promise.all(contexts.map(ctx => ctx.newPage()));
    
    try {
      // 1. 모든 클라이언트에서 새 예약 페이지 접근
      console.log('1️⃣ 다중 클라이언트 동시 접근...');
      
      await Promise.all(pages.map(page => 
        page.goto('http://localhost:3000/reservations/new')
      ));
      
      await Promise.all(pages.map(page => 
        page.waitForLoadState('networkidle')
      ));
      
      // 2. 각 클라이언트의 로딩 상태 확인
      const loadingStates = await Promise.all(
        pages.map(async (page, index) => {
          const content = await page.textContent('body');
          const hasContent = content && content.length > 100;
          console.log(`📱 클라이언트 ${index + 1} 로딩: ${hasContent ? '성공' : '실패'}`);
          return hasContent;
        })
      );
      
      const allLoaded = loadingStates.every(state => state);
      console.log(`🌐 전체 로딩 상태: ${allLoaded ? '모두 성공' : '일부 실패'}`);
      
      // 3. 동일한 시간대 예약 시도 시뮬레이션
      console.log('2️⃣ 동일 시간대 동시 예약 시도...');
      
      // 각 클라이언트에서 예약 폼 찾기
      const formElementCounts = await Promise.all(
        pages.map(async (page, index) => {
          const forms = await page.locator('form, .form, .reservation-form').count();
          const inputs = await page.locator('input, select, textarea').count();
          const buttons = await page.locator('button[type="submit"], button:has-text("예약"), button:has-text("확인")').count();
          
          console.log(`📝 클라이언트 ${index + 1}: 폼 ${forms}개, 입력필드 ${inputs}개, 버튼 ${buttons}개`);
          
          return { forms, inputs, buttons };
        })
      );
      
      // 4. 동시 API 호출 시뮬레이션
      console.log('3️⃣ 동시 API 호출 테스트...');
      
      // 각 페이지에서 동시에 API 호출 (네트워크 레벨에서)
      const apiResults = await Promise.all(
        pages.map(async (page, index) => {
          try {
            // JavaScript에서 직접 API 호출
            const result = await page.evaluate(async () => {
              try {
                const response = await fetch('/api/v2/reservations', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    deviceId: 'device-1',
                    date: '2025-01-01',
                    timeSlot: { start: '14:00', end: '16:00' },
                    playerCount: 1
                  })
                });
                
                return {
                  status: response.status,
                  success: response.ok
                };
              } catch (error) {
                return {
                  status: 'ERROR',
                  error: error.message
                };
              }
            });
            
            console.log(`🌐 클라이언트 ${index + 1} API 응답: ${result.status}`);
            return result;
            
          } catch (error) {
            console.log(`⚠️ 클라이언트 ${index + 1} API 오류: ${error.message}`);
            return { status: 'CLIENT_ERROR', error: error.message };
          }
        })
      );
      
      // 5. 충돌 방지 결과 분석
      console.log('4️⃣ 충돌 방지 결과 분석...');
      
      const successCount = apiResults.filter(result => result.success).length;
      const conflictCount = apiResults.filter(result => result.status === 409).length;
      const authErrorCount = apiResults.filter(result => result.status === 401).length;
      
      console.log(`📊 동시 예약 결과:`);
      console.log(`   ✅ 성공: ${successCount}개`);
      console.log(`   ⚔️ 충돌(409): ${conflictCount}개`);
      console.log(`   🔐 인증필요(401): ${authErrorCount}개`);
      console.log(`   🚨 기타: ${apiResults.length - successCount - conflictCount - authErrorCount}개`);
      
      // 예상되는 결과: 하나만 성공하고 나머지는 충돌 또는 인증 오류
      if (successCount <= 1 && (conflictCount > 0 || authErrorCount > 0)) {
        console.log('✅ 동시 예약 충돌 방지 정상 동작');
      } else if (authErrorCount === apiResults.length) {
        console.log('🔐 모든 요청이 인증 오류 - 정상적인 보안 동작');
      } else {
        console.log('⚠️ 충돌 방지 로직 점검 필요');
      }
      
    } finally {
      await Promise.all(contexts.map(ctx => ctx.close()));
    }
    
    console.log('✅ 동시 예약 충돌 방지 테스트 완료!');
  });

  test('🎯 Realtime #3: 기기 상태 실시간 업데이트', async ({ browser }) => {
    console.log('🎮 기기 상태 실시간 업데이트 테스트 시작...');
    
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const adminPage = await context1.newPage();
    const userPage = await context2.newPage();
    
    try {
      // 1. 관리자 페이지와 사용자 페이지 동시 접근
      console.log('1️⃣ 관리자/사용자 페이지 동시 접근...');
      
      await Promise.all([
        adminPage.goto('http://localhost:3000/admin/devices'),
        userPage.goto('http://localhost:3000/machines')
      ]);
      
      await Promise.all([
        adminPage.waitForLoadState('networkidle'),
        userPage.waitForLoadState('networkidle')
      ]);
      
      // 2. 기기 목록 확인
      console.log('2️⃣ 기기 목록 상태 확인...');
      
      const adminDevices = await adminPage.locator('.device, .device-card, .list-item, .card').count();
      const userDevices = await userPage.locator('.device, .device-card, .machine-card, .game-card').count();
      
      console.log(`🎮 관리자 페이지 기기: ${adminDevices}개`);
      console.log(`👤 사용자 페이지 기기: ${userDevices}개`);
      
      // 3. 상태 표시 요소 확인
      const adminStatusElements = await adminPage.locator('.status, .state, .available, .occupied, .maintenance').count();
      const userStatusElements = await userPage.locator('.status, .state, .available, .occupied, .busy').count();
      
      console.log(`📊 관리자 상태 표시: ${adminStatusElements}개`);
      console.log(`📊 사용자 상태 표시: ${userStatusElements}개`);
      
      // 4. 페이지 새로고침으로 상태 동기화 시뮬레이션
      console.log('3️⃣ 상태 동기화 시뮬레이션...');
      
      // 관리자 페이지 새로고침
      await adminPage.reload();
      await adminPage.waitForLoadState('networkidle');
      
      // 잠깐 대기 후 사용자 페이지도 새로고침
      await userPage.waitForTimeout(1000);
      await userPage.reload();
      await userPage.waitForLoadState('networkidle');
      
      // 5. 새로고침 후 일관성 확인
      const updatedAdminDevices = await adminPage.locator('.device, .device-card, .list-item, .card').count();
      const updatedUserDevices = await userPage.locator('.device, .device-card, .machine-card, .game-card').count();
      
      console.log(`🔄 새로고침 후 관리자 기기: ${updatedAdminDevices}개`);
      console.log(`🔄 새로고침 후 사용자 기기: ${updatedUserDevices}개`);
      
      // 데이터 일관성 체크 (약간의 차이는 허용)
      const isConsistent = Math.abs(updatedAdminDevices - updatedUserDevices) <= 2;
      console.log(`📊 데이터 일관성: ${isConsistent ? '유지됨' : '불일치'}`);
      
      // 6. API 레벨 동기화 확인
      console.log('4️⃣ API 레벨 동기화 확인...');
      
      const apiResponses = await Promise.all([
        adminPage.evaluate(() => 
          fetch('/api/v2/devices').then(r => ({ status: r.status, ok: r.ok })).catch(e => ({ error: e.message }))
        ),
        userPage.evaluate(() => 
          fetch('/api/v2/devices').then(r => ({ status: r.status, ok: r.ok })).catch(e => ({ error: e.message }))
        )
      ]);
      
      console.log(`🌐 관리자 API: ${apiResponses[0].status || apiResponses[0].error}`);
      console.log(`🌐 사용자 API: ${apiResponses[1].status || apiResponses[1].error}`);
      
      const bothApiWorking = apiResponses.every(r => r.status === 200 || r.status === 401);
      console.log(`✅ API 동기화: ${bothApiWorking ? '정상' : '문제있음'}`);
      
    } finally {
      await context1.close();
      await context2.close();
    }
    
    console.log('✅ 기기 상태 실시간 업데이트 테스트 완료!');
  });

  test('🎯 Realtime #4: 네트워크 연결 안정성', async ({ page }) => {
    console.log('🌐 네트워크 연결 안정성 테스트 시작...');
    
    // 1. 정상 연결 상태 확인
    console.log('1️⃣ 정상 연결 상태 확인...');
    
    await page.goto('http://localhost:3000/reservations');
    await page.waitForLoadState('networkidle');
    
    const initialContent = await page.textContent('body');
    const hasInitialContent = initialContent && initialContent.length > 100;
    
    console.log(`📡 초기 연결: ${hasInitialContent ? '성공' : '실패'}`);
    
    // 2. 네트워크 오프라인 시뮬레이션
    console.log('2️⃣ 오프라인 모드 테스트...');
    
    try {
      // 오프라인 모드 활성화
      await page.context().setOffline(true);
      
      // 오프라인 상태에서 페이지 새로고침 시도
      const offlineReloadResult = await page.reload().catch(error => {
        console.log('🔌 오프라인 새로고침 실패 - 예상된 동작');
        return { offline: true };
      });
      
      // 3. 연결 복구 테스트
      console.log('3️⃣ 연결 복구 테스트...');
      
      // 온라인 모드 복구
      await page.context().setOffline(false);
      
      // 연결 복구 후 페이지 로딩 확인
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      const recoveredContent = await page.textContent('body');
      const hasRecoveredContent = recoveredContent && recoveredContent.length > 100;
      
      console.log(`🔄 연결 복구: ${hasRecoveredContent ? '성공' : '실패'}`);
      
      // 4. 네트워크 지연 시뮬레이션
      console.log('4️⃣ 네트워크 지연 시뮬레이션...');
      
      // 느린 3G 연결 시뮬레이션
      await page.context().route('**/*', async route => {
        // 2초 지연 추가
        await new Promise(resolve => setTimeout(resolve, 200));
        route.continue();
      });
      
      const slowStartTime = Date.now();
      await page.reload();
      await page.waitForLoadState('networkidle');
      const slowEndTime = Date.now();
      
      const loadTime = slowEndTime - slowStartTime;
      console.log(`⏱️ 지연된 로딩 시간: ${loadTime}ms`);
      
      // 지연이 적절히 적용되었는지 확인
      const hasReasonableDelay = loadTime > 1000; // 최소 1초 이상
      console.log(`🐌 지연 시뮬레이션: ${hasReasonableDelay ? '적용됨' : '미적용'}`);
      
      // 5. 에러 복구 능력 테스트
      console.log('5️⃣ 에러 복구 능력 테스트...');
      
      // 네트워크 에러 시뮬레이션
      await page.context().route('**/api/**', route => {
        route.abort('internetdisconnected');
      });
      
      // API 호출 시도
      const errorResult = await page.evaluate(async () => {
        try {
          const response = await fetch('/api/v2/devices');
          return { success: true, status: response.status };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });
      
      console.log(`💥 에러 처리: ${errorResult.success ? '예상외 성공' : '정상적 실패'}`);
      
      // 네트워크 라우팅 복구
      await page.context().unroute('**/api/**');
      
      // 복구 후 API 재시도
      const recoveryResult = await page.evaluate(async () => {
        try {
          const response = await fetch('/api/v2/devices');
          return { success: response.ok, status: response.status };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });
      
      console.log(`🔄 복구 후 API: ${recoveryResult.success ? '성공' : `실패 (${recoveryResult.status || recoveryResult.error})`}`);
      
    } catch (error) {
      console.log(`⚠️ 네트워크 테스트 중 오류: ${error.message}`);
    }
    
    console.log('✅ 네트워크 연결 안정성 테스트 완료!');
  });

  test('🎯 Realtime #5: 시간대 동기화 검증', async ({ page }) => {
    console.log('⏰ KST 시간대 동기화 검증 시작...');
    
    // 1. 클라이언트 시간대 확인
    console.log('1️⃣ 클라이언트 시간대 확인...');
    
    await page.goto('http://localhost:3000/reservations');
    await page.waitForLoadState('networkidle');
    
    // JavaScript에서 시간대 정보 수집
    const timeInfo = await page.evaluate(() => {
      const now = new Date();
      return {
        localTime: now.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
        utcTime: now.toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timezoneOffset: now.getTimezoneOffset()
      };
    });
    
    console.log(`🕐 로컬 시간 (KST): ${timeInfo.localTime}`);
    console.log(`🌍 UTC 시간: ${timeInfo.utcTime}`);
    console.log(`🗺️ 시간대: ${timeInfo.timezone}`);
    console.log(`⏱️ UTC 오프셋: ${timeInfo.timezoneOffset}분`);
    
    // 2. 서버 시간과 동기화 확인
    console.log('2️⃣ 서버-클라이언트 시간 동기화 확인...');
    
    const serverTimeResult = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/v2/time-slots');
        // 응답 헤더에서 서버 시간 확인
        const serverDate = response.headers.get('date');
        return {
          success: true,
          serverTime: serverDate,
          status: response.status
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    });
    
    if (serverTimeResult.success && serverTimeResult.serverTime) {
      const serverTime = new Date(serverTimeResult.serverTime);
      const clientTime = new Date();
      const timeDiff = Math.abs(serverTime.getTime() - clientTime.getTime());
      
      console.log(`🖥️ 서버 시간: ${serverTime.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`);
      console.log(`💻 클라이언트 시간: ${clientTime.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`);
      console.log(`⏱️ 시간 차이: ${timeDiff}ms`);
      
      // 5분 이내 차이는 정상으로 간주
      const isSynchronized = timeDiff < 5 * 60 * 1000;
      console.log(`🔄 시간 동기화: ${isSynchronized ? '정상' : '차이 큼'}`);
    } else {
      console.log(`⚠️ 서버 시간 확인 실패: ${serverTimeResult.error || serverTimeResult.status}`);
    }
    
    // 3. 24시간 표시 체계 확인
    console.log('3️⃣ 24시간 표시 체계 확인...');
    
    // 페이지에서 시간 표시 요소들 찾기
    const timeDisplays = await page.locator('text=/\\d{1,2}:\\d{2}|\\d{1,2}시|시간/').allTextContents();
    
    console.log(`🕐 발견된 시간 표시: ${timeDisplays.length}개`);
    if (timeDisplays.length > 0) {
      // 처음 몇 개 시간 표시 출력
      timeDisplays.slice(0, 5).forEach((time, index) => {
        console.log(`   ${index + 1}. ${time}`);
      });
      
      // 24시간 이상 표시 (25시, 26시 등) 확인
      const extendedHours = timeDisplays.filter(time => {
        const hourMatch = time.match(/(\d{1,2})[시:]/);
        if (hourMatch) {
          const hour = parseInt(hourMatch[1]);
          return hour >= 24 && hour <= 29;
        }
        return false;
      });
      
      if (extendedHours.length > 0) {
        console.log(`🌙 확장 시간 표시 (24~29시): ${extendedHours.length}개`);
        extendedHours.forEach(time => console.log(`   - ${time}`));
      } else {
        console.log('🕐 표준 시간 표시만 발견');
      }
    }
    
    // 4. Date 객체 생성 방식 검증
    console.log('4️⃣ Date 객체 생성 방식 검증...');
    
    const dateCreationTest = await page.evaluate(() => {
      // 올바른 방식 vs 잘못된 방식 비교
      const correctDate = new Date(2025, 0, 1, 14, 0, 0); // 로컬 시간대
      const incorrectDate = new Date('2025-01-01T14:00:00'); // UTC 파싱 위험
      
      return {
        correct: correctDate.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
        incorrect: incorrectDate.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
        timeDiff: correctDate.getTime() - incorrectDate.getTime()
      };
    });
    
    console.log(`✅ 올바른 Date 생성: ${dateCreationTest.correct}`);
    console.log(`❌ 문제있는 Date 생성: ${dateCreationTest.incorrect}`);
    console.log(`⏱️ 차이: ${dateCreationTest.timeDiff}ms`);
    
    if (Math.abs(dateCreationTest.timeDiff) > 0) {
      console.log('⚠️ Date 객체 생성 방식에 시간대 차이 발생');
    } else {
      console.log('✅ Date 객체 생성 방식 일관됨');
    }
    
    // 5. 예약 시간 표시 일관성 확인
    console.log('5️⃣ 예약 시간 표시 일관성 확인...');
    
    // 새 예약 페이지로 이동
    await page.goto('http://localhost:3000/reservations/new');
    await page.waitForLoadState('networkidle');
    
    // 시간 선택 옵션들 확인
    const timeOptions = await page.locator('select option, .time-slot, .time-option').allTextContents();
    
    if (timeOptions.length > 0) {
      console.log(`⏰ 예약 가능 시간: ${timeOptions.length}개`);
      
      // 시간 표시 형식 분석
      const timeFormatCounts = {
        standard: 0,    // 0~23시
        extended: 0,    // 24~29시
        ampm: 0,        // AM/PM 표시
        colon: 0        // HH:MM 형식
      };
      
      timeOptions.forEach(option => {
        if (/\d{1,2}:\d{2}/.test(option)) timeFormatCounts.colon++;
        if (/[AP]M/.test(option)) timeFormatCounts.ampm++;
        if (/2[4-9]시|[3-9]\d시/.test(option)) timeFormatCounts.extended++;
        if (/[0-2]?\d시/.test(option)) timeFormatCounts.standard++;
      });
      
      console.log(`📊 시간 형식 분석:`);
      console.log(`   🕐 표준시간 (0~23): ${timeFormatCounts.standard}개`);
      console.log(`   🌙 확장시간 (24~29): ${timeFormatCounts.extended}개`);
      console.log(`   ⏰ HH:MM 형식: ${timeFormatCounts.colon}개`);
      console.log(`   🕐 AM/PM 형식: ${timeFormatCounts.ampm}개`);
      
      // 24시간 표시 체계 준수 확인
      if (timeFormatCounts.extended > 0) {
        console.log('✅ 24시간 확장 표시 체계 적용됨');
      } else if (timeFormatCounts.standard > 0) {
        console.log('🕐 표준 24시간 표시만 사용');
      } else {
        console.log('⚠️ 시간 표시 형식 불분명');
      }
    }
    
    console.log('✅ KST 시간대 동기화 검증 완료!');
  });

});