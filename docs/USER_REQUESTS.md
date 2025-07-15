# 📋 사용자 요청 기록

이 문서는 프로젝트 진행 중 받은 모든 사용자 요청사항을 기록합니다.

## 📌 기록 규칙
- 모든 요청은 날짜순으로 기록
- 구현 완료 여부와 관련 파일 명시
- 중복 요청 확인을 위한 검색 가능한 형식 유지

## 🗂️ 요청 기록

### 2025-01-03

#### ✅ 예약 목록 API 500 에러 수정
- **문제**: GET /api/reservations 에서 500 에러 발생
- **원인**: undefined user 변수 참조
- **해결**: session.user.email 사용하도록 수정
- **파일**: 
  - `app/api/reservations/route.ts`
  - `app/reservations/page.tsx`

#### ✅ 예약 목록 필터링 시 전체 개수 유지
- **문제**: 필터링 적용 시 "전체" 탭의 개수가 변경됨
- **해결**: 전체 데이터를 별도 state로 관리하고 클라이언트 사이드 필터링 적용
- **파일**: 
  - `app/reservations/page.tsx`
  - `app/admin/reservations/page.tsx`

#### ✅ 관리자 예약 관리 페이지 상단 고정
- **문제**: 스크롤 시 필터 탭이 고정되지 않음
- **원인**: 관리자 레이아웃의 overflow-y-auto 설정
- **해결**: 
  - sticky 헤더 구현
  - 관리자 레이아웃에서 overflow 제거
  - main 태그 중첩 문제 해결
- **파일**: 
  - `app/admin/reservations/page.tsx`
  - `app/admin/layout.tsx`

#### ✅ 운영 일정 관리 개선
- **요청 내용**:
  1. 시간 선택을 30분 단위로 변경
  2. 제목 필드 제거하고 설명만 남기기
  3. "조기 오픈"을 "조기 영업"으로 변경
- **구현**:
  - time input에 step="1800" 추가
  - 제목 필드 완전 제거
  - 표시 로직을 설명 우선으로 변경
- **파일**: `app/admin/schedule/page.tsx`

### 2025-01-04

#### ✅ 모델명/버전명 관리 위치 변경
- **요청 내용**: 
  - 모델명과 버전명을 개별 기기가 아닌 기종 레벨에서 관리
  - 기종 관리에서 모델명/버전명 입력 가능하게 수정
  - 대여 가격 설정은 대여기기 관리에서만 처리
- **구현**: 
  - device_types 테이블에 model_name, version_name 컬럼 추가
  - devices 테이블에서 model_name, version_name 컬럼 제거
  - 모든 관련 페이지에서 device_types를 통해 모델명/버전명 참조
- **파일**:
  - `supabase/migrations/20250704_move_model_to_device_type.sql`
  - `supabase/migrations/20250704_add_device_type_fields.sql`
  - `types/database.ts`
  - `app/admin/devices/page.tsx`
  - `app/api/admin/device-types/route.ts`
  - `app/api/admin/device-types/[id]/route.ts`
  - `app/api/public/schedule/route.ts`
  - `app/schedule/page.tsx`
  - `app/admin/checkin/page.tsx`
  - `app/admin/reservations/page.tsx`
  - `app/api/admin/reservations/route.ts`
  - `app/api/reservations/route.ts`
  - `app/reservations/page.tsx`
  - `docs/planning/complete_specification.md`

### 2025-07-04 (계속)

#### ✅ 예약 확정 일정 표시 문제
- **요청**: "예약확정 일정들이 안보임"
- **해결**: 
  - supabaseAdmin 사용하여 RLS 우회
  - confirmed, completed 상태 표시
  - 예약이 있는 시간대만 표시
- **파일**: `app/schedule/page.tsx`

#### ✅ 밤샘 시간 표시 개선
- **요청**: "밤샘 데이터중에 이해할 수 없는 데이터가 하나 있어. 밤샘영업이 08:00 ~ 05:00"
- **해결**: 
  - 24시간+ 포맷 사용 (05:00 → 29시)
  - formatTime24Plus 함수 구현
  - 조기마감/밤샘제한 마감시간만 표시
- **파일**: `app/schedule/page.tsx`

