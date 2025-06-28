# 📅 실제 이용시간 조정 기능 구현 계획

## 🎯 개요

예약된 시간과 별개로 실제 이용 시작/종료 시간을 관리자가 수동으로 조정할 수 있는 기능을 구현합니다. 이는 관리자 지각, 시스템 오류, 고객 요청 등 다양한 상황에 유연하게 대응하기 위함입니다.

## 📋 요구사항

### 기능적 요구사항
1. 체크인 완료된 예약에 대해 시작/종료 시간 수정 가능
2. 시간 변경 시 사유 입력 필수
3. 실제 이용시간 기준으로 요금 재계산
4. 변경 이력 추적 가능
5. 진행 중인 예약과 완료된 예약 모두 수정 가능

### 비기능적 요구사항
1. 시간 변경은 관리자 권한만 가능
2. 변경 내역은 모두 로그로 기록
3. 실시간으로 UI에 반영
4. 기기 상태 자동 업데이트와 연동

## 🏗️ 구현 계획

### 1단계: 데이터베이스 스키마 수정
```sql
-- reservations 테이블에 필드 추가
ALTER TABLE reservations ADD COLUMN actual_start_time TIMESTAMPTZ;
ALTER TABLE reservations ADD COLUMN actual_end_time TIMESTAMPTZ;
ALTER TABLE reservations ADD COLUMN time_adjustment_reason TEXT;
ALTER TABLE reservations ADD COLUMN adjusted_amount INTEGER;

-- 시간 조정 이력 테이블 생성
CREATE TABLE time_adjustments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reservation_id UUID REFERENCES reservations(id),
  adjusted_by UUID REFERENCES users(id),
  adjustment_type VARCHAR(20), -- 'start' or 'end'
  old_time TIMESTAMPTZ,
  new_time TIMESTAMPTZ,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2단계: UI 구현

#### 체크인 관리 페이지 수정
1. **시간 표시 영역 개선**
   - 예약 시간: 14:00 - 16:00 (2시간)
   - 실제 시간: 14:10 - 16:30 (2시간 20분) [수정]
   
2. **시간 수정 모달**
   ```
   ┌─────────────────────────────────┐
   │     실제 이용시간 조정          │
   ├─────────────────────────────────┤
   │ 시작 시간: [14:10] → [14:00]   │
   │ 종료 시간: [16:00] → [16:30]   │
   │                                 │
   │ 조정 사유: [필수 입력]          │
   │ □ 관리자 지각                  │
   │ □ 시스템 오류                  │
   │ □ 고객 요청 연장               │
   │ □ 조기 종료                    │
   │ □ 기타: [직접 입력]            │
   │                                 │
   │ 예상 요금 변동:                 │
   │ 10,000원 → 11,650원 (+1,650원) │
   │                                 │
   │ [취소]  [변경 사항 저장]        │
   └─────────────────────────────────┘
   ```

3. **변경 이력 표시**
   - 타임라인 형식으로 모든 변경 내역 표시
   - 변경자, 시간, 사유 표시

### 3단계: API 구현

#### 시간 조정 API
```typescript
// POST /api/admin/reservations/{id}/adjust-time
{
  "actual_start_time": "2024-01-25T14:00:00Z",
  "actual_end_time": "2024-01-25T16:30:00Z",
  "reason": "관리자 지각으로 인한 시간 연장",
  "adjustment_type": "both" // 'start' | 'end' | 'both'
}

// Response
{
  "success": true,
  "data": {
    "original_amount": 10000,
    "adjusted_amount": 11650,
    "actual_duration_minutes": 150,
    "adjustment_saved": true
  }
}
```

### 4단계: 비즈니스 로직

#### 요금 재계산 로직
```typescript
function calculateAdjustedAmount(reservation: Reservation) {
  const actualStart = new Date(reservation.actual_start_time);
  const actualEnd = new Date(reservation.actual_end_time);
  const actualMinutes = (actualEnd - actualStart) / (1000 * 60);
  const actualHours = Math.ceil(actualMinutes / 60); // 올림 처리
  
  const hourlyRate = reservation.hourly_rate;
  const adjustedAmount = hourlyRate * actualHours;
  
  return {
    actualMinutes,
    actualHours,
    adjustedAmount,
    difference: adjustedAmount - reservation.total_amount
  };
}
```

#### 시간 조정 가능 조건
1. 예약 상태가 'checked_in' 또는 'completed'
2. 관리자 권한 필요
3. 시작 시간은 종료 시간보다 이전이어야 함
4. 최소 이용시간 30분 이상

### 5단계: 자동화 연동

#### GitHub Actions 크론잡 수정
- 실제 종료 시간(actual_end_time) 기준으로 기기 상태 변경
- 예약 시간이 아닌 실제 시간 기준 체크

#### 실시간 업데이트
- Supabase Realtime으로 시간 변경 시 즉시 반영
- 대시보드의 매출 통계도 실시간 업데이트

## 🧪 테스트 시나리오

### 시나리오 1: 관리자 지각
1. 14:00 예약 → 14:10 실제 시작
2. 종료 시간 16:00 → 16:10으로 자동 연장
3. 추가 요금 없음 (보상 차원)

### 시나리오 2: 고객 요청 연장
1. 16:00 종료 예정 → 17:00으로 연장
2. 1시간 추가 요금 발생
3. 실시간으로 요금 계산 및 결제

### 시나리오 3: 조기 종료
1. 16:00 종료 예정 → 15:30 조기 종료
2. 환불 처리 또는 크레딧 적립
3. 기기 즉시 사용가능 상태로 변경

## 📊 예상 효과

1. **운영 유연성 증대**
   - 다양한 상황에 대한 대응력 향상
   - 고객 만족도 증가

2. **정확한 정산**
   - 실제 이용시간 기준 정산
   - 분쟁 소지 감소

3. **데이터 정확도 향상**
   - 실제 이용 패턴 분석 가능
   - 더 나은 운영 전략 수립

## ⚠️ 주의사항

1. 시간 조정 시 고객 동의 필요
2. 모든 변경 내역은 투명하게 공개
3. 악용 방지를 위한 모니터링 필요
4. 정기적인 감사(Audit) 실시

## 🔄 향후 개선사항

1. **자동 시간 조정**
   - QR 체크인 시 자동 시작
   - 센서 기반 종료 감지

2. **고객 앱 연동**
   - 실시간 이용시간 확인
   - 연장 요청 기능

3. **스마트 요금제**
   - 실제 이용시간 기반 요금제
   - 분 단위 과금 옵션

---

이 문서는 구현 진행에 따라 업데이트됩니다.