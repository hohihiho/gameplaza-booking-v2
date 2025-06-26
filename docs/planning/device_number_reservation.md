# 기기 번호별 예약 시스템 상세 설계

## 1. 시스템 개요

각 기기는 고유 번호를 가지며, 사용자는 특정 번호의 기기를 예약할 수 있습니다.

### 예시
- 마이마이 1번기, 마이마이 2번기, 마이마이 3번기
- 발키리 1번기, 발키리 2번기, 발키리 3번기, 발키리 4번기

## 2. 예약 제한 규칙

### 2.1 1인 1대 원칙
- 동일 시간대에 1개 기기만 예약 가능
- 다른 종류의 기기도 동시간대 중복 예약 불가

### 2.2 동시 예약 제한
- 활성 예약(pending, approved, checked_in) 최대 3개
- completed 또는 cancelled 상태는 제한에서 제외

```javascript
// 예약 가능 여부 체크
async function canUserReserve(userId) {
  const activeReservations = await db.reservations.count({
    where: {
      user_id: userId,
      status: { in: ['pending', 'approved', 'checked_in'] }
    }
  });
  
  return activeReservations < 3;
}
```

## 3. 예약 플로우

### 3.1 기기 선택 과정
```
1. 날짜 선택
   ↓
2. 기기 종류 선택 (마이마이, 츄니즘 등)
   ↓
3. 시간대 선택
   ↓
4. 예약 가능한 기기 번호 표시
   예: [1번기 ✓] [2번기 ✗] [3번기 ✓]
   ↓
5. 원하는 기기 번호 선택
   ↓
6. 예약 신청
```

### 3.2 기기 번호 배정 로직
```javascript
async function assignDeviceNumber(slotId, requestedNumber) {
  const slot = await getDeviceTimeSlot(slotId);
  const reservedDevices = await getReservedDevices(slotId);
  
  // 사용자가 요청한 번호가 가능한지 확인
  if (requestedNumber && slot.available_devices.includes(requestedNumber)) {
    if (!reservedDevices.includes(requestedNumber)) {
      return requestedNumber;
    }
  }
  
  // 불가능하면 가장 낮은 번호 자동 배정
  const availableNumbers = slot.available_devices.filter(
    num => !reservedDevices.includes(num)
  );
  
  return availableNumbers.sort((a, b) => a - b)[0];
}
```

## 4. UI/UX 설계

### 4.1 사용자 기기 선택 화면
```
[마이마이 예약]
2024년 6월 27일 (금) | 09:00~13:00

🎵 예약 가능한 기기를 선택하세요:

┌─────────┐ ┌─────────┐ ┌─────────┐
│ 1번기   │ │ 2번기   │ │ 3번기   │
│   ✓    │ │   ✗    │ │   ✓    │
│ [선택]  │ │ [예약됨] │ │ [선택]  │
└─────────┘ └─────────┘ └─────────┘

💡 Tip: 1번기는 입구쪽, 3번기는 창가쪽에 있어요!
```

### 4.2 관리자 기기 현황 화면
```
[2024년 6월 27일 기기 현황]

🎵 마이마이 (09:00~13:00)
┌────┬────────┬────────┬────────┐
│번호│ 상태   │ 예약자  │ 체크인 │
├────┼────────┼────────┼────────┤
│ 1  │ 예약됨  │ 홍길동  │   -    │
│ 2  │ 사용중  │ 김철수  │ 09:15  │
│ 3  │ 예약가능│   -    │   -    │
└────┴────────┴────────┴────────┘

🎮 발키리 (08:00~12:00)
┌────┬────────┬────────┬────────┐
│번호│ 상태   │ 예약자  │ 체크인 │
├────┼────────┼────────┼────────┤
│ 1  │ 예약됨  │ 이영희  │   -    │
│ 2  │ 예약됨  │ 박민수  │   -    │
│ 3  │ 점검중  │   -    │   -    │
│ 4  │ 예약가능│   -    │   -    │
└────┴────────┴────────┴────────┘
```

## 5. 체크인 프로세스