#### ✅ UI/UX 개선
- **요청**: 
  - "이번 달 주요일정 너무 길기도 하고 무슨소용인가 싶어. 그냥 아얘 없애버려"
  - "기종 레벨에서 말고 보는데에도 설명 대신 모델/버전 이런식으로 보이게 해줘"
- **해결**:
  - 주요일정 섹션 제거
  - 설명 대신 모델/버전 태그로 표시
  - 설명 입력란 단일 라인으로 변경
- **파일**: 
  - `app/schedule/page.tsx`
  - `app/admin/devices/page.tsx`
  - `app/admin/schedule/page.tsx`
  - `app/admin/checkin/page.tsx`

#### ✅ 인증 오류 수정
- **요청**: "기기관리에서 모델명 버전명이 저장이 안되는데 확인 부탁해"
- **해결**:
  - API 라우트에서 supabaseAdmin 사용
  - Next.js 15 params Promise 처리
- **파일**: 
  - `app/api/admin/device-types/[id]/route.ts`
  - `app/lib/supabase.ts`

#### ✅ Play Modes 저장 문제
- **요청**: "기기 관리에서 모드별 가격 업데이트가 안되는데 확인해줘"
- **해결**:
  - RLS 정책 추가 (INSERT/UPDATE/DELETE)
  - 개발 환경용 임시 정책 적용
- **우려사항**: "음.. 개발환경을 위한 정책인거 마음에 걸리는데?"
- **파일**: 
  - `supabase/migrations/20250704_fix_play_modes_rls.sql`
  - `app/api/admin/devices/types/[id]/play-modes/route.ts`
  - `app/admin/devices/page.tsx`

#### ✅ 예약 생성 오류
- **요청**: "최종 예약처리가 안되네 Error: 선택한 기기를 사용할 수 없습니다"
- **해결**: 
  - DB 스키마에 맞춰 쿼리 수정
  - device_number 필드 추가
- **파일**: `app/reservations/new/page.tsx`

#### ✅ 관리자 인증 기반 RLS 정책
- **배경**: 개발용 RLS 정책에 대한 우려
- **구현**:
  - admins 테이블 생성 (role 컬럼 포함)
  - is_admin(), is_super_admin() 함수 구현
  - 프로덕션용 보안 정책 작성
  - 슈퍼관리자: ndz5496@gmail.com
- **파일**: 
  - `supabase/migrations/20250704_admin_auth_rls.sql`
  - `supabase/migrations/20250704_admin_rpc_functions.sql`

#### ✅ 관리자 관리 페이지
- **요청**: "관리자는 ndz5496@gmail.com 으로 앞으로도 계속 여기로 할듯 얘가 슈퍼관리자 하고 관리자 추가 기능하면 관리자 동일기능하게"
- **구현**:
  - 슈퍼관리자만 접근 가능한 관리자 관리 페이지
  - 관리자 추가/삭제 기능
  - 이메일로 사용자 검색 후 관리자 권한 부여
  - 슈퍼관리자는 삭제 불가
- **파일**: 
  - `app/admin/admins/page.tsx`
  - `app/admin/layout.tsx`

### 2025-01-04 (이어서)

#### ✅ AI 기반 비속어 필터링 시스템
- **요청**: 기획서 파일들을 업데이트하고 구현된 기능들 반영
- **구현**:
  - 한국어 특화 필터 (자음/모음 분해, 유사음 감지)
  - 영어 특화 필터 (Leetspeak, 변형 감지)
  - 스팸/광고 패턴 차단
  - 실시간 필터링 적용
  - 무료 버전으로 구현 (외부 API 없이)
- **파일**: 
  - `app/lib/ai-filter.ts`
  - `app/api/auth/signup/route.ts`
  - `app/api/profile/route.ts`
  - `app/components/auth/SignUpForm.tsx`
  - `app/profile/page.tsx`

#### ✅ 관리자용 금지어 관리 시스템
- **요청**: 관리자가 금지어를 직접 관리할 수 있는 시스템
- **구현**:
  - 금지어 추가/수정/삭제 기능
  - 카테고리별 분류 (비속어, 스팸, 광고 등)
  - 언어별 분류 (한국어, 영어)
  - 심각도 레벨 관리 (경고, 차단)
  - 검색 및 필터링 기능
  - 실시간 동기화로 즉시 적용
