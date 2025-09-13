# Cloudflare Integration Guide (Workers/Pages + D1)

본 문서는 본 레포의 v3 백엔드를 Cloudflare 환경에 연결하는 절차를 표준화합니다. 다른 프로젝트에서도 그대로 재사용 가능하도록 작성되었습니다.

## 구성 요약
- 런타임: Cloudflare Workers/Pages Functions
- 데이터베이스: Cloudflare D1 (SQLite)
- 바인딩: D1 바인딩을 런타임에 주입
- 기능 토글: `D1_ENABLED='true'`
- 선택: 바인딩명 변경 시 `D1_BINDING_NAME='MY_DB'`

## 1) 스키마 적용
- 파일: `docs/sql/d1_reservations_and_pricing.sql`
- 포함: `reservations`, `device_pricing` 테이블과 인덱스
- 적용: Wrangler Dashboard 또는 wrangler CLI로 실행

## 2) 환경 변수 설정
- `D1_ENABLED='true'`
- `D1_BINDING_NAME='DB'` (기본값: `DB`)
- 기존 앱 변수: `NEXT_PUBLIC_APP_URL`, `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` 등

## 3) 바인딩 설정(wrangler.toml 예시)
```
name = "gameplaza-v3"
main = "server.js"
compatibility_date = "2024-09-01"

[[ d1_databases ]]
binding = "DB"              # D1_BINDING_NAME과 일치해야 함
database_name = "gameplaza"
database_id = "<YOUR-D1-ID>"
```

> 바인딩명이 `DB`가 아닐 경우, 앱의 `D1_BINDING_NAME` 환경변수에 동일한 이름을 설정하세요. 코드에서는 우선 `D1_BINDING_NAME` → `env.<binding>` → `env.DB` → `globalThis.DB` 순으로 탐지합니다.

## 4) 시드(device_pricing)
- 최소 1개 이상의 기기종류별 가격 정의가 있어야 서버 금액 계산이 정상 동작합니다.
- 예시: `docs/sql/d1_reservations_and_pricing.sql`의 seed 주석 참조
- 필드: `device_type_id`, `option_type('fixed'|'freeplay'|'unlimited')`, `price`, `price_2p_extra?`, `enable_extra_people(0|1)`, `extra_per_person?`

## 5) 로컬 개발
- 기본: 로컬 JSON 저장소(`data/local-db/reservations.json`) 사용 (D1_DISABLED)
- Cloudflare 개발 서버에 연결 테스트 시:
  - `D1_ENABLED='true'`
  - wrangler dev/preview 환경에서 바인딩이 `env`로 주입되도록 실행

## 6) 배포 체크리스트
- [ ] D1 스키마 적용 완료
- [ ] device_pricing 최소 1개 이상 존재
- [ ] D1_ENABLED / D1_BINDING_NAME 환경변수 설정
- [ ] OAuth/비밀키 환경변수 설정
- [ ] v3 API 헬스체크: `GET /api/v3/health`
- [ ] 예약 생성 금액 산정 확인: `POST /api/v3/reservations`

## 7) 트러블슈팅
- 금액이 0으로 나오는 경우: device_pricing 미정의 여부 확인
- 500 에러, "[D1] Database is not configured": 바인딩/환경변수 미설정
- 로컬에서만 동작: `D1_ENABLED`가 false이거나, 바인딩이 dev에 주입되지 않음

## 참고 문서
- 스키마: `docs/specs/database/reservations-d1-schema.md`
- 가격 정책: `docs/specs/database/pricing-policy-mapping.md`
- 어댑터: `lib/db/adapter.ts`, D1: `lib/db/d1.ts`

