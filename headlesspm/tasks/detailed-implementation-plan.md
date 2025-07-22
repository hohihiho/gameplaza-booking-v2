# 게임플라자 예약 시스템 MVP - 상세 구현 계획

## 📊 프로젝트 현황
- **전체 진행률**: 85%
- **예상 완료일**: 1-2주
- **총 예상 시간**: 74-96시간

## 🚨 긴급 작업 (1-2일 내 완료 필요)

### 1. 통계 페이지 차트 시각화 구현 (MVP-001)
**담당**: Frontend Developer
**예상 시간**: 8-12시간

#### 구현 순서:
1. **Recharts 라이브러리 설치**
   ```bash
   npm install recharts
   ```

2. **차트 컴포넌트 개발**
   - `AnalyticsChart.tsx` - 공통 차트 컴포넌트
   - 각 페이지별 차트 타입:
     - 예약통계: BarChart(시간대별), LineChart(일별)
     - 매출분석: LineChart(일별), PieChart(기종별)
     - 고객분석: PieChart(세그먼트), BarChart(재방문)
     - 기종분석: BarChart(이용률), TreeMap(매출)

3. **반응형 & 다크모드 처리**
   - ResponsiveContainer 활용
   - 다크모드 색상 팔레트 적용

### 2. PWA 설정 및 오프라인 지원 (MVP-002)
**담당**: Frontend Developer
**예상 시간**: 4-6시간

#### 구현 순서:
1. **next-pwa 설치**
   ```bash
   npm install next-pwa
   ```

2. **manifest.json 생성**
   ```json
   {
     "name": "게임플라자 예약",
     "short_name": "게임플라자",
     "theme_color": "#8B5CF6",
     "background_color": "#111827"
   }
   ```

3. **Service Worker 설정**
4. **아이콘 세트 생성** (192x192, 512x512)

### 3. SMS 인증 서비스 연동 (MVP-003)
**담당**: Backend Developer
**예상 시간**: 4-6시간

#### 구현 순서:
1. **알리고 API 계정 생성**
2. **환경변수 설정**
   ```
   ALIGO_API_KEY=xxx
   ALIGO_USER_ID=xxx
   ALIGO_SENDER=xxx
   ```

3. **SMS 서비스 구현**
   - `/lib/services/sms.service.ts`
   - 발송 함수 구현
   - 에러 처리 및 로깅

### 4. 계좌번호 관리 기능 (MVP-004)
**담당**: Fullstack Developer
**예상 시간**: 6-8시간

#### 구현 순서:
1. **DB 테이블 생성**
   ```sql
   CREATE TABLE payment_accounts (
     id UUID PRIMARY KEY,
     bank_name TEXT NOT NULL,
     account_number TEXT NOT NULL,
     account_holder TEXT NOT NULL,
     is_default BOOLEAN DEFAULT false
   );
   ```

2. **관리 페이지 구현**
   - `/app/admin/settings/payment/page.tsx`
   - CRUD 기능 구현

## 🔴 중요 작업 (3-5일)

### 5. 데이터 내보내기 기능 (MVP-005)
**담당**: Frontend Developer
**예상 시간**: 8-10시간

- xlsx 라이브러리 활용
- 예약/매출/고객 데이터 내보내기
- 날짜 필터 적용

### 6. 고객 블랙리스트 관리 (MVP-006)
**담당**: Fullstack Developer
**예상 시간**: 6-8시간

- 블랙리스트 테이블 생성
- 예약 차단 로직 구현
- 관리 UI 개발

### 7. 예약 리마인더 알림 (MVP-007)
**담당**: Backend Developer
**예상 시간**: 8-10시간

- Supabase Edge Function 생성
- 크론잡 설정 (5분마다)
- SMS/Push 알림 발송

## 🟡 최적화 작업 (1주 이후)

### 8. 성능 최적화 (MVP-008)
- 이미지 최적화
- 코드 스플리팅
- Lighthouse 점수 90+ 달성

### 9. 보안 강화 (MVP-009)
- OWASP Top 10 점검
- Rate Limiting 강화
- Input Validation 검증

### 10. E2E 테스트 (MVP-010)
- Playwright 설정
- 핵심 시나리오 테스트
- CI/CD 연동

## 📋 작업 우선순위 및 의존관계

```
1. 차트 시각화 (MVP-001) ─┐
2. PWA 설정 (MVP-002)     ├─→ 5. 데이터 내보내기 (MVP-005)
3. SMS 연동 (MVP-003) ────┴─→ 7. 리마인더 알림 (MVP-007)
4. 계좌 관리 (MVP-004)
6. 블랙리스트 (MVP-006)
8. 성능 최적화 (MVP-008)
9. 보안 강화 (MVP-009)
10. E2E 테스트 (MVP-010)
```

## 🎯 체크포인트

### Week 1 (긴급 + 중요 작업)
- [ ] 통계 차트 구현 완료
- [ ] PWA 설정 완료
- [ ] SMS 실제 발송 테스트
- [ ] 계좌 관리 기능 완성
- [ ] 데이터 내보내기 구현

### Week 2 (최적화 + 테스트)
- [ ] 블랙리스트 기능 완성
- [ ] 리마인더 알림 작동
- [ ] 성능 최적화 완료
- [ ] 보안 점검 통과
- [ ] E2E 테스트 실행

## 💡 주의사항

1. **모바일 우선**: 모든 기능은 모바일에서 완벽하게 작동해야 함
2. **실시간 동기화**: 기존 실시간 기능을 깨뜨리지 않도록 주의
3. **KST 시간대**: 시간 관련 작업 시 KST 고정 처리 유지
4. **단순성**: 복잡한 구현보다 단순하고 안정적인 구현 우선

## 🚀 시작하기

1. 이 문서를 참고하여 작업 시작
2. 각 작업별 브랜치 생성: `feature/MVP-XXX-작업명`
3. 완료 후 PR 생성 및 리뷰
4. 테스트 완료 후 main 머지