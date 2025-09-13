# Device Management Schema (v3 Backend)

본 문서는 관리자 기능(기기 등록/대여 가능 여부/대수/모드별 가격/시간 블록)을 위한 D1 스키마와 API를 정의합니다.

## 테이블
### device_types
```
CREATE TABLE device_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  is_rentable INTEGER NOT NULL DEFAULT 0,
  max_rentable_count INTEGER NOT NULL DEFAULT 1,
  color_code TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

### device_pricing (기기종류별 가격)
- 참조: `docs/specs/database/reservations-d1-schema.md` (부속 테이블)

### rental_time_blocks (대여 가능 시간 블록)
```
CREATE TABLE rental_time_blocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_type_id INTEGER NOT NULL,
  slot_type TEXT CHECK (slot_type IN ('early','overnight')) NOT NULL,
  start_time TEXT NOT NULL,  -- HH:MM
  end_time TEXT NOT NULL,    -- HH:MM
  enable_extra_people INTEGER NOT NULL DEFAULT 0,
  extra_per_person INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

## 관리자 API (v3)
- Device Types
  - GET  `/api/v3/admin/device-types`
  - POST `/api/v3/admin/device-types` (name, is_rentable, max_rentable_count, color_code)
  - GET  `/api/v3/admin/device-types/:id`
  - PUT  `/api/v3/admin/device-types/:id`
  - DELETE `/api/v3/admin/device-types/:id`
- Pricing (per device_type)
  - GET  `/api/v3/admin/device-types/:id/pricing`
  - POST `/api/v3/admin/device-types/:id/pricing` (option_type, price, price_2p_extra?, enable_extra_people?, extra_per_person?)
  - PUT  `/api/v3/admin/device-types/:id/pricing` (여러 옵션 일괄 업데이트도 허용 가능)
  - DELETE `/api/v3/admin/device-types/:id/pricing?option_type=...`
- Time Blocks (per device_type)
  - GET  `/api/v3/admin/device-types/:id/time-blocks`
  - POST `/api/v3/admin/device-types/:id/time-blocks` (slot_type, start_time, end_time, enable_extra_people?, extra_per_person?)
  - PUT  `/api/v3/admin/device-types/:id/time-blocks/:blockId`
  - DELETE `/api/v3/admin/device-types/:id/time-blocks/:blockId`

## 일반 사용자 API
- 대여 가능 기기 조회
  - GET `/api/v3/devices/available`
  - 응답: is_rentable=1인 device_types만 포함, 각 기기의 pricing/options와 time_blocks 요약 포함

## 비고
- 관리자는 이름/설정만 다루면 되며, 내부 ID는 응답에 포함되지만 입력에 필수 아님(선택적으로 UI에서 선택형으로 처리).
- 금액 계산은 `device_pricing` 기준이며, `rental_time_blocks`는 시간 가용성 관리 목적입니다.

