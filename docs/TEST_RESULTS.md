# 백엔드 V2 테스트 결과 문서

## 개요
이 문서는 백엔드 V2 시스템의 각 구성 요소에 대한 테스트 계획과 실행 결과를 기록합니다.

## 테스트 진행 상황

### ✅ 완료된 작업 (테스트 필요)

#### 1. 도메인 엔티티 및 값 객체
- [x] KSTDateTime 값 객체
- [x] ReservationDate 값 객체
- [x] TimeSlot 값 객체
- [x] ReservationStatus 값 객체
- [x] DeviceStatus 값 객체
- [x] PaymentAmount 값 객체
- [x] TransactionId 값 객체
- [x] NotificationPreferences 값 객체
- [x] StatisticsPeriod 값 객체
- [x] User 엔티티
- [x] Device 엔티티 V2
- [x] Reservation 엔티티 V2
- [x] Payment 엔티티 (현장 결제용으로 수정됨)
- [x] Notification 엔티티
- [x] 통계 관련 엔티티들

#### 2. 리포지토리 구현
- [x] UserSupabaseRepository
- [x] SupabaseDeviceRepositoryV2
- [x] SupabaseReservationRepositoryV2
- [x] SupabasePaymentRepository
- [x] SupabaseNotificationRepository

#### 3. 유스케이스 구현
- [x] CreateReservationV2UseCase - 예약 생성
- [x] CancelReservationUseCase - 예약 취소
- [x] GetReservationUseCase - 예약 조회 (단일/목록)
- [x] UpdateReservationUseCase - 예약 수정
- [x] CreatePaymentUseCase - 결제 생성 (현장 결제)
- [x] CompletePaymentUseCase - 결제 완료 (관리자)
- [x] RefundPaymentUseCase - 환불 처리 (관리자)
- [x] GetPaymentUseCase - 결제 조회
- [x] SendReservationNotificationUseCase - 알림 발송
- [x] 통계 관련 유스케이스들

#### 4. API 엔드포인트
- [x] POST /api/v2/reservations - 예약 생성
- [x] GET /api/v2/reservations - 예약 목록 조회
- [x] GET /api/v2/reservations/[id] - 예약 상세 조회
- [x] PATCH /api/v2/reservations/[id] - 예약 수정
- [x] POST /api/v2/reservations/cancel - 예약 취소
- [x] POST /api/v2/payments - 결제 생성
- [x] POST /api/v2/payments/complete - 결제 완료
- [x] POST /api/v2/payments/refund - 환불 처리
- [x] GET /api/v2/payments - 결제 목록 조회
- [x] GET /api/v2/payments/[id] - 결제 상세 조회
- [x] GET /api/v2/payments/summary - 결제 요약 통계
- [x] GET /api/v2/notifications - 알림 목록 조회
- [x] POST /api/v2/notifications - 알림 생성
- [x] PATCH /api/v2/notifications/[id]/read - 알림 읽음 처리
- [x] POST /api/v2/notifications/preferences - 알림 설정 업데이트
- [x] GET /api/v2/statistics/reservations - 예약 통계
- [x] GET /api/v2/statistics/devices - 기기 통계
- [x] GET /api/v2/statistics/users - 사용자 통계

## 테스트 전략

### 1. 단위 테스트 (Unit Tests)
각 도메인 엔티티와 값 객체의 비즈니스 로직 테스트

### 2. 통합 테스트 (Integration Tests)
유스케이스와 리포지토리 간의 상호작용 테스트

### 3. API 테스트 (E2E Tests)
실제 API 엔드포인트 호출을 통한 전체 플로우 테스트

## 테스트 케이스

### 1. KSTDateTime 값 객체 테스트
```typescript
describe('KSTDateTime', () => {
  test('현재 시간을 KST로 생성', () => {
    const now = KSTDateTime.now()
    expect(now).toBeDefined()
    expect(now.toISOString()).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
  })

  test('문자열에서 KST 시간 생성', () => {
    const dateStr = '2025-07-01 14:00:00'
    const kstDate = KSTDateTime.fromString(dateStr)
    expect(kstDate.toDate().getHours()).toBe(14)
  })

  test('24시간 표시 체계 (24~29시)', () => {
    const lateNight = KSTDateTime.fromString('2025-07-02 02:00:00')
    expect(lateNight.getDisplayHour()).toBe(26) // 새벽 2시 → 26시
  })
})
```

### 2. 예약 생성 유스케이스 테스트
```typescript
describe('CreateReservationV2UseCase', () => {
  test('정상적인 예약 생성', async () => {
    const request = {
      userId: 'user-123',
      deviceId: 'device-456',
      date: '2025-07-10',
      timeSlot: { startHour: 14, endHour: 16 }
    }
    
    const result = await useCase.execute(request)
    
    expect(result.reservation).toBeDefined()
    expect(result.reservation.status.value).toBe('pending')
    expect(result.reservation.date.dateString).toBe('2025-07-10')
  })

  test('중복 예약 방지', async () => {
    // 첫 번째 예약 생성
    await useCase.execute(request)
    
    // 동일 시간대 예약 시도
    await expect(useCase.execute(request))
      .rejects.toThrow('선택한 시간대에 이미 다른 예약이 있습니다')
  })

  test('영업시간 외 예약 차단', async () => {
    const invalidRequest = {
      ...request,
      timeSlot: { startHour: 7, endHour: 9 } // 영업시간 전
    }
    
    await expect(useCase.execute(invalidRequest))
      .rejects.toThrow('영업시간은 10:00부터 익일 05:00까지입니다')
  })
})
```

