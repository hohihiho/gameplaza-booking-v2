# Vercel 환경변수 설정 가이드

## 🎯 Production 환경 (main 브랜치)

Vercel Dashboard > Settings > Environment Variables에서 **Production**만 체크하고 추가:

```env
NEXT_PUBLIC_SUPABASE_URL=https://rfcxbqlgvppqjxgpwnzd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmY3hicWxndnBwcWp4Z3B3bnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMzU0MDUsImV4cCI6MjA2NTkxMTQwNX0.XDLyIizkYB1Tz8rNwPez8LV1H_bIQGTh_KP1crpfM-o
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmY3hicWxndnBwcWp4Z3B3bnpkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDMzNTQwNSwiZXhwIjoyMDY1OTExNDA1fQ.cQarFwfGAmkgnsxRhJPLOPHvpA1WS2iWI-2QwcxCBzg
NEXTAUTH_SECRET=[운영용 시크릿 키 생성 필요]
NEXTAUTH_URL=https://gameplaza-v2.vercel.app
DATABASE_URL=postgresql://postgres.rfcxbqlgvppqjxgpwnzd:[DB비밀번호]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true
```

## 🔧 Preview & Development 환경 (feature 브랜치)

**Preview**와 **Development** 체크하고 추가:

```env
NEXT_PUBLIC_SUPABASE_URL=https://rupeyejnfurlcpgneekg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1cGV5ZWpuZnVybGNwZ25lZWtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NjY0MjgsImV4cCI6MjA2NjQ0MjQyOH0.klSRGXI1hzkAG_mfORuAK5C74vDclX8VFeLEsyv9CAs
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1cGV5ZWpuZnVybGNwZ25lZWtnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDg2NjQyOCwiZXhwIjoyMDY2NDQyNDI4fQ.49VEsYv-jDnKPb1wK_wBmXgcdQWnYilLYaqbbaAHCt4
NEXTAUTH_SECRET=development-secret-key
NEXTAUTH_URL=https://gameplaza-v2-git-feature-*.vercel.app
```

## 📝 추가 환경변수 (모든 환경)

```env
# Google OAuth (필요시)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# 공휴일 API
NEXT_PUBLIC_HOLIDAY_API_KEY=your-holiday-api-key

# Cron Job Secret
CRON_SECRET=your-cron-secret
```

## ⚠️ 중요 사항

1. **NEXTAUTH_SECRET 생성 방법**:
   ```bash
   openssl rand -base64 32
   ```

2. **DATABASE_URL의 비밀번호**:
   - Supabase Dashboard > Settings > Database에서 확인
   - URL 인코딩 필요 (특수문자 포함 시)

3. **환경별 분리 확인**:
   - Production: 새 운영 DB (rfcxbqlgvppqjxgpwnzd)
   - Preview/Dev: 개발 DB (rupeyejnfurlcpgneekg)

4. **배포 후 확인**:
   - `/api/check-env` 엔드포인트로 환경 확인
   - Supabase Dashboard에서 연결 확인