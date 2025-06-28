# 예약 시간 조정 기능

## 개요
관리자가 예약의 시작/종료 시간을 수동으로 조정할 수 있는 기능입니다. 고객의 요청이나 운영상의 필요에 따라 예약 시간을 유연하게 변경할 수 있습니다.

## 주요 기능

### 1. 시간 조정 UI
- 예약 상세 모달에서 "시간 변경" 버튼을 통해 접근
- 시작 시간과 종료 시간을 각각 조정 가능
- 시각적으로 명확한 시간 선택 인터페이스

### 2. 변경 사유 관리
- **사전 정의된 사유**:
  - 고객 요청
  - 일정 충돌
  - 기기 문제
  - 직원 부족
  - 기타 (직접 입력)
- 사유 입력은 **선택사항**으로, 입력하지 않아도 시간 변경 가능

### 3. 시간 조정 이력
- 모든 시간 변경 내역이 자동으로 기록됨
- 변경 전/후 시간, 변경 사유, 변경자, 변경 일시 표시
- 예약 상세 모달에서 전체 이력 확인 가능

## 사용 방법

1. **예약 상세 확인**
   - 예약 관리 페이지에서 원하는 예약의 눈 아이콘(👁) 클릭
   - 예약 상세 모달이 열림

2. **시간 변경 시작**
   - "시간 조정" 섹션에서 "시간 변경" 버튼 클릭
   - 시간 입력 폼이 표시됨

3. **새로운 시간 설정**
   - 시작 시간과 종료 시간을 원하는 값으로 변경
   - 필요시 변경 사유 선택 (선택사항)

4. **변경사항 저장**
   - "저장" 버튼을 클릭하여 변경사항 적용
   - 성공 메시지 확인 후 모달 닫기

## 기술 구현

### 데이터베이스 스키마
```sql
-- reservations 테이블 추가 필드
actual_start_time TIMESTAMPTZ  -- 실제 시작 시간
actual_end_time TIMESTAMPTZ    -- 실제 종료 시간
time_adjustment_reason TEXT    -- 시간 조정 사유

-- time_adjustments 테이블 (이력 관리)
id UUID PRIMARY KEY
reservation_id UUID            -- 예약 ID
adjusted_by UUID              -- 변경한 관리자
adjustment_type VARCHAR(20)   -- 조정 유형
old_start_time TIMESTAMPTZ   -- 이전 시작 시간
new_start_time TIMESTAMPTZ   -- 새 시작 시간
old_end_time TIMESTAMPTZ     -- 이전 종료 시간
new_end_time TIMESTAMPTZ     -- 새 종료 시간
reason TEXT                  -- 변경 사유
created_at TIMESTAMPTZ      -- 변경 일시
```

### API 엔드포인트
- **POST** `/api/admin/reservations/time-adjustment`
  - 시간 조정 요청 처리
  - 이력 자동 저장
  
- **GET** `/api/admin/reservations/time-adjustment?reservationId={id}`
  - 특정 예약의 시간 조정 이력 조회

### 보안
- 관리자 권한 확인 (admin@gameplaza.kr, ndz5496@gmail.com)
- Row Level Security로 데이터 보호
- 모든 변경 내역 감사 추적

## 향후 개선사항
- [ ] 시간 조정에 따른 요금 자동 재계산
- [ ] 고객에게 시간 변경 알림 전송
- [ ] 대량 시간 조정 기능
- [ ] 시간 조정 통계 및 리포트