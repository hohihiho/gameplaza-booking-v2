# 🗄️ 데이터베이스 구조 설계서

> 💡 **초보자를 위한 설명**: 데이터베이스는 우리 서비스의 모든 정보를 체계적으로 저장하는 창고입니다. 
> 마치 엑셀 파일처럼 표(테이블) 형태로 정보를 관리합니다.

## 📊 전체 구조 한눈에 보기

```
GamePlaza 데이터베이스
│
├── 👤 사용자 관련
│   ├── users (회원 정보)
│   └── blacklist (블랙리스트)
│
├── 🎮 기기 관련
│   ├── machines (전체 기기 목록)
│   └── rental_machines (대여 가능 기기)
│
├── 📅 예약 관련
│   ├── reservations (예약 내역)
│   ├── check_ins (체크인 기록)
│   └── payments (결제 정보)
│
└── 🔧 관리 관련
    ├── admin_logs (관리자 활동 기록)
    ├── content_pages (콘텐츠 페이지)
    └── notifications (알림 내역)
```

## 📋 각 테이블 상세 설명

### 1. 👤 **users** - 회원 정보
> 우리 서비스를 사용하는 모든 회원의 정보를 저장합니다.

| 필드명 | 설명 | 예시 |
|--------|------|------|
| `id` | 회원 고유번호 | "user_123456" |
| `email` | 구글 이메일 | "kim@gmail.com" |
| `name` | 닉네임 (변경 가능) | "게임왕철수" |
| `phone` | 전화번호 | "010-1234-5678" |
| `role` | 권한 (일반/스태프/관리자) | "user", "staff", "admin" |
| `created_at` | 가입일 | "2024-01-15" |
| `last_login` | 마지막 로그인 | "2024-01-20 14:30" |
| `is_blacklisted` | 블랙리스트 여부 | true/false |

### 2. 🎮 **machines** - 개별 기기 목록
> 게임플라자가 보유한 모든 게임기의 개별 정보입니다. 기종 추가 시 보유대수만큼 자동 생성됩니다.

| 필드명 | 설명 | 예시 |
|--------|------|------|
| `id` | 기기 고유번호 | "machine_001" |
| `machine_type_id` | 기종 ID | "type_001" |
| `device_number` | 기기 번호 (1, 2, 3...) | 1, 2, 3 |
| `status` | 상태 | "available", "rental", "maintenance", "unavailable" |
| `notes` | 메모 | "2024-01-10 점검 완료" |
| `created_at` | 생성일 | "2023-12-01" |
| `updated_at` | 수정일 | "2024-01-10" |

#### 기기 상태 설명
- **available (사용가능)**: 예약 및 사용 가능한 정상 상태
- **rental (대여중)**: 현재 고객이 대여하여 사용 중인 상태 (체크인 시 자동 변경)
- **maintenance (점검중)**: 정기 점검이나 수리 중으로 사용 불가
- **unavailable (사용불가)**: 고장 등의 이유로 사용할 수 없는 상태

### 3. 🍺 **machine_types** - 기종 정보
> 각 기종의 상세 정보를 관리합니다.

| 필드명 | 설명 | 예시 |
|--------|------|------|
| `id` | 기종 고유번호 | "type_001" |
| `category` | 카테고리 (제조사) | "SEGA" |
| `type_name` | 기종명 (필수) | "마이마이 DX" |
| `model_name` | 모델명 (신기체/구기체 구분용) | "발키리", "구기체" |
| `version_name` | 버전명 | "PLUS" |
| `play_modes` | 플레이 모드 (JSON) | {"standard": 500, "dx": 1000} |
| `description` | 설명 | "최신 리듬게임" |
| `image_url` | 이미지 주소 | "https://..." |
| `total_count` | 총 보유대수 | 4 |

### 4. 🎯 **rental_machines** - 대여 가능 기기
> 일반 사용자가 예약할 수 있는 기기 목록입니다.

