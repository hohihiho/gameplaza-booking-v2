const { test, expect } = require('@playwright/test');

test.describe('게임플라자 홈페이지 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 모바일 뷰포트 설정 (게임플라자는 모바일 퍼스트)
    await page.setViewportSize({ width: 375, height: 667 });
  });

  test('홈페이지 로딩 및 기본 요소 확인', async ({ page }) => {
    console.log('🏠 홈페이지 접속 중...');
    
    // 성능 측정 시작
    const startTime = Date.now();
    
    // 홈페이지 접속
    await page.goto('http://localhost:3000');
    
    // 페이지 로딩 완료 대기
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    console.log(`⏱️ 홈페이지 로딩 시간: ${loadTime}ms`);
    
    // 페이지 제목 확인
    await expect(page).toHaveTitle(/게임플라자|GamePlaza/i);
    console.log('✅ 페이지 제목 확인 완료');
    
    // 헤더 네비게이션 확인
    const navigation = page.locator('nav, header, [role="navigation"]');
    await expect(navigation).toBeVisible();
    console.log('✅ 네비게이션 바 표시 확인');
    
    // 메인 컨텐츠 영역 확인
    const mainContent = page.locator('main, [role="main"], .main-content');
    if (await mainContent.count() > 0) {
      await expect(mainContent.first()).toBeVisible();
      console.log('✅ 메인 컨텐츠 영역 확인');
    }
    
    // 예약 관련 버튼이나 링크 확인
    const reservationElements = page.locator('a, button').filter({ 
      hasText: /예약|reservation|기기|게임/i 
    });
    
    if (await reservationElements.count() > 0) {
      console.log(`✅ 예약 관련 요소 ${await reservationElements.count()}개 발견`);
    }
    
    // 스크린샷 촬영
    await page.screenshot({ 
      path: 'tests/screenshots/homepage-mobile.png',
      fullPage: true 
    });
    console.log('📸 홈페이지 스크린샷 저장 완료');
    
    // 기본 접근성 확인
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < Math.min(imageCount, 10); i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      if (!alt || alt.trim() === '') {
        console.log(`⚠️ 이미지 alt 속성 누락: ${i + 1}번째 이미지`);
      }
    }
    
    console.log('🎉 홈페이지 기본 테스트 완료!');
  });

  test('모바일 터치 타겟 크기 검증', async ({ page }) => {
    console.log('📱 모바일 터치 인터페이스 테스트 시작...');
    
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // 모든 클릭 가능한 요소 찾기
    const clickableElements = page.locator('button, a, [role="button"], input[type="button"], input[type="submit"]');
    const elementCount = await clickableElements.count();
    
    console.log(`🎯 클릭 가능한 요소 ${elementCount}개 발견`);
    
    let validTouchTargets = 0;
    let smallTargets = [];
    
    for (let i = 0; i < Math.min(elementCount, 20); i++) {
      const element = clickableElements.nth(i);
      
      try {
        const box = await element.boundingBox();
        
        if (box) {
          const { width, height } = box;
          
          // 터치 타겟 최소 크기 확인 (44x44px - Apple HIG 권장)
          if (width >= 44 && height >= 44) {
            validTouchTargets++;
          } else {
            const text = await element.innerText().catch(() => '');
            smallTargets.push({
              index: i,
              size: `${Math.round(width)}x${Math.round(height)}px`,
              text: text.substring(0, 30)
            });
          }
        }
      } catch (error) {
        // 보이지 않는 요소는 무시
        continue;
      }
    }
    
    console.log(`✅ 적절한 터치 타겟: ${validTouchTargets}개`);
    
    if (smallTargets.length > 0) {
      console.log(`⚠️ 작은 터치 타겟 발견: ${smallTargets.length}개`);
      smallTargets.forEach(target => {
        console.log(`   - ${target.size}: "${target.text}"`);
      });
    }
    
    console.log('📱 모바일 터치 인터페이스 테스트 완료!');
  });

  test('반응형 디자인 테스트', async ({ page }) => {
    console.log('📐 반응형 디자인 테스트 시작...');
    
    const viewports = [
      { name: 'Mobile Portrait', width: 375, height: 667 },
      { name: 'Mobile Landscape', width: 667, height: 375 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1920, height: 1080 }
    ];
    
    for (const viewport of viewports) {
      console.log(`📱 ${viewport.name} (${viewport.width}x${viewport.height}) 테스트 중...`);
      
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('http://localhost:3000');
      await page.waitForLoadState('networkidle');
      
      // 수평 스크롤 확인 (모바일에서 중요)
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = viewport.width;
      
      if (bodyWidth > viewportWidth + 10) { // 10px 여유
        console.log(`⚠️ ${viewport.name}에서 수평 스크롤 발생: ${bodyWidth}px > ${viewportWidth}px`);
      } else {
        console.log(`✅ ${viewport.name} 수평 스크롤 없음`);
      }
      
      // 스크린샷 저장
      await page.screenshot({ 
        path: `tests/screenshots/homepage-${viewport.name.toLowerCase().replace(' ', '-')}.png`,
        fullPage: false 
      });
    }
    
    console.log('📐 반응형 디자인 테스트 완료!');
  });
});