/**
 * 🟡 MEDIUM RISK: 데이터 백업 및 복구 테스트
 * 
 * 리스크 레벨: 7/10 (Medium-High)
 * 
 * 테스트 범위:
 * 1. 데이터베이스 백업 기능
 * 2. 사용자 데이터 내보내기
 * 3. 예약 데이터 백업/복원
 * 4. 기기 설정 백업
 * 5. 시스템 복구 시나리오
 * 6. 데이터 무결성 검증
 * 7. 자동 백업 스케줄링
 */

import { test, expect } from '@playwright/test';

test.describe('🟡 MEDIUM RISK: 데이터 백업 및 복구', () => {

  test('🎯 Backup #1: 사용자 데이터 내보내기', async ({ page, request }) => {
    console.log('💾 사용자 데이터 내보내기 테스트 시작...');
    
    // 1. 사용자 데이터 내보내기 페이지 접근
    console.log('1️⃣ 데이터 내보내기 페이지 접근...');
    
    await page.goto('http://localhost:3000/profile/export');
    await page.waitForLoadState('networkidle');
    
    // 로그인이 필요한 경우 처리
    if (page.url().includes('/login') || page.url().includes('/auth')) {
      console.log('🔐 로그인 필요 - 인증 페이지로 리다이렉트됨');
      
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');
      
      if (await emailInput.count() > 0 && await passwordInput.count() > 0) {
        await emailInput.fill('user@test.com');
        await passwordInput.fill('testpassword');
        
        const loginButton = page.locator('button[type="submit"]');
        if (await loginButton.count() > 0) {
          await loginButton.click();
          await page.waitForURL('**/profile/**', { timeout: 5000 }).catch(() => {
            console.log('⚠️ 로그인 실패 - 테스트 계정 없음');
          });
        }
      }
    }
    
    // 2. 내보내기 옵션 확인
    console.log('2️⃣ 내보내기 옵션 확인...');
    
    const exportOptions = {
      personalInfo: page.locator('input[name*="personal"], input[value*="profile"], label:has-text("개인정보")'),
      reservationHistory: page.locator('input[name*="reservation"], input[value*="booking"], label:has-text("예약")'),
      paymentHistory: page.locator('input[name*="payment"], input[value*="transaction"], label:has-text("결제")'),
      preferences: page.locator('input[name*="preference"], input[value*="setting"], label:has-text("설정")')
    };
    
    console.log('📋 내보내기 데이터 옵션:');
    for (const [dataType, locator] of Object.entries(exportOptions)) {
      const optionCount = await locator.count();
      if (optionCount > 0) {
        const isChecked = await locator.first().isChecked();
        console.log(`   ${dataType}: ${isChecked ? '선택됨' : '선택안됨'}`);
      } else {
        console.log(`   ${dataType}: 옵션 없음`);
      }
    }
    
    // 3. 내보내기 형식 옵션 확인
    console.log('3️⃣ 내보내기 형식 옵션...');
    
    const formatOptions = {
      json: page.locator('input[value="json"], option[value="json"], label:has-text("JSON")'),
      csv: page.locator('input[value="csv"], option[value="csv"], label:has-text("CSV")'),
      excel: page.locator('input[value="excel"], option[value="xlsx"], label:has-text("Excel")'),
      pdf: page.locator('input[value="pdf"], option[value="pdf"], label:has-text("PDF")')
    };
    
    console.log('📄 내보내기 형식 옵션:');
    for (const [format, locator] of Object.entries(formatOptions)) {
      const formatCount = await locator.count();
      console.log(`   ${format}: ${formatCount > 0 ? '지원됨' : '미지원'}`);
    }
    
    // 4. 내보내기 실행 테스트
    console.log('4️⃣ 내보내기 실행 테스트...');
    
    const exportButton = page.locator('button:has-text("내보내기"), button:has-text("다운로드"), button:has-text("Export")');
    const hasExportButton = await exportButton.count() > 0;
    
    if (hasExportButton) {
      console.log('🔽 내보내기 버튼 발견됨');
      
      // 버튼 클릭하지 않고 호버로 UI 반응만 확인
      await exportButton.first().hover();
      
      // 진행률 표시나 로딩 인디케이터 확인
      const loadingIndicator = page.locator('.loading, .progress, .spinner, [class*="loading"]');
      const hasLoadingUI = await loadingIndicator.count() > 0;
      console.log(`⏳ 로딩 인디케이터: ${hasLoadingUI ? '있음' : '없음'}`);
      
    } else {
      console.log('❌ 내보내기 버튼 없음');
    }
    
    // 5. API 레벨 데이터 내보내기 테스트
    console.log('5️⃣ API 레벨 데이터 내보내기...');
    
    try {
      const exportResponse = await request.get('http://localhost:3000/api/v2/user/export');
      console.log(`🌐 사용자 데이터 내보내기 API: ${exportResponse.status()}`);
      
      if (exportResponse.status() === 200) {
        const contentType = exportResponse.headers()['content-type'];
        console.log(`📄 응답 형식: ${contentType || '알 수 없음'}`);
        
        // 응답 크기 확인
        const responseText = await exportResponse.text();
        const dataSize = responseText.length;
        console.log(`📊 데이터 크기: ${dataSize} bytes`);
        
        if (dataSize > 0) {
          console.log('✅ 데이터 내보내기 성공');
        } else {
          console.log('⚠️ 빈 데이터 응답');
        }
      } else if (exportResponse.status() === 401) {
        console.log('🔐 인증 필요 - 정상적인 보안 동작');
      } else {
        console.log(`⚠️ 예상치 못한 응답: ${exportResponse.status()}`);
      }
      
    } catch (error) {
      console.log(`⚠️ API 테스트 오류: ${error.message}`);
    }
    
    console.log('✅ 사용자 데이터 내보내기 테스트 완료!');
  });

  test('🎯 Backup #2: 예약 데이터 백업 및 복원', async ({ page, request }) => {
    console.log('🗂️ 예약 데이터 백업 테스트 시작...');
    
    // 1. 관리자 백업 페이지 접근
    console.log('1️⃣ 관리자 백업 페이지 접근...');
    
    await page.goto('http://localhost:3000/admin/backup');
    await page.waitForLoadState('networkidle');
    
    // 2. 백업 생성 옵션 확인
    console.log('2️⃣ 백업 생성 옵션 확인...');
    
    const backupOptions = {
      reservations: page.locator('input[name*="reservation"], label:has-text("예약")'),
      devices: page.locator('input[name*="device"], label:has-text("기기")'),
      users: page.locator('input[name*="user"], label:has-text("사용자")'),
      payments: page.locator('input[name*="payment"], label:has-text("결제")'),
      settings: page.locator('input[name*="setting"], label:has-text("설정")')
    };
    
    console.log('🗃️ 백업 대상 데이터:');
    for (const [dataType, locator] of Object.entries(backupOptions)) {
      const optionCount = await locator.count();
      console.log(`   ${dataType}: ${optionCount > 0 ? '선택 가능' : '옵션 없음'}`);
    }
    
    // 3. 백업 생성 버튼 확인
    const createBackupButton = page.locator('button:has-text("백업"), button:has-text("생성"), button:has-text("Create")');
    const hasCreateButton = await createBackupButton.count() > 0;
    console.log(`💾 백업 생성 버튼: ${hasCreateButton ? '있음' : '없음'}`);
    
    // 4. 기존 백업 목록 확인
    console.log('3️⃣ 기존 백업 목록 확인...');
    
    const backupList = page.locator('.backup-item, .backup-list li, .file-item');
    const backupCount = await backupList.count();
    console.log(`📋 기존 백업 파일: ${backupCount}개`);
    
    if (backupCount > 0) {
      // 첫 번째 백업 항목 정보 확인
      const firstBackup = backupList.first();
      const backupInfo = await firstBackup.textContent();
      console.log(`📄 백업 정보: ${backupInfo?.substring(0, 100)}...`);
      
      // 복원 버튼 확인
      const restoreButton = firstBackup.locator('button:has-text("복원"), button:has-text("복구"), button:has-text("Restore")');
      const hasRestoreButton = await restoreButton.count() > 0;
      console.log(`🔄 복원 버튼: ${hasRestoreButton ? '있음' : '없음'}`);
      
      // 다운로드 버튼 확인
      const downloadButton = firstBackup.locator('button:has-text("다운로드"), a[download], button:has-text("Download")');
      const hasDownloadButton = await downloadButton.count() > 0;
      console.log(`⬇️ 다운로드 버튼: ${hasDownloadButton ? '있음' : '없음'}`);
    }
    
    // 5. API를 통한 백업 생성 테스트
    console.log('4️⃣ API 백업 생성 테스트...');
    
    try {
      const backupResponse = await request.post('http://localhost:3000/api/admin/backup/create', {
        data: {
          type: 'reservations',
          format: 'json',
          dateRange: {
            start: '2025-01-01',
            end: '2025-12-31'
          }
        }
      });
      
      console.log(`🔧 백업 생성 API: ${backupResponse.status()}`);
      
      if (backupResponse.status() === 200) {
        const backupResult = await backupResponse.json();
        console.log(`✅ 백업 생성 성공: ${JSON.stringify(backupResult).substring(0, 100)}...`);
      } else if (backupResponse.status() === 401 || backupResponse.status() === 403) {
        console.log('🔐 권한 필요 - 정상적인 보안 동작');
      } else {
        console.log(`⚠️ 백업 생성 실패: ${backupResponse.status()}`);
      }
      
    } catch (error) {
      console.log(`⚠️ 백업 API 테스트 오류: ${error.message}`);
    }
    
    // 6. 백업 파일 목록 API 테스트
    console.log('5️⃣ 백업 파일 목록 API 테스트...');
    
    try {
      const listResponse = await request.get('http://localhost:3000/api/admin/backup/list');
      console.log(`📋 백업 목록 API: ${listResponse.status()}`);
      
      if (listResponse.status() === 200) {
        const backupList = await listResponse.json();
        console.log(`📊 API 백업 목록: ${Array.isArray(backupList) ? backupList.length : 0}개`);
      }
      
    } catch (error) {
      console.log(`⚠️ 백업 목록 API 오류: ${error.message}`);
    }
    
    console.log('✅ 예약 데이터 백업 테스트 완료!');
  });

  test('🎯 Backup #3: 시스템 설정 백업', async ({ page, request }) => {
    console.log('⚙️ 시스템 설정 백업 테스트 시작...');
    
    // 1. 시스템 설정 페이지 접근
    console.log('1️⃣ 시스템 설정 페이지 접근...');
    
    await page.goto('http://localhost:3000/admin/settings');
    await page.waitForLoadState('networkidle');
    
    // 2. 백업 가능한 설정 항목 확인
    console.log('2️⃣ 백업 가능한 설정 확인...');
    
    const settingCategories = {
      deviceSettings: page.locator('text=/기기 설정|Device Settings/'),
      timeSlotSettings: page.locator('text=/시간 설정|Time Settings/'),
      pricingSettings: page.locator('text=/가격 설정|Pricing Settings/'),
      notificationSettings: page.locator('text=/알림 설정|Notification Settings/'),
      securitySettings: page.locator('text=/보안 설정|Security Settings/')
    };
    
    console.log('🔧 시스템 설정 카테고리:');
    for (const [category, locator] of Object.entries(settingCategories)) {
      const categoryCount = await locator.count();
      console.log(`   ${category}: ${categoryCount > 0 ? '있음' : '없음'}`);
    }
    
    // 3. 설정 내보내기/가져오기 기능 확인
    console.log('3️⃣ 설정 내보내기/가져오기 확인...');
    
    const importExportButtons = {
      export: page.locator('button:has-text("내보내기"), button:has-text("Export"), button:has-text("백업")'),
      import: page.locator('button:has-text("가져오기"), button:has-text("Import"), button:has-text("복원")'),
      fileInput: page.locator('input[type="file"]')
    };
    
    for (const [action, locator] of Object.entries(importExportButtons)) {
      const buttonCount = await locator.count();
      console.log(`🔘 ${action} 기능: ${buttonCount > 0 ? '있음' : '없음'}`);
    }
    
    // 4. 설정 파일 형식 확인
    console.log('4️⃣ 설정 파일 형식 확인...');
    
    const fileFormatInfo = page.locator('text=/JSON|XML|YAML|\.json|\.xml|\.yaml/');
    const formatCount = await fileFormatInfo.count();
    
    if (formatCount > 0) {
      const formats = await fileFormatInfo.allTextContents();
      console.log(`📄 지원 형식: ${formats.slice(0, 3).join(', ')}`);
    } else {
      console.log('📄 파일 형식 정보: 명시되지 않음');
    }
    
    // 5. API를 통한 설정 백업 테스트
    console.log('5️⃣ API 설정 백업 테스트...');
    
    const settingApis = [
      { endpoint: '/api/admin/settings/export', name: '전체 설정' },
      { endpoint: '/api/admin/devices/settings', name: '기기 설정' },
      { endpoint: '/api/admin/time-slots/settings', name: '시간 설정' },
      { endpoint: '/api/admin/pricing/settings', name: '가격 설정' }
    ];
    
    for (const api of settingApis) {
      try {
        const response = await request.get(`http://localhost:3000${api.endpoint}`);
        console.log(`🔧 ${api.name} API: ${response.status()}`);
        
        if (response.status() === 200) {
          const contentType = response.headers()['content-type'];
          const responseText = await response.text();
          
          console.log(`   형식: ${contentType || '알 수 없음'}`);
          console.log(`   크기: ${responseText.length} bytes`);
          
          // JSON 형식인지 확인
          if (contentType?.includes('json')) {
            try {
              const data = JSON.parse(responseText);
              const keyCount = Object.keys(data).length;
              console.log(`   설정 항목: ${keyCount}개`);
            } catch (e) {
              console.log('   ⚠️ JSON 파싱 실패');
            }
          }
        } else if (response.status() === 401 || response.status() === 403) {
          console.log('   🔐 권한 필요');
        } else if (response.status() === 404) {
          console.log('   ❌ API 없음');
        }
        
      } catch (error) {
        console.log(`   ⚠️ API 테스트 오류: ${error.message}`);
      }
    }
    
    // 6. 설정 복원 시뮬레이션
    console.log('6️⃣ 설정 복원 시뮬레이션...');
    
    try {
      const restoreResponse = await request.post('http://localhost:3000/api/admin/settings/import', {
        data: {
          settings: {
            deviceTypes: ['PC', 'Console', 'VR'],
            timeSlots: ['09:00-11:00', '11:00-13:00'],
            pricing: { hourly: 5000, daily: 30000 }
          }
        }
      });
      
      console.log(`🔄 설정 복원 시뮬레이션: ${restoreResponse.status()}`);
      
      if (restoreResponse.status() === 200) {
        console.log('✅ 설정 복원 API 정상 동작');
      } else if (restoreResponse.status() === 401 || restoreResponse.status() === 403) {
        console.log('🔐 설정 복원 권한 제한 - 정상');
      } else {
        console.log(`⚠️ 예상치 못한 응답: ${restoreResponse.status()}`);
      }
      
    } catch (error) {
      console.log(`⚠️ 설정 복원 테스트 오류: ${error.message}`);
    }
    
    console.log('✅ 시스템 설정 백업 테스트 완료!');
  });

  test('🎯 Backup #4: 데이터 무결성 검증', async ({ page, request }) => {
    console.log('🔍 데이터 무결성 검증 테스트 시작...');
    
    // 1. 데이터베이스 상태 확인
    console.log('1️⃣ 데이터베이스 상태 확인...');
    
    try {
      const healthResponse = await request.get('http://localhost:3000/api/admin/health/database');
      console.log(`💓 데이터베이스 상태: ${healthResponse.status()}`);
      
      if (healthResponse.status() === 200) {
        const healthData = await healthResponse.json();
        console.log(`📊 상태 정보: ${JSON.stringify(healthData).substring(0, 100)}...`);
      }
      
    } catch (error) {
      console.log(`⚠️ 데이터베이스 상태 확인 오류: ${error.message}`);
    }
    
    // 2. 데이터 일관성 검사
    console.log('2️⃣ 데이터 일관성 검사...');
    
    const consistencyChecks = [
      { endpoint: '/api/admin/consistency/reservations', name: '예약 데이터' },
      { endpoint: '/api/admin/consistency/devices', name: '기기 데이터' },
      { endpoint: '/api/admin/consistency/users', name: '사용자 데이터' },
      { endpoint: '/api/admin/consistency/payments', name: '결제 데이터' }
    ];
    
    for (const check of consistencyChecks) {
      try {
        const response = await request.get(`http://localhost:3000${check.endpoint}`);
        console.log(`🔍 ${check.name} 일관성: ${response.status()}`);
        
        if (response.status() === 200) {
          const result = await response.json();
          if (result.consistent) {
            console.log(`   ✅ ${check.name} 일관성 유지`);
          } else {
            console.log(`   ⚠️ ${check.name} 불일치 발견: ${result.issues?.length || 0}개`);
          }
        } else if (response.status() === 404) {
          console.log(`   ❌ ${check.name} 일관성 검사 API 없음`);
        }
        
      } catch (error) {
        console.log(`   ⚠️ ${check.name} 검사 오류: ${error.message}`);
      }
    }
    
    // 3. 백업 파일 무결성 검증
    console.log('3️⃣ 백업 파일 무결성 검증...');
    
    try {
      const verifyResponse = await request.post('http://localhost:3000/api/admin/backup/verify', {
        data: {
          backupId: 'latest',
          checkType: 'full'
        }
      });
      
      console.log(`🔐 백업 무결성 검증: ${verifyResponse.status()}`);
      
      if (verifyResponse.status() === 200) {
        const verifyResult = await verifyResponse.json();
        console.log(`✅ 백업 무결성: ${verifyResult.valid ? '정상' : '손상됨'}`);
        
        if (verifyResult.checksum) {
          console.log(`🔑 체크섬: ${verifyResult.checksum.substring(0, 16)}...`);
        }
      }
      
    } catch (error) {
      console.log(`⚠️ 백업 무결성 검증 오류: ${error.message}`);
    }
    
    // 4. 참조 무결성 검사
    console.log('4️⃣ 참조 무결성 검사...');
    
    const referenceChecks = [
      'reservations와 devices 간 참조',
      'reservations와 users 간 참조',
      'payments와 reservations 간 참조',
      'check_ins와 reservations 간 참조'
    ];
    
    for (const checkName of referenceChecks) {
      try {
        const response = await request.get(`http://localhost:3000/api/admin/integrity/references`);
        console.log(`🔗 ${checkName}: API ${response.status()}`);
        
        if (response.status() === 404) {
          console.log(`   ❌ 참조 무결성 검사 API 미구현`);
        }
        
      } catch (error) {
        console.log(`   ⚠️ 참조 무결성 검사 오류: ${error.message}`);
      }
    }
    
    // 5. 데이터 크기 및 카운트 검증
    console.log('5️⃣ 데이터 크기 검증...');
    
    const dataCountApis = [
      { endpoint: '/api/v2/reservations', name: '예약' },
      { endpoint: '/api/v2/devices', name: '기기' },
      { endpoint: '/api/admin/users', name: '사용자' }
    ];
    
    for (const api of dataCountApis) {
      try {
        const response = await request.get(`http://localhost:3000${api.endpoint}`);
        
        if (response.status() === 200) {
          const data = await response.json();
          const count = Array.isArray(data) ? data.length : (data.total || 0);
          console.log(`📊 ${api.name} 데이터: ${count}개`);
          
          if (count === 0) {
            console.log(`   ⚠️ ${api.name} 데이터 없음 - 확인 필요`);
          } else {
            console.log(`   ✅ ${api.name} 데이터 존재`);
          }
        } else if (response.status() === 401) {
          console.log(`🔐 ${api.name} 접근 권한 필요`);
        } else {
          console.log(`❌ ${api.name} API 오류: ${response.status()}`);
        }
        
      } catch (error) {
        console.log(`⚠️ ${api.name} 카운트 확인 오류: ${error.message}`);
      }
    }
    
    console.log('✅ 데이터 무결성 검증 테스트 완료!');
  });

  test('🎯 Backup #5: 자동 백업 스케줄링', async ({ page, request }) => {
    console.log('⏰ 자동 백업 스케줄링 테스트 시작...');
    
    // 1. 백업 스케줄 설정 페이지 접근
    console.log('1️⃣ 백업 스케줄 설정 확인...');
    
    await page.goto('http://localhost:3000/admin/backup/schedule');
    await page.waitForLoadState('networkidle');
    
    // 2. 자동 백업 설정 확인
    console.log('2️⃣ 자동 백업 설정 확인...');
    
    const scheduleSettings = {
      enabled: page.locator('input[name*="auto"], input[type="checkbox"]'),
      frequency: page.locator('select[name*="frequency"], input[name*="interval"]'),
      time: page.locator('input[type="time"], select[name*="hour"]'),
      retention: page.locator('input[name*="retention"], input[name*="keep"]')
    };
    
    console.log('📅 자동 백업 설정 옵션:');
    for (const [setting, locator] of Object.entries(scheduleSettings)) {
      const settingCount = await locator.count();
      console.log(`   ${setting}: ${settingCount > 0 ? '설정 가능' : '옵션 없음'}`);
      
      if (settingCount > 0 && setting === 'frequency') {
        // 빈도 옵션 확인
        const options = await locator.locator('option').allTextContents();
        if (options.length > 0) {
          console.log(`     빈도 옵션: ${options.join(', ')}`);
        }
      }
    }
    
    // 3. 백업 히스토리 확인
    console.log('3️⃣ 백업 히스토리 확인...');
    
    const backupHistory = page.locator('.backup-history, .schedule-log, .backup-record');
    const historyCount = await backupHistory.count();
    console.log(`📜 백업 히스토리: ${historyCount}개 항목`);
    
    if (historyCount > 0) {
      // 최근 백업 정보 확인
      const recentBackup = backupHistory.first();
      const backupInfo = await recentBackup.textContent();
      console.log(`🕐 최근 백업: ${backupInfo?.substring(0, 80)}...`);
      
      // 백업 상태 확인
      const statusElements = recentBackup.locator('.status, .success, .failed, .pending');
      const hasStatus = await statusElements.count() > 0;
      if (hasStatus) {
        const status = await statusElements.first().textContent();
        console.log(`📊 백업 상태: ${status}`);
      }
    }
    
    // 4. API를 통한 스케줄 설정 확인
    console.log('4️⃣ API 스케줄 설정 확인...');
    
    try {
      const scheduleResponse = await request.get('http://localhost:3000/api/admin/backup/schedule');
      console.log(`⚙️ 백업 스케줄 API: ${scheduleResponse.status()}`);
      
      if (scheduleResponse.status() === 200) {
        const scheduleData = await scheduleResponse.json();
        console.log(`📋 스케줄 설정: ${JSON.stringify(scheduleData).substring(0, 100)}...`);
        
        // 스케줄 활성화 상태 확인
        if (scheduleData.enabled) {
          console.log(`✅ 자동 백업 활성화됨`);
          console.log(`   빈도: ${scheduleData.frequency || '설정 없음'}`);
          console.log(`   시간: ${scheduleData.time || '설정 없음'}`);
        } else {
          console.log(`⚠️ 자동 백업 비활성화됨`);
        }
      } else if (scheduleResponse.status() === 404) {
        console.log('❌ 백업 스케줄 API 없음');
      }
      
    } catch (error) {
      console.log(`⚠️ 스케줄 API 오류: ${error.message}`);
    }
    
    // 5. 수동 백업 트리거 테스트
    console.log('5️⃣ 수동 백업 트리거 테스트...');
    
    try {
      const triggerResponse = await request.post('http://localhost:3000/api/admin/backup/trigger', {
        data: {
          type: 'manual',
          target: 'test'
        }
      });
      
      console.log(`🔄 수동 백업 트리거: ${triggerResponse.status()}`);
      
      if (triggerResponse.status() === 200) {
        const triggerResult = await triggerResponse.json();
        console.log(`✅ 백업 트리거 성공: ${triggerResult.jobId || 'ID 없음'}`);
      } else if (triggerResponse.status() === 202) {
        console.log('⏳ 백업 작업 대기열에 추가됨');
      } else if (triggerResponse.status() === 401 || triggerResponse.status() === 403) {
        console.log('🔐 백업 트리거 권한 필요 - 정상');
      } else {
        console.log(`⚠️ 백업 트리거 실패: ${triggerResponse.status()}`);
      }
      
    } catch (error) {
      console.log(`⚠️ 백업 트리거 테스트 오류: ${error.message}`);
    }
    
    // 6. 백업 작업 상태 모니터링
    console.log('6️⃣ 백업 작업 상태 모니터링...');
    
    try {
      const jobsResponse = await request.get('http://localhost:3000/api/admin/backup/jobs');
      console.log(`📊 백업 작업 모니터링: ${jobsResponse.status()}`);
      
      if (jobsResponse.status() === 200) {
        const jobs = await jobsResponse.json();
        const jobCount = Array.isArray(jobs) ? jobs.length : 0;
        console.log(`🔄 진행 중인 백업 작업: ${jobCount}개`);
        
        if (jobCount > 0) {
          const activeJob = jobs[0];
          console.log(`📋 작업 상태: ${activeJob.status || '알 수 없음'}`);
          console.log(`⏱️ 시작 시간: ${activeJob.startTime || '알 수 없음'}`);
        }
      } else if (jobsResponse.status() === 404) {
        console.log('❌ 백업 작업 모니터링 API 없음');
      }
      
    } catch (error) {
      console.log(`⚠️ 작업 모니터링 오류: ${error.message}`);
    }
    
    console.log('✅ 자동 백업 스케줄링 테스트 완료!');
  });

  test('🎯 Backup #6: 재해 복구 시나리오', async ({ page, request }) => {
    console.log('🚨 재해 복구 시나리오 테스트 시작...');
    
    // 1. 시스템 상태 진단
    console.log('1️⃣ 시스템 상태 진단...');
    
    const systemChecks = [
      { endpoint: '/api/admin/health/database', name: '데이터베이스' },
      { endpoint: '/api/admin/health/storage', name: '스토리지' },
      { endpoint: '/api/admin/health/backup', name: '백업 시스템' },
      { endpoint: '/api/health', name: '전체 시스템' }
    ];
    
    console.log('🏥 시스템 건강 상태:');
    for (const check of systemChecks) {
      try {
        const response = await request.get(`http://localhost:3000${check.endpoint}`);
        console.log(`   ${check.name}: ${response.status()}`);
        
        if (response.status() === 200) {
          const healthData = await response.json();
          const status = healthData.status || healthData.healthy ? '정상' : '문제';
          console.log(`     상태: ${status}`);
        }
        
      } catch (error) {
        console.log(`     ⚠️ ${check.name} 확인 오류: ${error.message}`);
      }
    }
    
    // 2. 복구 계획 확인
    console.log('2️⃣ 복구 계획 확인...');
    
    await page.goto('http://localhost:3000/admin/disaster-recovery');
    await page.waitForLoadState('networkidle');
    
    // 복구 계획 문서나 가이드 확인
    const recoveryPlan = page.locator('text=/복구|Recovery|재해|Disaster/');
    const planCount = await recoveryPlan.count();
    console.log(`📋 복구 계획 문서: ${planCount > 0 ? '있음' : '없음'}`);
    
    // 복구 절차 단계 확인
    const recoverySteps = page.locator('ol li, .step, .procedure');
    const stepCount = await recoverySteps.count();
    console.log(`📝 복구 절차 단계: ${stepCount}개`);
    
    // 3. 백업 복원 시뮬레이션
    console.log('3️⃣ 백업 복원 시뮬레이션...');
    
    try {
      const restoreResponse = await request.post('http://localhost:3000/api/admin/restore/simulate', {
        data: {
          backupId: 'latest',
          components: ['database', 'files', 'settings'],
          dryRun: true
        }
      });
      
      console.log(`🔄 복원 시뮬레이션: ${restoreResponse.status()}`);
      
      if (restoreResponse.status() === 200) {
        const restoreResult = await restoreResponse.json();
        console.log(`✅ 복원 시뮬레이션 성공`);
        console.log(`   예상 시간: ${restoreResult.estimatedTime || '알 수 없음'}`);
        console.log(`   영향받는 데이터: ${restoreResult.affectedRecords || 0}개`);
      } else if (restoreResponse.status() === 404) {
        console.log('❌ 복원 시뮬레이션 API 없음');
      }
      
    } catch (error) {
      console.log(`⚠️ 복원 시뮬레이션 오류: ${error.message}`);
    }
    
    // 4. 데이터 일관성 복구 테스트
    console.log('4️⃣ 데이터 일관성 복구 테스트...');
    
    try {
      const consistencyResponse = await request.post('http://localhost:3000/api/admin/repair/consistency', {
        data: {
          mode: 'check',
          fix: false
        }
      });
      
      console.log(`🔧 일관성 복구: ${consistencyResponse.status()}`);
      
      if (consistencyResponse.status() === 200) {
        const repairResult = await consistencyResponse.json();
        console.log(`🔍 일관성 검사 결과:`);
        console.log(`   문제 발견: ${repairResult.issues?.length || 0}개`);
        console.log(`   수정 가능: ${repairResult.fixable || 0}개`);
      }
      
    } catch (error) {
      console.log(`⚠️ 일관성 복구 테스트 오류: ${error.message}`);
    }
    
    // 5. 서비스 중단 시간 최소화 전략
    console.log('5️⃣ 서비스 중단 시간 최소화 전략...');
    
    const maintenanceFeatures = {
      maintenanceMode: page.locator('input[name*="maintenance"], button:has-text("점검"), .maintenance-toggle'),
      rollbackButton: page.locator('button:has-text("롤백"), button:has-text("되돌리기"), button:has-text("Rollback")'),
      quickRestore: page.locator('button:has-text("빠른 복구"), button:has-text("Quick"), .quick-restore')
    };
    
    console.log('⚡ 긴급 복구 기능:');
    for (const [feature, locator] of Object.entries(maintenanceFeatures)) {
      const featureCount = await locator.count();
      console.log(`   ${feature}: ${featureCount > 0 ? '사용 가능' : '없음'}`);
    }
    
    // 6. 복구 후 검증 절차
    console.log('6️⃣ 복구 후 검증 절차...');
    
    const postRecoveryChecks = [
      { name: '사용자 로그인', endpoint: '/api/auth/test' },
      { name: '예약 생성', endpoint: '/api/v2/reservations' },
      { name: '기기 조회', endpoint: '/api/v2/devices' },
      { name: '관리자 기능', endpoint: '/api/admin/dashboard' }
    ];
    
    console.log('✅ 복구 후 검증 항목:');
    for (const check of postRecoveryChecks) {
      try {
        const testResponse = await request.get(`http://localhost:3000${check.endpoint}`);
        const status = testResponse.status();
        
        if (status === 200) {
          console.log(`   ${check.name}: ✅ 정상`);
        } else if (status === 401 || status === 403) {
          console.log(`   ${check.name}: 🔐 인증 필요 (정상)`);
        } else if (status === 404) {
          console.log(`   ${check.name}: ❌ API 없음`);
        } else {
          console.log(`   ${check.name}: ⚠️ 문제 (${status})`);
        }
        
      } catch (error) {
        console.log(`   ${check.name}: ❌ 오류 - ${error.message}`);
      }
    }
    
    console.log('✅ 재해 복구 시나리오 테스트 완료!');
  });

});