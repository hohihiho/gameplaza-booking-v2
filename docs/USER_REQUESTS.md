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