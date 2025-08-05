# 🗄️ 게임플라자 데이터베이스 백업 시스템

Supabase 의존성을 줄이고 데이터 안전성을 높이는 완전한 백업 솔루션입니다.

## 🚀 빠른 시작

### 즉시 백업하기
```bash
# 전체 백업 (JSON + SQL + 스키마)
npm run backup

# JSON 백업만 (항상 가능)
npm run backup:json

# SQL 백업만 (pg_dump 필요)
npm run backup:sql
```

### 백업 상태 확인
```bash
# 백업 현황 보기
npm run backup:status

# 백업 파일 목록
npm run restore:list
```

### 데이터 복원하기
```bash
# 대화형 복원 (안전)
npm run restore

# 특정 파일 복원
npm run restore backups/json/gameplaza-2025-01-22T12-30-00.json
```

## 📋 백업 유형

### 1. JSON 백업 ✅
**장점:**
- 항상 사용 가능 (Supabase API만 필요)
- 사람이 읽을 수 있는 형식
- 선택적 복원 가능

**단점:**
- 대용량 데이터에는 느림
- 관계/제약조건 정보 부족

**사용 시기:** 일반적인 일일 백업, 개발용

### 2. SQL 백업 ⚡
**장점:**
- 완전한 데이터베이스 구조 보존
- 빠른 복원 속도
- 관계/인덱스/제약조건 포함

**단점:**
- pg_dump 필요 (별도 설치)
- DATABASE_URL 설정 필요

**사용 시기:** 프로덕션 백업, 완전 복원

### 3. 스키마 백업 📐
**장점:**
- 데이터베이스 구조만 백업
- 빠르고 작은 크기

**사용 시기:** 개발 환경 설정, 마이그레이션

## ⏰ 자동 백업 스케줄링

### 스케줄러 시작
```bash
# 백업 스케줄러 시작 (백그라운드 실행)
npm run backup:schedule

# 스케줄러 상태 확인
npm run backup:schedule:status

# 스케줄러 중지
npm run backup:schedule:stop
```

### 기본 스케줄
- **매일 새벽 2시**: 전체 백업
- **매주 일요일 새벽 3시**: 오래된 백업 정리
- **시간별 JSON 백업**: 선택적 (기본 비활성화)

### 스케줄 관리
```bash
# 일일 백업 활성화
node scripts/backup-scheduler.js enable daily-backup

# 시간별 백업 활성화 (주의: 많은 파일 생성)
node scripts/backup-scheduler.js enable hourly-json

# 스케줄 비활성화
node scripts/backup-scheduler.js disable hourly-json
```

## 🗂️ 백업 파일 구조

```
backups/
├── json/                          # JSON 백업 파일
│   ├── gameplaza-2025-01-22T02-00-00.json
│   └── gameplaza-2025-01-21T02-00-00.json
├── sql/                           # SQL 백업 파일  
│   ├── gameplaza-2025-01-22T02-00-00.sql
│   ├── schema-2025-01-22T02-00-00.sql
│   └── gameplaza-2025-01-21T02-00-00.sql
└── logs/                          # 백업 로그
    ├── backup-2025-01-22.log
    ├── restore-2025-01-22.log
    └── scheduler.log
```

## 🔧 초기 설정

### 1. 환경 변수 설정
`.env.local` 파일에 다음 변수들이 필요합니다:

```env
# Supabase 설정 (JSON 백업용)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# PostgreSQL 직접 연결 (SQL 백업용, 선택적)
DATABASE_URL=postgresql://user:pass@host:port/dbname
```

### 2. pg_dump 설치 (SQL 백업용, 선택적)
```bash
# macOS
brew install postgresql

# Ubuntu/Debian
sudo apt-get install postgresql-client

# Windows
# PostgreSQL 공식 설치 프로그램 사용
```

### 3. 백업 디렉토리 권한 확인
```bash
# 백업 디렉토리 생성 및 권한 설정
mkdir -p backups/{json,sql,logs}
chmod 755 backups backups/*
```

## 📊 백업 전략 권장사항

### 개발 환경
```bash
# 매일 JSON 백업
npm run backup:json

# 주간 정리
npm run backup:cleanup
```

