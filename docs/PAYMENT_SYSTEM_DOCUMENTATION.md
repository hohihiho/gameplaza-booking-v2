# 결제 시스템 문서화

## 현재 구현 상태 (PG사 연동 버전)

### 1. 시스템 개요
현재 결제 시스템은 토스페이먼츠(Toss Payments) PG사와 연동되어 있으며, 다음과 같은 결제 수단을 지원합니다:
- 카드 결제
- 계좌이체
- 가상계좌
- 모바일 결제
- 현금 결제
- 포인트 결제

### 2. 주요 구성 요소

#### 2.1 도메인 엔티티
- **Payment Entity** (`/src/domain/entities/payment.ts`)
  - 결제 정보 관리
  - 상태: pending, processing, completed, failed, cancelled, refunded, partial_refunded
  - 환불 가능 여부 및 금액 계산 로직 포함

#### 2.2 값 객체
- **PaymentAmount** (`/src/domain/value-objects/payment-amount.ts`)
  - 금액 유효성 검증 및 계산
- **TransactionId** (`/src/domain/value-objects/transaction-id.ts`)
  - PG사 거래 ID 관리

#### 2.3 도메인 서비스
- **PaymentService Interface** (`/src/domain/services/payment.service.interface.ts`)
  - PG사 연동 인터페이스 정의
  - 결제 요청, 검증, 환불 메서드 포함

### 3. 유스케이스

#### 3.1 결제 생성 (`create-payment.use-case.ts`)
- PG사로 결제 요청 전송
- 결제 URL 생성 및 반환
- 예약 상태 확인 후 결제 진행

#### 3.2 결제 완료 (`complete-payment.use-case.ts`)
- PG사 콜백 처리
- 결제 검증 및 상태 업데이트
- 예약 상태 자동 변경 (pending → confirmed)
- 알림 발송

#### 3.3 결제 환불 (`refund-payment.use-case.ts`)
- 자동 환불 수수료 계산
- 부분/전액 환불 지원
- PG사 환불 API 호출
- 예약 상태 자동 변경

#### 3.4 결제 조회 (`get-payment.use-case.ts`)
- 개별 결제 상세 조회
- 결제 목록 조회 (필터링, 페이지네이션)
- 결제 요약 통계

### 4. API 엔드포인트

#### 4.1 결제 생성
- **POST** `/api/v2/payments`
- PG사 결제 창 URL 반환

#### 4.2 결제 완료
- **POST** `/api/v2/payments/complete`
- PG사 콜백 처리 엔드포인트

#### 4.3 결제 환불
- **POST** `/api/v2/payments/refund`
- 자동 환불 처리

#### 4.4 결제 조회
- **GET** `/api/v2/payments` - 목록 조회
- **GET** `/api/v2/payments/[id]` - 상세 조회
- **GET** `/api/v2/payments/summary` - 요약 통계

### 5. 외부 서비스
- **TossPaymentsService** (`/src/infrastructure/services/toss-payments.service.ts`)
  - 토스페이먼츠 API 연동
  - 결제 요청, 검증, 환불 구현

## 변경 완료 사항 (현장 결제 시스템)

### 구현된 사용자 요구사항
1. ✅ **PG사 미사용** - 현장 결제만 지원
2. ✅ **결제 수단** - 현금 또는 계좌이체 (현장 결제)
3. ✅ **환불** - 현금으로만 진행 (부분/전액)
4. ✅ **환불 정책** - 자동 계산 없이 수동 처리

### 주요 변경 내용

#### 1. 제거된 항목
- ✅ PaymentService 인터페이스 완전 제거
- ✅ TossPaymentsService 클래스 삭제
- ✅ 자동 환불 수수료 계산 로직 제거
- ✅ 온라인 결제 관련 상태 (processing, failed) 제거
- ✅ 결제 URL 생성 로직 제거

#### 2. 수정된 항목
- ✅ 결제 수단을 현금/계좌이체로만 제한
- ✅ 결제 프로세스를 현장 결제용으로 단순화
- ✅ 환불을 관리자 수동 처리 방식으로 변경
- ✅ 결제 상태 단순화 (pending → completed)
- ✅ receiptUrl을 receiptNumber로 변경

#### 3. 유지된 항목
- ✅ 결제 기록 관리
- ✅ 예약과의 연동
- ✅ 알림 시스템 연동
- ✅ 통계 및 리포트 기능

### 새로운 결제 프로세스

#### 1. 결제 생성
- 사용자가 예약 후 결제 정보 생성 (pending 상태)
- 현금 또는 계좌이체 선택
- 현장 방문 안내 메시지 표시

#### 2. 결제 완료
- 관리자가 현장에서 결제 확인
- 영수증 번호 기록 (선택사항)
- 결제 완료 처리 및 예약 확정

#### 3. 환불 처리
- 관리자만 환불 가능
- 환불 금액 수동 입력
- 현금 환불 완료 후 시스템 기록

### API 변경 사항

#### POST /api/v2/payments
```json
// 요청
{
  "reservationId": "uuid",
  "method": "cash" | "bank_transfer"
}

// 응답
{
  "payment": { ... },
  "message": "현장에서 현금으로 30,000원을 결제해주세요."
}
```

#### POST /api/v2/payments/complete
```json
// 요청 (관리자만)
{
  "paymentId": "uuid",
  "receiptNumber": "2024-001" // 선택사항
}

// 응답
{
  "payment": { ... },
  "message": "홍길동님의 현금 30,000원 결제가 완료되었습니다."
}
```

#### POST /api/v2/payments/refund
```json
// 요청 (관리자만)
{
  "paymentId": "uuid",
  "amount": 30000,
  "reason": "고객 요청"
}

// 응답
{
  "payment": { ... },
  "message": "홍길동님께 현금 30,000원을 환불했습니다."
}
```