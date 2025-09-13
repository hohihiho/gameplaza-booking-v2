# 🚀 실시간 에러 모니터링 시스템 가이드

## 📌 개요

이 프로젝트는 4가지 레벨의 에러 모니터링 시스템을 제공합니다:

1. **기본 모니터** - 간단한 에러 감지 및 수정
2. **고급 모니터** - AI 기반 패턴 학습 및 실시간 수정
3. **울트라 모니터** - 콘솔에 안 잡히는 침묵 에러 감지
4. **대시보드** - 시각적 실시간 모니터링

## 🎯 빠른 시작

### 1. 기본 에러 모니터 (초보자용)

가장 간단한 방법입니다. 브라우저 에러를 감지하고 자동으로 수정합니다.

```bash
# 실행
npm run monitor

# 또는 한국어 명령
npm run 오토픽스
```

**특징:**
- ✅ 설치 없이 바로 사용
- ✅ 콘솔 에러 자동 감지
- ✅ API 404 에러 자동 수정
- ✅ import 에러 자동 수정

### 2. 고급 에러 모니터 (개발자용)

더 강력한 기능이 필요할 때 사용합니다.

```bash
# 필요한 패키지 설치
npm install playwright ws chokidar chalk ora

# 실행
npm run monitor:advanced
```

**특징:**
- ✅ WebSocket 실시간 통신
- ✅ Chrome DevTools Protocol 사용
- ✅ AI 패턴 학습
- ✅ 병렬 에러 수정
- ✅ 메모리 누수 감지
- ✅ 성능 모니터링

### 3. 울트라 에러 모니터 (고급 사용자용)

콘솔에 표시되지 않는 침묵 에러를 감지합니다.

```bash
# 울트라 모니터 실행
npm run monitor:ultra

# 또는 한국어 명령
npm run 울트라모니터

# 울트라 모니터 + 대시보드 동시 실행
npm run 완전감시
```

**특징:**
- ✅ 반응 없는 버튼/링크 감지
- ✅ 무한 로딩 상태 감지
- ✅ 빈 화면 감지
- ✅ 깨진 이미지 감지
- ✅ 폼 제출 실패 감지
- ✅ 레이아웃 깨짐 감지
- ✅ 접근성 문제 감지
- ✅ JavaScript 동작 중단 감지

### 4. 실시간 대시보드

시각적으로 에러를 모니터링하고 싶을 때 사용합니다.

```bash
# 대시보드만 열기
npm run monitor:dashboard

# 고급 모니터 + 대시보드 동시 실행
npm run monitor:full

# 울트라 모니터 + 대시보드 동시 실행
npm run 완전감시
```

## 📊 대시보드 사용법

### 메인 화면 구성

```
┌─────────────────────────────────────┐
│         실시간 에러 모니터          │
├─────────────────────────────────────┤
│  🟢 연결됨  | 자동수정: ON | 에러: 5 │
├─────────────────────────────────────┤
│                                     │
│  [자동수정 토글] [에러 지우기]      │
│  [페이지 새로고침] [로그 내보내기]  │
│                                     │
├──────────────┬──────────────────────┤
│ 실시간 에러  │     성능 메트릭      │
│              │                      │
│ • TypeError  │  메모리: 45MB        │
│ • API 404    │  로드시간: 1.2s      │
│ • Import err │  FCP: 0.8s           │
│              │                      │
├──────────────┼──────────────────────┤
│ 수정된 에러  │   학습된 패턴        │
│              │                      │
│ ✅ 5개 수정  │  📚 12개 패턴        │
│              │                      │
└──────────────┴──────────────────────┘
```

### 주요 기능

#### 1. 에러 필터링
- **전체** - 모든 에러 표시
- **런타임** - JavaScript 런타임 에러
- **콘솔** - console.error 메시지
- **네트워크** - API 호출 에러
- **타입** - TypeScript 타입 에러

#### 2. 자동 수정 설정
- **자동수정 ON/OFF** - 에러 자동 수정 활성화/비활성화
- **학습 모드** - AI 패턴 학습 활성화/비활성화
- **병렬 처리** - 동시 수정 개수 설정

#### 3. 통계 정보
- **총 에러 수** - 감지된 전체 에러
- **분당 에러** - 최근 1분간 발생한 에러
- **수정률** - 자동 수정 성공률
- **학습된 패턴** - AI가 학습한 패턴 수

## 🛠️ 고급 설정

### 설정 파일 만들기

`.error-monitor.config.json` 파일을 프로젝트 루트에 생성:

