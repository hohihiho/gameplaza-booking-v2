# 체크인 시스템 도메인 설계

## 개요
체크인 시스템은 예약된 고객이 실제로 방문했을 때 체크인을 처리하고, 결제를 확인하며, 기기 상태를 관리하는 핵심 기능입니다.

## 도메인 모델

### 1. CheckIn 엔티티
체크인 정보를 관리하는 핵심 엔티티

```typescript
interface CheckIn {
  id: string
  reservationId: string  // 예약 ID
  deviceId: string      // 배정된 기기 ID
  checkInTime: Date     // 체크인 시간
  checkOutTime?: Date   // 체크아웃 시간
  paymentStatus: PaymentStatus
  paymentMethod?: PaymentMethod
  paymentAmount: number
  adjustedAmount?: number  // 조정된 금액
  adjustmentReason?: string
  actualStartTime?: Date   // 실제 시작 시간
  actualEndTime?: Date     // 실제 종료 시간
  status: CheckInStatus
  notes?: string
  createdAt: Date
  updatedAt: Date
}
```

### 2. 값 객체들

#### PaymentStatus (결제 상태)
```typescript
enum PaymentStatus {
  PENDING = 'pending',        // 결제 대기
  COMPLETED = 'completed',    // 결제 완료
  CANCELLED = 'cancelled'     // 결제 취소
}
```

#### PaymentMethod (결제 방법)
```typescript
enum PaymentMethod {
  CASH = 'cash',              // 현금
  BANK_TRANSFER = 'transfer', // 계좌이체
  CARD = 'card'              // 카드 (향후 추가)
}
```

#### CheckInStatus (체크인 상태)
```typescript
enum CheckInStatus {
  CHECKED_IN = 'checked_in',    // 체크인 완료
  IN_USE = 'in_use',           // 사용 중
  COMPLETED = 'completed',      // 완료
  CANCELLED = 'cancelled'       // 취소
}
```

### 3. CheckInTime 값 객체
체크인 가능 시간을 관리하는 값 객체

```typescript
class CheckInTime {
  private readonly reservationStartTime: Date
  
  constructor(reservationStartTime: Date) {
    this.reservationStartTime = reservationStartTime
  }
  
  // 체크인 가능 여부 확인 (예약 시작 1시간 전부터 가능)
  canCheckIn(currentTime: Date): boolean {
    const oneHourBefore = new Date(this.reservationStartTime)
    oneHourBefore.setHours(oneHourBefore.getHours() - 1)
    return currentTime >= oneHourBefore
  }
  
  // 체크인 가능 시작 시간 반환
  getCheckInAvailableTime(): Date {
    const oneHourBefore = new Date(this.reservationStartTime)
    oneHourBefore.setHours(oneHourBefore.getHours() - 1)
    return oneHourBefore
  }
}
```

### 4. TimeAdjustment 값 객체
시간 조정을 관리하는 값 객체

```typescript
class TimeAdjustment {
  constructor(
    private readonly originalStartTime: Date,
    private readonly originalEndTime: Date,
    private readonly adjustedStartTime?: Date,
    private readonly adjustedEndTime?: Date,
    private readonly reason?: string
  ) {}
  
  getAdjustedDuration(): number {
    const start = this.adjustedStartTime || this.originalStartTime
    const end = this.adjustedEndTime || this.originalEndTime
    return end.getTime() - start.getTime()
  }
  
  hasAdjustment(): boolean {
    return !!(this.adjustedStartTime || this.adjustedEndTime)
  }
}
```

### 5. AmountAdjustment 값 객체
금액 조정을 관리하는 값 객체

```typescript
class AmountAdjustment {
  constructor(
    private readonly originalAmount: number,
    private readonly adjustedAmount: number,
    private readonly reason: string
  ) {}
  
  getDifference(): number {
    return this.adjustedAmount - this.originalAmount
  }
  
  getDiscountRate(): number {
    if (this.originalAmount === 0) return 0
    return ((this.originalAmount - this.adjustedAmount) / this.originalAmount) * 100
  }
}
```

## 리포지토리 인터페이스

```typescript
interface CheckInRepository {
  create(checkIn: CheckIn): Promise<CheckIn>
  update(checkIn: CheckIn): Promise<CheckIn>
  findById(id: string): Promise<CheckIn | null>
  findByReservationId(reservationId: string): Promise<CheckIn | null>
  findByDeviceId(deviceId: string): Promise<CheckIn[]>
  findActiveCheckIns(): Promise<CheckIn[]>
  findByDateRange(startDate: Date, endDate: Date): Promise<CheckIn[]>
}
```

