# User Management & Role Policy (v3 Backend)

본 문서는 사용자 직급(역할)과 제한/정지 정책을 단순하고 운영 친화적으로 정의합니다.

## 직급(역할) 계층
- `super_admin`: 슈퍼관리자 (최상위, 시스템 설정/토글/슈퍼 권한)
- `gp_vip`: 겜플VIP
- `gp_regular`: 겜플단골
- `gp_user`: 겜플유저(일반)
- `restricted`: 제한 (예약 금지 상태)

역할은 `user_roles` 테이블에 저장하며, 복수 역할을 가질 수 있습니다.
권한 체크는 `super_admin`을 최우선으로 하며, 일반 사용자는 `gp_*` 계열을 가질 수 있습니다.

## 제한/정지 정책
- 기간 제한: `user_restrictions`에 기간(start_date/end_date)과 사유 저장 → 기간 동안 예약 불가 처리
- 영구 정지: 블랙리스트(이메일/ID 관리)에 기록하고 운영팀 메일로 공지/관리
  - 코드 레벨에서는 `blocked_identities`(provider, subject, email_hash)로 재가입 방지

> 주의: 이메일은 바뀔 수 있으므로, OAuth 제공자의 `subject`(고유 식별자)를 기반으로 막는 것을 권장합니다.

## 재가입 방지
- `oauth_identities`: (user_id, provider, subject, email_hash)
- `blocked_identities`: (provider, subject?, email_hash?) – 둘 중 하나로 차단 가능
- 회원가입 시점에 `blocked_identities`를 조회하여 차단

## 스키마(요약)
- `user_roles(role_type CHECK IN ('super_admin','gp_vip','gp_regular','gp_user','restricted'))`
- `user_restrictions(restriction_type CHECK IN ('normal','restricted','suspended'), start_date, end_date, reason, is_active)`
- `oauth_identities(user_id, provider, subject, email_hash)`
- `blocked_identities(provider, subject?, email_hash?)`

## 운영 가이드
- "정지"(영구 블랙리스트)는 이메일보다는 OAuth subject로 기록
- "기간 제한"은 `user_restrictions`에 기록 후 만료 시 자동 해제(배치 또는 만료 체크 로직)
- "제한" 역할(`restricted`)은 화면/정책상 표시용으로 사용 가능하나, 실제 차단은 `user_restrictions`/`blocked_identities`로 수행 권장

## 자동 직급 부여(랭킹 기반)
대여 랭킹에 따라 일반 사용자 역할을 자동 부여합니다.

- 기준(권장: 월간 랭킹, KST 기준)
  - 1~5위: `gp_vip` (겜플VIP)
  - 6~20위: `gp_regular` (겜플단골)
  - 21위 이후/기본: `gp_user` (겜플유저)
  - `restricted`/`super_admin`은 항상 우선(자동 변경 제외)

- 업데이트 주기
  - 매일 06:00 KST 배치(스케줄러)로 전월/금월 기준 랭킹 집계 후 역할 갱신
  - 수동 트리거(관리자 전용 API)도 허용

- 랭킹 산정(예시 SQL)
```
-- 월간 랭킹(예약 건수 기준)
SELECT user_id, COUNT(1) AS cnt,
       ROW_NUMBER() OVER (ORDER BY COUNT(1) DESC) AS rank
FROM reservations
WHERE date >= strftime('%Y-%m-01','now','localtime')
  AND date <  strftime('%Y-%m-01','now','localtime','+1 month')
GROUP BY user_id;
```

- 역할 갱신 규칙
  - 기존 `gp_*` 역할 제거 → 새 랭킹에 따른 역할 1개만 부여
  - `restricted` 보유자는 갱신 제외(제한 우선)
  - `super_admin`은 갱신 제외(최상위 우선)

- UI 표시(배지)
  - 랭킹 페이지/마이페이지/프로필에 배지 표기: VIP/단골/일반
  - 배지 툴팁에 간단한 기준 안내(예: “월간 대여 랭킹 1~5위”) 

> 구현 시 주의: 동점/동순위 발생 시 DB 윈도우 함수 기준으로 결정되며, 필요하면 tie-breaker(최근 이용시각 등) 추가.

## TODO(연계)
- 회원가입 훅에서 `blocked_identities` 조회/차단 로직 연결
- 기간 제한 만료 자동 처리(스케줄러)
- 관리자 화면에서 간편 설정(드롭다운으로 직급 변경/제한 적용)
- 월간 랭킹 집계 배치 + 자동 직급 부여 로직 구현(06:00 KST)
