# 기기별 시간대 예약 시스템 상세 설계

## 1. 시스템 개요

광주 게임플라자는 **기기별로 시간대를 설정**하여 예약받는 시스템을 사용합니다.
- 예: "8~12 발키리 2대", "24~28 마이마이 1대"
- 관리자가 날짜별로 각 기기의 대여 가능 시간대를 자유롭게 설정
- 같은 날짜에 같은 기기를 여러 시간대로 나눠서 대여 가능

## 2. 시간대 유형

### 2.1 시간대 구분
```javascript
const TIME_SLOT_TYPES = {
  EARLY: {
    name: "조기대여",
    defaultStart: "10:00",
    defaultEnd: "18:00",
    description: "오전~오후 시간대 대여"
  },
  OVERNIGHT: {
    name: "밤샘대여", 
    defaultStart: "22:00",
    defaultEnd: "08:00",
    description: "야간 시간대 대여"
  }
}
```

**특징:**
- 조기대여와 밤샘대여 모두 여러 개 시간대 설정 가능
- 예: 조기대여 10:00-14:00, 14:00-18:00 분리 운영
- 예: 밤샘대여 22:00-02:00 (4시간), 22:00-06:00 (8시간) 선택

### 2.2 크레딧 타입별 가격 설정
각 시간대별로 크레딧 타입에 따른 가격 차별화:
```javascript
const CREDIT_TYPES = {
  FIXED: "고정크레딧",      // 관리자가 설정한 크레딧 수 (예: 50, 100, 200)
  FREEPLAY: "프리플레이",   // 무제한 플레이
  UNLIMITED: "무한크레딧"   // 크레딧 무제한
}
```

**고정크레딧 설정:**
- 각 크레딧 옵션마다 크레딧 수를 개별 설정
- 예: 오전 - 100크레딧, 오후 - 150크레딧
- 기종별로 적절한 크레딧 수 설정 가능

### 2.3 시간별 가격 설정
- 동일 시간대 내에서도 대여 시간에 따른 가격 차별화
- 예: 4시간 30,000원, 5시간 35,000원
- 관리자가 시간대별로 가능한 대여 시간 옵션 설정

### 2.4 2인 플레이 옵션
- 마이마이 등 2인 플레이 가능 기종
- 2인 플레이 시 추가 요금 설정
- 기종별로 2인 플레이 가능 여부 설정

### 2.5 청소년 시간대 정책
- 게임산업진흥에 관한 법률에 따른 청소년 이용 시간 제한
- 만 16세 미만: 오전 9시 ~ 오후 10시
- 관리자가 각 시간대별로 청소년 이용 가능 여부 설정
- 청소년 시간대로 설정된 경우 예약 시 연령 확인 필수

## 3. 데이터베이스 설계

