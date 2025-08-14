# Vercel 환경변수 설정 가이드

## 📋 환경별 설정

Vercel 대시보드에서 각 환경별로 다른 환경변수를 설정해야 합니다.

## 1️⃣ Production 환경 (실제 운영)

프로덕션 배포 시 사용되는 환경변수입니다.

```bash
# Supabase 프로덕션 DB (Gameplaza-product)
NEXT_PUBLIC_SUPABASE_URL=https://rfcxbqlgvppqjxgpwnzd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmY3hicWxndnBwcWp4Z3B3bnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMzU0MDUsImV4cCI6MjA2NTkxMTQwNX0.XDLyIizkYB1Tz8rNwPez8LV1H_bIQGTh_KP1crpfM-o

# 서버 전용 (절대 클라이언트에 노출하면 안됨!)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmY3hicWxndnBwcWp4Z3B3bnpkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDMzNTQwNSwiZXhwIjoyMDY1OTExNDA1fQ.C0vHJAYJHCpOqkTL9GQvqLk8vRJUf0koxC0aEtJA05E

# Personal Access Token (MCP용)
SUPABASE_ACCESS_TOKEN=sbp_d2b033997eb6381787c0460cf9e1a18d767897c0

# NextAuth 설정
NEXTAUTH_SECRET=s+buiCTuHYFj6iSQkRaY17VAOIvINq2gS6F1yIO+IxI=
NEXTAUTH_URL=https://gameplaza-v2.vercel.app

# 데이터베이스 직접 연결 (필요시)
DATABASE_URL=postgresql://postgres.rfcxbqlgvppqjxgpwnzd:[YOUR-DB-PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres

# Google OAuth
GOOGLE_CLIENT_ID=44559014883-248e8a3kb4meo4peee4ga8vr5190566m.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# Firebase 설정 (전화번호 인증용)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCmUu1gBrvxAFfQbCwToKIraFgEdBGIt6o
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=gameplaza-kr0.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://gameplaza-kr0-default-rtdb.asia-southeast1.firebasedatabase.app
NEXT_PUBLIC_FIREBASE_PROJECT_ID=gameplaza-kr0
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=gameplaza-kr0.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=44559014883
NEXT_PUBLIC_FIREBASE_APP_ID=1:44559014883:web:edab1727ac2d7a965cded6
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-6WBCMK3RYF

# PWA Push Notifications - VAPID Keys
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BKd0F7QbaOONvQ1Y7Tj5SGYP-7PY9jKXzSqPqPbPUzOhS7kcMdYCYKqWjRETeQc2TKZMSKqHYXBHpAV8QqnGXTg
VAPID_PRIVATE_KEY=4VQjhbsd_5vCCYHmvLqzVBLWPWH9wPaVU5UBpFPWV4A

# 한국천문연구원 공휴일 API
NEXT_PUBLIC_HOLIDAY_API_KEY=jrAc%2BOqGGL6NGNpcrAqLHdcGwqQ6vVMxYmneaDm3ZWMMeUw0GqGYGRDXt%2F1NMMWCXDifelmWxSzYUvCHn0xFDg%3D%3D

# Vercel Cron Job Secret
CRON_SECRET=your-secure-cron-secret-here

# 환경 설정
NODE_ENV=production
```

## 2️⃣ Preview 환경 (PR 프리뷰)

PR을 만들거나 브랜치를 푸시할 때 생성되는 프리뷰 환경입니다.

