# Spec Implementation Status (v3 Backend)

이 문서는 기능별 구현 상태를 한눈에 볼 수 있는 대시보드입니다. 구현될 때마다 여기와 해당 스펙 문서의 "구현 상태/변경 이력"을 같이 갱신합니다.

## Legend
- ✅ Done
- 🟡 Partial (일부 구현/추가 예정)
- ⬜ Todo

## Core
- 인증/세션(Better Auth) — ✅ (서버 세션/클라 훅 구성)
- 예약(목록/생성/상세/삭제/체크인) — ✅ (`/api/v3/reservations*`, `/api/v3/me/reservations`)
- 금액 계산(기기종류+옵션+2인/추가인원+추가금) — ✅ (서버 계산, device_pricing 기반)

## Device & Pricing
- 기기 등록/수정/삭제 — ✅ (`/api/v3/admin/device-types*`)
- 가격 옵션 설정(고정/프리/무한) — ✅ (`/api/v3/admin/device-types/:id/pricing`)
- 2인/추가인원 옵션 — ✅ (price_2p_extra, enable_extra_people, extra_per_person)
- 대여 시간 블록(조기/밤샘) — ✅ (`/api/v3/admin/device-types/:id/time-blocks*`)
- 대여 가능 기기 조회 — ✅ (`/api/v3/devices/available`)

## Schedule
- 운영 일정 CRUD(관리자) — ✅ (`/api/v3/admin/schedule-events*`)
- 운영 일정 조회(사용자) — ✅ (`/api/v3/schedule/today`, `/api/v3/schedule`)

## CMS
- 약관(버전 관리) — ✅ (`/api/v3/admin/terms*`, `/api/v3/terms`)
- 이용안내(카테고리/콘텐츠) — ✅ (`/api/v3/admin/guide-*`, `/api/v3/guide`)

## Users
- 회원 목록/업서트 — ✅ (`/api/v3/admin/users`, 내부 업서트 유틸)
- 역할 관리 — ✅ (`/api/v3/admin/users/:id/roles`)
- 제한/정지(기간/영구) — ✅ (`/api/v3/admin/users/:id/restrictions`)
- 성인 인증 — ✅ (`/api/v3/admin/users/:id/verify-adult`, `/api/v3/me/age-verification`)
- 프로필 이미지 — ✅ (`/api/v3/me/profile-image`)
- 랭킹 기반 자동 직급 — ✅ (수동 트리거 + 크론 훅 구현)

## Notifications
- 구독 저장/해지 — ✅ (`/api/v3/notifications/subscribe|unsubscribe`)
- 공지 발송(관리자) — ✅ (`/api/v3/admin/notifications/announce`)
- 예약 알림 템플릿 — ✅ (서버 유틸)
- 템플릿 관리 — ✅ (`/api/v3/admin/notifications/templates*`)
- 테스트 발송 — ✅ (`/api/v3/admin/notifications/test`)
- VAPID 퍼블릭 키 — ✅ (`/api/v3/notifications/vapid-public-key`)

## Analytics
- 이용 통계 — ✅ (`/api/v3/admin/analytics/usage`)
- 매출 통계 — ✅ (`/api/v3/admin/analytics/sales`)
- 사용자 본인 통계 — ✅ (`/api/v3/me/analytics/summary`)
- 관리자 요약(월/년/일 매출 포함) — ✅ (`/api/v3/admin/analytics/summary`)

## Deployment
- Cloudflare D1 스키마/SQL — ✅ (`docs/sql/d1_reservations_and_pricing.sql`)
- 바인딩/환경/가이드 — ✅ (`docs/specs/deployment/cloudflare-integration.md`)
- Moderation Worker(무료 할당 프록시) — ✅ (`docs/specs/deployment/moderation-worker.md`)
- Moderation 통합 가이드 — ✅ (`docs/specs/deployment/moderation-integration.md`)
 - 랭킹 직급 크론 훅 — ✅ (`/api/cron/rebuild-roles`, CRON_SECRET 필요)

## Notes
- 프론트(UI)는 손대지 않음. 관리자/사용자 화면은 요청 시 API로 바로 연결 가능.
- 스펙 상세는 `docs/specs/database/*.md` 참고.
