# Schedule Management Schema (v3 Backend)

운영 일정(조기 오픈, 밤샘, 이벤트 등)을 관리하는 D1 스키마와 API입니다. 예약 시스템과 분리하여, 일정이 예약 가능 여부에 미치는 영향을 나타낼 수 있습니다.

## 테이블: schedule_events
```
CREATE TABLE schedule_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  date TEXT NOT NULL,
  end_date TEXT,
  type TEXT CHECK (type IN ('special','early_open','overnight','early_close','event','reservation_block')) NOT NULL,
  start_time TEXT,
  end_time TEXT,
  affects_reservation INTEGER DEFAULT 0 NOT NULL,
  block_type TEXT CHECK (block_type IN ('early','overnight','all_day')),
  is_auto_generated INTEGER DEFAULT 0 NOT NULL,
  source_type TEXT CHECK (source_type IN ('manual','reservation_auto')),
  source_reference INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_schedule_events_date ON schedule_events (date);
CREATE INDEX idx_schedule_events_type ON schedule_events (type);
CREATE INDEX idx_schedule_events_affects_reservation ON schedule_events (affects_reservation);
CREATE INDEX idx_schedule_events_auto_generated ON schedule_events (is_auto_generated);
```

## 관리자 API (v3)
- GET  `/api/v3/admin/schedule-events`
- POST `/api/v3/admin/schedule-events`
- GET  `/api/v3/admin/schedule-events/:id`
- PUT  `/api/v3/admin/schedule-events/:id`
- DELETE `/api/v3/admin/schedule-events/:id`

## 사용자 API (v3)
- GET `/api/v3/schedule/today` → 오늘/내일의 운영 일정 요약(프론트 캘린더에 표시)
- GET `/api/v3/schedule?date=YYYY-MM-DD` → 특정 날짜 일정 조회

## 비고
- 예약 차단(reservation_block) 타입은 예약 가능 시간 블록과 조합하여 사용 가능
- KST 기준 날짜/시간 처리
- 예약과의 연계는 애플리케이션 레이어에서 판단(affects_reservation/ block_type 이용)

## 구현 상태
- [x] 관리자 API 라우트 추가 (CRUD)
- [x] 사용자 API 라우트 추가 (today / by date)
- [x] D1 스키마 및 인덱스 추가
- [ ] 고급 필터(기간 범위 포함) 및 KST 엄밀 처리

## 변경 이력
- 2025-09-12: 초기 스키마/인덱스 및 v3 라우트 구현/문서화