### 3. 결제 시스템 테스트 (현장 결제)
```typescript
describe('Payment System - On-site Only', () => {
  test('결제 생성 - 현금', async () => {
    const request = {
      userId: 'user-123',
      reservationId: 'reservation-789',
      method: 'cash' as PaymentMethod
    }
    
    const result = await createPaymentUseCase.execute(request)
    
    expect(result.payment.status).toBe('pending')
    expect(result.message).toContain('현장에서 현금으로')
  })

  test('결제 완료 - 관리자만 가능', async () => {
    const adminRequest = {
      userId: 'admin-123',
      paymentId: 'payment-456',
      receiptNumber: '2025-001'
    }
    
    const result = await completePaymentUseCase.execute(adminRequest)
    
    expect(result.payment.status).toBe('completed')
    expect(result.payment.receiptNumber).toBe('2025-001')
  })

  test('환불 처리 - 수동 현금 환불', async () => {
    const refundRequest = {
      userId: 'admin-123',
      paymentId: 'payment-456',
      amount: 10000,
      reason: '고객 요청'
    }
    
    const result = await refundPaymentUseCase.execute(refundRequest)
    
    expect(result.refundedAmount).toBe(10000)
    expect(result.message).toContain('현금 10,000원을 환불했습니다')
  })
})
```

### 4. API 엔드포인트 테스트
```typescript
describe('API Endpoints', () => {
  test('POST /api/v2/reservations', async () => {
    const response = await fetch('/api/v2/reservations', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        deviceId: 'device-123',
        date: '2025-07-10',
        timeSlot: { startHour: 14, endHour: 16 }
      })
    })
    
    expect(response.status).toBe(201)
    const data = await response.json()
    expect(data.reservation).toBeDefined()
  })

  test('PATCH /api/v2/reservations/[id]', async () => {
    const response = await fetch('/api/v2/reservations/reservation-123', {
      method: 'PATCH',
      headers: {
        'Authorization': 'Bearer token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        date: '2025-07-11',
        note: '시간 변경 요청'
      })
    })
    
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.message).toContain('예약이 수정되었습니다')
  })
})
```

## 테스트 실행 방법

```bash
# 전체 테스트 실행
npm test

# 특정 파일 테스트
npm test -- reservation.test.ts

# 커버리지 포함
npm test -- --coverage

# 감시 모드
npm test -- --watch
```

## 테스트 커버리지 목표

- 도메인 로직: 90% 이상
- 유스케이스: 85% 이상
- API 엔드포인트: 80% 이상
- 전체: 85% 이상

### 5. 예약 업데이트 테스트
```typescript
describe('UpdateReservationUseCase', () => {
  test('예약 날짜 변경', async () => {
    const request = {
      userId: 'user-123',
      reservationId: 'reservation-456',
      date: '2025-07-11'
    }
    
    const result = await updateUseCase.execute(request)
    
    expect(result.reservation.date.dateString).toBe('2025-07-11')
    expect(result.message).toContain('날짜')
  })

  test('24시간 이내 수정 차단', async () => {
    // 내일 예약을 오늘 수정 시도
    const request = {
      userId: 'user-123',
      reservationId: 'tomorrow-reservation',
      date: '2025-07-12'
    }
    
    await expect(updateUseCase.execute(request))
      .rejects.toThrow('예약 시작 24시간 전에는 수정할 수 없습니다')
  })

  test('관리자는 24시간 제한 없이 수정 가능', async () => {
    const adminRequest = {
      userId: 'admin-123',
      reservationId: 'tomorrow-reservation',
      date: '2025-07-12'
    }
    
    const result = await updateUseCase.execute(adminRequest)
    expect(result.reservation).toBeDefined()
  })

  test('결제 완료된 예약은 관리자만 수정', async () => {
    const userRequest = {
      userId: 'user-123',
      reservationId: 'paid-reservation',
      note: '메모 변경'
    }
    
    await expect(updateUseCase.execute(userRequest))
      .rejects.toThrow('결제가 완료된 예약은 관리자만 수정할 수 있습니다')
  })
})
```

## 미구현 테스트 목록

### 높은 우선순위
1. [x] 예약 업데이트 유스케이스 테스트
2. [ ] 알림 발송 로직 테스트
3. [ ] 통계 계산 정확성 테스트

### 중간 우선순위
1. [ ] 리포지토리 계층 통합 테스트
2. [ ] 에러 처리 시나리오 테스트
3. [ ] 동시성 처리 테스트

### 낮은 우선순위
1. [ ] 성능 테스트
2. [ ] 부하 테스트
3. [ ] 보안 테스트

## 버그 및 이슈 추적

### 발견된 이슈
1. ❌ 예약 시간대가 자정을 넘어가는 경우 처리 필요
2. ❌ 환불 후 예약 상태 동기화 확인 필요
3. ❌ 알림 발송 실패 시 재시도 로직 필요

### 해결된 이슈
1. ✅ PG사 연동 제거 완료
2. ✅ 현장 결제 전용으로 수정 완료
3. ✅ KST 시간대 처리 통일

## 다음 단계

1. 미구현 테스트 케이스 작성
2. CI/CD 파이프라인에 테스트 통합
3. 테스트 자동화 스크립트 개선
4. 성능 모니터링 도구 연동