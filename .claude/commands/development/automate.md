# /automate - 브라우저 자동화 모드

Playwright MCP 서버들을 활용하여 브라우저 자동화 테스트를 수행합니다.

## 🎭 브라우저 자동화 전문가 역할

### 핵심 자동화 영역
- **사용자 플로우 테스트**: 실제 사용자 시나리오 자동화
- **모바일 브라우저 테스트**: 다양한 모바일 환경 검증
- **성능 측정**: 로딩 시간, 응답성 자동 측정
- **크로스 브라우저 테스트**: Chrome, Firefox, Safari 호환성
- **스크린샷 비교**: UI 변경사항 시각적 검증

### 게임플라자 특화 자동화
- **예약 시스템 테스트**: 예약 생성부터 완료까지 전체 플로우
- **모바일 터치 인터페이스**: 실제 터치 동작 시뮬레이션
- **24시간 시간 선택**: 새벽 시간대 UI 정확성 검증
- **실시간 동기화**: 다중 브라우저 동시 접속 테스트

## 🎯 자동화 워크플로우

### 1. 테스트 계획 수립
```bash
# 테스트 시나리오 정의
- 사용자 스토리별 테스트 케이스
- 성공/실패 기준 설정
- 테스트 데이터 준비
- 실행 환경 설정
```

### 2. 자동화 스크립트 개발
```javascript
// 예약 시스템 테스트 예시
const testReservationFlow = async (page) => {
  // 1. 홈페이지 접속
  await page.goto('http://localhost:3000');
  
  // 2. 기기 선택
  await page.click('[data-testid="device-ps5-001"]');
  
  // 3. 시간 선택 (새벽 시간 테스트)
  await page.selectOption('[data-testid="time-select"]', '26:00'); // 새벽 2시
  
  // 4. 예약 버튼 클릭
  await page.click('[data-testid="reserve-button"]');
  
  // 5. 예약 완료 확인
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
};
```

### 3. 다중 환경 테스트
```javascript
// 모바일 브라우저 테스트
const mobileDevices = [
  'iPhone 12 Pro',
  'Samsung Galaxy S20',
  'iPad Pro 12.9'
];

for (const device of mobileDevices) {
  await page.emulate(playwright.devices[device]);
  await testReservationFlow(page);
}
```

## 📱 게임플라자 자동화 시나리오

### 예약 시스템 전체 플로우
```javascript
// 시나리오: 새벽 시간 예약 테스트
describe('새벽 시간 예약 시스템', () => {
  test('24~29시 표시 및 예약 생성', async ({ page }) => {
    // 1. 모바일 뷰포트 설정
    await page.setViewportSize({ width: 375, height: 667 });
    
    // 2. 게임플라자 접속
    await page.goto('http://localhost:3000');
    
    // 3. PS5 기기 선택
    await page.click('[data-testid="device-ps5"]');
    
    // 4. 날짜 선택 (내일)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await page.fill('[data-testid="date-input"]', tomorrow.toISOString().split('T')[0]);
    
    // 5. 새벽 시간 선택 (26시 = 새벽 2시)
    await page.click('[data-testid="time-26"]');
    
    // 6. 사용 시간 설정 (2시간)
    await page.selectOption('[data-testid="duration"]', '120');
    
    // 7. 예약 정보 확인
    const timeDisplay = await page.textContent('[data-testid="selected-time"]');
    expect(timeDisplay).toContain('26시'); // 24시간 표시 확인
    
    // 8. 예약 버튼 클릭
    await page.click('[data-testid="submit-reservation"]');
    
    // 9. 성공 메시지 확인
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
    
    // 10. 예약 목록에서 확인
    await page.goto('/reservations');
    const reservationItem = page.locator('[data-testid="reservation-item"]').first();
    await expect(reservationItem).toContainText('26시');
  });
});
```

### 실시간 동기화 테스트
```javascript
// 시나리오: 다중 사용자 동시 예약 시도
describe('실시간 동기화 테스트', () => {
  test('동시 예약 시도 시 충돌 방지', async ({ browser }) => {
    // 두 개의 브라우저 컨텍스트 생성
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    // 동일한 시간대에 예약 시도
    await Promise.all([
      reserveTime(page1, '14:00'),
      reserveTime(page2, '14:00')
    ]);
    
    // 한 명만 성공, 다른 한 명은 충돌 메시지
    const success1 = await page1.locator('[data-testid="success-message"]').isVisible();
    const success2 = await page2.locator('[data-testid="success-message"]').isVisible();
    const conflict1 = await page1.locator('[data-testid="conflict-message"]').isVisible();
    const conflict2 = await page2.locator('[data-testid="conflict-message"]').isVisible();
    
    expect(success1 !== success2).toBe(true); // 하나만 성공
    expect(conflict1 !== conflict2).toBe(true); // 하나는 충돌
  });
});
```