- **파일**: 
  - `app/admin/forbidden-words/page.tsx`
  - `app/api/admin/forbidden-words/route.ts`
  - `app/admin/layout.tsx`
  - `supabase/migrations/20250104_create_forbidden_words.sql`

#### ✅ 전화번호 인증 기능
- **요청**: SMS 인증 시스템 구현
- **구현**:
  - 6자리 인증 코드 발송
  - 5분 만료 시간
  - 개발 환경 테스트 모드 (콘솔 출력)
  - 인증 완료 후 회원가입 진행
- **파일**: 
  - `app/api/auth/send-sms/route.ts`
  - `app/api/auth/verify-sms/route.ts`
  - `app/components/auth/SignUpForm.tsx`

#### ✅ 회원가입 완료 환영 페이지
- **요청**: 회원가입 후 환영 인사 및 서비스 소개
- **구현**:
  - 축하 애니메이션 효과
  - 서비스 간단 소개
  - 첫 예약 유도 버튼
  - 자동 리다이렉트 (5초)
- **파일**: 
  - `app/welcome/page.tsx`
  - `app/api/auth/signup/route.ts`

### 2025-07-14

#### ✅ 전화번호 인증 제거 및 단순 중복 확인으로 변경
- **요청**: "하.. 오락실 예약시스템에 꼭 전화번호 인증이 필요할까? 전화번호 입력은 필요하다라고는 생각해."
- **구현**:
  - Firebase SMS 인증 완전 제거
  - 전화번호 직접 입력 방식으로 변경
  - 중복 확인 API 구현
  - 전화번호 형식 자동 포맷팅
- **파일**:
  - `app/signup/page.tsx`
  - `app/api/auth/phone/check/route.ts`
  - 삭제: SMS 인증 관련 모든 코드

#### ✅ 환영 페이지 게임패드 이모지 제거
- **요청**: "웰컴페이지에 이제 시작해볼까요? 옆에 게임패드 빼줘."
- **구현**: "이제 시작해볼까요? 🎮" → "이제 시작해볼까요?"
- **파일**: `app/welcome/page.tsx`

#### ✅ 예약 확정 시 자동 영업일정 업데이트
- **요청**: 
  - "조기영업 시간대 확정이 되면 자동으로 그날 가장 예약 확정된 빠른 시간대에 자동으로 조기영업 일정이 등록됨 > 다만, 수동으로 수정가능"
  - "밤샘영업도 마찬가지로 밤샘영업 시간대 확정이 되면 자동으로 그날 예약 확정된 가장 늦게 끝나는 시간대 마감으로 밤샘영업 일정이 등록됨 > 마찬가지로 수동으로 수정가능"
- **구현**:
  - schedule_events 테이블에 자동 생성 필드 추가 (is_auto_generated, source_type, source_reference)
  - ScheduleService 클래스 구현 (조기/밤샘 시간 자동 계산)
  - 예약 승인 API에서 자동 스케줄 업데이트 호출
  - 수동 일정이 있으면 자동 생성하지 않음
  - 자동 생성된 일정도 수동 수정 가능
- **파일**:
  - `supabase/migrations/20240107_add_auto_schedule_fields.sql`
  - `lib/services/schedule.service.ts`
  - `app/api/admin/reservations/route.ts`
  - `docs/기획서_운영일정관리.md`

#### ✅ 관리자 등록 및 전화번호 인증 백엔드 제거
- **요청**: 
  - "백엔드쪽 유저 정보중에 전화번호 제한 부분 삭제해야할거같아. 그리고 관리자 등록이 지금 1명도 없는 상태인데 어떻게 등록하지?"
  - "sql mcp로 실행 불가능? 전화번호 인증 관련 백엔드는 다 제거하는게 좋을거같아."
- **구현**:
  - ndz5496@gmail.com을 super admin으로 등록 (Supabase MCP 사용)
  - phone_verified 컬럼 및 관련 테이블/함수 제거
  - 전화번호 인증 API 파일 삭제
  - 백엔드 코드에서 phone_verified 참조 모두 제거
