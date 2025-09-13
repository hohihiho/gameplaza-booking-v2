# Pricing Policy Mapping (v3 Backend)

본 문서는 예약 금액(total_amount) 산정 방식을 스펙에 맞춰 표준화하기 위한 매핑 규칙을 정리합니다. 겹칠 경우 `docs/specs`의 명세서를 우선합니다.

## 참고 명세
- SPEC-006 대여가격 설정: `docs/specs/006-rental-pricing-system.md`
- 운영 일정/시간대: `docs/specs/007-operation-schedule-management.md`
- 예약 스키마(D1): `docs/specs/database/reservations-d1-schema.md`

## 데이터 소스
- device_pricing (권장, 기기종류별 가격/옵션 정의)
  - device_type_id (FK), option_type('fixed'|'freeplay'|'unlimited'), price
  - price_2p_extra (선택), enable_extra_people (BOOLEAN), extra_per_person (INTEGER)
- device_types: 기종 정보/정책(대여 가능 대수 등)
- rental_time_slots: 시간대 정보(필요 시 참고용, 금액 산정은 기기종류 기준)

## 산정 원칙(요약)
1) 기본가격 = 선택한 기기종류의 선택된 크레딧 옵션 가격(device_pricing.price)
2) 2인 플레이 허용 시 추가요금 합산(device_pricing.price_2p_extra)
3) 추가 인원 옵션이 활성화된 경우, 2인 이상이면 (인원-1)*extra_per_person을 합산
4) 추가금액(extra_fee)이 있으면 더함(현장 조정 등)
5) 모든 금액은 1,000원 단위, 0 이상(검증)

## 입력 → 산정 파라미터 매핑
- device_type_id (필수): 기기종류 ID
- credit_option_type (필수): 'fixed' | 'freeplay' | 'unlimited'
- is_2p (선택): 2인 플레이 여부
- participants (선택): 참가 인원(기본 1)
- extra_fee (선택): 추가 금액(현장 조정 등)

프론트에서 위 파라미터를 보내면, 서버는 device_pricing에서 가격정보를 조회하여 총 금액을 산정합니다.

## 서버 동작(현 상태)
- v3 POST /api/v3/reservations:
  - total_amount 값이 없으면 device_type 기반으로 서버 산정(credit_option_type, is_2p, participants, extra_fee 반영)
- v3 POST /api/v3/reservations/:id/checkin:
  - payment_method/payment_amount를 기록 (결제 요약)

## 구현 상태 (진행형)
- [x] 입력 금액 저장 및 체크인 결제 요약 기록
- [ ] time_slot_id/credit_option 기반 서버 산정 로직
- [ ] 2P/참가자 수 반영 추가요금 계산
- [ ] 금액 범위/형식 검증(명세 상수화)

## 변경 이력
- 2025-09-12: 초안 작성 (명세 매핑/현 상태/향후 계획)

## 향후 계획(엔진 연동)
- lib/pricing 강화:
  - getDevicePricing(deviceTypeId, optionType) → { price, price_2p_extra, enable_extra_people, extra_per_person }
  - computeTotal({ deviceTypeId, creditOptionType, is2p, participants, extra_fee }) → { base, extras..., total }
- 검증 상수화: 금액 단위/범위 서버 상수로 고정

## 예시
- 조기대여(07:00-12:00, 5시간), fixed(100크레딧)=25,000원, 2P 추가 5,000원
  - total = 25,000 + 5,000 = 30,000원
- 밤샘대여(22:00-05:00, 7시간), freeplay=55,000원, 1P
  - total = 55,000원

## 검증 규칙
- 금액 범위: 1,000원 ~ 100,000원 (조정 가능)
- 형식: 정수(원 단위)
- 음수/소수 불가

## 참고 구현 포인트
- KST 기준 날짜/시간 처리 일관화
- 슬롯 겹침과 1인 1대 원칙은 별도 검증 로직에서 처리
- 청소년 시간대/이벤트 할인은 rental_time_slots 가격에 반영 (정책 확장 시 별도 필드 고려)
