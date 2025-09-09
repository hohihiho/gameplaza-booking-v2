import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

test.describe('성능 테스트', () => {
  test('홈페이지 로딩 성능', async ({ page }) => {
    await page.goto('/');
    
    const metrics = await TestHelpers.measurePerformance(page);
    
    // 성능 기준값 검증
    expect(metrics.domContentLoaded).toBeLessThan(1000); // 1초 이내
    expect(metrics.firstContentfulPaint).toBeLessThan(1500); // 1.5초 이내
    expect(metrics.loadComplete).toBeLessThan(3000); // 3초 이내
    
    console.log('Performance Metrics:', metrics);
  });

  test('예약 페이지 로딩 성능', async ({ page }) => {
    await TestHelpers.login(page);
    await page.goto('/reservations/new');
    
    const metrics = await TestHelpers.measurePerformance(page);
    
    expect(metrics.domContentLoaded).toBeLessThan(1500);
    expect(metrics.firstContentfulPaint).toBeLessThan(2000);
  });

  test('3G 네트워크 시뮬레이션', async ({ page, browser }) => {
    // 3G 네트워크 조건 설정
    const context = await browser.newContext();
    const cdp = await context.newCDPSession(await context.newPage());
    
    await cdp.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: 750 * 1024 / 8, // 750kb/s
      uploadThroughput: 250 * 1024 / 8,   // 250kb/s
      latency: 100 // 100ms 지연
    });
    
    const page3G = await context.newPage();
    const startTime = Date.now();
    await page3G.goto('/');
    const loadTime = Date.now() - startTime;
    
    // 3G에서도 5초 이내 로드
    expect(loadTime).toBeLessThan(5000);
    
    await context.close();
  });

  test('이미지 최적화 확인', async ({ page }) => {
    await page.goto('/');
    
    // 모든 이미지 요소 찾기
    const images = await page.$$('img');
    
    for (const img of images) {
      const src = await img.getAttribute('src');
      if (src) {
        // 이미지 로딩 확인
        const isLoaded = await img.evaluate((el) => {
          return (el as HTMLImageElement).complete && (el as HTMLImageElement).naturalHeight !== 0;
        });
        expect(isLoaded).toBeTruthy();
        
        // lazy loading 속성 확인
        const loading = await img.getAttribute('loading');
        expect(loading).toBe('lazy');
      }
    }
  });

  test('번들 크기 모니터링', async ({ page }) => {
    const resourceSizes: { [key: string]: number } = {};
    
    page.on('response', response => {
      const url = response.url();
      const size = response.headers()['content-length'];
      
      if (size && (url.includes('.js') || url.includes('.css'))) {
        const fileName = url.split('/').pop() || 'unknown';
        resourceSizes[fileName] = parseInt(size);
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // 번들 크기 검증
    const totalSize = Object.values(resourceSizes).reduce((sum, size) => sum + size, 0);
    const totalSizeMB = totalSize / (1024 * 1024);
    
    console.log('Bundle Sizes:', resourceSizes);
    console.log(`Total Size: ${totalSizeMB.toFixed(2)} MB`);
    
    // 전체 번들 크기가 2MB 미만
    expect(totalSizeMB).toBeLessThan(2);
  });
});