### 모바일 터치 인터페이스 테스트
```javascript
// 시나리오: 터치 제스처 테스트
describe('모바일 터치 인터페이스', () => {
  test('터치 타겟 크기 및 응답성', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000');
    
    // 모든 터치 가능한 요소 찾기
    const touchTargets = await page.locator('button, a, [role="button"]').all();
    
    for (const target of touchTargets) {
      const box = await target.boundingBox();
      
      // 터치 타겟 최소 크기 확인 (44x44px)
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
      
      // 터치 응답성 테스트
      await target.tap();
      await page.waitForTimeout(100); // 짧은 대기
    }
  });
  
  test('스와이프 제스처 지원', async ({ page }) => {
    await page.goto('http://localhost:3000/schedule');
    
    // 스케줄 캘린더 스와이프 테스트
    const calendar = page.locator('[data-testid="calendar"]');
    
    // 좌로 스와이프 (다음 주)
    await calendar.swipe({ from: { x: 300, y: 200 }, to: { x: 50, y: 200 } });
    
    // URL 변경 확인
    await expect(page).toHaveURL(/week=\d+/);
  });
});
```

## 🔧 MCP 도구 활용

### Microsoft Playwright MCP
```bash
# 기본 브라우저 자동화
- 페이지 네비게이션
- 요소 클릭 및 입력
- 스크린샷 촬영
- 네트워크 요청 모니터링
```

### ExecuteAutomation Playwright MCP
```bash
# 고급 자동화 기능
- 테스트 코드 자동 생성
- 웹 스크래핑
- JavaScript 실행
- 성능 메트릭 수집
```

## 📊 자동화 리포트

### 테스트 실행 결과
```
🎭 브라우저 자동화 테스트 리포트
실행 시간: [현재 시간]
테스트 환경: Chrome, Firefox, Safari (모바일)

📊 테스트 결과:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ 통과: 45개 (90%)
❌ 실패: 3개 (6%)  
⏭️ 건너뜀: 2개 (4%)
⏱️ 총 소요시간: 12분 34초

🎯 주요 테스트 결과:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ 예약 시스템 플로우: 통과
✅ 24시간 표시 체계: 통과  
✅ 모바일 터치 인터페이스: 통과
❌ 실시간 동기화: 간헐적 실패
❌ 크로스 브라우저 호환성: Safari 이슈

📱 모바일 테스트:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📱 iPhone 12 Pro: ✅ 통과
📱 Samsung Galaxy S20: ✅ 통과  
📱 iPad Pro: ❌ 레이아웃 이슈

⚡ 성능 메트릭:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏠 홈페이지 로딩: 1.2초
📅 예약 페이지: 0.8초
💾 예약 생성: 0.5초
📊 관리자 대시보드: 2.1초

🚨 발견된 이슈:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Safari에서 시간 선택 드롭다운 스타일 깨짐
2. iPad에서 터치 타겟 간격 부족
3. 실시간 동기화 시 네트워크 지연 시 충돌

💡 개선 권장사항:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Safari 호환성 개선 필요
2. iPad 전용 레이아웃 추가
3. 네트워크 에러 핸들링 강화
```

## 🚀 CI/CD 통합

### GitHub Actions 자동화
```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on:
  pull_request:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      
      - name: Install dependencies
        run: npm ci
        
      - name: Install Playwright
        run: npx playwright install
        
      - name: Run E2E tests
        run: npm run test:e2e
        
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

### 자동화 실행 일정
```bash
# 정기 실행 스케줄
- 매일 새벽 2시: 전체 회귀 테스트
- PR 생성/업데이트: 관련 기능 테스트
- 배포 전: 크리티컬 패스 테스트
- 주말: 성능 및 호환성 테스트
```

## 💡 효과적인 자동화 팁

### 테스트 안정성 향상
- **대기 전략**: 명시적 대기 사용 (`waitForSelector`)
- **재시도 로직**: 네트워크 이슈 대응
- **테스트 격리**: 각 테스트 독립적 실행
- **데이터 정리**: 테스트 후 상태 초기화

### 유지보수성 개선
- **페이지 객체 패턴**: 재사용 가능한 컴포넌트
- **설정 외부화**: 환경별 설정 분리
- **스크린샷 비교**: 시각적 회귀 테스트
- **성능 임계값**: 성능 저하 자동 감지

브라우저 자동화를 통해 안정적이고 신뢰할 수 있는 게임플라자 서비스를 제공할 수 있습니다!