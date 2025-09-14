# 리듬게임 대여 스펙 (Cloudflare D1 기준)

## 대여 대상 및 보유 대수
- maimai: 총 4대 (동시 대여 최대 3대)
- CHUNITHM: 총 3대
- beatmania IIDX Lightning Model: 총 1대
- SOUND VOLTEX Valkyrie Model: 총 13대

## 시간 블록
- 공통 표기: 24~29시는 0~5시의 야간 시간대를 24시 표기로 변환
- CHUNITHM, maimai
  - 조기대여: 07-12, 08-12, 09-13(청소년 시간대)
  - 밤샘대여: 24-28
- SOUND VOLTEX Valkyrie, beatmania IIDX Lightning
  - 조기대여: 07-12, 08-12, 09-13(청소년 시간대)
  - 밤샘대여: 24-29

## 크레딧 옵션 및 요금 정책
- CHUNITHM, maimai
  - 옵션: freeplay, unlimited 중 선택
  - 야간 할증 없음. 시간 블록의 시간 길이에 따라 요금 결정
  - maimai 2인 옵션 지원: 추가 10,000원
  - 요금표
    - maimai
      - freeplay: 4시간 25,000 / 5시간 30,000
      - unlimited: 4시간 25,000 / 5시간 30,000
    - CHUNITHM
      - freeplay: 4시간 30,000 / 5시간 40,000
      - unlimited: 4시간 40,000 / 5시간 50,000
- SOUND VOLTEX Valkyrie, beatmania IIDX Lightning
  - 옵션: fixed (고정 크레딧)
  - 야간 할증 없음. 고정 크레딧은 시간과 무관하게 동일 요금
  - 요금표
    - SOUND VOLTEX Valkyrie: 84 크레딧 충전, 33,000원
    - beatmania IIDX Lightning: 90 크레딧 충전, 45,000원

## D1 데이터 모델 적용
- device_types.rental_settings
  - maimai: `{ "max_rental_units": 3, "max_players": 2 }`
- rental_time_blocks 컬럼
  - slot_type: 'early' | 'overnight'
  - start_time/end_time: HH:MM:SS (24~29시 허용)
  - is_youth_time: 0/1 (09-13 블록에 1)
  - enable_extra_people, extra_per_person: 2인 옵션/추가요금에 사용
- reservations.reservation_number (YYMMDD-NNN)
  - 매일 000부터 증가

## API 반영 (v2)
- GET /api/v2/devices/available-for-reservation
  - D1 기반으로 가용/펜딩 대수 산출
- GET /api/v2/time-slots/available
  - 블록별 duration에 따라 creditOptions 생성
  - maimai: enable2P=true, price2PExtra=10000
- POST /api/v2/reservations/create
  - reservation_number 자동 생성(YYMMDD-NNN)
- PATCH /api/v2/reservations/{id}
  - 날짜/시간/메모 수정, 겹침 방지

## ✅ 실시간 기기 상태 시스템 (완료 - 2025.09.14)

### 완료된 구현
- **D1 데이터베이스 마이그레이션** ✅
  - 마스터 마이그레이션 파일: `migrations/2025-09-14_000_master.sql`
  - 기존 스키마 제거 후 완전 재구축
  - 리듬게임 기기 시드 데이터 삽입 (CHUNITHM 3대, maimai 4대, SOUND VOLTEX 13대, beatmania IIDX 1대)

- **DevicesHub WebSocket Worker** ✅
  - Cloudflare Durable Objects 기반 실시간 통신
  - 배포 완료: `wss://dev.gameplaza.kr/ws/devices` (개발), `wss://gameplaza.kr/ws/devices` (운영)
  - PUBLISH_SECRET 인증 적용
  - SQLite 상태 관리

- **실시간 관리자 UI** ✅
  - 경로: `/admin/rentals/devices`
  - WebSocket 연결 + 10초 폴링 폴백
  - 기기 상태 실시간 반영: available/rental/maintenance/disabled
  - 일괄 편집 모드, 필터링, 검색 기능
  - 현대적 UI/UX (Framer Motion 애니메이션, Lucide 아이콘)

- **WSClient 라이브러리** ✅
  - 파일: `lib/realtime/ws-client.ts`
  - 자동 재연결, 에러 핸들링
  - 토픽 구독 시스템

### 환경 설정 완료
```bash
# .env.local 추가
PUBLISH_BASE_URL=https://dev.gameplaza.kr
NEXT_PUBLIC_WS_ENDPOINT=https://dev.gameplaza.kr/ws/devices
PUBLISH_SECRET=gameplaza-secret-1757809174
```

## 📋 다음 단계 (예정)

### 1. 실시간 예약 시스템 통합
- 예약 생성/수정/취소 시 기기 상태 자동 업데이트
- DevicesHub로 상태 변경 메시지 전송
- 예약 페이지에서 실시간 대여 가능 상태 표시

### 2. 체크인/체크아웃 시스템
- QR 코드 기반 체크인 프로세스
- 기기 상태 'available' → 'rental' → 'available' 자동 전환
- 관리자 대시보드에서 실시간 대여 현황 모니터링

### 3. 알림 시스템
- 기기 고장 신고 시 상태 'maintenance'로 자동 전환
- 관리자에게 실시간 알림 (토스트, 이메일)
- 사용자에게 예약 상태 변경 알림

### 4. 운영 도구
- 기기 사용률 통계 (실시간 데이터 기반)
- 점검 스케줄 관리
- 장애 로그 및 복구 이력