```json
{
  "url": "http://localhost:3000",
  "wsPort": 8888,
  "autoFix": true,
  "parallel": true,
  "maxParallelFixes": 3,
  "debounceTime": 100,
  "retryAttempts": 3,
  "enablePrediction": true,
  "enablePerformanceMonitor": true,
  "enableMemoryMonitor": true,
  "enableNetworkMonitor": true,
  "enableSourceMap": true,
  "enableHotReload": true,
  "enableAIAnalysis": true,
  "logLevel": "verbose"
}
```

### 설정 옵션 설명

| 옵션 | 기본값 | 설명 |
|------|--------|------|
| `url` | http://localhost:3000 | 모니터링할 URL |
| `wsPort` | 8888 | WebSocket 포트 |
| `autoFix` | true | 자동 수정 활성화 |
| `parallel` | true | 병렬 처리 활성화 |
| `maxParallelFixes` | 3 | 동시 수정 최대 개수 |
| `debounceTime` | 100 | 에러 그룹핑 시간(ms) |
| `retryAttempts` | 3 | 수정 재시도 횟수 |
| `enablePrediction` | true | 예측적 에러 방지 |
| `enablePerformanceMonitor` | true | 성능 모니터링 |
| `enableMemoryMonitor` | true | 메모리 모니터링 |
| `enableNetworkMonitor` | true | 네트워크 모니터링 |
| `enableSourceMap` | true | 소스맵 사용 |
| `enableHotReload` | true | 수정 후 자동 새로고침 |
| `enableAIAnalysis` | true | AI 분석 활성화 |
| `logLevel` | verbose | 로그 레벨 |

## 🔍 에러 유형별 자동 수정

### 1. Import 에러
```javascript
// 에러: useState is not defined
// 자동 수정: import { useState } from 'react' 추가
```

### 2. API 엔드포인트 에러
```javascript
// 에러: 404 Not Found - /api/users
// 자동 수정: /app/api/users/route.ts 파일 생성
```

### 3. TypeScript 타입 에러
```javascript
// 에러: Type 'string' is not assignable to type 'number'
// 자동 수정: 타입 변환 또는 타입 정의 수정
```

### 4. 컴포넌트 에러
```javascript
// 에러: Component 'Button' is not defined
// 자동 수정: Button 컴포넌트 import 또는 생성
```

### 5. 침묵 에러 (울트라 모니터 전용)
```javascript
// 에러: 버튼을 클릭해도 반응 없음
// 감지: onClick 핸들러 누락 또는 이벤트 버블링 차단
// 자동 수정: 이벤트 핸들러 추가 또는 수정

// 에러: 페이지가 계속 로딩 중
// 감지: Promise 미해결 또는 무한 루프
// 자동 수정: 타임아웃 추가 또는 루프 조건 수정

// 에러: 화면이 비어있음
// 감지: 렌더링 실패 또는 데이터 로드 실패
// 자동 수정: 에러 경계 추가 또는 폴백 UI 제공
```

## 📝 사용 시나리오

### 시나리오 1: 개발 중 실시간 에러 수정

```bash
# 터미널 1: 개발 서버 실행
npm run dev

# 터미널 2: 에러 모니터 실행
npm run monitor:advanced

# 브라우저에서 대시보드 열기
npm run monitor:dashboard
```

### 시나리오 2: QA 테스트 중 에러 수집

```bash
# 에러 수집 모드로 실행 (자동 수정 OFF)
npm run monitor:advanced -- --no-autofix

# 수집된 에러 로그 내보내기
# 대시보드에서 "로그 내보내기" 버튼 클릭
```

### 시나리오 3: 프로덕션 빌드 전 에러 체크

```bash
# 전체 프로젝트 스캔
npm run scan

# 빠른 스캔 (10페이지만)
npm run scan:fast
```

### 시나리오 4: 침묵 에러 감지 및 수정

```bash
# 울트라 모니터로 숨은 문제 찾기
npm run 울트라모니터

# 완전 감시 모드 (울트라 + 대시보드)
npm run 완전감시

# 감지되는 문제들:
# - 클릭해도 반응 없는 버튼
# - 무한 로딩 스피너
# - 렌더링되지 않는 컴포넌트
# - 깨진 이미지나 아이콘
# - 접근성 문제 (키보드 네비게이션 불가 등)
```

## 💡 팁과 트릭

### 1. 한국어 명령어 사용

package.json에 한국어 별칭 추가:

```json
{
  "scripts": {
    "오토픽스": "npm run monitor",
    "고급모니터": "npm run monitor:advanced",
    "대시보드": "npm run monitor:dashboard",
    "전체모니터": "npm run monitor:full"
  }
}
```

