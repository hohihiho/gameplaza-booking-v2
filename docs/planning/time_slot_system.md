# 기기별 시간대 예약 시스템 상세 설계

## 1. 시스템 개요

광주 게임플라자는 **기기별로 시간대를 설정**하여 예약받는 시스템을 사용합니다.
- 예: "8~12 발키리 2대", "24~28 마이마이 1대"
- 관리자가 날짜별로 각 기기의 대여 가능 시간대를 자유롭게 설정
- 같은 날짜에 같은 기기를 여러 시간대로 나눠서 대여 가능

## 2. 시간대 유형

### 2.1 기본 시간대 (Default Time Slots)
```javascript
const DEFAULT_TIME_SLOTS = {
  EARLY_MORNING: {
    name: "조기영업",
    start: "07:00",
    end: "12:00",
    basePrice: 30000
  },
  DAYTIME: {
    name: "주간영업",
    start: "12:00", 
    end: "18:00",
    basePrice: 40000
  },
  EVENING: {
    name: "야간영업",
    start: "18:00",
    end: "24:00",
    basePrice: 50000
  },
  OVERNIGHT: {
    name: "밤샘영업",
    start: "00:00",
    end: "07:00",
    basePrice: 60000
  }
}
```

### 2.2 커스텀 시간대 (Custom Time Slots)
관리자가 특별히 설정하는 시간대:
- 특정 날짜에만 적용
- 요일별 반복 설정 가능
- 이벤트/대회용 특별 시간대

예시:
- 평일 오전 특가: 08:00~12:00 (25,000원)
- 주말 점심시간: 11:00~14:00 (35,000원)
- 대회 연습 시간: 14:00~17:00 (45,000원)

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

### 3.3 device_time_slots 테이블 (기기별 시간대)
```sql
CREATE TABLE device_time_slots (
  id UUID PRIMARY KEY,
  date DATE NOT NULL,
  device_type_id UUID REFERENCES device_types(id),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  available_devices INTEGER[], -- 예약 가능한 기기 번호 배열 [1, 2, 3]
  price INTEGER NOT NULL,
  slot_type ENUM('regular', 'early', 'overnight', 'custom'),
  notes TEXT, -- "조기개장", "밤샘영업" 등
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(date, device_type_id, start_time, end_time)
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
- **슬롯 생성**: 날짜, 기기, 시간, 대수, 가격 설정
- **일별 관리**: 달력 뷰에서 날짜별 기기 시간대 설정
- **복사 기능**: 이전 날짜 설정 복사
- **템플릿**: 자주 쓰는 패턴 저장 (금요일 밤샘 등)

### 4.2 특별 영업 관리
- **조기개장**: 2대 이상 예약 시 자동 제안
- **밤샘영업**: 금~토, 토~일 정기 설정
- **조건 확인**: 최소 예약 대수 충족 확인
- **추가 오픈**: 확정 후 추가 슬롯 생성

### 4.3 가격 정책
- **기본 가격**: 시간대별 기본 요금
- **추가 요금**: 특정 기기, 옵션에 따른 추가금
- **할인 정책**: 회원 등급, 이벤트 할인
- **동적 가격**: 수요에 따른 가격 조정

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

### 6.1 관리자 기기별 시간대 설정
```
[2024년 6월 27일(금)] [< 이전] [다음 >]

조기개장 ✓
┌─────────────────────────────────────┐
│ 🎮 발키리 (총 4대)                  │
│ + 08:00-12:00 | 2대 | 40,000원 [삭제]│
│ + 시간대 추가                       │
├─────────────────────────────────────┤
│ 🎵 마이마이 (총 3대)                │
│ + 09:00-13:00 | 1대 | 50,000원 [삭제]│
│ + 시간대 추가                       │
└─────────────────────────────────────┘

밤샘영업 ✓ (금~토)
┌─────────────────────────────────────┐
│ 🎵 마이마이                         │
│ + 24:00-28:00 | 1대 | 60,000원 [삭제]│
├─────────────────────────────────────┤
│ ⚡ 라이트닝 (총 2대)                │
│ + 24:00-29:00 | 1대 | 70,000원 [삭제]│
├─────────────────────────────────────┤
│ 🎮 발키리                           │
│ + 24:00-29:00 | 2대 | 70,000원 [삭제]│
└─────────────────────────────────────┘

[이전 날짜에서 복사] [템플릿 저장]
```

### 6.2 사용자 예약 화면
```
[날짜 선택]
2024년 6월 27일 (금)

[기기 선택]
🎮 발키리 | 🎵 마이마이 | 🎮 츄니즘 | ⚡ 라이트닝

[선택: 🎵 마이마이]

[예약 가능 시간대]
┌─────────────────────────────────┐
│ 🌅 조기개장                       │
│ 09:00 - 13:00 (4시간)            │
│ 50,000원                         │
│ 남은 대수: 1대                   │
│ [예약하기]                       │
├─────────────────────────────────┤
│ 🌙 밤샘영업 (금~토)             │
│ 24:00 - 28:00 (+1일)             │
│ 60,000원                         │
│ 남은 대수: 1대                   │
│ [예약하기]                       │
└─────────────────────────────────┘

[마이마이 2P 옵션]
☐ 2인 플레이 (+10,000원)
```

## 7. 특수 케이스 처리

### 7.1 시간대 중복
- 겹치는 시간대는 생성 불가
- 우선순위로 적용 시간대 결정

### 7.2 자정 넘는 시간대
- 밤샘영업처럼 날짜가 바뀌는 경우
- 예약은 시작 날짜 기준으로 처리
- UI에서 명확히 표시 (24:00-07:00+1)

### 7.3 동적 시간대 생성
- 관리자가 당일에도 시간대 추가 가능
- 기존 예약과 충돌하지 않는 범위에서만

### 7.4 취소/변경 정책
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