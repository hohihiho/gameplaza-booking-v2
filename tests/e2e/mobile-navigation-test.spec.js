// 모바일 네비게이션 특화 테스트
const { test, expect } = require('@playwright/test');

test.describe('모바일 네비게이션 테스트', () => {
  test.beforeEach(async ({ page, context }) => {
    // 모바일 환경 시뮬레이션
    await context.addInitScript(() => {
      // 터치 이벤트 지원 추가
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

  test('모바일 네비게이션 표시 및 Dynamic Island 호환성', async ({ page }) => {
    // 페이지가 모바일로 인식되었는지 확인
    const isMobileView = await page.evaluate(() => window.innerWidth < 768);
    console.log('모바일 뷰 감지:', isMobileView);

    // 모든 nav 요소 확인
    const allNavs = await page.locator('nav').all();
    console.log(`전체 nav 요소 개수: ${allNavs.length}`);

    for (let i = 0; i < allNavs.length; i++) {
      const nav = allNavs[i];
      const isVisible = await nav.isVisible();
      const className = await nav.getAttribute('class');
      const role = await nav.getAttribute('role');
      
      console.log(`nav ${i + 1}:`);
      console.log(`  - visible: ${isVisible}`);
      console.log(`  - class: "${className}"`);
      console.log(`  - role: "${role}"`);

      // Dynamic Island 호환 네비게이션 찾기
      if (className && className.includes('dynamic-island-compatible')) {
        console.log('  ✅ Dynamic Island 호환 네비게이션 발견!');
        
        if (isVisible) {
          const styles = await nav.evaluate((el) => {
            const computedStyle = window.getComputedStyle(el);
            return {
              backgroundColor: computedStyle.backgroundColor,
              backdropFilter: computedStyle.backdropFilter || computedStyle.webkitBackdropFilter,
              position: computedStyle.position,
              top: computedStyle.top,
              zIndex: computedStyle.zIndex
            };
          });
          console.log('  - 스타일:', styles);
        }
      }

      // 모바일 네비게이션인지 확인
      if (className && (className.includes('md:hidden') || className.includes('mobile'))) {
        console.log('  📱 모바일 네비게이션으로 추정');
      }
    }

    // 모바일에서만 표시되는 요소들 확인
    const mobileOnlyElements = await page.locator('.md\\:hidden').all();
    console.log(`모바일 전용 요소 개수: ${mobileOnlyElements.length}`);

    // 데스크톱에서만 표시되는 요소들 확인
    const desktopOnlyElements = await page.locator('.hidden.md\\:block').all();
    console.log(`데스크톱 전용 요소 개수: ${desktopOnlyElements.length}`);
  });

  test('하단 탭바 안전 영역 및 스타일 검증', async ({ page }) => {
    // 하단 탭바 관련 요소들 모두 찾기
    const bottomElements = await page.locator('[class*="bottom-tab"], [class*="fixed-bottom"]').all();
    
    console.log(`하단 관련 요소 개수: ${bottomElements.length}`);

    for (let i = 0; i < bottomElements.length; i++) {
      const elem = bottomElements[i];
      const isVisible = await elem.isVisible();
      
      if (isVisible) {
        const className = await elem.getAttribute('class');
        const tagName = await elem.evaluate(el => el.tagName);
        const styles = await elem.evaluate((el) => {
          const computedStyle = window.getComputedStyle(el);
          return {
            paddingBottom: computedStyle.paddingBottom,
            position: computedStyle.position,
            bottom: computedStyle.bottom,
            left: computedStyle.left,
            right: computedStyle.right,
            zIndex: computedStyle.zIndex,
            background: computedStyle.background,
            backdropFilter: computedStyle.backdropFilter || computedStyle.webkitBackdropFilter
          };
        });

        console.log(`${tagName.toLowerCase()} ${i + 1}:`);
        console.log(`  - class: "${className}"`);
        console.log(`  - styles:`, styles);

        // CSS에서 정의한 클래스들이 적용되었는지 확인
        if (className) {
          const hasBottomTabSafe = className.includes('bottom-tab-safe');
          const hasFixedBottomMobile = className.includes('fixed-bottom-mobile');
          
          console.log(`  - bottom-tab-safe 클래스: ${hasBottomTabSafe}`);
          console.log(`  - fixed-bottom-mobile 클래스: ${hasFixedBottomMobile}`);

          if (hasBottomTabSafe || hasFixedBottomMobile) {
            console.log('  ✅ iPhone 최적화 클래스 적용됨');
            
            // padding-bottom 값 분석
            const paddingValue = parseInt(styles.paddingBottom);
            console.log(`  - padding-bottom 값: ${paddingValue}px`);
            
            if (paddingValue >= 20) {
              console.log('  ✅ 적절한 안전 영역 확보됨');
            } else {
              console.log('  ⚠️ 안전 영역 부족할 수 있음');
            }
          }
        }
      }
    }
  });

  test('CSS 클래스 정의 및 적용 상태', async ({ page }) => {
    // CSS 변수와 클래스가 올바르게 로드되었는지 확인
    const cssSupport = await page.evaluate(() => {
      // CSS 지원 테스트
      const tests = {
        safeAreaInset: CSS.supports('padding-bottom', 'env(safe-area-inset-bottom)'),
        backdropFilter: CSS.supports('backdrop-filter', 'blur(10px)'),
        webkitBackdrop: CSS.supports('-webkit-backdrop-filter', 'blur(10px)'),
        webkitTouch: CSS.supports('-webkit-touch-callout', 'none'),
        maxFunction: CSS.supports('padding', 'max(10px, 20px)')
      };

      // 클래스 존재 여부 확인
      const stylesheets = Array.from(document.styleSheets);
      const hasCustomClasses = stylesheets.some(sheet => {
        try {
          const rules = Array.from(sheet.cssRules || sheet.rules || []);
          return rules.some(rule => 
            rule.selectorText && (
              rule.selectorText.includes('dynamic-island') ||
              rule.selectorText.includes('bottom-tab-safe') ||
              rule.selectorText.includes('fixed-bottom-mobile')
            )
          );
        } catch (e) {
          return false;
        }
      });

      return { tests, hasCustomClasses };
    });

    console.log('CSS 지원 상태:', cssSupport.tests);
    console.log('커스텀 클래스 존재:', cssSupport.hasCustomClasses);

    // env() 함수 테스트
    const envSupport = await page.evaluate(() => {
      const testElement = document.createElement('div');
      testElement.style.paddingBottom = 'env(safe-area-inset-bottom, 20px)';
      document.body.appendChild(testElement);
      
      const computedStyle = window.getComputedStyle(testElement);
      const paddingBottom = computedStyle.paddingBottom;
      
      document.body.removeChild(testElement);
      return paddingBottom;
    });

    console.log('env(safe-area-inset-bottom) 테스트 결과:', envSupport);
  });

  test('실제 터치 이벤트 및 상호작용', async ({ page }) => {
    // 터치 가능한 요소들 찾기
    const touchableElements = await page.locator('button, a, [role="button"]').all();
    console.log(`터치 가능한 요소 개수: ${touchableElements.length}`);

    let validTouchTargets = 0;
    
    for (let i = 0; i < Math.min(touchableElements.length, 10); i++) { // 처음 10개만 테스트
      const elem = touchableElements[i];
      const isVisible = await elem.isVisible();
      
      if (isVisible) {
        const box = await elem.boundingBox();
        if (box) {
          const isValidSize = box.width >= 44 && box.height >= 44;
          if (isValidSize) validTouchTargets++;
          
          const className = await elem.getAttribute('class');
          const tagName = await elem.evaluate(el => el.tagName);
          
          console.log(`${tagName} ${i + 1}: ${box.width.toFixed(1)}x${box.height.toFixed(1)}px ${isValidSize ? '✅' : '❌'}`);
          console.log(`  class: "${className?.substring(0, 50)}..."`);
        }
      }
    }

    console.log(`유효한 터치 타겟: ${validTouchTargets}/${Math.min(touchableElements.length, 10)}`);
  });
});