### 스테이징 환경
```bash
# 자동 스케줄러 사용
npm run backup:schedule

# 배포 전 수동 백업
npm run backup
```

### 프로덕션 환경
```bash
# 1. 자동 스케줄러 + 모니터링
npm run backup:schedule

# 2. 중요 변경 전 수동 백업
npm run backup

# 3. 정기적 백업 검증
npm run backup:status

# 4. 복원 테스트 (별도 환경에서)
npm run restore
```

## 🚨 재해 복구 시나리오

### 시나리오 1: Supabase 일시 중단
```bash
# 1. 상황 확인
npm run backup:status

# 2. 최신 백업 확인
npm run restore:list

# 3. 필요시 로컬에서 백업 데이터 확인
# JSON 파일 직접 열어서 데이터 확인 가능
```

### 시나리오 2: 데이터 손상/삭제
```bash
# 1. 즉시 현재 상태 백업 (증거 보전)
npm run backup

# 2. 복원할 백업 선택
npm run restore:list

# 3. 대화형 복원 실행 (안전 확인 포함)
npm run restore

# 4. 데이터 검증
npm run backup:status
```

### 시나리오 3: 완전한 데이터베이스 재구축
```bash
# 1. 스키마 복원
node scripts/restore-database.js backups/sql/schema-latest.sql

# 2. 데이터 복원
node scripts/restore-database.js backups/json/gameplaza-latest.json

# 3. 검증 및 테스트
npm run test:realdb
```

## 💡 모범 사례

### 1. 백업 주기
- **개발**: 매일 JSON 백업
- **스테이징**: 매일 전체 백업 + 주간 정리
- **프로덕션**: 매일 전체 백업 + 실시간 모니터링

### 2. 보관 정책
- 최근 30일: 모든 백업 보관
- 1-3개월: 주간 백업만 보관
- 3개월+: 월간 백업만 보관

### 3. 검증 절차
```bash
# 주간 백업 검증
npm run backup:status
npm run restore:list

# 월간 복원 테스트 (스테이징 환경)
npm run restore # 최신 백업 복원 테스트
```

### 4. 모니터링
```bash
# 백업 스케줄러 상태 정기 확인
npm run backup:schedule:status

# 백업 로그 확인
tail -f backups/logs/scheduler.log
```

## 🔍 문제 해결

### 백업 실패 시
```bash
# 1. 로그 확인
cat backups/logs/backup-$(date +%Y-%m-%d).log

# 2. 환경 변수 확인
npm run fix env

# 3. Supabase 연결 테스트
node -e "
const { createClient } = require('@supabase/supabase-js');
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
client.from('users').select('count').then(console.log);
"
```

### 복원 실패 시
```bash
# 1. 백업 파일 무결성 확인
ls -la backups/json/
head -100 backups/json/gameplaza-latest.json

# 2. 권한 확인
chmod +r backups/json/*.json
chmod +r backups/sql/*.sql

# 3. 단계별 복원
# JSON 백업은 테이블별로 복원 가능
```

### 스케줄러 문제
```bash
# 1. 프로세스 확인
ps aux | grep backup-scheduler

# 2. 설정 파일 확인
cat backup-config.json

# 3. 수동 재시작
npm run backup:schedule:stop
npm run backup:schedule
```

## 📈 백업 성능 최적화

### 대용량 데이터베이스의 경우
1. **JSON 백업**: 테이블별 분할 백업 고려
2. **SQL 백업**: 압축 옵션 사용
3. **스케줄링**: 피크 시간 피해서 실행

### 네트워크 최적화
- 백업 시간대를 트래픽이 적은 새벽 시간으로 설정
- 대용량 백업은 압축 후 저장

---

## 🎯 요약

✅ **즉시 사용 가능**: `npm run backup`  
✅ **자동화**: `npm run backup:schedule`  
✅ **안전한 복원**: `npm run restore`  
✅ **완전한 로깅**: `backups/logs/` 확인  
✅ **유연한 전략**: JSON/SQL 선택 가능  

이 백업 시스템으로 Supabase 의존성 걱정 없이 안전하게 데이터를 보호하세요! 🛡️