### 2. 특정 페이지만 모니터링

```javascript
// .error-monitor.config.json
{
  "url": "http://localhost:3000/admin",
  "routes": ["/admin/*", "/api/*"]
}
```

### 3. 에러 무시 패턴 설정

```javascript
// .error-monitor.ignore
**/node_modules/**
**/.next/**
**/test/**
```

### 4. 커스텀 수정 규칙 추가

`.error-patterns.json` 파일에 패턴 추가:

```json
[
  {
    "pattern": "Cannot read property '(\\w+)' of undefined",
    "fix": {
      "type": "nullcheck",
      "template": "옵셔널 체이닝 추가: ?."
    }
  }
]
```

## 🚨 문제 해결

### 문제: WebSocket 연결 실패

**해결책:**
```bash
# 포트 확인
lsof -i:8888

# 포트 변경
# .error-monitor.config.json
{
  "wsPort": 8889
}
```

### 문제: 브라우저가 열리지 않음

**해결책:**
```bash
# Playwright 브라우저 설치
npx playwright install chromium
```

### 문제: 메모리 사용량 과다

**해결책:**
```javascript
// .error-monitor.config.json
{
  "enableMemoryMonitor": false,
  "enablePerformanceMonitor": false,
  "maxParallelFixes": 1
}
```

## 📊 성능 최적화

### 경량 모드

최소한의 리소스만 사용:

```json
{
  "enablePrediction": false,
  "enableAIAnalysis": false,
  "enablePerformanceMonitor": false,
  "enableMemoryMonitor": false,
  "parallel": false
}
```

### 고성능 모드

모든 기능 활성화:

```json
{
  "enablePrediction": true,
  "enableAIAnalysis": true,
  "enablePerformanceMonitor": true,
  "enableMemoryMonitor": true,
  "parallel": true,
  "maxParallelFixes": 5
}
```

## 🎮 울트라 모니터 고급 기능

### 침묵 에러 감지 메커니즘

#### 1. 클릭 가능 요소 검사
```javascript
// 모든 버튼과 링크의 이벤트 리스너 검사
// pointer-events: none 감지
// disabled 속성 오류 감지
// z-index 문제로 인한 클릭 불가 감지
```

#### 2. 무한 로딩 감지
```javascript
// 스피너가 30초 이상 지속되는지 확인
// 네트워크 요청이 완료되지 않는지 모니터링
// Promise 체인 무한 대기 감지
```

#### 3. 렌더링 실패 감지
```javascript
// React Error Boundary 없는 컴포넌트 감지
// 빈 컨테이너 요소 감지
// 조건부 렌더링 실패 감지
```

#### 4. 접근성 문제 감지
```javascript
// 키보드 네비게이션 불가 요소
// 스크린 리더 호환성 문제
// 색상 대비 부족
// 포커스 트랩
```

### 울트라 모니터 설정

`.ultra-monitor.config.json` 파일 생성:

```json
{
  "silentErrors": {
    "detectUnresponsive": true,
    "detectInfiniteLoading": true,
    "detectEmptyScreens": true,
    "detectBrokenImages": true,
    "detectAccessibility": true
  },
  "thresholds": {
    "loadingTimeout": 30000,
    "clickResponseTime": 500,
    "renderTimeout": 5000
  },
  "autoFix": {
    "addErrorBoundaries": true,
    "fixEventHandlers": true,
    "addFallbackUI": true,
    "fixAccessibility": true
  }
}
```

## 🔄 업데이트 내역

### v3.0.0 (2024-01-13)
- 울트라 모니터 추가
- 침묵 에러 감지 기능
- 한국어 명령어 확장
- 완전 감시 모드 추가

### v2.0.0 (2024-01-13)
- WebSocket 실시간 통신 추가
- AI 패턴 학습 기능 추가
- 한국어 대시보드 추가
- 병렬 처리 지원

### v1.0.0 (2024-01-12)
- 기본 에러 모니터링
- 자동 수정 기능
- Playwright 통합

## 📚 추가 자료

- [Playwright 문서](https://playwright.dev)
- [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)
- [WebSocket API](https://developer.mozilla.org/ko/docs/Web/API/WebSocket)

## 🤝 기여하기

버그 리포트나 기능 제안은 GitHub Issues에 등록해주세요.

## 📄 라이센스

MIT License

---

**작성자:** 게임플라자 개발팀
**최종 수정:** 2024-01-13
**문의:** dev@gameplaza.kr