| 필드명 | 설명 | 예시 |
|--------|------|------|
| `id` | 대여기기 고유번호 | "rental_001" |
| `machine_type_id` | 기종 ID | "type_001" |
| `display_name` | 표시 이름 (관리자 설정) | "마이마이 DX" |
| `hourly_rate` | 시간당 기본 요금 | 5000 |
| `min_hours` | 최소 대여시간 | 2 |
| `max_hours` | 최대 대여시간 | 4 |
| `max_rental_units` | 최대 대여 가능 대수 | 3 |
| `total_units` | 전체 보유 대수 | 4 |
| `is_active` | 대여 가능 여부 | true/false |
| `credit_options` | 크레딧 옵션별 가격 (JSON) | {"1credit": 5000, "2credit": 9000} |

### 5. 📅 **reservations** - 예약 내역
> 모든 예약 신청과 처리 내역을 관리합니다.

| 필드명 | 설명 | 예시 |
|--------|------|------|
| `id` | 예약 번호 | "res_20240120_001" |
| `user_id` | 예약자 | "user_123456" |
| `rental_machine_id` | 대여 기기 ID | "rental_001" |
| `machine_number` | 배정된 기기 번호 | "#1" |
| `date` | 예약일 | "2024-01-25" |
| `start_time` | 예약 시작 시간 | "14:00" |
| `end_time` | 예약 종료 시간 | "16:00" |
| `actual_start_time` | 실제 시작 시간 | "14:10" |
| `actual_end_time` | 실제 종료 시간 | "16:30" |
| `hours` | 예약 시간 | 2 |
| `actual_hours` | 실제 이용 시간 | 2.33 |
| `selected_mode` | 선택한 플레이 모드 | "standard" |
| `total_amount` | 총 금액 | 10000 |
| `adjusted_amount` | 조정된 금액 | 11650 |
| `status` | 상태 | "pending", "approved", "rejected", "checked_in", "completed", "cancelled", "no_show" |
| `payment_method` | 결제 방법 | "cash", "transfer" |
| `payment_status` | 결제 상태 | "pending", "paid", "failed", "cancelled", "partial_refund", "refunded" |
| `payment_confirmed_at` | 결제 확인 시간 | "2024-01-25 14:15" |
| `payment_confirmed_by` | 결제 확인자 | "admin_001" |
| `check_in_at` | 체크인 시간 | "2024-01-25 14:05" |
| `check_in_by` | 체크인 처리자 | "admin_001" |
| `created_at` | 신청일시 | "2024-01-20 10:30" |
| `approved_at` | 승인일시 | "2024-01-20 11:00" |
| `approved_by` | 승인한 관리자 | "admin_001" |
| `time_adjustment_reason` | 시간 조정 사유 | "고객 요청으로 30분 연장" |
| `adjustment_reason` | 금액 조정 사유 | "조기 종료로 일부 환불" |
| `rejection_reason` | 거절 사유 | "해당 시간 이미 예약됨" |
| `notes` | 메모 | "단골 고객" |

### 6. ✅ **check_ins** - 체크인 기록
> 체크인 관련 정보는 이제 reservations 테이블에 통합되어 관리됩니다.
> - check_in_at: 체크인 시간
> - check_in_by: 체크인 처리 관리자
> - payment_method: 결제 방법 (현금/계좌이체)
> - payment_status: 결제 상태 (대기/완료)
> - payment_confirmed_at/by: 결제 확인 정보

### 7. 💰 **payments** - 결제 정보
> 결제 관련 정보를 저장합니다.

| 필드명 | 설명 | 예시 |
|--------|------|------|
| `id` | 결제 번호 | "pay_001" |
| `reservation_id` | 예약 번호 | "res_20240120_001" |
| `amount` | 금액 | 10000 |
| `method` | 결제 방법 | "계좌이체" |
| `status` | 상태 | "대기중", "완료", "취소" |
| `paid_at` | 결제 완료일 | "2024-01-25 14:10" |
| `bank_name` | 은행명 | "카카오뱅크" |
| `account_number` | 계좌번호 | "3333-01-1234567" |

