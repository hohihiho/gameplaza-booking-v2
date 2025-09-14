# 게임플라자 실시간 대여/예약 시스템 핸드오버 문서

본 문서는 Cloudflare(D1 + Durable Objects + WebSocket) 기반으로 재구성한 대여/예약 시스템의 전반을 요약합니다. 신규 기여자/외주/운영 인수인계를 위한 개요, 파일 위치, 배포/운영 방법, 주의사항을 포함합니다.

## 1) 아키텍처 개요
- DB: Cloudflare D1(스키마/시드 포함)
- 실시간: Durable Objects(DevicesHub) + WebSocket + 폴백 스냅샷(10초)
- 서버: Next.js Route Handlers(D1만 사용)
- 관리자: 타입/시간블록/요금/기기 CRUD + 기기현황(실시간 상태)
- 사용자: 리듬게임 대여정책(시간/요금/2인/청소년) 반영, 예약 생성/수정/취소, 예약번호 자동 생성(YYMMDD-NNN)

## 2) 도메인/Zone
- 운영: `gameplaza.kr`
- 개발: `dev.gameplaza.kr`
- Cloudflare Zone ID: `bec19190c3aadcb866d5e3311a18dab6`

## 3) 실시간 인프라(안정성 우선)
- Worker/DO: `workers/devices-hub.ts`
  - WS: `/ws/devices?topics=all[,type:{id},device:{id}]`
  - 내부 발행: `POST /internal/publish` `{ topic, type, payload, ts }`
- 라우팅(`workers/devices-hub.wrangler.toml`)
  - dev: `dev.gameplaza.kr/ws/*`, `dev.gameplaza.kr/internal/*`
  - prod: `gameplaza.kr/ws/*`, `gameplaza.kr/internal/*`
- 서버 발행 유틸: `lib/realtime/publish.ts`
  - `PUBLISH_BASE_URL` 기반(없으면 상대경로)
  - Authorization: `Bearer PUBLISH_SECRET` 지원
- 클라이언트 구독 유틸: `lib/realtime/ws-client.ts`
- 스냅샷 API: `GET /api/v3/devices/status`
  - 현재 시간 기준 rental/available 계산, `maintenance/disabled` 우선
- 관리자 기기현황: `/admin/rentals/devices`
  - WebSocket 실시간 + 10초 폴백
  - 수동 상태 변경(available/rental/maintenance/disabled)

## 4) D1 마이그레이션/시드(통합)
- 마스터 파일: `migrations/2025-09-14_000_master.sql`
  - 카탈로그(타입/기기) + 예약/요금 스키마 + 알터(청소년 플래그, 예약번호) + 리듬게임 시드
- 실행(개발 DB)
  - `bash scripts/migrate-d1.sh gameplaza-developmentd8bb6ff7-b731-4d5a-b22f-4b3e41c9ed8e`

## 5) 리듬게임 대여정책(요약)
- 기기 대수
  - maimai 4대(동시대여 3대), CHUNITHM 3대, SDVX Valkyrie 13대, IIDX Lightning 1대
- 시간 블록
  - maimai/CHUNITHM: 07-12, 08-12, 09-13(청소년), 24-28
  - SDVX/IIDX: 07-12, 08-12, 09-13(청소년), 24-29
- 요금/크레딧
  - maimai/CHUNITHM: freeplay/unlimited, 야간할증 없음(블록 시간에 따라 요금 결정)
  - maimai 2인 +10,000
  - maimai: 4h 25,000 / 5h 30,000 (free/unlimited 동일)
  - CHUNITHM: free 4h 30,000 / 5h 40,000, unlimited 4h 40,000 / 5h 50,000
  - SDVX: fixed 84크레딧 33,000
  - IIDX: fixed 90크레딧 45,000
- 모델 기준: Valkyrie(SDVX), Lightning(IIDX), Arena(GITADORA)만 `model_name` 사용, 이외는 `version_name` 중심

