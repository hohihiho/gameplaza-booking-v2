# 아키텍처 일관성 및 기술 부채 보고서

생성일: 2025-07-24

## 1. DDD 계층 구조 분석

### ✅ 잘 구현된 부분
- `src/domain`, `src/application`, `src/infrastructure` 3계층 구조가 명확히 분리됨
- 각 계층의 책임이 잘 정의되어 있음:
  - **Domain**: 엔티티, 값객체, 도메인 서비스, Repository 인터페이스
  - **Application**: Use Case, DTO, Mapper
  - **Infrastructure**: Repository 구현체, 외부 서비스 통합

### ⚠️ 일관성 문제
1. **DTO 위치 불일치**
   - `src/application/dto/` (checkin.dto.ts)
   - `src/application/dtos/` (나머지 DTO들)
   - 두 개의 디렉토리가 혼재되어 있음

2. **중복된 Use Case**
   - `checkin` vs `check-in` 디렉토리가 동시에 존재
   - 명명 규칙 불일치

3. **Entity 파일명 불일치**
   - `check-in.entity.ts` vs `checkin.ts`
   - `device.entity.ts` vs `device.ts`
   - 일부는 `.entity` 접미사 사용, 일부는 미사용

## 2. API 디렉토리 구조 분석

### ⚠️ 주요 문제
1. **버전 관리 혼재**
   - `/app/api/` 하위에 v1(암시적)과 v2가 혼재
   - v1 API가 점진적으로 v2로 마이그레이션 중
   - 일부 엔드포인트는 두 버전이 동시에 존재

2. **v2 API 구조**
   - 더 체계적인 디렉토리 구조
   - 테스트 파일이 함께 포함됨
   - 미들웨어와 유틸리티가 모듈화됨

## 3. 상태 관리 패턴 분석

### 현재 상태
1. **Zustand 사용**: 
   - `zustand@^5.0.5` 의존성 확인
   - `/app/store/reservation-store.ts` 한 개 파일만 발견
   - 매우 제한적인 사용 (lastReservationId만 저장)

2. **React Query 사용**:
   - `@tanstack/react-query@^5.81.2` 의존성 확인
   - 실제 사용 코드는 발견되지 않음
   - 테스트 렌더 설정에만 참조됨

### ⚠️ 문제점
- 상태 관리 전략이 명확하지 않음
- React Query가 설치되어 있으나 활용되지 않음
- 서버 상태 관리가 전통적인 fetch 방식으로 구현됨

## 4. 테스트 구조 분석

### ✅ 잘 구성된 부분
- 각 계층별로 `__tests__` 디렉토리가 잘 구성됨
- 도메인, 애플리케이션, 인프라 계층 모두 테스트 존재
- API 레벨 통합 테스트 구현

### ⚠️ 개선 필요 사항
1. **테스트 위치 불일치**
   - 대부분: `__tests__` 디렉토리 내부
   - 일부: 소스 파일과 같은 레벨 (예: `/app/api/v2/reservations/route.test.ts`)

2. **E2E 테스트**
   - Playwright 설정은 있으나 실제 테스트 파일이 보이지 않음
   - `/tests/` 디렉토리가 git status에는 있으나 내용 확인 필요

## 5. TODO/FIXME/HACK 주석 분석

### 발견된 TODO 목록
1. **NotificationSupabaseRepository** (5개)
   - 전체 메서드가 TODO로 구현되지 않음
   - 더미 구현체만 존재

2. **PaymentSupabaseRepository** (5개)
   - 전체 메서드가 TODO로 구현되지 않음
   - 더미 구현체만 존재

3. **process-checkin.use-case.ts**
   - 62번 줄: `paymentAmount: 30000, // TODO: 예약에서 금액 정보를 가져와야 함`
   - 하드코딩된 금액

4. **admin/settings/page.tsx**
   - 117번 줄: `// TODO: API 구현 후 추가`

5. **문서 관련**
   - `performance_optimization.md` - TODO
   - `testing_strategy.md` - TODO (파일은 있으나 내용 깨짐)
   - `admin_manual.md` - TODO
   - `troubleshooting_guide.md` - TODO

## 6. 기술 부채 우선순위

### 🔴 긴급 (High Priority)
1. **NotificationSupabaseRepository 구현**
   - 알림 기능이 작동하지 않음
   - 사용자 경험에 직접적 영향

2. **PaymentSupabaseRepository 구현**
   - 결제 기능이 작동하지 않음
   - 비즈니스 크리티컬

3. **체크인 금액 하드코딩 제거**
   - 실제 예약 정보에서 금액 조회 필요

### 🟡 중요 (Medium Priority)
1. **API 버전 통합**
   - v1 API를 v2로 완전 마이그레이션
   - 중복 코드 제거

2. **DTO 디렉토리 통합**
   - `dto` vs `dtos` 디렉토리 정리

3. **Entity 파일명 규칙 통일**
   - `.entity.ts` 접미사 사용 여부 결정

4. **checkin vs check-in 명명 통일**
   - 일관된 명명 규칙 적용

### 🟢 개선 사항 (Low Priority)
1. **React Query 활용**
   - 서버 상태 관리 개선
   - 캐싱 및 동기화 최적화

2. **테스트 위치 표준화**
   - 모든 테스트를 `__tests__` 디렉토리로 이동

3. **E2E 테스트 작성**
   - 주요 사용자 시나리오 커버

4. **문서 완성**
   - TODO로 표시된 문서들 작성

## 7. 권장 조치 사항

### 즉시 실행
1. NotificationSupabaseRepository 구현
2. PaymentSupabaseRepository 구현
3. 체크인 금액 로직 수정

### 단기 계획 (1-2주)
1. API v1 → v2 마이그레이션 완료
2. 파일/디렉토리 명명 규칙 통일
3. React Query 도입 검토 및 POC

### 중기 계획 (1개월)
1. 전체 테스트 커버리지 향상
2. E2E 테스트 스위트 구축
3. 문서화 완성

## 8. 아키텍처 개선 제안

1. **Repository 패턴 일관성**
   - BaseRepository 활용 확대
   - 공통 CRUD 로직 추상화

2. **에러 처리 표준화**
   - 도메인별 커스텀 에러 클래스
   - 일관된 에러 응답 형식

3. **이벤트 기반 아키텍처 고려**
   - 예약 상태 변경 시 이벤트 발행
   - 알림, 통계 등 부가 기능 분리

4. **모니터링 및 로깅**
   - 구조화된 로깅 시스템
   - APM 도구 통합 고려