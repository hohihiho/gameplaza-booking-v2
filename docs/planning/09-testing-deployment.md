# 9. 테스트 및 배포

## 9.1 테스트 전략

### 9.1.1 테스트 레벨
1. **단위 테스트 (Unit Test)**
   - 커버리지 목표: 80% 이상
   - 도구: Jest, React Testing Library
   - 대상: 함수, 컴포넌트, 훅

2. **통합 테스트 (Integration Test)**
   - API 엔드포인트 테스트
   - 데이터베이스 연동 테스트
   - 인증 플로우 테스트

3. **E2E 테스트 (End-to-End Test)**
   - 도구: Playwright
   - 주요 사용자 시나리오
   - 예약 플로우 전체

### 9.1.2 테스트 케이스
```typescript
// 예약 생성 테스트
describe('예약 시스템', () => {
  test('정상 예약 생성', async () => {
    const reservation = await createReservation({
      deviceId: 'device-1',
      date: '2025-01-30',
      startTime: '14:00',
      duration: 2
    });
    
    expect(reservation.status).toBe('pending');
    expect(reservation.totalAmount).toBe(10000);
  });
  
  test('중복 예약 방지', async () => {
    await expect(
      createDuplicateReservation()
    ).rejects.toThrow('Time slot already booked');
  });
  
  test('1일 3시간 제한', async () => {
    await expect(
      createReservationExceedingLimit()
    ).rejects.toThrow('Daily limit exceeded');
  });
});
```

### 9.1.3 성능 테스트
- **로드 테스트**: k6로 1000명 동시 접속
- **응답 시간 목표**: API 200ms 이내
- **페이지 로드 시간**: 3초 이내 (3G)

## 9.2 CI/CD 파이프라인

### 9.2.1 GitHub Actions
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test -- --coverage
      
      - name: Run build
        run: npm run build
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Cloudflare
        run: |
          npx wrangler deploy \
            --env production \
            --var ENVIRONMENT=production
```

### 9.2.2 배포 프로세스
1. **개발 환경**
   - 브랜치: develop
   - 자동 배포
   - URL: dev.gameplaza.kr

2. **스테이징 환경**
   - 브랜치: staging
   - 수동 배포
   - URL: staging.gameplaza.kr

3. **프로덕션 환경**
   - 브랜치: main
   - 승인 후 배포
   - URL: gameplaza.kr

## 9.3 배포 아키텍처

### 9.3.1 Cloudflare 구성
```
┌───────────────────────────┐
│   Cloudflare CDN         │
│                          │
│  ┌──────────────────────┐ │
│  │   Pages (Frontend)   │ │
│  │   - Next.js SSG      │ │
│  │   - Static Assets    │ │
│  └──────────────────────┘ │
│                          │
│  ┌──────────────────────┐ │
│  │   Workers (API)      │ │
│  │   - Edge Functions   │ │
│  │   - API Routes       │ │
│  └──────────────────────┘ │
│                          │
│  ┌──────────────────────┐ │
│  │   D1 (Database)      │ │
│  │   - SQLite           │ │
│  │   - Edge Locations   │ │
│  └──────────────────────┘ │
│                          │
│  ┌──────────────────────┐ │
│  │   R2 (Storage)       │ │
│  │   - Images           │ │
│  │   - Backups          │ │
│  └──────────────────────┘ │
└───────────────────────────┘
```

### 9.3.2 환경 변수
```env
# Production
DATABASE_URL=d1://production-db
AUTH_SECRET=production-secret
GOOGLE_CLIENT_ID=prod-client-id
GOOGLE_CLIENT_SECRET=prod-secret
NEXT_PUBLIC_API_URL=https://api.gameplaza.kr

# Development
DATABASE_URL=d1://dev-db
AUTH_SECRET=dev-secret
GOOGLE_CLIENT_ID=dev-client-id
GOOGLE_CLIENT_SECRET=dev-secret
NEXT_PUBLIC_API_URL=https://dev-api.gameplaza.kr
```

## 9.4 모니터링

### 9.4.1 성능 모니터링
- **Cloudflare Analytics**
  - 트래픽 분석
  - 성능 메트릭
  - 에러 추적

- **Core Web Vitals**
  - LCP < 2.5s
  - FID < 100ms
  - CLS < 0.1

### 9.4.2 에러 모니터링
- **Sentry 통합**
  ```typescript
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.ENVIRONMENT,
    tracesSampleRate: 0.1,
    beforeSend(event) {
      // 민감 정보 필터링
      return event;
    }
  });
  ```

### 9.4.3 로그 관리
- **로그 레벨**:
  - Production: ERROR, WARN
  - Staging: INFO 이상
  - Development: 모든 레벨

- **로그 저장**:
  - Cloudflare Logpush
  - 30일 보관
  - 암호화 저장

## 9.5 보안 체크리스트

### 9.5.1 배포 전 검증
- [ ] 환경 변수 확인
- [ ] 비밀 키 노출 검사
- [ ] 의존성 취약점 스캔
- [ ] 코드 난독화 확인

### 9.5.2 배포 후 검증
- [ ] SSL 인증서 확인
- [ ] CORS 설정 확인
- [ ] Rate Limiting 동작
- [ ] 보안 헤더 설정

## 9.6 롤백 계획

### 9.6.1 롤백 트리거
- 에러율 5% 초과
- 응답 시간 2배 증가
- 중요 기능 실패

### 9.6.2 롤백 프로세스
1. 트래픽 전환 중단
2. 이전 버전으로 즉시 배포
3. 에러 로그 분석
4. 핫픽스 적용
5. 재배포

## 9.7 백업 및 복구

### 9.7.1 백업 전략
- **데이터베이스**:
  - 일일 자동 백업 (03:00 KST)
  - D1 Export to R2
  - 30일 보관

- **코드**:
  - Git 저장소
  - 태그 버전 관리

### 9.7.2 복구 시나리오
- **RTO**: 1시간 이내
- **RPO**: 24시간 이내
- **복구 테스트**: 분기별 실시

## 9.8 성능 최적화

### 9.8.1 프론트엔드 최적화
- **코드 스플리팅**
- **이미지 최적화** (WebP, AVIF)
- **CDN 캐싱**
- **서비스 워커**

### 9.8.2 백엔드 최적화
- **Edge 컴퓨팅**
- **데이터베이스 인덱싱**
- **쿼리 최적화**
- **캐싱 전략**

## 9.9 문서화

### 9.9.1 기술 문서
- API 명세서
- 데이터베이스 스키마
- 아키텍처 다이어그램
- 배포 가이드

### 9.9.2 운영 문서
- 운영 매뉴얼
- 트러블슈팅 가이드
- 비상 대응 매뉴얼
- 보안 정책