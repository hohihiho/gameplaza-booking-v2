// iPhone UI 개선사항 최종 통합 테스트
const { test, expect } = require('@playwright/test');

test.describe('iPhone UI 개선사항 최종 검증', () => {
  test.beforeEach(async ({ page, context }) => {
    // 모바일 환경 시뮬레이션
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'maxTouchPoints', {
        writable: false,
        value: 5,
      });
    });

    // iPhone 14 Pro 뷰포트 설정
    await page.setViewportSize({ width: 393, height: 852 });
    
    // iOS Safari User Agent 설정
    await page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    });

    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  test('🎯 iPhone UI 개선사항 종합 검증', async ({ page }) => {
    console.log('📱 iPhone UI 개선사항 최종 검증 시작...');

    // 1. Dynamic Island 호환 네비게이션 검증
    const dynamicIslandNav = page.locator('nav.dynamic-island-compatible');
    await expect(dynamicIslandNav).toBeVisible();
    
    const navStyles = await dynamicIslandNav.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        backgroundColor: styles.backgroundColor,
        backdropFilter: styles.backdropFilter,
        position: styles.position,
        zIndex: styles.zIndex
      };
    });

    // Dynamic Island 호환성 확인
    expect(navStyles.position).toBe('sticky');
    expect(navStyles.backdropFilter).toContain('blur');
    expect(parseInt(navStyles.zIndex)).toBeGreaterThanOrEqual(50);
    console.log('✅ Dynamic Island 호환 네비게이션 검증 완료');

    // 2. 하단 탭바 안전 영역 검증
    const bottomTabBar = page.locator('.bottom-tab-safe.fixed-bottom-mobile');
    await expect(bottomTabBar).toBeVisible();

    const tabBarStyles = await bottomTabBar.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        paddingBottom: styles.paddingBottom,
        position: styles.position,
        bottom: styles.bottom,
        zIndex: styles.zIndex
      };
    });

    // iPhone 안전 영역 확인
    expect(tabBarStyles.position).toBe('fixed');
    expect(tabBarStyles.bottom).toBe('0px');
    expect(parseInt(tabBarStyles.paddingBottom)).toBeGreaterThanOrEqual(34);
    expect(parseInt(tabBarStyles.zIndex)).toBeGreaterThanOrEqual(50);
    console.log('✅ 하단 탭바 안전 영역 검증 완료 (padding-bottom:', tabBarStyles.paddingBottom, ')');

    // 3. 터치 타겟 크기 검증 (주요 버튼들)
    const themeToggle = page.getByTestId('theme-toggle');
    await expect(themeToggle).toBeVisible();
    
    const themeToggleBox = await themeToggle.boundingBox();
    expect(themeToggleBox.width).toBeGreaterThanOrEqual(44);
    expect(themeToggleBox.height).toBeGreaterThanOrEqual(44);
    console.log('✅ ThemeToggle 터치 타겟 크기 검증 완료 (', themeToggleBox.width, 'x', themeToggleBox.height, 'px)');

    const mobileMenuToggle = page.getByTestId('mobile-menu-toggle');
    await expect(mobileMenuToggle).toBeVisible();
    
    const menuToggleBox = await mobileMenuToggle.boundingBox();
    expect(menuToggleBox.width).toBeGreaterThanOrEqual(44);
    expect(menuToggleBox.height).toBeGreaterThanOrEqual(44);
    console.log('✅ 모바일 메뉴 토글 터치 타겟 크기 검증 완료 (', menuToggleBox.width, 'x', menuToggleBox.height, 'px)');

    // 4. CSS 클래스 적용 확인
    const cssClassTest = await page.evaluate(() => {
      // 각 CSS 클래스의 적용 상태 확인
      const results = {
        dynamicIslandElements: document.querySelectorAll('.dynamic-island-compatible').length,
        bottomTabSafeElements: document.querySelectorAll('.bottom-tab-safe').length,
        fixedBottomMobileElements: document.querySelectorAll('.fixed-bottom-mobile').length,
        touchTargetElements: document.querySelectorAll('.touch-target').length
      };
      
      // CSS 지원 확인
      results.cssSupport = {
        safeAreaInset: CSS.supports('padding-bottom', 'env(safe-area-inset-bottom)'),
        backdropFilter: CSS.supports('backdrop-filter', 'blur(10px)'),
        maxFunction: CSS.supports('padding', 'max(10px, 20px)')
      };

      return results;
    });

    // CSS 클래스와 기능 지원 확인
    expect(cssClassTest.dynamicIslandElements).toBeGreaterThan(0);
    expect(cssClassTest.bottomTabSafeElements).toBeGreaterThan(0);
    expect(cssClassTest.fixedBottomMobileElements).toBeGreaterThan(0);
    expect(cssClassTest.cssSupport.safeAreaInset).toBe(true);
    expect(cssClassTest.cssSupport.backdropFilter).toBe(true);
    expect(cssClassTest.cssSupport.maxFunction).toBe(true);
    console.log('✅ CSS 클래스 및 기능 지원 검증 완료:', cssClassTest);

    // 5. 실제 상호작용 테스트
    // 모바일 메뉴 토글 테스트
    await mobileMenuToggle.click();
    const mobileMenu = page.locator('#mobile-navigation-menu');
    await expect(mobileMenu).toBeVisible();
    console.log('✅ 모바일 메뉴 열기 상호작용 검증 완료');

    await mobileMenuToggle.click();
    await expect(mobileMenu).not.toBeVisible();
    console.log('✅ 모바일 메뉴 닫기 상호작용 검증 완료');

    // 테마 토글 테스트
    const htmlElement = page.locator('html');
    const initialTheme = await htmlElement.getAttribute('class');
    
    await themeToggle.click();
    await page.waitForTimeout(500); // 테마 변경 애니메이션 대기
    
    const newTheme = await htmlElement.getAttribute('class');
    expect(newTheme).not.toBe(initialTheme);
    console.log('✅ 테마 토글 상호작용 검증 완료');

    // 6. 접근성 검증
    const accessibilityCheck = await page.evaluate(() => {
      const themeButton = document.querySelector('[data-testid="theme-toggle"]');
      const menuButton = document.querySelector('[data-testid="mobile-menu-toggle"]');
      
      return {
        themeButtonAccessible: !!(themeButton?.getAttribute('aria-label')),
        menuButtonAccessible: !!(menuButton?.getAttribute('aria-label') && 
                                menuButton?.getAttribute('aria-expanded') && 
                                menuButton?.getAttribute('aria-controls')),
        focusManagement: document.activeElement !== null
      };
    });

    expect(accessibilityCheck.themeButtonAccessible).toBe(true);
    expect(accessibilityCheck.menuButtonAccessible).toBe(true);
    console.log('✅ 접근성 검증 완료');

    // 스크린샷 촬영 (검증용)
    await page.screenshot({ 
      path: 'test-results/iphone-ui-final-verification.png',
      fullPage: false 
    });

    console.log('🎉 iPhone UI 개선사항 최종 검증 완료!');
  });

  test('📊 성능 및 렌더링 검증', async ({ page }) => {
    // 페이지 로딩 성능 측정
    const startTime = Date.now();
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    const loadTime = Date.now() - startTime;
    
    console.log(`⏱️ 페이지 로딩 시간: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(5000); // 5초 이내 로딩

    // 중요 요소들의 렌더링 시간 측정
    const renderingMetrics = await page.evaluate(() => {
      const nav = document.querySelector('nav.dynamic-island-compatible');
      const bottomTab = document.querySelector('.bottom-tab-safe');
      const themeToggle = document.querySelector('[data-testid="theme-toggle"]');
      
      return {
        navigationVisible: nav ? nav.offsetHeight > 0 : false,
        bottomTabVisible: bottomTab ? bottomTab.offsetHeight > 0 : false,
        themeToggleVisible: themeToggle ? themeToggle.offsetHeight > 0 : false,
        timestamp: Date.now()
      };
    });

    expect(renderingMetrics.navigationVisible).toBe(true);
    expect(renderingMetrics.bottomTabVisible).toBe(true);
    expect(renderingMetrics.themeToggleVisible).toBe(true);
    
    console.log('✅ 렌더링 성능 검증 완료');
  });
});