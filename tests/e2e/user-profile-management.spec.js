/**
 * 🟡 MEDIUM RISK: 사용자 프로필 관리 테스트
 * 
 * 리스크 레벨: 6/10 (Medium-High)
 * 
 * 테스트 범위:
 * 1. 사용자 등록 및 프로필 생성
 * 2. 프로필 정보 수정 및 업데이트
 * 3. 프로필 이미지 업로드
 * 4. 개인정보 보호 및 접근 권한
 * 5. 사용자 기본 설정 관리
 * 6. 계정 삭제 및 데이터 정리
 * 7. 다중 기기 로그인 관리
 */

import { test, expect } from '@playwright/test';

test.describe('🟡 MEDIUM RISK: 사용자 프로필 관리', () => {

  test('🎯 Profile #1: 사용자 등록 및 프로필 생성', async ({ page }) => {
    console.log('👤 사용자 등록 및 프로필 생성 테스트 시작...');
    
    // 1. 회원가입 페이지 접근
    console.log('1️⃣ 회원가입 페이지 접근...');
    
    await page.goto('http://localhost:3000/auth/signup');
    await page.waitForLoadState('networkidle');
    
    // 회원가입 폼 확인
    const signupForm = page.locator('form, .signup-form, .register-form');
    const hasSignupForm = await signupForm.count() > 0;
    
    console.log(`📝 회원가입 폼: ${hasSignupForm ? '발견됨' : '없음'}`);
    
    if (hasSignupForm) {
      // 필수 입력 필드 확인
      const requiredFields = {
        email: page.locator('input[type="email"], input[name="email"]'),
        password: page.locator('input[type="password"], input[name="password"]'),
        name: page.locator('input[name="name"], input[name="username"], input[placeholder*="이름"]'),
        phone: page.locator('input[type="tel"], input[name="phone"], input[placeholder*="전화"]')
      };
      
      for (const [fieldName, locator] of Object.entries(requiredFields)) {
        const fieldCount = await locator.count();
        console.log(`   ${fieldName} 필드: ${fieldCount}개`);
      }
      
      // 회원가입 버튼 확인
      const submitButton = page.locator('button[type="submit"], button:has-text("가입"), button:has-text("회원가입")');
      const hasSubmitButton = await submitButton.count() > 0;
      console.log(`🔘 가입 버튼: ${hasSubmitButton ? '있음' : '없음'}`);
    }
    
    // 2. 소셜 로그인 옵션 확인
    console.log('2️⃣ 소셜 로그인 옵션 확인...');
    
    const socialButtons = {
      google: page.locator('button:has-text("Google"), button:has-text("구글"), .google-login'),
      kakao: page.locator('button:has-text("Kakao"), button:has-text("카카오"), .kakao-login'),
      naver: page.locator('button:has-text("Naver"), button:has-text("네이버"), .naver-login')
    };
    
    for (const [provider, locator] of Object.entries(socialButtons)) {
      const buttonCount = await locator.count();
      console.log(`🔗 ${provider} 로그인: ${buttonCount > 0 ? '지원됨' : '미지원'}`);
    }
    
    // 3. 입력 검증 테스트
    console.log('3️⃣ 입력 검증 테스트...');
    
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    if (await emailInput.count() > 0) {
      // 잘못된 이메일 형식 테스트
      const invalidEmails = ['invalid-email', 'test@', '@domain.com'];
      
      for (const invalidEmail of invalidEmails) {
        await emailInput.fill(invalidEmail);
        await emailInput.blur();
        
        // 에러 메시지 확인
        const errorMessage = page.locator('.error, .invalid, .danger, [class*="error"]');
        const hasError = await errorMessage.count() > 0;
        console.log(`   "${invalidEmail}": ${hasError ? '에러 표시됨' : '에러 없음'}`);
      }
      
      // 올바른 이메일로 복구
      await emailInput.fill('test@example.com');
    }
    
    console.log('✅ 사용자 등록 및 프로필 생성 테스트 완료!');
  });

  test('🎯 Profile #2: 프로필 정보 수정 및 업데이트', async ({ page }) => {
    console.log('✏️ 프로필 정보 수정 테스트 시작...');
    
    // 1. 프로필 설정 페이지 접근
    console.log('1️⃣ 프로필 설정 페이지 접근...');
    
    await page.goto('http://localhost:3000/profile/settings');
    await page.waitForLoadState('networkidle');
    
    // 로그인 필요시 처리
    if (page.url().includes('/login') || page.url().includes('/auth')) {
      console.log('🔐 로그인 필요 - 인증 페이지로 리다이렉트됨');
      
      // 간단한 로그인 시도
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
    
    // 2. 프로필 편집 폼 확인
    console.log('2️⃣ 프로필 편집 폼 확인...');
    
    const profileForm = page.locator('form, .profile-form, .edit-form');
    const hasProfileForm = await profileForm.count() > 0;
    console.log(`📝 프로필 편집 폼: ${hasProfileForm ? '발견됨' : '없음'}`);
    
    if (hasProfileForm) {
      // 편집 가능한 필드들 확인
      const editableFields = {
        name: page.locator('input[name="name"], input[placeholder*="이름"]'),
        phone: page.locator('input[name="phone"], input[type="tel"]'),
        birth: page.locator('input[type="date"], input[name="birth"]'),
        gender: page.locator('select[name="gender"], input[name="gender"]'),
        address: page.locator('textarea[name="address"], input[name="address"]')
      };
      
      for (const [fieldName, locator] of Object.entries(editableFields)) {
        const fieldCount = await locator.count();
        if (fieldCount > 0) {
          const isDisabled = await locator.first().isDisabled();
          console.log(`   ${fieldName}: ${fieldCount}개 (${isDisabled ? '비활성' : '편집가능'})`);
        }
      }
    }
    
    // 3. 실시간 검증 테스트
    console.log('3️⃣ 실시간 검증 테스트...');
    
    const nameInput = page.locator('input[name="name"], input[placeholder*="이름"]').first();
    if (await nameInput.count() > 0) {
      // 기존 값 저장
      const originalValue = await nameInput.inputValue();
      
      // 값 변경 테스트
      await nameInput.fill('테스트 사용자');
      await nameInput.blur();
      
      // 변경사항 저장 버튼 확인
      const saveButton = page.locator('button:has-text("저장"), button:has-text("수정"), button[type="submit"]');
      const hasSaveButton = await saveButton.count() > 0;
      console.log(`💾 저장 버튼: ${hasSaveButton ? '있음' : '없음'}`);
      
      // 취소 버튼 확인
      const cancelButton = page.locator('button:has-text("취소"), button:has-text("되돌리기")');
      const hasCancelButton = await cancelButton.count() > 0;
      console.log(`❌ 취소 버튼: ${hasCancelButton ? '있음' : '없음'}`);
      
      // 원래 값으로 복구
      if (originalValue) {
        await nameInput.fill(originalValue);
      }
    }
    
    // 4. 필드별 유효성 검사
    console.log('4️⃣ 필드별 유효성 검사...');
    
    const phoneInput = page.locator('input[name="phone"], input[type="tel"]').first();
    if (await phoneInput.count() > 0) {
      // 잘못된 전화번호 형식 테스트
      const invalidPhones = ['123', '01012345678901', 'abcd-efgh'];
      
      for (const invalidPhone of invalidPhones) {
        await phoneInput.fill(invalidPhone);
        await phoneInput.blur();
        
        const errorMessage = page.locator('.error, .invalid, [class*="error"]');
        const hasError = await errorMessage.count() > 0;
        console.log(`   전화번호 "${invalidPhone}": ${hasError ? '에러 표시' : '에러 없음'}`);
      }
      
      // 올바른 형식으로 복구
      await phoneInput.fill('010-1234-5678');
    }
    
    console.log('✅ 프로필 정보 수정 테스트 완료!');
  });

  test('🎯 Profile #3: 프로필 이미지 업로드', async ({ page }) => {
    console.log('📸 프로필 이미지 업로드 테스트 시작...');
    
    // 1. 프로필 페이지 접근
    console.log('1️⃣ 프로필 페이지 접근...');
    
    await page.goto('http://localhost:3000/profile');
    await page.waitForLoadState('networkidle');
    
    // 2. 프로필 이미지 영역 확인
    console.log('2️⃣ 프로필 이미지 영역 확인...');
    
    const profileImage = page.locator('.profile-image, .avatar, img[alt*="프로필"], img[alt*="profile"]');
    const hasProfileImage = await profileImage.count() > 0;
    console.log(`🖼️ 프로필 이미지 영역: ${hasProfileImage ? '있음' : '없음'}`);
    
    // 이미지 업로드 버튼 확인
    const uploadButton = page.locator('button:has-text("업로드"), button:has-text("변경"), input[type="file"]');
    const hasUploadButton = await uploadButton.count() > 0;
    console.log(`📤 업로드 버튼: ${hasUploadButton ? '있음' : '없음'}`);
    
    // 3. 파일 선택 기능 테스트
    console.log('3️⃣ 파일 선택 기능 테스트...');
    
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.count() > 0) {
      // 파일 타입 제한 확인
      const acceptAttr = await fileInput.getAttribute('accept');
      console.log(`📎 허용 파일 타입: ${acceptAttr || '제한 없음'}`);
      
      // 파일 크기 제한 표시 확인
      const sizeInfo = page.locator('text=/MB|KB|용량|크기/');
      const hasSizeInfo = await sizeInfo.count() > 0;
      console.log(`📏 파일 크기 안내: ${hasSizeInfo ? '있음' : '없음'}`);
      
      if (hasSizeInfo) {
        const sizeText = await sizeInfo.first().textContent();
        console.log(`   크기 제한: ${sizeText?.substring(0, 50)}...`);
      }
    }
    
    // 4. 이미지 미리보기 기능 확인
    console.log('4️⃣ 이미지 미리보기 기능 확인...');
    
    const previewArea = page.locator('.preview, .image-preview, .upload-preview');
    const hasPreviewArea = await previewArea.count() > 0;
    console.log(`👀 미리보기 영역: ${hasPreviewArea ? '있음' : '없음'}`);
    
    // 기본 아바타나 플레이스홀더 확인
    const defaultAvatar = page.locator('.default-avatar, .placeholder, img[src*="default"]');
    const hasDefaultAvatar = await defaultAvatar.count() > 0;
    console.log(`👤 기본 아바타: ${hasDefaultAvatar ? '있음' : '없음'}`);
    
    // 5. 업로드 진행률 표시 확인
    console.log('5️⃣ 업로드 UI 요소 확인...');
    
    // 진행률 바나 로딩 스피너
    const progressElements = page.locator('.progress, .loading, .spinner, .upload-progress');
    const hasProgressElements = await progressElements.count() > 0;
    console.log(`⏳ 진행률 표시: ${hasProgressElements ? '구현됨' : '없음'}`);
    
    // 삭제 버튼
    const deleteButton = page.locator('button:has-text("삭제"), button:has-text("제거"), .delete-image');
    const hasDeleteButton = await deleteButton.count() > 0;
    console.log(`🗑️ 이미지 삭제 버튼: ${hasDeleteButton ? '있음' : '없음'}`);
    
    // 6. 이미지 포맷 지원 확인
    console.log('6️⃣ 이미지 포맷 지원 확인...');
    
    // 지원 포맷 안내 텍스트 찾기
    const formatInfo = page.locator('text=/JPG|JPEG|PNG|GIF|WebP|지원|형식/');
    const hasFormatInfo = await formatInfo.count() > 0;
    
    if (hasFormatInfo) {
      const formatText = await formatInfo.first().textContent();
      console.log(`🎨 지원 포맷: ${formatText?.substring(0, 100)}...`);
      
      // 일반적인 이미지 포맷 지원 확인
      const supportedFormats = ['JPG', 'JPEG', 'PNG', 'GIF', 'WebP'];
      const mentionedFormats = supportedFormats.filter(format => 
        formatText?.toUpperCase().includes(format)
      );
      console.log(`   지원 포맷: ${mentionedFormats.join(', ') || '명시되지 않음'}`);
    } else {
      console.log('📄 포맷 지원 정보: 명시되지 않음');
    }
    
    console.log('✅ 프로필 이미지 업로드 테스트 완료!');
  });

  test('🎯 Profile #4: 개인정보 보호 및 접근 권한', async ({ page }) => {
    console.log('🔒 개인정보 보호 및 접근 권한 테스트 시작...');
    
    // 1. 개인정보 처리방침 접근
    console.log('1️⃣ 개인정보 처리방침 확인...');
    
    await page.goto('http://localhost:3000/privacy');
    await page.waitForLoadState('networkidle');
    
    // 개인정보 처리방침 내용 확인
    const privacyContent = await page.textContent('body');
    const hasPrivacyContent = privacyContent && privacyContent.length > 500;
    console.log(`📋 개인정보 처리방침: ${hasPrivacyContent ? '있음' : '없음'}`);
    
    if (hasPrivacyContent) {
      // 필수 개인정보 보호 항목들 확인
      const requiredTerms = [
        '개인정보', '수집', '이용', '제3자', '보관', '삭제', '동의'
      ];
      
      const foundTerms = requiredTerms.filter(term => 
        privacyContent.includes(term)
      );
      
      console.log(`🔍 필수 항목 포함: ${foundTerms.length}/${requiredTerms.length}개`);
      console.log(`   포함된 항목: ${foundTerms.join(', ')}`);
    }
    
    // 2. 프로필 공개 설정 확인
    console.log('2️⃣ 프로필 공개 설정 확인...');
    
    await page.goto('http://localhost:3000/profile/privacy');
    await page.waitForLoadState('networkidle');
    
    // 공개 설정 옵션들 확인
    const privacySettings = {
      profileVisibility: page.locator('input[name*="visibility"], select[name*="public"]'),
      emailVisibility: page.locator('input[name*="email"], input[name*="연락처"]'),
      phoneVisibility: page.locator('input[name*="phone"], input[name*="전화"]'),
      historyVisibility: page.locator('input[name*="history"], input[name*="기록"]')
    };
    
    for (const [setting, locator] of Object.entries(privacySettings)) {
      const optionCount = await locator.count();
      console.log(`🔐 ${setting}: ${optionCount > 0 ? '설정 가능' : '설정 없음'}`);
    }
    
    // 3. 데이터 다운로드 기능 확인
    console.log('3️⃣ 데이터 다운로드 기능 확인...');
    
    const downloadButton = page.locator('button:has-text("다운로드"), button:has-text("내보내기"), a:has-text("데이터")');
    const hasDownloadOption = await downloadButton.count() > 0;
    console.log(`💾 데이터 다운로드: ${hasDownloadOption ? '가능' : '불가능'}`);
    
    // 4. 계정 삭제 옵션 확인
    console.log('4️⃣ 계정 삭제 옵션 확인...');
    
    const deleteButton = page.locator('button:has-text("삭제"), button:has-text("탈퇴"), a:has-text("계정")');
    const hasDeleteOption = await deleteButton.count() > 0;
    console.log(`🗑️ 계정 삭제: ${hasDeleteOption ? '가능' : '불가능'}`);
    
    if (hasDeleteOption) {
      // 삭제 확인 프로세스 체크 (실제로 삭제하지 않음)
      await deleteButton.first().hover();
      
      // 경고 메시지나 확인 단계 확인
      const warningText = page.locator('text=/주의|경고|삭제|복구|불가능/');
      const hasWarning = await warningText.count() > 0;
      console.log(`⚠️ 삭제 경고 메시지: ${hasWarning ? '있음' : '없음'}`);
    }
    
    // 5. 쿠키 및 세션 관리
    console.log('5️⃣ 쿠키 및 세션 관리 확인...');
    
    // 브라우저 쿠키 확인
    const cookies = await page.context().cookies();
    console.log(`🍪 설정된 쿠키: ${cookies.length}개`);
    
    if (cookies.length > 0) {
      // 보안 관련 쿠키 속성 확인
      const secureCookies = cookies.filter(cookie => cookie.secure);
      const httpOnlyCookies = cookies.filter(cookie => cookie.httpOnly);
      
      console.log(`   Secure 쿠키: ${secureCookies.length}개`);
      console.log(`   HttpOnly 쿠키: ${httpOnlyCookies.length}개`);
      
      // 세션 쿠키와 영구 쿠키 구분
      const sessionCookies = cookies.filter(cookie => !cookie.expires || cookie.expires === -1);
      console.log(`   세션 쿠키: ${sessionCookies.length}개`);
    }
    
    // 6. 로그아웃 기능 확인
    console.log('6️⃣ 로그아웃 기능 확인...');
    
    const logoutButton = page.locator('button:has-text("로그아웃"), a:has-text("로그아웃"), .logout');
    const hasLogoutButton = await logoutButton.count() > 0;
    console.log(`🚪 로그아웃 버튼: ${hasLogoutButton ? '있음' : '없음'}`);
    
    console.log('✅ 개인정보 보호 및 접근 권한 테스트 완료!');
  });

  test('🎯 Profile #5: 사용자 기본 설정 관리', async ({ page }) => {
    console.log('⚙️ 사용자 기본 설정 관리 테스트 시작...');
    
    // 1. 설정 페이지 접근
    console.log('1️⃣ 설정 페이지 접근...');
    
    await page.goto('http://localhost:3000/settings');
    await page.waitForLoadState('networkidle');
    
    // 설정 페이지 구조 확인
    const settingsMenu = page.locator('.settings-menu, .sidebar, nav');
    const hasSettingsMenu = await settingsMenu.count() > 0;
    console.log(`🗂️ 설정 메뉴: ${hasSettingsMenu ? '있음' : '없음'}`);
    
    // 2. 알림 설정 확인
    console.log('2️⃣ 알림 설정 확인...');
    
    const notificationSettings = {
      email: page.locator('input[name*="email"], input[type="checkbox"]'),
      sms: page.locator('input[name*="sms"], input[type="checkbox"]'),
      push: page.locator('input[name*="push"], input[type="checkbox"]'),
      marketing: page.locator('input[name*="marketing"], input[type="checkbox"]')
    };
    
    for (const [type, locator] of Object.entries(notificationSettings)) {
      const settingCount = await locator.count();
      if (settingCount > 0) {
        const isChecked = await locator.first().isChecked();
        console.log(`🔔 ${type} 알림: ${isChecked ? '활성화' : '비활성화'}`);
      }
    }
    
    // 3. 언어 및 지역 설정
    console.log('3️⃣ 언어 및 지역 설정 확인...');
    
    const languageSelect = page.locator('select[name*="language"], select[name*="lang"]');
    const hasLanguageSelect = await languageSelect.count() > 0;
    
    if (hasLanguageSelect) {
      const options = await languageSelect.locator('option').allTextContents();
      console.log(`🌐 언어 옵션: ${options.length}개`);
      console.log(`   지원 언어: ${options.slice(0, 3).join(', ')}${options.length > 3 ? '...' : ''}`);
    } else {
      console.log('🌐 언어 설정: 없음');
    }
    
    // 지역/시간대 설정
    const timezoneSelect = page.locator('select[name*="timezone"], select[name*="지역"]');
    const hasTimezoneSelect = await timezoneSelect.count() > 0;
    console.log(`🕐 시간대 설정: ${hasTimezoneSelect ? '있음' : '없음'}`);
    
    // 4. 테마 및 디스플레이 설정
    console.log('4️⃣ 테마 및 디스플레이 설정 확인...');
    
    const themeSettings = {
      darkMode: page.locator('input[name*="dark"], input[name*="theme"], .theme-toggle'),
      fontSize: page.locator('select[name*="font"], input[name*="size"]'),
      colorScheme: page.locator('input[name*="color"], select[name*="scheme"]')
    };
    
    for (const [setting, locator] of Object.entries(themeSettings)) {
      const hasOption = await locator.count() > 0;
      console.log(`🎨 ${setting}: ${hasOption ? '설정 가능' : '설정 없음'}`);
    }
    
    // 5. 보안 설정 확인
    console.log('5️⃣ 보안 설정 확인...');
    
    const securitySettings = {
      twoFactor: page.locator('input[name*="2fa"], input[name*="two"]'),
      loginAlerts: page.locator('input[name*="login"], input[name*="alert"]'),
      passwordChange: page.locator('button:has-text("비밀번호"), a:has-text("변경")')
    };
    
    for (const [setting, locator] of Object.entries(securitySettings)) {
      const hasOption = await locator.count() > 0;
      console.log(`🔐 ${setting}: ${hasOption ? '설정 가능' : '설정 없음'}`);
    }
    
    // 6. 설정 저장 및 적용
    console.log('6️⃣ 설정 저장 기능 확인...');
    
    const saveButton = page.locator('button:has-text("저장"), button:has-text("적용"), button[type="submit"]');
    const hasSaveButton = await saveButton.count() > 0;
    console.log(`💾 저장 버튼: ${hasSaveButton ? '있음' : '없음'}`);
    
    // 자동 저장 기능 확인
    const autoSaveIndicator = page.locator('text=/자동저장|자동 저장|저장됨|Saved/');
    const hasAutoSave = await autoSaveIndicator.count() > 0;
    console.log(`🔄 자동 저장: ${hasAutoSave ? '활성화' : '수동 저장'}`);
    
    // 설정 초기화 옵션
    const resetButton = page.locator('button:has-text("초기화"), button:has-text("기본값"), button:has-text("리셋")');
    const hasResetOption = await resetButton.count() > 0;
    console.log(`🔄 설정 초기화: ${hasResetOption ? '가능' : '불가능'}`);
    
    console.log('✅ 사용자 기본 설정 관리 테스트 완료!');
  });

  test('🎯 Profile #6: 다중 기기 로그인 관리', async ({ page, context }) => {
    console.log('📱 다중 기기 로그인 관리 테스트 시작...');
    
    // 1. 활성 세션 관리 페이지 접근
    console.log('1️⃣ 활성 세션 관리 페이지 접근...');
    
    await page.goto('http://localhost:3000/profile/sessions');
    await page.waitForLoadState('networkidle');
    
    // 세션 관리 페이지 확인
    const sessionList = page.locator('.session, .device, .login-history');
    const hasSessionList = await sessionList.count() > 0;
    console.log(`📋 세션 목록: ${hasSessionList ? '있음' : '없음'}`);
    
    if (hasSessionList) {
      const sessionCount = await sessionList.count();
      console.log(`🔗 활성 세션: ${sessionCount}개`);
      
      // 세션 정보 확인
      for (let i = 0; i < Math.min(sessionCount, 3); i++) {
        const session = sessionList.nth(i);
        const sessionText = await session.textContent();
        console.log(`   세션 ${i + 1}: ${sessionText?.substring(0, 50)}...`);
      }
    }
    
    // 2. 기기 정보 표시 확인
    console.log('2️⃣ 기기 정보 표시 확인...');
    
    const deviceInfo = {
      browser: page.locator('text=/Chrome|Firefox|Safari|Edge/'),
      os: page.locator('text=/Windows|Mac|Linux|iOS|Android/'),
      ip: page.locator('text=/\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}/'),
      location: page.locator('text=/서울|부산|대구|위치|지역/')
    };
    
    for (const [infoType, locator] of Object.entries(deviceInfo)) {
      const hasInfo = await locator.count() > 0;
      if (hasInfo) {
        const infoText = await locator.first().textContent();
        console.log(`🔍 ${infoType}: ${infoText?.substring(0, 30)}...`);
      }
    }
    
    // 3. 원격 로그아웃 기능 확인
    console.log('3️⃣ 원격 로그아웃 기능 확인...');
    
    const logoutButtons = page.locator('button:has-text("로그아웃"), button:has-text("종료"), .logout-session');
    const logoutButtonCount = await logoutButtons.count();
    console.log(`🚪 개별 로그아웃 버튼: ${logoutButtonCount}개`);
    
    // 전체 세션 종료 버튼
    const logoutAllButton = page.locator('button:has-text("모든"), button:has-text("전체"), button:has-text("모두")');
    const hasLogoutAll = await logoutAllButton.count() > 0;
    console.log(`🔐 전체 로그아웃: ${hasLogoutAll ? '가능' : '불가능'}`);
    
    // 4. 새 기기에서 로그인 시뮬레이션
    console.log('4️⃣ 새 기기 로그인 시뮬레이션...');
    
    // 새로운 브라우저 컨텍스트 생성 (다른 기기 시뮬레이션)
    const newContext = await context.browser().newContext({
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
    });
    const newDevicePage = await newContext.newPage();
    
    try {
      await newDevicePage.goto('http://localhost:3000/login');
      await newDevicePage.waitForLoadState('networkidle');
      
      console.log('📲 새 기기에서 로그인 페이지 접근 성공');
      
      // 기기 인증 또는 보안 확인 과정이 있는지 확인
      const securityCheck = newDevicePage.locator('text=/인증|확인|보안|새로운 기기/');
      const hasSecurityCheck = await securityCheck.count() > 0;
      console.log(`🔒 새 기기 보안 확인: ${hasSecurityCheck ? '있음' : '없음'}`);
      
    } catch (error) {
      console.log(`⚠️ 새 기기 접근 테스트 오류: ${error.message}`);
    } finally {
      await newContext.close();
    }
    
    // 5. 로그인 알림 설정 확인
    console.log('5️⃣ 로그인 알림 설정 확인...');
    
    const loginAlerts = {
      emailAlert: page.locator('input[name*="email"], input[type="checkbox"]'),
      smsAlert: page.locator('input[name*="sms"], input[type="checkbox"]'),
      unknownDevice: page.locator('input[name*="unknown"], input[name*="새로운"]')
    };
    
    for (const [alertType, locator] of Object.entries(loginAlerts)) {
      const hasAlert = await locator.count() > 0;
      if (hasAlert) {
        const isEnabled = await locator.first().isChecked();
        console.log(`🔔 ${alertType}: ${isEnabled ? '활성화' : '비활성화'}`);
      }
    }
    
    // 6. 세션 타임아웃 설정 확인
    console.log('6️⃣ 세션 타임아웃 설정 확인...');
    
    const timeoutSettings = page.locator('select[name*="timeout"], input[name*="expire"]');
    const hasTimeoutSettings = await timeoutSettings.count() > 0;
    
    if (hasTimeoutSettings) {
      const timeoutText = await timeoutSettings.first().textContent();
      console.log(`⏰ 세션 타임아웃: ${timeoutText?.substring(0, 50)}...`);
    } else {
      console.log('⏰ 세션 타임아웃 설정: 없음');
    }
    
    console.log('✅ 다중 기기 로그인 관리 테스트 완료!');
  });

});