// DOM 구조 검사를 위한 테스트
const { test, expect } = require('@playwright/test');

test.describe('DOM 구조 검사', () => {
  test('실제 DOM 구조 및 클래스 확인', async ({ page }) => {
    // iPhone 14 Pro 뷰포트로 설정
    await page.setViewportSize({ width: 393, height: 852 });
    
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // 페이지 전체 DOM 구조 출력
    const bodyContent = await page.locator('body').innerHTML();
    console.log('=== 페이지 DOM 구조 (일부) ===');
    
    // 네비게이션 요소들 확인
    const navElements = await page.locator('nav').all();
    console.log(`네비게이션 요소 개수: ${navElements.length}`);
    
    for (let i = 0; i < navElements.length; i++) {
      const nav = navElements[i];
      const className = await nav.getAttribute('class');
      const isVisible = await nav.isVisible();
      console.log(`nav ${i}: visible=${isVisible}, class="${className}"`);
      
      if (className && className.includes('dynamic-island')) {
        console.log('✅ Dynamic Island 호환 네비게이션 발견!');
      }
    }

    // 하단 탭바 관련 요소들 확인
    const bottomElements = await page.locator('[class*="bottom"]').all();
    console.log(`하단 관련 요소 개수: ${bottomElements.length}`);
    
    for (let i = 0; i < bottomElements.length; i++) {
      const elem = bottomElements[i];
      const className = await elem.getAttribute('class');
      const tagName = await elem.evaluate(el => el.tagName);
      const isVisible = await elem.isVisible();
      console.log(`${tagName.toLowerCase()} ${i}: visible=${isVisible}, class="${className}"`);
    }

    // 모든 버튼 요소 확인 (터치 타겟 테스트용)
    const buttons = await page.locator('button').all();
    console.log(`버튼 요소 개수: ${buttons.length}`);
    
    for (let i = 0; i < Math.min(buttons.length, 5); i++) { // 처음 5개만
      const button = buttons[i];
      const isVisible = await button.isVisible();
      if (isVisible) {
        const box = await button.boundingBox();
        const testId = await button.getAttribute('data-testid');
        const className = await button.getAttribute('class');
        console.log(`button ${i}: ${box?.width}x${box?.height}px, testid="${testId}", class="${className?.split(' ')[0]}"`);
      }
    }

    // 특정 클래스들의 실제 적용 상태 확인
    const classesToCheck = [
      'dynamic-island-compatible',
      'bottom-tab-safe', 
      'fixed-bottom-mobile',
      'touch-target'
    ];

    for (const className of classesToCheck) {
      const elements = await page.locator(`.${className}`).all();
      console.log(`클래스 "${className}": ${elements.length}개 요소`);
      
      if (elements.length > 0) {
        const firstElement = elements[0];
        const isVisible = await firstElement.isVisible();
        const styles = await firstElement.evaluate((el) => {
          const computedStyle = window.getComputedStyle(el);
          return {
            paddingBottom: computedStyle.paddingBottom,
            position: computedStyle.position,
            backgroundColor: computedStyle.backgroundColor,
            backdropFilter: computedStyle.backdropFilter
          };
        });
        console.log(`   첫 번째 요소 - visible: ${isVisible}, styles:`, styles);
      }
    }

    // 스크린샷 촬영
    await page.screenshot({ 
      path: 'test-results/dom-inspection-mobile.png',
      fullPage: true
    });
    
    console.log('✅ DOM 구조 검사 완료');
  });
});