### 5.1 체크인 시 기기 확정
```javascript
async function checkIn(reservationId) {
  const reservation = await getReservation(reservationId);
  
  // 예약한 기기 번호가 여전히 사용 가능한지 확인
  const isAvailable = await checkDeviceAvailability(
    reservation.device_number,
    reservation.device_time_slot_id
  );
  
  if (!isAvailable) {
    // 다른 기기로 자동 재배정
    const newNumber = await reassignDevice(reservation);
    await notifyDeviceChange(reservation.user_id, newNumber);
  }
  
  // 체크인 처리
  await updateReservationStatus(reservationId, 'checked_in');
  await updateDeviceStatus(reservation.device_id, 'occupied');
}
```

### 5.2 기기 변경 알림
- 예약한 기기가 사용 불가능한 경우 (고장, 점검 등)
- 다른 번호로 자동 재배정
- FCM 푸시 알림으로 즉시 안내

## 6. 특수 케이스 처리

### 6.1 기기 고장/점검
```javascript
async function setDeviceMaintenance(deviceId) {
  // 1. 기기 상태 변경
  await updateDeviceStatus(deviceId, 'maintenance');
  
  // 2. 영향받는 예약 조회
  const affectedReservations = await getAffectedReservations(deviceId);
  
  // 3. 각 예약에 대해 처리
  for (const reservation of affectedReservations) {
    // 다른 기기로 재배정 시도
    const newDevice = await tryReassignDevice(reservation);
    
    if (newDevice) {
      // 재배정 성공
      await updateReservationDevice(reservation.id, newDevice);
      await sendNotification(reservation.user_id, '기기 변경 안내');
    } else {
      // 재배정 실패 - 예약 취소
      await cancelReservation(reservation.id);
      await sendNotification(reservation.user_id, '예약 취소 안내');
    }
  }
}
```

### 6.2 선호 기기 시스템 (향후 확장)
```javascript
// 사용자 선호 기기 저장
const user_preferences = {
  user_id: 'xxx',
  device_preferences: {
    '마이마이': [1, 3], // 선호 순서
    '발키리': [2, 1, 4, 3]
  }
};

// 예약 시 선호도 반영
async function suggestDeviceNumber(userId, deviceType, availableNumbers) {
  const preferences = await getUserPreferences(userId, deviceType);
  
  // 선호 기기 중 가능한 것 우선 추천
  for (const preferred of preferences) {
    if (availableNumbers.includes(preferred)) {
      return preferred;
    }
  }
  
  // 없으면 가장 낮은 번호
  return availableNumbers[0];
}
```

## 7. 통계 및 분석

### 7.1 기기별 이용률
```sql
-- 기기별 월간 이용률
SELECT 
  d.device_type_id,
  d.device_number,
  COUNT(r.id) as reservation_count,
  SUM(EXTRACT(EPOCH FROM (slot.end_time - slot.start_time))) / 3600 as total_hours
FROM devices d
LEFT JOIN reservations r ON d.id = r.device_id
LEFT JOIN device_time_slots slot ON r.device_time_slot_id = slot.id
WHERE r.status = 'completed'
  AND r.created_at >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY d.device_type_id, d.device_number
ORDER BY d.device_type_id, d.device_number;
```

### 7.2 인기 기기 분석
- 가장 많이 예약되는 기기 번호
- 시간대별 선호 기기
- 기기별 취소율

## 8. 관리자 기능

### 8.1 기기 관리
- 기기 추가/삭제
- 기기 위치 정보 관리
- 점검 스케줄 설정

### 8.2 예약 조정
- 기기 번호 수동 변경
- 긴급 기기 교체
- 예약 이동

### 8.3 실시간 모니터링
```
[실시간 기기 현황]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
마이마이: ■■□ (2/3 사용중)
츄니즘:  ■■■■ (4/4 사용중) ⚠️ 대기자 2명
발키리:  ■□□□ (1/4 사용중)
라이트닝: □□ (0/2 사용중)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

이 시스템은 사용자에게 기기 선택의 자유를 주면서도, 효율적인 운영이 가능하도록 설계되었습니다.