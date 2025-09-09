# E2E 테스트 가이드

## 개요
Playwright를 사용한 End-to-End 테스트 자동화 시스템입니다.

## 테스트 구조
```
tests/e2e/
├── fixtures/       # 테스트 픽스처
├── pages/          # 페이지 객체 패턴
├── specs/          # 테스트 스펙 파일
└── utils/          # 유틸리티 함수
```

## 테스트 실행

### 전체 테스트 실행
```bash
npm run test:e2e
```

### UI 모드로 실행 (브라우저에서 테스트 확인)
```bash
npm run test:e2e:ui
```

### 디버그 모드
```bash
npm run test:e2e:debug
```

### 특정 브라우저만 테스트
```bash
npm run test:e2e:chrome
```

### 모바일 테스트만 실행
```bash
npm run test:e2e:mobile
```

## 테스트 작성 가이드

### 1. 페이지 객체 생성
```typescript
// pages/example.page.ts
import { Page } from '@playwright/test';
import { BasePage } from './base.page';

export class ExamplePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }
  
  // Locators
  private readonly submitButton = '[data-testid="submit"]';
  
  // Actions
  async submit() {
    await this.clickElement(this.submitButton);
  }
}
```

### 2. 테스트 스펙 작성
```typescript
// specs/example.spec.ts
import { test, expect } from '@playwright/test';
import { ExamplePage } from '../pages/example.page';

test.describe('예제 테스트', () => {
  test('기본 플로우', async ({ page }) => {
    const examplePage = new ExamplePage(page);
    await examplePage.navigate('/example');
    await examplePage.submit();
    await expect(page).toHaveURL('/success');
  });
});
```

## 주요 테스트 시나리오

### 예약 시스템
- ✅ 기본 예약 생성 플로우
- ✅ 24시간 표시 체계 (24-29시)
- ✅ 중복 예약 방지
- ✅ 예약 취소
- ✅ 24시간 제한 규칙

### 모바일 최적화
- ✅ 터치 타겟 크기 (44px 이상)
- ✅ 반응형 레이아웃
- ✅ 스와이프 제스처
- ✅ Pull to Refresh
- ✅ 오프라인 모드

### 실시간 동기화
- ✅ 동시 예약 충돌 방지
- ✅ 예약 목록 실시간 업데이트
- ✅ 기기 상태 동기화
- ✅ 알림 실시간 전송

### 성능
- ✅ 페이지 로딩 시간 (3초 이내)
- ✅ 3G 네트워크 성능
- ✅ 번들 크기 모니터링
- ✅ 이미지 최적화

## 디버깅 팁

### 스크린샷 촬영
테스트 실패 시 자동으로 스크린샷이 저장됩니다.
```typescript
await page.screenshot({ path: 'debug.png' });
```

### 느린 실행 모드
```typescript
test.use({ 
  video: 'on',
  trace: 'on' 
});
```

### 특정 테스트만 실행
```typescript
test.only('특정 테스트만', async ({ page }) => {
  // ...
});
```

## CI/CD 통합
GitHub Actions에서 자동으로 실행됩니다:
- PR 생성 시
- main/develop 브랜치 푸시 시
- 테스트 결과는 Artifacts에 저장

## 트러블슈팅

### 테스트가 로컬에서는 성공하지만 CI에서 실패하는 경우
1. 환경 변수 확인
2. 타임아웃 설정 확인
3. 네트워크 조건 차이 확인

### 셀렉터를 찾을 수 없는 경우
1. `data-testid` 속성 사용 권장
2. 페이지 로딩 완료 대기
3. 동적 요소는 `waitForSelector` 사용