## 유스케이스

### 1. ProcessCheckInUseCase
체크인 처리 유스케이스

**입력**
- reservationId: string
- deviceId: string
- paymentMethod?: PaymentMethod
- adminId: string

**처리**
1. 예약 정보 확인
2. 체크인 가능 시간 검증
3. 기기 상태 확인 및 배정
4. 체크인 정보 생성
5. 예약 상태 업데이트 (checked_in)
6. 기기 상태 업데이트 (in_use)

### 2. ConfirmPaymentUseCase
결제 확인 유스케이스

**입력**
- checkInId: string
- paymentMethod: PaymentMethod
- adminId: string

**처리**
1. 체크인 정보 조회
2. 결제 상태 업데이트
3. 체크인 상태를 in_use로 변경
4. 예약 상태 업데이트

### 3. AdjustTimeAndAmountUseCase
시간/금액 조정 유스케이스

**입력**
- checkInId: string
- adjustedStartTime?: Date
- adjustedEndTime?: Date
- adjustedAmount?: number
- reason: string
- adminId: string

**처리**
1. 체크인 정보 조회
2. 시간 조정 (선택적)
3. 금액 재계산 및 조정
4. 조정 사유 기록
5. 정보 업데이트

### 4. ProcessCheckOutUseCase
체크아웃 처리 유스케이스

**입력**
- checkInId: string
- adminId: string

**처리**
1. 체크인 정보 조회
2. 체크아웃 시간 기록
3. 체크인 상태를 completed로 변경
4. 기기 상태를 available로 변경
5. 예약 상태 업데이트

### 5. CancelCheckInUseCase
체크인 취소 유스케이스

**입력**
- checkInId: string
- reason: string
- adminId: string

**처리**
1. 체크인 정보 조회
2. 체크인 상태를 cancelled로 변경
3. 기기 상태 원복
4. 예약 상태 원복
5. 취소 사유 기록

## 도메인 이벤트

```typescript
// 체크인 완료 이벤트
interface CheckInCompletedEvent {
  checkInId: string
  reservationId: string
  deviceId: string
  checkInTime: Date
}

// 결제 확인 이벤트
interface PaymentConfirmedEvent {
  checkInId: string
  paymentMethod: PaymentMethod
  amount: number
}

// 체크아웃 완료 이벤트
interface CheckOutCompletedEvent {
  checkInId: string
  checkOutTime: Date
  duration: number
}
```

## 비즈니스 규칙

1. **체크인 가능 시간**: 예약 시작 시간 1시간 전부터 가능
2. **기기 배정**: 체크인 시점에 사용 가능한 기기 중에서 자동 배정
3. **결제 프로세스**: 체크인 → 결제 확인 → 사용 시작
4. **시간 조정**: 실제 이용 시간에 따라 관리자가 조정 가능
5. **금액 조정**: 시간 조정이나 특별 할인 등으로 관리자가 조정 가능
6. **체크인 취소**: 모든 상태를 원복하고 기기를 다시 사용 가능 상태로 변경

## 데이터베이스 스키마

```sql
CREATE TABLE check_ins (
  id VARCHAR(255) PRIMARY KEY,
  reservation_id VARCHAR(255) NOT NULL,
  device_id VARCHAR(255) NOT NULL,
  check_in_time TIMESTAMP WITH TIME ZONE NOT NULL,
  check_out_time TIMESTAMP WITH TIME ZONE,
  payment_status VARCHAR(50) NOT NULL DEFAULT 'pending',
  payment_method VARCHAR(50),
  payment_amount INTEGER NOT NULL,
  adjusted_amount INTEGER,
  adjustment_reason TEXT,
  actual_start_time TIMESTAMP WITH TIME ZONE,
  actual_end_time TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) NOT NULL DEFAULT 'checked_in',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  FOREIGN KEY (reservation_id) REFERENCES reservations(id),
  FOREIGN KEY (device_id) REFERENCES devices(id)
);

CREATE INDEX idx_check_ins_reservation ON check_ins(reservation_id);
CREATE INDEX idx_check_ins_device ON check_ins(device_id);
CREATE INDEX idx_check_ins_status ON check_ins(status);
CREATE INDEX idx_check_ins_check_in_time ON check_ins(check_in_time);
```