- **파일**:
  - 삭제: `/app/api/auth/phone/send-code/route.ts`, `/app/api/auth/phone/verify-code/route.ts`
  - 수정: `/lib/auth.ts`, `/app/api/auth/signup/route.ts`, `/app/api/users/check/route.ts`
  - 생성: `/supabase/migrations/20250114_remove_phone_verification.sql`
  - 수정: `/supabase/migrations/002_improved_schema.sql` (phone_verified 컬럼 제거)
  - 문서: `/docs/technical/database_schema.md`, `/docs/technical/architecture.md`

---

## 🔍 빠른 검색을 위한 키워드
- API 에러: 500, undefined, user
- 필터링: 전체 개수, 탭, 상태
- 상단 고정: sticky, 스크롤, 헤더
- 운영 일정: 30분, 제목, 조기 영업
- 모델명: 기종 레벨, device_types, 버전명
- 비속어 필터: AI, 한국어, 영어, 스팸
- 금지어 관리: 카테고리, 언어, 심각도
- SMS 인증: 전화번호, 6자리 코드, 5분
- 환영 페이지: 회원가입 완료, 애니메이션
- 자동 영업일정: 예약 확정, 조기영업, 밤샘영업, schedule_events
- 전화번호 인증: 제거, phone_verified, 백엔드
- 관리자 등록: super admin, ndz5496@gmail.com
- 체크인 프로세스: 결제완료, 수동 확인, 금액 조정
- 노쇼 처리: 사유 불필요, 간소화
- 시간 조정: 종료 시간만, KST 처리
- 예약 상태 색상: 노란색(승인), 초록색(체크인), 파란색(결제완료)
- 체크인 취소: 상태 롤백, 기기 사용가능
- 토스트 알림: alert 대체, 3초 자동 사라짐

### 2025-07-14 (이어서)

#### ✅ 관리자 대시보드 실제 데이터 연동
- **요청**: "대시보드 지금 목업파일인데 이거 다 실제 db와 이어줘."
- **구현**:
  - `/api/admin/dashboard` API 엔드포인트 생성
  - 오늘 매출, 예약 현황, 이용 현황, 기기 상태 실시간 조회
  - 전일 대비 증감률 계산
  - 30초마다 자동 새로고침
  - 최근 예약 목록 섹션 추가
- **파일**:
  - 생성: `/app/api/admin/dashboard/route.ts`
  - 수정: `/app/admin/page.tsx`

#### ✅ 관리자 사이드바 데스크톱 UI 개선
- **요청**: "데스크톱 기준 관리자쪽 사이드바에 사이트로 돌아가기랑 프로필 없어도 되지않나? 그냥 사이드바가 옆에있기도 하고 해서 중복일듯"
- **구현**: 데스크톱에서 사이드바 하단의 프로필 정보와 "사이트로 돌아가기" 버튼 제거 (모바일에서만 표시)
- **파일**: `/app/admin/layout.tsx`

#### ✅ 운영일정 관리 개선
- **요청**: "관리자 운영일정에서 해당 날짜 누르면 그날 일정 리스트 뜨는건 오케이인데 해당 일정 눌렀을때 수정뜨는게 안나오네. 운영일정 관리는 해당 계정에서 등록한것과 상관없이 남아있어야하는데 계정 탈퇴하니 다 사라진거같아."
- **구현**:
  - schedule_events 테이블의 created_by 외래키 CASCADE → SET NULL로 변경
  - viewingEvent 상세보기 모달 제거
  - 일정 클릭 시 바로 수정 모달 표시
  - 사용자 탈퇴 시에도 운영일정 보존
- **파일**:
  - 생성: `/supabase/migrations/20250114_fix_schedule_events_cascade.sql`
  - 수정: `/app/admin/schedule/page.tsx`
  - 문서: `/docs/기획서_운영일정관리.md`

#### ✅ 관리자 통계분석 데이터베이스 연동
- **요청**: "관리자 통계분석쪽도 db 연결해줘."
- **구현**:
  - `/api/admin/analytics/reservations` API 엔드포인트 생성
  - 예약 통계 데이터 실시간 조회 (요약 통계, 일별 추이, 시간대별 분포 등)
  - 날짜 범위 필터링 지원 (7일, 30일, 90일, 커스텀)
  - 기기별, 요일별, 상태별 분석 데이터 제공
  - 프론트엔드에서 실제 데이터 표시하도록 연동
