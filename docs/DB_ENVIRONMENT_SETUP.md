# 개발/운영 DB 분리 설정 가이드

## 📋 현재 구성
- **개발 DB**: `rupeyejnfurlcpgneekg.supabase.co` (기존 DB)
- **운영 DB**: 새로 생성한 프로덕션 Supabase 프로젝트

## 🔧 설정 방법

### 1. 개발용 Supabase 프로젝트 생성

#### 옵션 A: 새 Supabase 프로젝트 (권장)
1. [Supabase Dashboard](https://app.supabase.com) 접속
2. "New Project" 클릭
3. 프로젝트명: `gameplaza-dev` 
4. 비밀번호 설정
5. Region: Seoul (ap-northeast-2) 선택

#### 옵션 B: Supabase Local (Docker)
```bash
# Supabase CLI 설치
brew install supabase/tap/supabase

# 프로젝트 초기화
supabase init

# 로컬 서버 시작
supabase start
```

### 2. 환경 변수 설정

#### `.env.local` (로컬 개발)
```env
# 개발 DB
NEXT_PUBLIC_SUPABASE_URL=https://your-dev-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-dev-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-dev-service-role-key
```

#### `.env.production` (운영)
```env
# 운영 DB (기존 DB)
NEXT_PUBLIC_SUPABASE_URL=https://rupeyejnfurlcpgneekg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-prod-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-prod-service-role-key
```

### 3. Vercel 환경 변수 설정

#### Production Environment
Vercel Dashboard > Settings > Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL_PROD`: 운영 DB URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY_PROD`: 운영 Anon Key
- `SUPABASE_SERVICE_ROLE_KEY_PROD`: 운영 Service Role Key

#### Preview Environment
- `NEXT_PUBLIC_SUPABASE_URL_DEV`: 개발 DB URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY_DEV`: 개발 Anon Key
- `SUPABASE_SERVICE_ROLE_KEY_DEV`: 개발 Service Role Key

### 4. 데이터베이스 마이그레이션

개발 DB에 운영 DB 스키마 복사:

```bash
# 운영 DB 스키마 내보내기
pg_dump -h aws-0-ap-northeast-2.pooler.supabase.com \
  -U postgres.rupeyejnfurlcpgneekg \
  -d postgres \
  -p 6543 \
  --schema-only \
  > schema.sql

# 개발 DB에 스키마 적용
psql -h your-dev-db-host \
  -U postgres \
  -d postgres \
  < schema.sql
```

또는 Supabase Dashboard에서:
1. 운영 DB > SQL Editor
2. 모든 테이블 스키마 복사
3. 개발 DB > SQL Editor에 붙여넣기

### 5. 테스트 데이터 준비

```sql
-- 개발 DB에 테스트 데이터 삽입
INSERT INTO users (email, name, nickname, role) VALUES
  ('test@example.com', '테스트유저', '테스터', 'user'),
  ('admin@example.com', '관리자', '어드민', 'admin');

INSERT INTO devices (name, type, status) VALUES
  ('PS5 #1', 'PS5', 'available'),
  ('Switch #1', 'SWITCH', 'available');
```

## 🚀 사용 방법

### 로컬 개발
```bash
# 개발 DB 사용
npm run dev
```

### Vercel 배포
```bash
# feature 브랜치 → Preview (개발 DB)
git push origin feature/branch-name

# main 브랜치 → Production (운영 DB)
git push origin main
```

## ✅ 확인 사항

### 현재 환경 확인
```typescript
// pages/api/check-env.ts
export default function handler(req, res) {
  res.json({
    environment: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    dbUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...'
  })
}
```

### 주의 사항
1. **운영 DB 키는 절대 개발 환경에 넣지 마세요**
2. **`.env.local`은 절대 commit하지 마세요**
3. **개발 DB에서만 테스트 데이터 생성**
4. **운영 배포 전 반드시 환경 변수 확인**

## 🔐 보안 체크리스트
- [ ] `.env.local`이 `.gitignore`에 포함되어 있는지 확인
- [ ] 운영 Service Role Key가 노출되지 않았는지 확인
- [ ] Vercel 환경 변수가 올바른 환경에 설정되었는지 확인
- [ ] 개발/운영 DB가 완전히 분리되었는지 확인