### 8. 🚫 **blacklist** - 블랙리스트
> 이용 제한된 사용자의 정보입니다.

| 필드명 | 설명 | 예시 |
|--------|------|------|
| `id` | 번호 | "black_001" |
| `email_hash` | 이메일 해시값 | "a1b2c3d4..." |
| `reason` | 사유 | "노쇼 3회 이상" |
| `blocked_at` | 차단일 | "2024-01-15" |
| `blocked_by` | 처리 관리자 | "admin_001" |
| `unblock_date` | 해제 예정일 | "2027-01-15" |

> 💡 **개인정보 보호**: 실제 이메일 대신 해시값으로 저장하여 개인정보를 보호합니다.

### 9. 📝 **admin_logs** - 관리자 활동 기록
> 관리자가 수행한 모든 작업을 기록합니다.

| 필드명 | 설명 | 예시 |
|--------|------|------|
| `id` | 로그 번호 | "log_001" |
| `admin_id` | 관리자 번호 | "admin_001" |
| `action` | 작업 내용 | "예약 승인" |
| `target_type` | 대상 종류 | "reservation" |
| `target_id` | 대상 번호 | "res_20240120_001" |
| `details` | 상세 내용 | "철권8 예약 승인 처리" |
| `ip_address` | IP 주소 | "192.168.1.1" |
| `created_at` | 작업 시간 | "2024-01-20 11:00" |

### 10. 📄 **content_pages** - 콘텐츠 페이지
> 노코드 빌더로 만든 페이지 정보입니다.

| 필드명 | 설명 | 예시 |
|--------|------|------|
| `id` | 페이지 번호 | "page_001" |
| `slug` | 주소 | "event-2024" |
| `title` | 제목 | "2024년 신년 이벤트" |
| `content` | 내용 (JSON) | {"blocks": [...]} |
| `is_published` | 공개 여부 | true/false |
| `created_by` | 작성자 | "admin_001" |
| `created_at` | 작성일 | "2024-01-01" |
| `updated_at` | 수정일 | "2024-01-05" |

### 11. 📱 **notifications** - 알림 내역
> 사용자에게 전송된 모든 알림 기록입니다.

| 필드명 | 설명 | 예시 |
|--------|------|------|
| `id` | 알림 번호 | "noti_001" |
| `user_id` | 받는 사람 | "user_123456" |
| `type` | 알림 종류 | "예약승인", "체크인", "공지사항" |
| `title` | 제목 | "예약이 승인되었습니다" |
| `message` | 내용 | "1월 25일 철권8 예약..." |
| `is_read` | 읽음 여부 | true/false |
| `sent_at` | 전송 시간 | "2024-01-20 11:00" |
| `fcm_token` | FCM 토큰 | "fcm_token_string..." |

## 🔗 테이블 간의 관계

### 쉽게 이해하는 관계도
```
🏭 카테고리 (SEGA, KONAMI...)
    ↓
🎮 기종 (machine_types)
    ↓
🔢 개별 기기 (machines #1, #2...)
    ↓
🎯 대여 가능 기기 (rental_machines)
    ↓
👤 사용자(users)가
    ↓
📅 예약(reservations)을 신청하면
    ↓
👮 관리자가 승인/거절하고
    ↓
✅ 체크인(check_ins) 시 
    ↓
💰 결제(payments) 정보를 받아요
```

