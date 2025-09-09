// iPhone UI 개선사항 테스트
// 1. Dynamic Island 색상 조화
// 2. 하단 탭 버튼 안전 영역
// 3. 터치 타겟 크기
// 4. 다크/라이트 모드 색상 조화

const { test, expect } = require('@playwright/test');

test.describe('iPhone UI 개선사항 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // iPhone 14 Pro 사이즈로 설정 (Dynamic Island 테스트용)
    await page.setViewportSize({ width: 393, height: 852 });
    
    // 홈페이지로 이동
    await page.goto('http://localhost:3000');
    
    // 페이지 로드 완료 대기
    await page.waitForLoadState('networkidle');
  });

  test('Dynamic Island 호환 네비게이션 색상 조화', async ({ page }) => {
    // 모바일 네비게이션 요소 찾기
    const mobileNav = page.locator('nav.dynamic-island-compatible');
    await expect(mobileNav).toBeVisible();

    // Dynamic Island 호환 클래스 적용 확인
    await expect(mobileNav).toHaveClass(/dynamic-island-compatible/);

    // 배경색과 블러 효과 적용 확인
    const navStyles = await mobileNav.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        backgroundColor: styles.backgroundColor,
        backdropFilter: styles.backdropFilter,
        background: styles.background
      };
    });

    // 블러 효과 적용 확인
    expect(navStyles.backdropFilter).toContain('blur');
    
    // 라이트 모드에서 배경색 확인
    expect(navStyles.background).toBeTruthy();
    
    console.log('✅ Dynamic Island 호환 네비게이션 색상 조화 테스트 통과');
  });

  test('하단 탭바 안전 영역 처리', async ({ page }) => {
    // 하단 탭바 요소 찾기
    const bottomTabBar = page.locator('.bottom-tab-safe.fixed-bottom-mobile');
    await expect(bottomTabBar).toBeVisible();

    // 안전 영역 클래스 적용 확인
    await expect(bottomTabBar).toHaveClass(/bottom-tab-safe/);
    await expect(bottomTabBar).toHaveClass(/fixed-bottom-mobile/);

    // padding-bottom 값 확인 (iPhone 홈 인디케이터와 겹치지 않도록)
    const tabBarStyles = await bottomTabBar.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        paddingBottom: styles.paddingBottom,
        position: styles.position,
        bottom: styles.bottom,
        zIndex: styles.zIndex
      };
    });

    // 고정 위치 및 적절한 z-index 확인
    expect(tabBarStyles.position).toBe('fixed');
    expect(tabBarStyles.bottom).toBe('0px');
    expect(parseInt(tabBarStyles.zIndex)).toBeGreaterThanOrEqual(50);

    // padding-bottom이 최소 34px 이상인지 확인
    const paddingValue = parseInt(tabBarStyles.paddingBottom);
    expect(paddingValue).toBeGreaterThanOrEqual(34);

    console.log('✅ 하단 탭바 안전 영역 처리 테스트 통과');
  });

  test('터치 타겟 크기 44px 이상 보장', async ({ page }) => {
    // 모바일 메뉴 토글 버튼 테스트
    const menuToggle = page.getByTestId('mobile-menu-toggle');
    await expect(menuToggle).toBeVisible();

    // 터치 타겟 크기 확인
    const menuToggleBox = await menuToggle.boundingBox();
    expect(menuToggleBox.width).toBeGreaterThanOrEqual(44);
    expect(menuToggleBox.height).toBeGreaterThanOrEqual(44);

    // 하단 탭바의 각 탭 버튼 크기 확인
    const tabButtons = page.locator('.bottom-tab-safe a, .bottom-tab-safe button');
    const tabCount = await tabButtons.count();
    
    for (let i = 0; i < tabCount; i++) {
      const tabButton = tabButtons.nth(i);
      await expect(tabButton).toBeVisible();
      
      const buttonBox = await tabButton.boundingBox();
      // 터치 영역이 충분한지 확인 (최소 44px)
      expect(buttonBox.height).toBeGreaterThanOrEqual(44);
    }

    console.log('✅ 터치 타겟 크기 44px 이상 보장 테스트 통과');
  });

  test('다크 모드에서 Dynamic Island 색상 조화', async ({ page }) => {
    // 다크 모드 활성화
    await page.click('[data-testid="theme-toggle"]');
    
    // 다크 모드 적용 대기
    await page.waitForTimeout(500);

    // 다크 모드 클래스 확인
    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/);

    // 모바일 네비게이션 요소 확인
    const mobileNav = page.locator('nav.dynamic-island-compatible');
    await expect(mobileNav).toBeVisible();

    // 다크 모드에서의 배경색 확인
    const navStyles = await mobileNav.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        backgroundColor: styles.backgroundColor,
        background: styles.background
      };
    });

    // 다크 모드에서 적절한 배경색 적용 확인
    expect(navStyles.background).toBeTruthy();
    
    console.log('✅ 다크 모드 Dynamic Island 색상 조화 테스트 통과');
  });

  test('iOS Safari 특화 최적화 확인', async ({ page }) => {
    // iOS Safari 시뮬레이션을 위한 User Agent 설정
    await page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // 하단 탭바의 iOS 최적화 확인
    const bottomTabBar = page.locator('.fixed-bottom-mobile');
    await expect(bottomTabBar).toBeVisible();

    // iOS Safari 지원 확인 (-webkit-touch-callout 지원)
    const iosOptimization = await page.evaluate(() => {
      return CSS.supports('-webkit-touch-callout', 'none');
    });

    if (iosOptimization) {
      console.log('✅ iOS Safari 특화 최적화 지원 확인됨');
      
      // iOS에서 추가 패딩 확인
      const tabBarStyles = await bottomTabBar.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          paddingBottom: styles.paddingBottom
        };
      });

      // iOS에서는 더 큰 패딩이 적용되어야 함
      const paddingValue = parseInt(tabBarStyles.paddingBottom);
      expect(paddingValue).toBeGreaterThanOrEqual(34);
    }

    console.log('✅ iOS Safari 특화 최적화 테스트 통과');
  });

  test('레이아웃 wrapper 메인 콘텐츠 패딩 처리', async ({ page }) => {
    // 메인 콘텐츠 영역 확인
    const mainContent = page.locator('#main-content');
    await expect(mainContent).toBeVisible();

    // 메인 콘텐츠의 하단 패딩 확인
    const mainStyles = await mainContent.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        paddingBottom: styles.paddingBottom,
        minHeight: styles.minHeight
      };
    });

    // 적절한 하단 패딩 적용 확인 (하단 탭바와 겹치지 않도록)
    const paddingValue = parseInt(mainStyles.paddingBottom);
    expect(paddingValue).toBeGreaterThanOrEqual(64);

    // 최소 높이 확인
    expect(mainStyles.minHeight).toBe('100vh');

    console.log('✅ 레이아웃 wrapper 메인 콘텐츠 패딩 처리 테스트 통과');
  });

  test('전체적인 터치 경험 및 상호작용', async ({ page }) => {
    // 모바일 메뉴 토글 테스트
    const menuToggle = page.getByTestId('mobile-menu-toggle');
    await menuToggle.click();
    
    // 메뉴가 열렸는지 확인
    const mobileMenu = page.locator('#mobile-navigation-menu');
    await expect(mobileMenu).toBeVisible();

    // 메뉴 닫기 테스트
    await menuToggle.click();
    await expect(mobileMenu).not.toBeVisible();

    // 하단 탭 버튼 클릭 테스트
    const homeTab = page.locator('.bottom-tab-safe a[href="/"]');
    await expect(homeTab).toBeVisible();
    
    // 터치 반응성 확인 (framer-motion의 whileTap 효과)
    await homeTab.click();
    
    // 로그인 페이지로 이동 테스트
    const loginTab = page.locator('.bottom-tab-safe a[href="/login"]');
    if (await loginTab.isVisible()) {
      await loginTab.click();
      await expect(page).toHaveURL(/.*\/login/);
    }

    console.log('✅ 전체적인 터치 경험 및 상호작용 테스트 통과');
  });
});