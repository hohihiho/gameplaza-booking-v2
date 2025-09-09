const { test, expect } = require('@playwright/test');

test('🎮 게임플라자 UI 테스트 시연', async ({ page }) => {
  console.log('🚀 게임플라자 홈페이지 접속 시작...');
  
  // 홈페이지 접속
  await page.goto('/');
  console.log('✅ 홈페이지 접속 완료');
  
  // 페이지 제목 확인
  const title = await page.title();
  console.log(`📄 페이지 제목: "${title}"`);
  
  // 페이지 로딩 대기
  await page.waitForLoadState('networkidle');
  console.log('⏱️ 페이지 로딩 완료');
  
  // 네비게이션 메뉴 확인
  const navItems = await page.locator('nav a, header a').count();
  console.log(`🧭 네비게이션 아이템: ${navItems}개`);
  
  // 주요 버튼들 확인
  const buttons = await page.locator('button').count();
  console.log(`🔘 버튼 요소: ${buttons}개`);
  
  // 링크들 확인
  const links = await page.locator('a').count();
  console.log(`🔗 링크 요소: ${links}개`);
  
  // 스크롤 테스트
  console.log('📜 페이지 스크롤 테스트...');
  await page.evaluate(() => window.scrollTo(0, 300));
  await page.waitForTimeout(1000);
  
  await page.evaluate(() => window.scrollTo(0, 600));
  await page.waitForTimeout(1000);
  
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1000);
  console.log('✅ 스크롤 테스트 완료');
  
  // 폼 요소 찾기
  const inputs = await page.locator('input').count();
  console.log(`📝 입력 요소: ${inputs}개`);
  
  // 이미지 확인
  const images = await page.locator('img').count();
  console.log(`🖼️ 이미지 요소: ${images}개`);
  
  // 반응형 테스트
  console.log('📱 모바일 뷰 테스트...');
  await page.setViewportSize({ width: 375, height: 667 });
  await page.waitForTimeout(2000);
  
  console.log('💻 데스크톱 뷰 테스트...');
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.waitForTimeout(2000);
  
  console.log('🎉 UI 테스트 시연 완료!');
  
  // 성공 확인
  expect(title).toBeTruthy();
});

test('🔍 요소 탐색 및 상호작용 시연', async ({ page }) => {
  console.log('🔍 요소 탐색 시연 시작...');
  
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  
  // 텍스트 요소들 확인
  const headings = await page.locator('h1, h2, h3, h4, h5, h6').count();
  console.log(`📝 헤딩 요소: ${headings}개`);
  
  // 첫 번째 헤딩 텍스트 확인
  const firstHeading = await page.locator('h1, h2, h3').first();
  if (await firstHeading.count() > 0) {
    const headingText = await firstHeading.textContent();
    console.log(`🏷️ 첫 번째 제목: "${headingText}"`);
  }
  
  // 클릭 가능한 요소들 하이라이트
  console.log('🎯 클릭 가능한 요소들 하이라이트...');
  await page.addStyleTag({
    content: `
      a, button { 
        border: 2px solid red !important; 
        animation: pulse 1s infinite !important;
      }
      @keyframes pulse {
        0% { border-color: red; }
        50% { border-color: blue; }
        100% { border-color: red; }
      }
    `
  });
  
  await page.waitForTimeout(3000);
  
  // 다크모드/라이트모드 전환 시뮬레이션
  console.log('🌙 다크모드 시뮬레이션...');
  await page.addStyleTag({
    content: `
      body { 
        background-color: #1a1a1a !important; 
        color: white !important;
        transition: all 0.5s ease !important;
      }
    `
  });
  
  await page.waitForTimeout(2000);
  
  console.log('☀️ 라이트모드 복원...');
  await page.addStyleTag({
    content: `
      body { 
        background-color: white !important; 
        color: black !important;
        transition: all 0.5s ease !important;
      }
    `
  });
  
  await page.waitForTimeout(2000);
  
  console.log('✨ 요소 탐색 시연 완료!');
});