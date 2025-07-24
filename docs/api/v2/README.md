# 게임플라자 예약 시스템 API v2 명세

## 개요

이 문서는 게임플라자 예약 시스템의 v2 API 명세를 설명합니다. v2 API는 클린 아키텍처와 도메인 주도 설계(DDD) 원칙에 따라 재설계되었습니다.

## 주요 변경사항 (v1 → v2)

### 아키텍처 개선
- **클린 아키텍처 적용**: 도메인 레이어, 애플리케이션 레이어, 인프라 레이어 분리
- **도메인 모델 중심**: 엔티티, 값 객체, 도메인 서비스로 비즈니스 로직 캡슐화
- **유스케이스 패턴**: 각 비즈니스 사용 사례를 독립적인 유스케이스로 구현

### API 설계 개선
- **RESTful 원칙 준수**: 표준 HTTP 메서드와 상태 코드 사용
- **일관된 응답 형식**: 모든 응답이 동일한 구조 따름
- **명확한 에러 처리**: 구체적인 에러 코드와 메시지 제공
- **페이지네이션 표준화**: 모든 목록 조회 API에 일관된 페이지네이션 적용

### 기능 개선
- **시간대 예약 시스템**: 관리자가 유연하게 시간대를 설정하고 관리
- **예약 제한 로직**: 1인 1대 원칙, 동시 예약 개수 제한
- **예약 번호 체계**: GP-YYYYMMDD-NNNN 형식의 고유 예약 번호

## API 명세 파일

### 1. 예약 관리 API
- **파일**: [`reservation-api.yaml`](./reservation-api.yaml)
- **주요 엔드포인트**:
  - `GET /reservations` - 예약 목록 조회
  - `POST /reservations` - 예약 생성
  - `GET /reservations/{id}` - 예약 상세 조회
  - `PATCH /reservations/{id}` - 예약 상태 변경
  - `POST /reservations/check-availability` - 예약 가능 여부 확인
  - `GET /reservations/user/{userId}/active` - 사용자 활성 예약 조회

### 2. 시간대 관리 API
- **파일**: [`time-slot-api.yaml`](./time-slot-api.yaml)
- **주요 엔드포인트**:
  - `GET /time-slots` - 시간대 템플릿 목록 조회
  - `POST /time-slots` - 시간대 템플릿 생성 (관리자)
  - `PUT /time-slots/{id}` - 시간대 템플릿 수정 (관리자)
  - `GET /time-slots/schedules` - 시간대 스케줄 조회
  - `POST /time-slots/schedules` - 시간대 스케줄 설정 (관리자)
  - `GET /time-slots/available` - 예약 가능한 시간대 조회

## 도메인 모델

### 핵심 엔티티
- **Reservation**: 예약 정보를 관리하는 핵심 엔티티
- **Device**: 게임 기기 정보
- **User**: 사용자 정보
- **TimeSlotTemplate**: 시간대 템플릿
- **TimeSlotSchedule**: 날짜별 시간대 스케줄

### 값 객체
- **KSTDateTime**: 한국 표준시(KST) 기반 날짜/시간 처리
- **TimeSlot**: 시간대 정보 (시작/종료 시간)
- **ReservationStatus**: 예약 상태 및 상태 전이 규칙

## 비즈니스 규칙

### 예약 규칙
1. **24시간 사전 예약**: 예약은 시작 시간 24시간 전까지만 가능
2. **1인 1대 원칙**: 동일 시간대에 1개 기기만 예약 가능
3. **동시 예약 제한**: 활성 예약(pending, approved, checked_in) 최대 3개
4. **시간대 제약**: 최소 30분 단위, 최대 연속 4시간

### 시간 표시 규칙
- **24시간 연장 표시**: 새벽 0-5시는 24-29시로 표시
- **KST 고정**: 모든 시간은 한국 표준시 기준
- **예시**: 
  - 07:00-12:00 (조기)
  - 12:00-18:00 (주간)
  - 18:00-24:00 (야간)
  - 24:00-29:00 (밤샘, 실제로는 00:00-05:00)

### 예약 상태 전이
```
pending → approved → checked_in → completed
   ↓         ↓           ↓
rejected  cancelled    no_show
```

## 인증 및 권한

### 인증 방식
- **JWT Bearer Token**: 모든 API 요청에 Authorization 헤더 필요
- **형식**: `Authorization: Bearer {token}`

### 권한 레벨
- **일반 사용자**: 본인 예약 조회/생성/취소
- **관리자**: 모든 예약 관리, 시간대 설정, 기기 관리

## 에러 처리

### 표준 에러 응답
```json
{
  "code": "RESERVATION_CONFLICT",
  "message": "해당 시간대에 이미 예약이 있습니다",
  "details": {
    "conflictingReservationId": "123e4567-e89b-12d3-a456-426614174000"
  }
}
```

### 주요 에러 코드
- `INVALID_TIME_SLOT`: 잘못된 시간대
- `RESERVATION_CONFLICT`: 예약 충돌
- `USER_RESERVATION_LIMIT`: 사용자 예약 제한 초과
- `INVALID_STATUS_TRANSITION`: 잘못된 상태 전환
- `PAST_TIME_RESERVATION`: 과거 시간 예약 시도
- `INSUFFICIENT_ADVANCE_TIME`: 24시간 규칙 위반

## 구현 현황

### 완료된 부분
- ✅ 도메인 모델 (엔티티, 값 객체)
- ✅ 도메인 서비스
- ✅ 레포지토리 인터페이스
- ✅ 예약 생성 유스케이스
- ✅ 단위 테스트 (110개+)

### 진행 예정
- 🚧 API 엔드포인트 구현
- 🚧 인프라 레이어 (Supabase 연동)
- 🚧 통합 테스트
- 🚧 API 문서 자동화 (Swagger UI)

## 사용 예시

### 예약 생성
```bash
POST /api/v2/reservations
Content-Type: application/json
Authorization: Bearer {token}

{
  "deviceId": "123e4567-e89b-12d3-a456-426614174000",
  "date": "2025-07-24",
  "timeSlot": {
    "startHour": 14,
    "endHour": 18
  }
}
```

### 예약 가능 시간대 조회
```bash
GET /api/v2/time-slots/available?date=2025-07-24&deviceId=123e4567-e89b-12d3-a456-426614174000
Authorization: Bearer {token}
```

## 마이그레이션 가이드

v1 API에서 v2 API로 마이그레이션하는 방법은 [V2_API_MIGRATION_GUIDE.md](/docs/V2_API_MIGRATION_GUIDE.md)를 참조하세요.