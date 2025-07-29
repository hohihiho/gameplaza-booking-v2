/**
 * 🟡 MEDIUM RISK: 캐싱 및 성능 최적화 테스트
 * 
 * 리스크 레벨: 6/10 (Medium-High)
 * 
 * 테스트 범위:
 * 1. 브라우저 캐싱 전략 검증
 * 2. API 응답 캐싱 최적화
 * 3. 이미지 및 정적 자원 최적화
 * 4. Service Worker 캐싱 동작
 * 5. 메모리 사용량 모니터링
 * 6. 번들 크기 및 로딩 최적화
 * 7. 3G 환경 성능 시뮬레이션
 */

import { test, expect } from '@playwright/test';

test.describe('🟡 MEDIUM RISK: 캐싱 및 성능 최적화', () => {

  test('🎯 Performance #1: 브라우저 캐싱 전략 검증', async ({ page }) => {
    console.log('🗄️ 브라우저 캐싱 전략 검증 시작...');
    
    // 1. 첫 번째 방문 - 모든 리소스 다운로드
    console.log('1️⃣ 첫 번째 방문 - 리소스 다운로드...');
    
    const networkRequests = [];
    page.on('response', response => {
      networkRequests.push({
        url: response.url(),
        status: response.status(),
        headers: response.headers(),
        fromCache: response.fromServiceWorker() || response.status() === 304
      });
    });
    
    const firstLoadStart = Date.now();
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    const firstLoadTime = Date.now() - firstLoadStart;
    
    console.log(`⏱️ 첫 번째 로딩 시간: ${firstLoadTime}ms`);
    console.log(`📊 첫 번째 방문 요청 수: ${networkRequests.length}개`);
    
    // 캐시 가능한 리소스들 확인
    const cacheableResources = networkRequests.filter(req => {
      const url = req.url;
      return url.includes('.js') || url.includes('.css') || 
             url.includes('.png') || url.includes('.jpg') || 
             url.includes('.svg') || url.includes('.ico');
    });
    
    console.log(`🎯 캐시 가능한 리소스: ${cacheableResources.length}개`);
    
    // 캐시 헤더 확인
    const resourcesWithCacheHeaders = cacheableResources.filter(res => {
      return res.headers['cache-control'] || res.headers['etag'] || res.headers['last-modified'];
    });
    
    console.log(`🗄️ 캐시 헤더 있는 리소스: ${resourcesWithCacheHeaders.length}개`);
    
    // 2. 페이지 새로고침 - 캐시 활용 확인
    console.log('2️⃣ 페이지 새로고침 - 캐시 활용 확인...');
    
    const secondLoadRequests = [];
    page.on('response', response => {
      secondLoadRequests.push({
        url: response.url(),
        status: response.status(),
        fromCache: response.fromServiceWorker() || response.status() === 304
      });
    });
    
    const secondLoadStart = Date.now();
    await page.reload();
    await page.waitForLoadState('networkidle');
    const secondLoadTime = Date.now() - secondLoadStart;
    
    console.log(`⏱️ 두 번째 로딩 시간: ${secondLoadTime}ms`);
    
    // 캐시 효과 분석
    const cachedRequests = secondLoadRequests.filter(req => req.fromCache || req.status === 304);
    const cacheHitRatio = (cachedRequests.length / secondLoadRequests.length) * 100;
    
    console.log(`📈 캐시 히트율: ${cacheHitRatio.toFixed(1)}%`);
    console.log(`🚀 로딩 시간 개선: ${((firstLoadTime - secondLoadTime) / firstLoadTime * 100).toFixed(1)}%`);
    
    // 성능 기준 검증
    if (secondLoadTime < firstLoadTime * 0.7) {
      console.log('✅ 캐싱 효과가 우수함 (30% 이상 개선)');
    } else if (secondLoadTime < firstLoadTime * 0.9) {
      console.log('👍 캐싱 효과가 양호함 (10% 이상 개선)');
    } else {
      console.log('⚠️ 캐싱 효과 미흡 - 최적화 필요');
    }
    
    console.log('✅ 브라우저 캐싱 전략 검증 완료!');
  });

  test('🎯 Performance #2: API 응답 캐싱 최적화', async ({ page }) => {
    console.log('🌐 API 응답 캐싱 최적화 테스트 시작...');
    
    // 1. API 응답 시간 측정
    console.log('1️⃣ 기본 API 응답 시간 측정...');
    
    const apiEndpoints = [
      '/api/v2/devices',
      '/api/v2/time-slots',
      '/api/v2/reservations'
    ];
    
    const apiPerformance = [];
    
    for (const endpoint of apiEndpoints) {
      const measurements = [];
      
      // 각 API를 3번씩 호출하여 평균 측정
      for (let i = 0; i < 3; i++) {
        const result = await page.evaluate(async (url) => {
          const start = performance.now();
          try {
            const response = await fetch(url);
            const end = performance.now();
            return {
              success: true,
              responseTime: end - start,
              status: response.status,
              headers: Object.fromEntries(response.headers.entries())
            };
          } catch (error) {
            const end = performance.now();
            return {
              success: false,
              responseTime: end - start,
              error: error.message
            };
          }
        }, endpoint);
        
        measurements.push(result);
      }
      
      const avgResponseTime = measurements.reduce((sum, m) => sum + m.responseTime, 0) / measurements.length;
      const successRate = measurements.filter(m => m.success).length / measurements.length;
      
      apiPerformance.push({
        endpoint,
        avgResponseTime: avgResponseTime.toFixed(2),
        successRate: (successRate * 100).toFixed(1),
        cacheHeaders: measurements[0].headers ? {
          cacheControl: measurements[0].headers['cache-control'],
          etag: measurements[0].headers['etag'],
          lastModified: measurements[0].headers['last-modified']
        } : null
      });
      
      console.log(`🌐 ${endpoint}: ${avgResponseTime.toFixed(2)}ms (성공률: ${(successRate * 100).toFixed(1)}%)`);
    }
    
    // 2. 캐시 헤더 분석
    console.log('2️⃣ API 캐시 헤더 분석...');
    
    apiPerformance.forEach(api => {
      if (api.cacheHeaders) {
        console.log(`📋 ${api.endpoint} 캐시 헤더:`);
        if (api.cacheHeaders.cacheControl) {
          console.log(`   Cache-Control: ${api.cacheHeaders.cacheControl}`);
        }
        if (api.cacheHeaders.etag) {
          console.log(`   ETag: ${api.cacheHeaders.etag}`);
        }
        if (api.cacheHeaders.lastModified) {
          console.log(`   Last-Modified: ${api.cacheHeaders.lastModified}`);
        }
        
        // 캐시 정책 평가
        if (api.cacheHeaders.cacheControl) {
          if (api.cacheHeaders.cacheControl.includes('no-cache') || 
              api.cacheHeaders.cacheControl.includes('no-store')) {
            console.log('   ⚠️ 캐시 비활성화됨');
          } else if (api.cacheHeaders.cacheControl.includes('max-age')) {
            console.log('   ✅ 캐시 유효기간 설정됨');
          }
        }
      } else {
        console.log(`⚠️ ${api.endpoint}: 캐시 헤더 없음`);
      }
    });
    
    // 3. 성능 기준 평가
    console.log('3️⃣ API 성능 기준 평가...');
    
    const fastApis = apiPerformance.filter(api => parseFloat(api.avgResponseTime) < 100);
    const slowApis = apiPerformance.filter(api => parseFloat(api.avgResponseTime) > 500);
    
    console.log(`🚀 빠른 API (100ms 미만): ${fastApis.length}개`);
    console.log(`🐌 느린 API (500ms 초과): ${slowApis.length}개`);
    
    if (slowApis.length > 0) {
      console.log('⚠️ 느린 API 목록:');
      slowApis.forEach(api => {
        console.log(`   - ${api.endpoint}: ${api.avgResponseTime}ms`);
      });
    }
    
    console.log('✅ API 응답 캐싱 최적화 테스트 완료!');
  });

  test('🎯 Performance #3: 정적 자원 최적화 검증', async ({ page }) => {
    console.log('🖼️ 정적 자원 최적화 검증 시작...');
    
    // 1. 모든 네트워크 요청 모니터링
    console.log('1️⃣ 정적 자원 로딩 모니터링...');
    
    const staticResources = [];
    
    page.on('response', response => {
      const url = response.url();
      const contentType = response.headers()['content-type'] || '';
      
      // 정적 자원 필터링
      if (url.includes('.js') || url.includes('.css') || 
          url.includes('.png') || url.includes('.jpg') || 
          url.includes('.svg') || url.includes('.ico') ||
          contentType.includes('image/') || 
          contentType.includes('text/css') ||
          contentType.includes('application/javascript')) {
        
        staticResources.push({
          url,
          contentType,
          status: response.status(),
          contentLength: response.headers()['content-length'],
          cacheControl: response.headers()['cache-control'],
          compression: response.headers()['content-encoding']
        });
      }
    });
    
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    console.log(`📊 로드된 정적 자원: ${staticResources.length}개`);
    
    // 2. 리소스 타입별 분석
    console.log('2️⃣ 리소스 타입별 분석...');
    
    const resourcesByType = {
      javascript: staticResources.filter(r => r.url.includes('.js') || r.contentType.includes('javascript')),
      css: staticResources.filter(r => r.url.includes('.css') || r.contentType.includes('css')),
      images: staticResources.filter(r => r.url.includes('.png') || r.url.includes('.jpg') || r.url.includes('.svg') || r.contentType.includes('image')),
      fonts: staticResources.filter(r => r.url.includes('.woff') || r.url.includes('.ttf') || r.contentType.includes('font')),
      other: staticResources.filter(r => !r.url.includes('.js') && !r.url.includes('.css') && !r.contentType.includes('image') && !r.contentType.includes('font'))
    };
    
    Object.entries(resourcesByType).forEach(([type, resources]) => {
      if (resources.length > 0) {
        const totalSize = resources.reduce((sum, r) => {
          const size = parseInt(r.contentLength) || 0;
          return sum + size;
        }, 0);
        
        const compressed = resources.filter(r => r.compression).length;
        const cached = resources.filter(r => r.cacheControl && !r.cacheControl.includes('no-cache')).length;
        
        console.log(`📁 ${type.toUpperCase()}: ${resources.length}개`);
        console.log(`   크기: ${(totalSize / 1024).toFixed(1)}KB`);
        console.log(`   압축: ${compressed}/${resources.length} (${(compressed/resources.length*100).toFixed(1)}%)`);
        console.log(`   캐시: ${cached}/${resources.length} (${(cached/resources.length*100).toFixed(1)}%)`);
      }
    });
    
    // 3. 압축 최적화 확인
    console.log('3️⃣ 압축 최적화 확인...');
    
    const compressibleResources = staticResources.filter(r => 
      r.contentType.includes('javascript') || 
      r.contentType.includes('css') || 
      r.contentType.includes('html') ||
      r.contentType.includes('json')
    );
    
    const compressedResources = compressibleResources.filter(r => 
      r.compression === 'gzip' || r.compression === 'br' || r.compression === 'deflate'
    );
    
    const compressionRatio = compressedResources.length / compressibleResources.length;
    
    console.log(`🗜️ 압축 가능한 리소스: ${compressibleResources.length}개`);
    console.log(`✅ 압축된 리소스: ${compressedResources.length}개`);
    console.log(`📈 압축률: ${(compressionRatio * 100).toFixed(1)}%`);
    
    if (compressionRatio > 0.8) {
      console.log('✅ 압축 최적화 우수');
    } else if (compressionRatio > 0.5) {
      console.log('👍 압축 최적화 양호');
    } else {
      console.log('⚠️ 압축 최적화 개선 필요');
    }
    
    // 4. 큰 파일 식별
    console.log('4️⃣ 큰 파일 식별...');
    
    const largeFiles = staticResources
      .filter(r => r.contentLength && parseInt(r.contentLength) > 100000) // 100KB 이상
      .sort((a, b) => parseInt(b.contentLength) - parseInt(a.contentLength));
    
    if (largeFiles.length > 0) {
      console.log(`📦 큰 파일 (100KB 이상): ${largeFiles.length}개`);
      largeFiles.slice(0, 5).forEach(file => {
        const sizeKB = (parseInt(file.contentLength) / 1024).toFixed(1);
        console.log(`   - ${file.url.split('/').pop()}: ${sizeKB}KB ${file.compression ? '(압축됨)' : '(미압축)'}`);
      });
    } else {
      console.log('✅ 큰 파일 없음 (모든 파일이 100KB 미만)');
    }
    
    console.log('✅ 정적 자원 최적화 검증 완료!');
  });

  test('🎯 Performance #4: Service Worker 캐싱 동작', async ({ page }) => {
    console.log('⚙️ Service Worker 캐싱 동작 테스트 시작...');
    
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // 1. Service Worker 등록 확인
    console.log('1️⃣ Service Worker 등록 확인...');
    
    const swRegistration = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          return {
            exists: !!registration,
            state: registration?.active?.state,
            scope: registration?.scope,
            scriptURL: registration?.active?.scriptURL
          };
        } catch (error) {
          return { exists: false, error: error.message };
        }
      }
      return { exists: false, reason: 'Service Worker not supported' };
    });
    
    console.log(`🔧 Service Worker 등록 상태: ${swRegistration.exists ? '등록됨' : '미등록'}`);
    
    if (swRegistration.exists) {
      console.log(`   상태: ${swRegistration.state}`);
      console.log(`   범위: ${swRegistration.scope}`);
      console.log(`   스크립트: ${swRegistration.scriptURL?.split('/').pop()}`);
    }
    
    // 2. 캐시 저장소 확인
    console.log('2️⃣ 캐시 저장소 확인...');
    
    const cacheInfo = await page.evaluate(async () => {
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          const cacheDetails = [];
          
          for (const cacheName of cacheNames) {
            const cache = await caches.open(cacheName);
            const keys = await cache.keys();
            cacheDetails.push({
              name: cacheName,
              itemCount: keys.length,
              urls: keys.slice(0, 5).map(req => req.url) // 처음 5개만
            });
          }
          
          return { success: true, caches: cacheDetails };
        } catch (error) {
          return { success: false, error: error.message };
        }
      }
      return { success: false, reason: 'Cache API not supported' };
    });
    
    if (cacheInfo.success && cacheInfo.caches.length > 0) {
      console.log(`🗄️ 캐시 저장소: ${cacheInfo.caches.length}개`);
      cacheInfo.caches.forEach(cache => {
        console.log(`   - ${cache.name}: ${cache.itemCount}개 항목`);
      });
    } else {
      console.log(`⚠️ 캐시 저장소 없음: ${cacheInfo.error || cacheInfo.reason}`);
    }
    
    // 3. 오프라인 기능 테스트
    console.log('3️⃣ 오프라인 기능 테스트...');
    
    if (swRegistration.exists) {
      try {
        // 오프라인 모드로 전환
        await page.context().setOffline(true);
        
        // 페이지 새로고침 시도
        await page.reload();
        await page.waitForLoadState('networkidle', { timeout: 10000 });
        
        // 페이지가 로드되었는지 확인
        const offlineContent = await page.textContent('body');
        const hasOfflineContent = offlineContent && offlineContent.length > 100;
        
        console.log(`📱 오프라인 로딩: ${hasOfflineContent ? '성공' : '실패'}`);
        
        // 온라인 모드로 복구
        await page.context().setOffline(false);
        
        if (hasOfflineContent) {
          console.log('✅ Service Worker 오프라인 캐싱 정상 동작');
        } else {
          console.log('⚠️ Service Worker 오프라인 캐싱 미작동');
        }
        
      } catch (error) {
        console.log(`⚠️ 오프라인 테스트 오류: ${error.message}`);
        await page.context().setOffline(false);
      }
    } else {
      console.log('ℹ️ Service Worker 미등록으로 오프라인 테스트 생략');
    }
    
    // 4. PWA 캐싱 전략 확인
    console.log('4️⃣ PWA 캐싱 전략 확인...');
    
    const pwaCaching = await page.evaluate(async () => {
      // manifest.json 확인
      const manifestLink = document.querySelector('link[rel="manifest"]');
      
      // 캐시 전략 추정
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        return {
          hasManifest: !!manifestLink,
          manifestHref: manifestLink?.href,
          hasServiceWorker: !!registration,
          isPWA: !!manifestLink && !!registration
        };
      }
      
      return {
        hasManifest: !!manifestLink,
        manifestHref: manifestLink?.href,
        hasServiceWorker: false,
        isPWA: false
      };
    });
    
    console.log(`📱 PWA Manifest: ${pwaCaching.hasManifest ? '있음' : '없음'}`);
    console.log(`⚙️ Service Worker: ${pwaCaching.hasServiceWorker ? '활성' : '비활성'}`);
    console.log(`🎯 PWA 준비도: ${pwaCaching.isPWA ? '완료' : '부분적'}`);
    
    if (pwaCaching.isPWA) {
      console.log('✅ PWA 캐싱 기능 완전 구현');
    } else if (pwaCaching.hasServiceWorker || pwaCaching.hasManifest) {
      console.log('👍 PWA 캐싱 기능 부분 구현');
    } else {
      console.log('⚠️ PWA 캐싱 기능 미구현');
    }
    
    console.log('✅ Service Worker 캐싱 동작 테스트 완료!');
  });

  test('🎯 Performance #5: 메모리 사용량 모니터링', async ({ page }) => {
    console.log('🧠 메모리 사용량 모니터링 시작...');
    
    // 1. 초기 메모리 사용량 측정
    console.log('1️⃣ 초기 메모리 사용량 측정...');
    
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    const initialMemory = await page.evaluate(() => {
      if (performance.memory) {
        return {
          used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
          total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
          limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
        };
      }
      return null;
    });
    
    if (initialMemory) {
      console.log(`🧠 초기 메모리 사용량: ${initialMemory.used}MB / ${initialMemory.total}MB`);
      console.log(`📊 메모리 한계: ${initialMemory.limit}MB`);
      console.log(`📈 사용률: ${(initialMemory.used / initialMemory.limit * 100).toFixed(1)}%`);
    } else {
      console.log('⚠️ 메모리 정보 접근 불가 (Chrome 전용 기능)');
    }
    
    // 2. 페이지 탐색 후 메모리 변화 확인
    console.log('2️⃣ 페이지 탐색 후 메모리 변화 확인...');
    
    const pages = [
      '/reservations',
      '/machines',
      '/admin',
      '/admin/devices',
      '/admin/reservations'
    ];
    
    const memorySnapshots = [{ page: 'initial', memory: initialMemory }];
    
    for (const pagePath of pages) {
      try {
        await page.goto(`http://localhost:3000${pagePath}`);
        await page.waitForLoadState('networkidle');
        
        // 가비지 컬렉션 강제 실행 시도
        await page.evaluate(() => {
          if (window.gc) {
            window.gc();
          }
        });
        
        const currentMemory = await page.evaluate(() => {
          if (performance.memory) {
            return {
              used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
              total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
              limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
            };
          }
          return null;
        });
        
        memorySnapshots.push({ 
          page: pagePath, 
          memory: currentMemory 
        });
        
        if (currentMemory) {
          console.log(`📄 ${pagePath}: ${currentMemory.used}MB`);
        }
        
      } catch (error) {
        console.log(`⚠️ ${pagePath} 로딩 실패: ${error.message}`);
      }
    }
    
    // 3. 메모리 누수 분석
    console.log('3️⃣ 메모리 누수 분석...');
    
    if (memorySnapshots.length > 1 && memorySnapshots[0].memory && memorySnapshots[memorySnapshots.length - 1].memory) {
      const initialUsed = memorySnapshots[0].memory.used;
      const finalUsed = memorySnapshots[memorySnapshots.length - 1].memory.used;
      const memoryIncrease = finalUsed - initialUsed;
      
      console.log(`📊 메모리 증가량: ${memoryIncrease}MB`);
      
      if (memoryIncrease > 50) {
        console.log('🚨 심각한 메모리 증가 감지 (50MB 초과)');
      } else if (memoryIncrease > 20) {
        console.log('⚠️ 주의할 메모리 증가 (20MB 초과)');
      } else if (memoryIncrease > 0) {
        console.log('👍 정상적인 메모리 증가');
      } else {
        console.log('✅ 메모리 사용량 안정적');
      }
      
      // 가장 많은 메모리를 사용하는 페이지 식별
      const maxMemoryPage = memorySnapshots.reduce((max, current) => {
        if (!current.memory || !max.memory) return max;
        return current.memory.used > max.memory.used ? current : max;
      });
      
      if (maxMemoryPage.memory) {
        console.log(`🔝 최대 메모리 사용 페이지: ${maxMemoryPage.page} (${maxMemoryPage.memory.used}MB)`);
      }
    }
    
    // 4. DOM 노드 수 확인
    console.log('4️⃣ DOM 노드 수 확인...');
    
    const domStats = await page.evaluate(() => {
      return {
        totalNodes: document.querySelectorAll('*').length,
        htmlElements: document.querySelectorAll('html *').length,
        eventListeners: typeof getEventListeners !== 'undefined' ? Object.keys(getEventListeners(document)).length : 'unknown'
      };
    });
    
    console.log(`🏗️ 총 DOM 노드: ${domStats.totalNodes}개`);
    console.log(`📝 HTML 요소: ${domStats.htmlElements}개`);
    
    if (domStats.totalNodes > 3000) {
      console.log('⚠️ DOM 노드 수가 많음 (3000개 초과) - 성능 영향 가능');
    } else if (domStats.totalNodes > 1500) {
      console.log('👍 DOM 노드 수 적정 수준');
    } else {
      console.log('✅ DOM 노드 수 최적화됨');
    }
    
    console.log('✅ 메모리 사용량 모니터링 완료!');
  });

  test('🎯 Performance #6: 3G 환경 성능 시뮬레이션', async ({ page }) => {
    console.log('📶 3G 환경 성능 시뮬레이션 시작...');
    
    // 1. 정상 속도에서의 기준 측정
    console.log('1️⃣ 정상 속도 기준 측정...');
    
    const normalStart = Date.now();
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    const normalLoadTime = Date.now() - normalStart;
    
    console.log(`⚡ 정상 속도 로딩 시간: ${normalLoadTime}ms`);
    
    // 2. 3G 속도 시뮬레이션
    console.log('2️⃣ 3G 속도 시뮬레이션...');
    
    // 3G 네트워크 조건 설정
    await page.context().route('**/*', async route => {
      // 3G 지연 시뮬레이션 (100-300ms)
      const delay = Math.random() * 200 + 100;
      await new Promise(resolve => setTimeout(resolve, delay));
      route.continue();
    });
    
    const slowStart = Date.now();
    await page.reload();
    await page.waitForLoadState('networkidle');
    const slowLoadTime = Date.now() - slowStart;
    
    console.log(`📶 3G 속도 로딩 시간: ${slowLoadTime}ms`);
    console.log(`📊 성능 비율: ${(slowLoadTime / normalLoadTime).toFixed(2)}배 느림`);
    
    // 3. Critical Rendering Path 분석
    console.log('3️⃣ Critical Rendering Path 분석...');
    
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      if (navigation) {
        return {
          dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
          tcpConnect: navigation.connectEnd - navigation.connectStart,
          ttfb: navigation.responseStart - navigation.requestStart,
          domLoading: navigation.domContentLoadedEventStart - navigation.responseStart,
          domComplete: navigation.domComplete - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart
        };
      }
      return null;
    });
    
    if (performanceMetrics) {
      console.log('📊 성능 분석 결과:');
      console.log(`   DNS 조회: ${performanceMetrics.dnsLookup.toFixed(1)}ms`);
      console.log(`   TCP 연결: ${performanceMetrics.tcpConnect.toFixed(1)}ms`);
      console.log(`   TTFB: ${performanceMetrics.ttfb.toFixed(1)}ms`);
      console.log(`   DOM 로딩: ${performanceMetrics.domLoading.toFixed(1)}ms`);
      console.log(`   DOM 완료: ${performanceMetrics.domComplete.toFixed(1)}ms`);
      console.log(`   로드 완료: ${performanceMetrics.loadComplete.toFixed(1)}ms`);
      
      // 성능 병목 지점 식별
      const bottlenecks = [];
      if (performanceMetrics.ttfb > 500) bottlenecks.push('TTFB 느림');
      if (performanceMetrics.domLoading > 1000) bottlenecks.push('DOM 로딩 느림');
      if (performanceMetrics.domComplete > 2000) bottlenecks.push('DOM 완료 느림');
      
      if (bottlenecks.length > 0) {
        console.log(`⚠️ 성능 병목: ${bottlenecks.join(', ')}`);
      } else {
        console.log('✅ 주요 성능 병목 없음');
      }
    }
    
    // 4. 모바일 사용성 확인
    console.log('4️⃣ 모바일 사용성 확인...');
    
    // 모바일 뷰포트로 설정
    await page.setViewportSize({ width: 375, height: 667 });
    
    // 주요 UI 요소 로딩 확인
    const uiElements = [
      'button',
      'input',
      'select',
      '.card',
      '.reservation',
      '.device'
    ];
    
    const visibleElements = {};
    for (const selector of uiElements) {
      const count = await page.locator(selector).count();
      visibleElements[selector] = count;
    }
    
    console.log('📱 모바일 UI 요소 로딩 상태:');
    Object.entries(visibleElements).forEach(([selector, count]) => {
      console.log(`   ${selector}: ${count}개`);
    });
    
    // 5. 3G 환경 성능 기준 평가
    console.log('5️⃣ 3G 환경 성능 기준 평가...');
    
    // 3G 환경에서의 성능 목표
    const performance3GTargets = {
      loadTime: 5000,        // 5초 이내
      domContentLoaded: 3000, // 3초 이내
      firstMeaningfulPaint: 2000 // 2초 이내
    };
    
    console.log(`🎯 성능 목표 달성도:`);
    console.log(`   로딩 시간: ${slowLoadTime}ms / ${performance3GTargets.loadTime}ms ${slowLoadTime <= performance3GTargets.loadTime ? '✅' : '❌'}`);
    
    if (performanceMetrics) {
      const domContentLoadedTime = performanceMetrics.domLoading + performanceMetrics.domComplete;
      console.log(`   DOM 로딩: ${domContentLoadedTime.toFixed(1)}ms / ${performance3GTargets.domContentLoaded}ms ${domContentLoadedTime <= performance3GTargets.domContentLoaded ? '✅' : '❌'}`);
    }
    
    // 전체 성능 등급 산정
    let performanceGrade = 'A';
    if (slowLoadTime > performance3GTargets.loadTime) performanceGrade = 'B';
    if (slowLoadTime > performance3GTargets.loadTime * 1.5) performanceGrade = 'C';
    if (slowLoadTime > performance3GTargets.loadTime * 2) performanceGrade = 'D';
    
    console.log(`🏆 3G 환경 성능 등급: ${performanceGrade}`);
    
    // 네트워크 라우팅 해제
    await page.context().unroute('**/*');
    
    console.log('✅ 3G 환경 성능 시뮬레이션 완료!');
  });

});