- **파일**:
  - 생성: `/app/api/admin/analytics/reservations/route.ts`
  - 수정: `/app/admin/analytics/reservations/page.tsx`

### 2025-07-15

#### ✅ 체크인 및 결제 프로세스 전면 개편
- **요청**: 
  - "실제 시작시간" 제거 - 종료 시간 조정만 필요
  - 자동 계산 대신 수동 금액 조정
  - 현금만 환불 가능
  - "체크인" 버튼을 "결제완료"로 변경
  - 현금과 계좌이체 모두 결제 확인 가능하게
  - 결제 확인 후에도 결제 수단 변경 가능
  - 노쇼 처리 시 사유 입력 불필요
  - 종료 시간 조정 시 기기 상태를 "사용 가능"으로 자동 변경
  - pg_cron을 이용한 자동 기기 상태 변경 구현
- **구현**:
  - 시간 조정 모달에서 시작 시간 필드 제거
  - 금액 조정을 수동 입력 방식으로 변경
  - 모든 결제 유형에 대해 수동 확인 프로세스 적용
  - 노쇼 처리 간소화
  - UTC 대신 KST 시간대 처리 수정
  - 예약 상태 색상 코딩: 노란색(승인됨), 초록색(체크인), 파란색(사용중/결제완료)
  - 체크인 취소 기능 추가
  - 토스트 알림 시스템 구현
- **파일**:
  - `/app/admin/reservations/page.tsx`
  - `/app/admin/checkin/page.tsx`
  - `/app/api/admin/checkin/process/route.ts`
  - `/app/api/admin/checkin/payment-confirm/route.ts` (신규)
  - `/app/api/admin/reservations/time-adjustment/route.ts`
  - `/app/components/Toast.tsx` (신규)
  - 다수의 SQL 스크립트 파일

#### ✅ 마이페이지 예약 상태 표시 수정
- **요청**: "예약 승인된건데 마이페이지 예약쪽에 보면 예약 승인 대기로 되어있어. 이것도 체크해줘."
- **구현**: 
  - 'approved' 상태를 'pending'과 분리하여 별도로 카운트
  - 예약 상태 그리드를 4열에서 5열로 변경
  - 승인됨 상태에 파란색 적용
- **파일**:
  - `/app/api/mypage/reservation-stats/route.ts`
  - `/app/mypage/page.tsx`

#### ✅ payment_status 제약 조건 오류 수정
- **문제**: "ERROR: 23514: check constraint 'reservations_payment_status_check' of relation 'reservations' is violated by some row"
- **해결**: 
  - MCP를 통해 데이터베이스 제약 조건 업데이트
  - 'completed', 'confirmed' 값을 'paid'로 마이그레이션
- **파일**:
  - 데이터베이스 마이그레이션 (MCP 실행)

#### ✅ 체크인 페이지 모바일 레이아웃 개선
- **요청**: "모바일에선 일열로 보이던데 현재시간만 1열로 하고 나머진 2열씩 나눠도될듯"
- **구현**: 현재 시간은 전체 너비, 나머지 통계는 2열 그리드로 표시
- **파일**: `/app/admin/checkin/page.tsx`

#### ✅ 토스트 알림 시스템 구현
- **요청**: "안내팝업 못생겼는데 뭐 토스트 팝업이라던가로 변경안되나?"
- **구현**: 
  - 모든 alert() 호출을 토스트 알림으로 대체
  - 성공, 오류, 경고, 정보 타입 지원
  - 3초 후 자동 사라짐
  - 다크 모드 지원
- **파일**: 
  - `/app/components/Toast.tsx`
  - `/app/admin/checkin/page.tsx`

#### ✅ 체크인 취소 시 전체 상태 롤백
- **요청**: "결제완료 상태에서 체크인 취소하면 결제완료도 다 취소되고 체크인에서 승인됨으로 돌아가야해. 더불어 대여중도 다시 사용가능으로 변경"
- **구현**:
  - payment_status를 'pending'으로 재설정
  - 모든 결제 관련 필드 초기화
  - 기기 상태를 '사용 가능'으로 변경
  - 적절한 토스트 알림 표시
- **파일**: `/app/admin/checkin/page.tsx`