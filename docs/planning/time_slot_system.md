# 시간대 예약 시스템 상세 설계

## 1. 시스템 개요

광주 게임플라자는 고정된 시간 단위(30분, 1시간 등)가 아닌, 관리자가 설정한 특정 시간대를 예약하는 시스템을 사용합니다.

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

### 3.1 time_slots 테이블
```sql
CREATE TABLE time_slots (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  base_price INTEGER NOT NULL,
  slot_type ENUM('default', 'custom') DEFAULT 'custom',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 3.2 time_slot_schedules 테이블
```sql
CREATE TABLE time_slot_schedules (
  id UUID PRIMARY KEY,
  time_slot_id UUID REFERENCES time_slots(id),
  applicable_date DATE, -- 특정 날짜
  day_of_week INTEGER[], -- 요일 (0=일요일, 6=토요일)
  is_recurring BOOLEAN DEFAULT false,
  priority INTEGER DEFAULT 0, -- 우선순위 (높을수록 우선)
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3.3 time_slot_availability 테이블
```sql
CREATE TABLE time_slot_availability (
  id UUID PRIMARY KEY,
  date DATE NOT NULL,
  time_slot_id UUID REFERENCES time_slots(id),
  device_id UUID REFERENCES devices(id),
  is_available BOOLEAN DEFAULT true,
  max_reservations INTEGER DEFAULT 1,
  current_reservations INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(date, time_slot_id, device_id)
);
```

## 4. 관리자 기능

### 4.1 시간대 관리
- **시간대 생성**: 시작/종료 시간, 가격 설정
- **시간대 수정**: 기존 시간대 정보 변경
- **시간대 활성화/비활성화**: 특정 시간대 사용 여부
- **일괄 적용**: 여러 날짜에 동일 시간대 적용

### 4.2 스케줄 관리
- **날짜별 설정**: 특정 날짜의 시간대 구성
- **요일별 반복**: 매주 특정 요일 자동 적용
- **예외 날짜**: 공휴일, 특별 영업일 설정
- **우선순위**: 중복 시 적용할 시간대 결정

### 4.3 가격 정책
- **기본 가격**: 시간대별 기본 요금
- **추가 요금**: 특정 기기, 옵션에 따른 추가금
- **할인 정책**: 회원 등급, 이벤트 할인
- **동적 가격**: 수요에 따른 가격 조정

## 5. 사용자 예약 플로우

### 5.1 시간대 조회
```javascript
// 특정 날짜의 예약 가능한 시간대 조회
async function getAvailableTimeSlots(date, deviceId) {
  // 1. 해당 날짜에 적용되는 시간대 조회
  const applicableSlots = await getApplicableTimeSlots(date);
  
  // 2. 각 시간대의 예약 가능 여부 확인
  const availability = await checkAvailability(date, applicableSlots, deviceId);
  
  // 3. 예약 가능한 시간대만 반환
  return availability.filter(slot => slot.isAvailable);
}
```

### 5.2 예약 검증
- 선택한 시간대가 해당 날짜에 존재하는지
- 이미 예약이 차 있는지
- 24시간 룰 위반 여부
- 기기 점검 시간과 충돌 여부

### 5.3 예약 생성
```javascript
async function createReservation(userId, date, timeSlotId, deviceId, options) {
  // 트랜잭션 시작
  const reservation = await db.transaction(async (trx) => {
    // 1. 가용성 재확인 (동시성 처리)
    const available = await checkAndLockAvailability(trx, date, timeSlotId, deviceId);
    
    // 2. 예약 생성
    const reservation = await createReservationRecord(trx, {
      userId,
      date,
      timeSlotId,
      deviceId,
      ...options
    });
    
    // 3. 가용성 업데이트
    await updateAvailability(trx, date, timeSlotId, deviceId);
    
    return reservation;
  });
  
  // 4. 알림 발송
  await sendReservationNotification(reservation);
  
  return reservation;
}
```

## 6. UI/UX 설계

### 6.1 관리자 시간대 설정 화면
```
[시간대 관리]
┌─────────────────────────────────┐
│ + 새 시간대 추가                │
├─────────────────────────────────┤
│ 조기영업 (07:00-12:00) 30,000원 │
│ [수정] [삭제]                   │
├─────────────────────────────────┤
│ 주간영업 (12:00-18:00) 40,000원 │
│ [수정] [삭제]                   │
├─────────────────────────────────┤
│ 커스텀1 (08:00-12:00) 25,000원  │
│ [수정] [삭제]                   │
└─────────────────────────────────┘

[스케줄 설정]
날짜: [2024-06-26]
적용할 시간대:
☑ 조기영업
☑ 주간영업
☐ 야간영업
☐ 밤샘영업
☑ 커스텀1

[일괄 적용]
```

### 6.2 사용자 예약 화면
```
[날짜 선택]
2024년 6월 26일 (수)

[예약 가능 시간대]
┌─────────────────────────────┐
│ 🌅 조기영업                 │
│ 07:00 - 12:00 (5시간)       │
│ 30,000원                    │
│ [선택하기]                  │
├─────────────────────────────┤
│ ☀️ 주간영업                 │
│ 12:00 - 18:00 (6시간)       │
│ 40,000원                    │
│ [예약마감]                  │
├─────────────────────────────┤
│ 🎯 특별시간대               │
│ 08:00 - 12:00 (4시간)       │
│ 25,000원 (특가!)            │
│ [선택하기]                  │
└─────────────────────────────┘
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