### 주요 연결 관계
1. **카테고리 → 기종**: 제조사별로 여러 기종 보유
2. **기종 → 개별 기기**: 하나의 기종에 여러 개별 기기 (보유대수만큼 자동 생성)
3. **개별 기기 상태 관리**: 각 기기별로 available/in_use/maintenance 상태 개별 관리
4. **기종 → 대여설정**: 대여 가능한 기종의 시간대/가격 설정
5. **대여설정 → 시간대/가격**: 기종별로 다른 시간대와 가격 설정
6. **사용자 → 예약**: 한 사용자가 여러 예약 가능
7. **예약 → 체크인**: 하나의 예약당 하나의 체크인
8. **예약 → 결제**: 하나의 예약당 하나의 결제
9. **예약 → 개별 기기**: 예약 시 특정 기기 번호 배정

## 🛡️ 보안 설정

### RLS (Row Level Security) - 행 수준 보안
> 💡 각 사용자가 자신의 데이터만 볼 수 있도록 제한합니다.

- **일반 사용자**: 자신의 예약, 결제 정보만 조회 가능
- **스태프**: 체크인 관련 정보 조회/수정 가능
- **관리자**: 모든 데이터 조회/수정 가능

### 인덱스 설정
> 💡 자주 검색하는 항목을 빠르게 찾을 수 있도록 색인을 만듭니다.

- 예약 날짜별 검색을 위한 인덱스
- 사용자별 예약 조회를 위한 인덱스
- 기기별 예약 현황 조회를 위한 인덱스

### 12. ⏰ **rental_time_slots** - 대여 시간대 설정
> 기종별로 다른 대여 가능 시간대를 설정합니다.

| 필드명 | 설명 | 예시 |
|--------|------|------|
| `id` | 시간대 번호 | "slot_001" |
| `rental_machine_id` | 대여기기 번호 | "rental_001" |
| `day_type` | 요일 구분 | "weekday", "weekend" |
| `start_time` | 시작 시간 | "10:00" |
| `end_time` | 종료 시간 | "02:00" |
| `price_per_hour` | 시간당 가격 | 5000 |
| `is_overnight` | 밤샘 대여 여부 | true/false |
| `overnight_price` | 밤샘 대여 가격 | 30000 |
| `maintenance_time` | 점검 시간 | "04:00-06:00" |

### 13. 🎮 **play_mode_prices** - 플레이 모드별 가격
> 각 기종의 플레이 모드별 대여 가격을 관리합니다.

| 필드명 | 설명 | 예시 |
|--------|------|------|
| `id` | 가격 고유번호 | "price_001" |
| `rental_machine_id` | 대여기기 번호 | "rental_001" |
| `mode_name` | 모드명 | "standard", "dx" |
| `price_per_hour` | 시간당 가격 | 5000 |
| `display_order` | 표시 순서 | 1 |

## 📈 데이터 백업 정책

1. **자동 백업**: 매일 새벽 3시 자동 백업
2. **백업 보관**: 최근 30일간의 백업 보관
3. **복구 시간**: 문제 발생 시 1시간 이내 복구

## 🔍 자주 사용하는 데이터 조회 예시

### 1. "오늘 예약 현황 보기"
```
오늘 날짜의 모든 예약을 시간순으로 정렬해서 보여줍니다.
```

### 2. "특정 사용자의 예약 이력"
```
해당 사용자의 모든 예약을 최신순으로 보여줍니다.
```

### 3. "이번 달 매출 통계"
```
이번 달 완료된 모든 결제의 합계를 계산합니다.
```

---

> 📌 **참고**: 이 문서는 개발자가 실제 데이터베이스를 구축할 때 참고하는 설계도입니다. 
> 실제 운영 중에 필요에 따라 수정될 수 있습니다.

---

## 📝 변경 이력

### 2025.07.15 업데이트
- reservations 테이블에 결제 관련 필드 추가
  - payment_method: 결제 방법 (cash/transfer)
  - payment_status: 결제 상태 (pending/paid/failed 등)
  - payment_confirmed_at/by: 결제 확인 정보
  - check_in_at/by: 체크인 정보
  - adjustment_reason: 금액 조정 사유
- check_ins 테이블 정보를 reservations 테이블로 통합
- 예약 상태에 no_show 추가