```bash
# Supabase 개발 DB (gameplaza-dev)
NEXT_PUBLIC_SUPABASE_URL=https://rupeyejnfurlcpgneekg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1cGV5ZWpuZnVybGNwZ25lZWtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NjY0MjgsImV4cCI6MjA2NjQ0MjQyOH0.klSRGXI1hzkAG_mfORuAK5C74vDclX8VFeLEsyv9CAs

# 서버 전용 (개발)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1cGV5ZWpuZnVybGNwZ25lZWtnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDg2NjQyOCwiZXhwIjoyMDY2NDQyNDI4fQ.49VEsYv-jDnKPb1wK_wBmXgcdQWnYilLYaqbbaAHCt4

# Personal Access Token (MCP용)
SUPABASE_ACCESS_TOKEN=sbp_d2b033997eb6381787c0460cf9e1a18d767897c0

# NextAuth 설정 (프리뷰 URL은 동적으로 생성됨)
NEXTAUTH_SECRET=s+buiCTuHYFj6iSQkRaY17VAOIvINq2gS6F1yIO+IxI=
# NEXTAUTH_URL은 Vercel이 자동으로 설정

# 데이터베이스 직접 연결 (개발)
DATABASE_URL=postgresql://postgres.rupeyejnfurlcpgneekg:tpgml12%40%40S@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres

# Google OAuth (동일)
GOOGLE_CLIENT_ID=44559014883-248e8a3kb4meo4peee4ga8vr5190566m.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# Firebase 설정 (동일)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCmUu1gBrvxAFfQbCwToKIraFgEdBGIt6o
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=gameplaza-kr0.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://gameplaza-kr0-default-rtdb.asia-southeast1.firebasedatabase.app
NEXT_PUBLIC_FIREBASE_PROJECT_ID=gameplaza-kr0
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=gameplaza-kr0.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=44559014883
NEXT_PUBLIC_FIREBASE_APP_ID=1:44559014883:web:edab1727ac2d7a965cded6
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-6WBCMK3RYF

# PWA Push Notifications (동일)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BKd0F7QbaOONvQ1Y7Tj5SGYP-7PY9jKXzSqPqPbPUzOhS7kcMdYCYKqWjRETeQc2TKZMSKqHYXBHpAV8QqnGXTg
VAPID_PRIVATE_KEY=4VQjhbsd_5vCCYHmvLqzVBLWPWH9wPaVU5UBpFPWV4A

# 한국천문연구원 공휴일 API (동일)
NEXT_PUBLIC_HOLIDAY_API_KEY=jrAc%2BOqGGL6NGNpcrAqLHdcGwqQ6vVMxYmneaDm3ZWMMeUw0GqGYGRDXt%2F1NMMWCXDifelmWxSzYUvCHn0xFDg%3D%3D

# Vercel Cron Job Secret
CRON_SECRET=your-secure-cron-secret-here

# 환경 설정
NODE_ENV=preview
```

## 3️⃣ Development 환경 (개발 브랜치)

개발 브랜치 배포 시 사용되는 환경변수입니다. (Preview와 동일)

```bash
# Preview와 동일한 설정 사용
# 개발 DB (rupeyejnfurlcpgneekg) 사용
```

## 🔧 Vercel 대시보드에서 설정하는 방법

1. **Vercel 프로젝트 설정 페이지 접속**
   - https://vercel.com/[your-team]/gameplaza-v2/settings/environment-variables

2. **환경변수 추가/수정**
   - Key: 환경변수 이름
   - Value: 환경변수 값
   - Environment: 체크박스 선택
     - ✅ Production (운영)
     - ✅ Preview (PR 프리뷰)
     - ✅ Development (개발)

3. **환경별로 다른 값 설정**
   - 같은 키 이름으로 여러 번 추가
   - 각각 다른 Environment 선택
   - 예: `NEXT_PUBLIC_SUPABASE_URL`
     - Production: 운영 DB URL
     - Preview/Development: 개발 DB URL

## ⚠️ 중요 사항

### 1. 보안 주의사항
- `SUPABASE_SERVICE_ROLE_KEY`는 절대 클라이언트에 노출되면 안됨
- GitHub에 커밋하지 말 것
- Vercel 환경변수로만 관리

### 2. DB 구분
- **Production**: `rfcxbqlgvppqjxgpwnzd` (운영 DB)
- **Preview/Dev**: `rupeyejnfurlcpgneekg` (개발 DB)

### 3. 환경 확인 방법
```javascript
// 코드에서 현재 환경 확인
console.log('VERCEL_ENV:', process.env.VERCEL_ENV);
// production | preview | development | undefined(로컬)
```

### 4. 재배포
- 환경변수 변경 후 반드시 재배포 필요
- Vercel 대시보드에서 "Redeploy" 클릭

## 📝 체크리스트

- [ ] Production 환경변수 설정 완료
- [ ] Preview 환경변수 설정 완료
- [ ] Development 환경변수 설정 완료
- [ ] 각 환경별 DB URL 확인
- [ ] SERVICE_ROLE_KEY 보안 설정 확인
- [ ] 재배포 실행

## 🔍 문제 해결

### 환경변수가 적용되지 않을 때
1. Vercel 대시보드에서 환경변수 확인
2. 올바른 Environment가 선택되었는지 확인
3. 재배포 실행
4. 빌드 로그에서 환경변수 로드 확인

### DB 연결 오류
1. Supabase 프로젝트 상태 확인 (ACTIVE_HEALTHY)
2. API 키가 올바른지 확인
3. 환경별 DB URL이 맞는지 확인