# 게임플라자 D1 데이터베이스 마이그레이션

## 파일 구조

### `complete-schema.sql`
- **목적**: 전체 데이터베이스 스키마 정의
- **사용법**: 새로운 D1 데이터베이스 생성 시 전체 스키마를 한 번에 적용
- **내용**: 모든 테이블, 인덱스, 기본 데이터 포함

### `add-guide-contents.sql`
- **목적**: 기존 데이터베이스에 guide_contents 테이블 추가
- **사용법**: 이미 운영 중인 데이터베이스에 CMS 기능 추가 시 사용
- **내용**: guide_contents 테이블 및 관련 인덱스만 포함

## 사용 방법

### 1. 새 데이터베이스 생성 시
```bash
# Cloudflare D1에서 새 데이터베이스 생성
wrangler d1 create gameplaza-v2

# 전체 스키마 적용
wrangler d1 execute gameplaza-v2 --file=migrations/complete-schema.sql
```

### 2. 기존 데이터베이스 업데이트 시
```bash
# 특정 기능만 추가
wrangler d1 execute gameplaza-v2 --file=migrations/add-guide-contents.sql
```

## 테이블 구조

### 사용자 관리
- `users` - 사용자 정보
- `sessions` - 세션 관리
- `accounts` - OAuth 계정 연동
- `verifications` - 인증 코드

### 기기 관리
- `device_types` - 기기 종류 (사볼텍, 비트매니아 등)
- `devices` - 개별 기기 정보

### 예약 시스템
- `time_slots` - 예약 가능 시간대
- `reservations` - 예약 정보
- `schedule_events` - 운영 일정/이벤트

### CMS 컨텐츠
- `guide_contents` - 이용안내 편집 가능 콘텐츠

## 데이터베이스 설정

현재 프로젝트는 Cloudflare D1 데이터베이스를 사용합니다.

### wrangler.toml 설정
```toml
[[d1_databases]]
binding = "DB"
database_name = "gameplaza-v2"
database_id = "your-database-id"
```

### 환경 변수
```bash
CLOUDFLARE_D1_DATABASE_ID=your-database-id
```

## 주의사항

1. **프로덕션 적용**: 항상 백업 후 마이그레이션 진행
2. **인덱스**: 성능을 위해 적절한 인덱스가 설정되어 있음
3. **외래키**: SQLite 외래키 제약 조건 활성화 필요
4. **데이터 타입**: D1은 SQLite 기반이므로 타입 제한 고려