### 3.1 device_types 테이블 (기기 종류)
```sql
CREATE TABLE device_types (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL, -- 마이마이, 츄니즘, 발키리, 라이트닝
  total_count INTEGER NOT NULL, -- 보유 대수
  is_rentable BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3.2 devices 테이블 (개별 기기)
```sql
CREATE TABLE devices (
  id UUID PRIMARY KEY,
  device_type_id UUID REFERENCES device_types(id),
  device_number INTEGER NOT NULL, -- 기기 번호 (1번기, 2번기...)
  location VARCHAR(100), -- 위치 정보
  status ENUM('available', 'occupied', 'maintenance') DEFAULT 'available',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(device_type_id, device_number)
);
```

### 3.3 rental_time_slots 테이블 (대여 시간대 및 가격)
```sql
CREATE TABLE rental_time_slots (
  id UUID PRIMARY KEY,
  device_type_id UUID REFERENCES device_types(id),
  slot_type ENUM('early', 'overnight'), -- 조기대여/밤샘대여
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  -- 크레딧 옵션별 시간별 가격
  -- JSON 형태: [{
  --   type: 'fixed'|'freeplay'|'unlimited', 
  --   hours: [4,5], 
  --   prices: {4: 30000, 5: 35000},
  --   fixed_credits: 100  -- 고정크레딧인 경우 크레딧 수
  -- }]
  credit_options JSONB NOT NULL,
  
  -- 2인 플레이 설정
  enable_2p BOOLEAN DEFAULT false,
  price_2p_extra INTEGER, -- 2인 플레이 추가 요금
  
  -- 청소년 시간대 여부
  is_youth_time BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 3.4 rental_settings 테이블 (대여 설정)
```sql
CREATE TABLE rental_settings (
  id UUID PRIMARY KEY,
  device_type_id UUID REFERENCES device_types(id) UNIQUE,
  max_rental_units INTEGER, -- 동시 대여 가능 대수
  min_rental_hours INTEGER DEFAULT 1,
  max_rental_hours INTEGER DEFAULT 24,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3.4 reservations 테이블 (수정)
```sql
CREATE TABLE reservations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  device_time_slot_id UUID REFERENCES device_time_slots(id),
  device_id UUID REFERENCES devices(id), -- 배정된 기기
  device_number INTEGER, -- 예약한 기기 번호
  total_price INTEGER NOT NULL,
  player_count INTEGER DEFAULT 1, -- 마이마이 2P 등
  status ENUM('pending', 'approved', 'rejected', 'checked_in', 'completed', 'cancelled'),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  check_in_at TIMESTAMP,
  completed_at TIMESTAMP,
  payment_method ENUM('cash', 'transfer'),
  payment_confirmed_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 예약 제한을 위한 인덱스
CREATE INDEX idx_user_active_reservations 
ON reservations(user_id, status) 
WHERE status IN ('pending', 'approved', 'checked_in');
```

### 3.4 special_operations 테이블 (특별 영업)
```sql
CREATE TABLE special_operations (
  id UUID PRIMARY KEY,
  date DATE NOT NULL,
  operation_type ENUM('early', 'overnight'),
  min_devices INTEGER DEFAULT 2, -- 최소 예약 대수
  is_confirmed BOOLEAN DEFAULT false,
  confirmed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 4. 관리자 기능

### 4.1 기기별 시간대 관리
- **복수 시간대 설정**: 조기대여, 밤샘대여 각각 여러 개 시간대 추가 가능
- **유연한 운영**: 같은 타입 내에서도 다양한 시간/가격 설정
  - 조기대여: 오전/오후 분리, 점심시간 특가 등
  - 밤샘대여: 단시간/장시간 옵션 제공
- **개별 관리**: 각 시간대별 독립적인 가격/옵션 설정
- **템플릿**: 자주 쓰는 시간대 조합 저장

### 4.2 특별 영업 관리
- **조기개장**: 2대 이상 예약 시 자동 제안
- **밤샘영업**: 금~토, 토~일 정기 설정
- **조건 확인**: 최소 예약 대수 충족 확인
- **추가 오픈**: 확정 후 추가 슬롯 생성

### 4.3 가격 정책
- **크레딧별 차등 가격**: 고정크레딧/프리플레이/무한크레딧별 가격 설정
- **시간별 가격**: 4시간, 5시간 등 대여 시간별 가격 차별화
- **2인 플레이 추가금**: 2인 플레이 옵션 선택 시 추가 요금
- **시간대별 가격**: 조기대여/밤샘대여 시간대별 다른 가격 정책

## 5. 사용자 예약 플로우

### 5.1 기기별 시간대 조회
```javascript
// 특정 날짜와 기기의 예약 가능한 시간대 조회
async function getAvailableSlots(date, deviceTypeId) {
  // 1. 해당 날짜의 기기 시간대 조회
  const deviceSlots = await getDeviceTimeSlots(date, deviceTypeId);
  
  // 2. 예약 가능 대수 계산
  const availableSlots = deviceSlots.map(slot => ({
    ...slot,
    availableCount: slot.available_count - slot.reserved_count
  }));
  
  // 3. 예약 가능한 시간대만 반환
  return availableSlots.filter(slot => slot.availableCount > 0);
}
```

### 5.2 예약 검증
- 선택한 시간대가 해당 날짜에 존재하는지
- 이미 예약이 차 있는지
- 24시간 룰 위반 여부
- 기기 점검 시간과 충돌 여부

### 5.3 예약 생성
```javascript
async function createReservation(userId, deviceTimeSlotId, quantity, options) {
  // 트랜잭션 시작
  const reservation = await db.transaction(async (trx) => {
    // 1. 슬롯 정보 조회 및 잠금
    const slot = await lockDeviceTimeSlot(trx, deviceTimeSlotId);
    
    // 2. 가용성 검증
    if (slot.reserved_count + quantity > slot.available_count) {
      throw new Error('예약 가능 대수 초과');
    }
    
    // 3. 예약 생성
    const reservation = await createReservationRecord(trx, {
      userId,
      deviceTimeSlotId,
      quantity,
      totalPrice: slot.price * quantity,
      ...options
    });
    
    // 4. 예약 대수 업데이트
    await updateReservedCount(trx, deviceTimeSlotId, quantity);
    
    // 5. 특별 영업 체크
    await checkSpecialOperation(trx, slot.date);
    
    return reservation;
  });
  
  // 6. 알림 발송
  await sendReservationNotification(reservation);
  
  return reservation;
}
```

## 6. UI/UX 설계

### 6.1 관리자 대여 가격 설정
```
[🎮 발키리 가격 설정]

대여 가능 대수: [3] / 총 4대

☀️ 조기대여 시간대
[조기대여 추가]

[조기대여 #1] 10:00 - 14:00              [수정] [삭제]
┌─────────────────────────────────────┐
│ 고정크레딧 (100크레딧): 4시간 25,000원 │
│ 프리플레이: 4시간 30,000원         │
│ 무한크레딧: 4시간 35,000원         │
│ ✓ 2인 플레이 가능 (+10,000원)      │
│ ✓ 청소년 시간대                    │
└─────────────────────────────────────┘

[조기대여 #2] 14:00 - 18:00              [수정] [삭제]
┌─────────────────────────────────────┐
│ 고정크레딧 (150크레딧): 4시간 28,000원 │
│ 프리플레이: 4시간 33,000원         │
│ 무한크레딧: 4시간 40,000원         │
│ ✓ 2인 플레이 가능 (+10,000원)      │
│ □ 청소년 시간대                    │
└─────────────────────────────────────┘

🌙 밤샘대여 시간대
[밤샘대여 추가]

[밤샘대여 #1] 22:00 - 02:00              [수정] [삭제]
┌─────────────────────────────────────┐
│ 프리플레이: 4시간 40,000원         │
│ □ 2인 플레이 가능                  │
│ □ 청소년 시간대                    │
└─────────────────────────────────────┘

[밤샘대여 #2] 22:00 - 06:00              [수정] [삭제]
┌─────────────────────────────────────┐
│ 프리플레이: 8시간 60,000원         │
│ 무한크레딧: 8시간 70,000원         │
│ □ 2인 플레이 가능                  │
│ □ 청소년 시간대                    │
└─────────────────────────────────────┘

[저장]
```

### 6.2 사용자 예약 화면
```
[날짜 선택]
2024년 6월 27일 (금)

[기기 선택]
🎮 발키리 | 🎵 마이마이 | 🎮 츄니즘 | ⚡ 라이트닝

[선택: 🎵 마이마이]

[대여 시간대 선택]
┌─────────────────────────────────┐
│ ☀️ 조기대여                       │
│ 10:00 - 18:00                    │
│                                  │
│ 크레딧 타입:                     │
│ ○ 프리플레이                    │
│ ● 무한크레딧                    │
│                                  │
│ 대여 시간:                       │
│ ● 4시간 (40,000원)              │
│ ○ 5시간 (50,000원)              │
│                                  │
│ ☐ 2인 플레이 (+10,000원)        │
│                                  │
│ 총 금액: 40,000원               │
│ [예약하기]                       │
├─────────────────────────────────┤
│ 🌙 밤샘대여                      │
│ 22:00 - 08:00 (+1일)             │
│                                  │
│ 크레딧 타입:                     │
│ ● 프리플레이                    │
│                                  │
│ 대여 시간:                       │
│ ○ 8시간 (50,000원)              │
│ ● 10시간 (60,000원)             │
│                                  │
│ 총 금액: 60,000원               │
│ [예약하기]                       │
└─────────────────────────────────┘
```

## 7. 특수 케이스 처리

### 7.1 청소년 시간대 관리
- 게임산업진흥에 관한 법률 준수
- 예약 시 나이 확인 절차
- 청소년 시간대 외 예약 차단
- 부모 동의 확인

### 7.2 시간대 중복
- 같은 타입 내에서 겹치는 시간대는 생성 불가
- 조기대여와 밤샘대여는 시간 중복 가능 (타입이 다름)
- 예: 조기대여 18:00-22:00, 밤샘대여 22:00-06:00 동시 운영

### 7.3 자정 넘는 시간대
- 밤샘영업처럼 날짜가 바뀌는 경우
- 예약은 시작 날짜 기준으로 처리
- UI에서 명확히 표시 (24:00-07:00+1)

### 7.4 동적 시간대 생성
- 관리자가 당일에도 시간대 추가 가능
- 기존 예약과 충돌하지 않는 범위에서만

### 7.5 취소/변경 정책
- 시간대별로 다른 취소 정책 적용 가능
- 밤샘영업은 당일 취소 불가 등

## 8. 향후 확장 가능성

### 8.1 스마트 스케줄링
- AI 기반 수요 예측
- 자동 시간대 최적화
- 동적 가격 책정

### 8.2 패키지 상품
- 여러 시간대 묶음 할인
- 정기 이용권
- 그룹 예약

### 8.3 연동 기능
- 대회 일정과 자동 연동
- 특별 이벤트 시간대 자동 생성
- 외부 캘린더 연동

---

이 시스템은 유연하면서도 관리가 용이하도록 설계되었으며, 향후 확장에도 대응할 수 있는 구조입니다.