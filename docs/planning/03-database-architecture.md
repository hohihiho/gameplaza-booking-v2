# 🗄️ 데이터베이스 아키텍처

## Cloudflare D1 전역 데이터베이스

### 아키텍처 개요
게임플라자 예약 시스템은 **Cloudflare D1 전역 데이터베이스**와 **GitHub 아카이브**를 결합한 하이브리드 아키텍처를 채택합니다.

### 주요 특징
- **전역 엣지 실행**: 300+ 위치에서 < 10ms 응답시간
- **무제한 읽기**: 전역 커넥션 풀링으로 고속 처리
- **자동 스케일링**: 트래픽 급증에도 일정한 성능
- **완전 무료**: 25GB + 500만 읽기/일 + 10만 쓰기/일
- **SQLite 기반**: 표준 SQL 완벽 지원

## 📊 3단계 데이터 저장 구조

### 1. Hot Data (활성 데이터) - Cloudflare D1
**보관 기간**: 최근 3개월  
**접근 빈도**: 실시간 접근 (99% 케이스)  

**데이터 종류**:
- 활성 예약 정보 (pending, approved, checked_in)
- 현재 기기 상태 및 설정
- 사용자 세션 및 인증 정보
- 실시간 운영 일정
- 최근 3개월 통계 데이터
- CMS 콘텐츠 데이터 (약관, 정책, 공지사항)

**특징**:
- 엣지 쿼리 최적화: 평균 < 10ms
- 글로벌 읽기 복제
- 자동 확장
- Drizzle ORM 연동

### 2. Warm Data (준활성 데이터) - JSON 파일
**보관 기간**: 3개월 ~ 2년  
**접근 빈도**: 월 1-2회  
**저장 위치**: `/data/archive/warm/`  

**데이터 종류**:
- 완료된 예약 기록
- 월별/분기별 통계
- 기기별 이용 이력
- 사용자 패턴 분석

**파일 구조**:
```
/data/archive/warm/
├── reservations/
│   ├── 2024/
│   │   ├── 2024-01-reservations.json.gz
│   │   └── 2024-02-reservations.json.gz
│   └── 2025/
├── statistics/
│   ├── monthly/
│   └── quarterly/
└── user_patterns/
```

### 3. Cold Data (장기 보관) - 압축 저장
**보관 기간**: 2년 이상 (최대 10년)  
**접근 빈도**: 연 1-2회  
**저장 위치**: `/data/archive/cold/`  

**데이터 종류**:
- 연간 통합 리포트
- 법적 보관 필수 데이터
- 장기 트렌드 분석
- 시스템 변경 이력

**압축 방식**:
- Brotli 압축 (90% 이상 압축률)
- 연도별 통합
- 인덱스 파일 생성

## 🔄 자동 아카이빙 시스템

### GitHub Actions 크론잡
```yaml
# 매일 새벽 2시 (KST) 실행
schedule:
  - cron: '0 17 * * *'  # UTC 17:00 = KST 02:00

# 월말 새벽 1시 실행
schedule:
  - cron: '0 16 28-31 * *'  # UTC 16:00 = KST 01:00
```

### Hot → Warm 이전 프로세스
1. 3개월 이전 완료 데이터 조회
2. 월별 JSON 파일로 그룹화 및 압축
3. GitHub Repository에 커밋
4. 검증 후 원본 삭제
5. 로그 기록

### Warm → Cold 이전 프로세스
1. 2년 이전 월별 파일 통합
2. Brotli 고압축 적용
3. 메타데이터 인덱스 생성
4. Cold 스토리지로 이전

## 📈 통합 검색 시스템

### 검색 API
```typescript
GET /api/data/search?
  user_email=user@example.com
  &start_date=2020-01-01
  &end_date=2025-12-31
  &data_sources=hot,warm,cold
```

### 검색 로직
1. **Hot Data**: D1 직접 쿼리
2. **Warm Data**: JSON 파일 스캔
3. **Cold Data**: 인덱스 기반 검색
4. 결과 통합 및 정렬

### 데이터 복원
```bash
# 특정 월 데이터 복원
npm run restore:month -- --year=2024 --month=06

# 특정 예약 복원
npm run restore:reservation -- --id=240601-001
```

## 💰 비용 최적화

### 10년 운영 비용 추산
```
연도별 데이터량:
- 1년차: ~2MB (압축 후)
- 5년차: ~10MB (누적)
- 10년차: ~20MB (총)

GitHub Repository:
- 10년 후: < 100MB
- 비용: $0 (완전 무료)

Cloudflare D1:
- Hot Data: 50MB 이하
- 비용: $0 (Free Tier)
```

## ⚡ 성능 최적화

### 캐싱 전략
- **메모리 캐싱**: Vercel Edge Functions
- **KV 스토어**: 자주 조회되는 데이터
- **브라우저 캐싱**: 정적 콘텐츠

### 응답 시간 목표
- **Hot Data**: < 100ms
- **Warm Data**: < 2초
- **Cold Data**: < 10초
- **통합 검색**: < 5초

### 모니터링
```yaml
# 헬스체크
- name: "Database Health Check"
  run: |
    npm run health:check
    npm run capacity:monitor
    npm run archiving:status
```

## 🔧 기술 구현

### 아카이빙 스크립트
```typescript
// scripts/archiving/
├── hot-to-warm.ts       // 3개월 아카이빙
├── warm-to-cold.ts      // 2년 압축
├── data-validator.ts    // 무결성 검증
├── search-engine.ts     // 통합 검색
└── restore-manager.ts   // 데이터 복원
```

### 데이터 검증
```typescript
interface ArchiveValidation {
  sourceCount: number;      // 원본 레코드 수
  archivedCount: number;    // 아카이브 레코드 수
  checksumMatch: boolean;   // 무결성 검증
  compressionRatio: number; // 압축 효율
  indexGenerated: boolean;  // 인덱스 생성
}
```

### 복구 보장
1. **3중 백업**: Hot → Warm → Cold → GitHub Release
2. **체크섬 검증**: SHA-256 검증
3. **원자적 작업**: 실패 시 자동 롤백
4. **정기 테스트**: 월 1회 복구 테스트

## 데이터베이스 스키마

### 주요 테이블
```sql
-- 사용자 테이블
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 예약 테이블
CREATE TABLE reservations (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  device_id TEXT REFERENCES devices(id),
  date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 기기 테이블
CREATE TABLE devices (
  id TEXT PRIMARY KEY,
  category_id TEXT REFERENCES device_categories(id),
  type_id TEXT REFERENCES device_types(id),
  device_number INTEGER NOT NULL,
  status TEXT DEFAULT 'available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CMS 콘텐츠 테이블
CREATE TABLE content_pages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  status VARCHAR(20) DEFAULT 'draft',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 인덱스 최적화
```sql
-- 성능 최적화 인덱스
CREATE INDEX idx_reservations_date_status 
  ON reservations(date, status);
  
CREATE INDEX idx_reservations_user_date 
  ON reservations(user_id, date);
  
CREATE INDEX idx_devices_status 
  ON devices(status);
  
CREATE INDEX idx_content_pages_type_status 
  ON content_pages(page_type, status);
```