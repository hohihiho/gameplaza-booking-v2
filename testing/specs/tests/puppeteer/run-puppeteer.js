/**
 * 🤖 Puppeteer 브라우저 자동화 테스트 실행기
 * Jest 없이 독립적으로 실행되는 Puppeteer 테스트
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// 스크린샷 디렉토리 생성
const screenshotDir = path.join(__dirname, '../screenshots');
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

async function runPuppeteerTests() {
  console.log('🚀 Puppeteer 브라우저 자동화 테스트 시작');
  console.log('==================================');
  
  let browser;
  let testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    errors: []
  };

  try {
    browser = await puppeteer.launch({
      headless: true, // CI 환경에서는 headless
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--window-size=390,844'
      ]
    });

    const page = await browser.newPage();
    
    // 모바일 환경 시뮬레이션
    await page.setViewport({ width: 390, height: 844 });
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15');

    // 테스트 1: 홈페이지 기본 동작
    await runTest('홈페이지 기본 동작', async () => {
      console.log('🏠 홈페이지 접속 테스트...');
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 10000 });
      
      const title = await page.title();
      console.log(`📄 페이지 제목: ${title}`);
      
      await page.screenshot({ path: path.join(screenshotDir, 'puppeteer-homepage.png') });
      
      if (!title.includes('게임플라자') && !title.includes('GAMEPLAZA')) {
        throw new Error(`예상되지 않은 페이지 제목: ${title}`);
      }
      
      console.log('✅ 홈페이지 기본 동작 테스트 통과');
    });

    // 테스트 2: 반응형 디자인
    await runTest('반응형 디자인', async () => {
      console.log('📱 반응형 디자인 테스트...');
      
      // 모바일 뷰
      await page.setViewport({ width: 390, height: 844 });
      await page.reload({ waitUntil: 'networkidle2' });
      await page.screenshot({ path: path.join(screenshotDir, 'puppeteer-mobile.png') });
      
      // 태블릿 뷰
      await page.setViewport({ width: 768, height: 1024 });
      await page.reload({ waitUntil: 'networkidle2' });
      await page.screenshot({ path: path.join(screenshotDir, 'puppeteer-tablet.png') });
      
      // 데스크탑 뷰
      await page.setViewport({ width: 1920, height: 1080 });
      await page.reload({ waitUntil: 'networkidle2' });
      await page.screenshot({ path: path.join(screenshotDir, 'puppeteer-desktop.png') });
      
      console.log('✅ 반응형 디자인 테스트 통과');
    });

    // 테스트 3: 성능 모니터링
    await runTest('성능 모니터링', async () => {
      console.log('📊 성능 모니터링 테스트...');
      
      await page.setViewport({ width: 390, height: 844 }); // 모바일로 돌아가기
      
      const startTime = Date.now();
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
      const loadTime = Date.now() - startTime;
      
      console.log(`⚡ 페이지 로드 시간: ${loadTime}ms`);
      
      const metrics = await page.metrics();
      console.log('📈 성능 메트릭:', {
        JSHeapUsedSize: `${Math.round(metrics.JSHeapUsedSize / 1024 / 1024)}MB`,
        JSHeapTotalSize: `${Math.round(metrics.JSHeapTotalSize / 1024 / 1024)}MB`,
        Nodes: metrics.Nodes,
        Documents: metrics.Documents
      });
      
      if (loadTime > 10000) { // 10초 이상이면 실패
        throw new Error(`페이지 로드 시간이 너무 깁니다: ${loadTime}ms`);
      }
      
      console.log('✅ 성능 모니터링 테스트 통과');
    });

    // 테스트 4: 네트워크 조건
    await runTest('네트워크 조건', async () => {
      console.log('📶 네트워크 조건 테스트...');
      
      // 느린 3G 시뮬레이션
      const slow3G = {
        offline: false,
        downloadThroughput: 500 * 1024 / 8,
        uploadThroughput: 500 * 1024 / 8,
        latency: 400
      };
      
      await page.emulateNetworkConditions(slow3G);
      console.log('📶 3G 네트워크 환경 시뮬레이션');
      
      const startTime = Date.now();
      await page.goto('http://localhost:3000', { timeout: 15000 });
      const slow3GLoadTime = Date.now() - startTime;
      
      console.log(`🐌 3G 환경 로드 시간: ${slow3GLoadTime}ms`);
      
      // 네트워크 복구
      await page.emulateNetworkConditions(null);
      
      console.log('✅ 네트워크 조건 테스트 통과');
    });

    // 테스트 5: JavaScript 실행
    await runTest('JavaScript 실행', async () => {
      console.log('⚙️ JavaScript 실행 테스트...');
      
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
      
      // JavaScript 실행 테스트
      const result = await page.evaluate(() => {
        return {
          userAgent: navigator.userAgent,
          language: navigator.language,
          cookieEnabled: navigator.cookieEnabled,
          screenWidth: screen.width,
          screenHeight: screen.height,
          hasLocalStorage: typeof localStorage !== 'undefined',
          hasSessionStorage: typeof sessionStorage !== 'undefined'
        };
      });
      
      console.log('🔧 브라우저 정보:', result);
      
      if (!result.hasLocalStorage || !result.hasSessionStorage) {
        throw new Error('Local Storage 또는 Session Storage가 지원되지 않습니다');
      }
      
      console.log('✅ JavaScript 실행 테스트 통과');
    });

  } catch (error) {
    console.error('❌ Puppeteer 테스트 실행 중 오류:', error);
    testResults.errors.push(error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  // 테스트 결과 출력
  console.log('\n🎮 Puppeteer 테스트 결과');
  console.log('====================');
  console.log(`📊 총 테스트: ${testResults.total}`);
  console.log(`✅ 통과: ${testResults.passed}`);
  console.log(`❌ 실패: ${testResults.failed}`);
  
  if (testResults.errors.length > 0) {
    console.log('\n🚨 오류 목록:');
    testResults.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  }
  
  console.log(`\n📸 스크린샷 저장됨: ${screenshotDir}`);
  
  return testResults;

  async function runTest(testName, testFn) {
    testResults.total++;
    try {
      await testFn();
      testResults.passed++;
    } catch (error) {
      testResults.failed++;
      testResults.errors.push(`${testName}: ${error.message}`);
      console.error(`❌ ${testName} 실패:`, error.message);
    }
  }
}

// 실행
if (require.main === module) {
  runPuppeteerTests()
    .then((results) => {
      process.exit(results.failed > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = runPuppeteerTests;