## 6) 관리자/서버 API(핵심)
- 관리자
  - 타입: `GET/POST /api/v3/admin/device-types`, `GET/PUT/DELETE /api/v3/admin/device-types/:id`
  - 시간블록: `GET/POST /api/v3/admin/device-types/:id/time-blocks`, `PUT/DELETE /api/v3/admin/device-types/:id/time-blocks/:blockId`
  - 요금: `GET/POST /api/v3/admin/device-types/:id/pricing`, `PUT/DELETE /api/v3/admin/device-types/:id/pricing/:pricingId`
  - 기기: `GET/POST /api/v3/admin/devices`, `GET/PUT/DELETE /api/v3/admin/devices/:id`
- 사용자
  - 스냅샷: `GET /api/v3/devices/status`
  - 예약: `POST /api/v2/reservations/create`(예약번호 자동), `PATCH/DELETE/GET /api/v2/reservations/:id`
  - 조회: `GET /api/public/reservations/by-number?number=예약번호 또는 예약ID`
- 실시간 이벤트(발행됨)
  - `device.status.updated`, `reservation.created`, `reservation.updated`, `reservation.cancelled`
  - 토픽: `all`, `device:{deviceId}` (확장 시 `type:{deviceTypeId}`)

## 7) 배포·설정 체크리스트
- D1 마이그레이션(개발 DB)
  - `bash scripts/migrate-d1.sh gameplaza-developmentd8bb6ff7-b731-4d5a-b22f-4b3e41c9ed8e`
- DevicesHub 시크릿 등록
  - dev: `wrangler secret put PUBLISH_SECRET -c workers/devices-hub.wrangler.toml --env development`
  - prod: `wrangler secret put PUBLISH_SECRET -c workers/devices-hub.wrangler.toml --env production`
- DevicesHub 배포(라우팅 포함)
  - dev: `npx wrangler publish -c workers/devices-hub.wrangler.toml --env development`
  - prod: `npx wrangler publish -c workers/devices-hub.wrangler.toml --env production`
- 앱 환경변수
  - dev: `PUBLISH_BASE_URL=https://dev.gameplaza.kr`, `NEXT_PUBLIC_WS_ENDPOINT=https://dev.gameplaza.kr/ws/devices`
  - prod: `PUBLISH_BASE_URL=https://gameplaza.kr`, `NEXT_PUBLIC_WS_ENDPOINT=https://gameplaza.kr/ws/devices`

## 8) 주의/운영상 포인트
- DNS 프록시 On → Worker 라우트(`/ws/*`, `/internal/*`) 적용 확인
- `PUBLISH_SECRET` 절대 노출 금지, 환경별 분리/주기적 로테이션 권장
- 폴백 스냅샷 10초(필요시 5초) → WS 장애/유실 보정
- `maintenance/disabled` 수동상태는 자동 계산보다 우선
- 시간 모델: KST, 24~29시는 0~5시(야간대역) 표현
- `/internal/publish` 보호: 시크릿 + WAF/Firewall Rule로 서버만 허용 권장

## 9) 검증(Dev)
- WS 연결: `wss://dev.gameplaza.kr/ws/devices?topics=all`
- 내부 발행(테스트):
```
curl -X POST https://dev.gameplaza.kr/internal/publish \
  -H "Authorization: Bearer <DEV_PUBLISH_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"topic":"all","type":"device.status.updated","payload":{"id":"00000000-0000-0000-0000-000000100201","status":"rental"}}'
```
- 관리자 현황(`/admin/rentals/devices`)에 즉시 반영(폴백은 10초 이내)

## 10) TODO(추가 개선)
- 타입별 토픽 구독 확대(예약/진행률/잔여대수 실시간 반영)
- 현황 대시보드(타입별 가동/대여/점검 집계)
- 기기 단건 편집 UI 강화(번호/타입/상태 일괄 편집)
- 백오피스 접근제어(관리자 토큰/역할)

