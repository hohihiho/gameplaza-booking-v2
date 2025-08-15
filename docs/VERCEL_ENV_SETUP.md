# Vercel 환경 변수 설정 가이드

## 🚨 현재 발생한 에러들

배포된 사이트에서 다음 API들이 500 에러 발생:
- `/api/auth/session` 
- `/api/auth/csrf`
- `/api/public/schedule/today`
- `/api/public/device-count`
- `/api/admin/devices/types`

원인: Vercel에 환경 변수가 설정되지 않음

## 📝 필수 환경 변수 목록

Vercel 대시보드 (https://vercel.com) 에서 프로젝트 설정 → Environment Variables에 다음 변수들을 추가해야 합니다:

### 1. Supabase 설정
```
NEXT_PUBLIC_SUPABASE_URL=https://rupeyejnfurlcpgneekg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1cGV5ZWpuZnVybGNwZ25lZWtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NjY0MjgsImV4cCI6MjA2NjQ0MjQyOH0.klSRGXI1hzkAG_mfORuAK5C74vDclX8VFeLEsyv9CAs
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1cGV5ZWpuZnVybGNwZ25lZWtnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDg2NjQyOCwiZXhwIjoyMDY2NDQyNDI4fQ.49VEsYv-jDnKPb1wK_wBmXgcdQWnYilLYaqbbaAHCt4
```

### 2. NextAuth 설정
```
NEXTAUTH_SECRET=s3o1xAv6Tu7vtob+gt2vjv4pH9RFa/Qe5kBnlw4hBMk=
NEXTAUTH_URL=https://gameplaza-v2.vercel.app
```
⚠️ 주의: NEXTAUTH_URL은 프로덕션 URL로 설정!

### 3. Google OAuth
```
GOOGLE_CLIENT_ID=44559014883-248e8a3kb4meo4peee4ga8vr5190566m.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

### 4. Firebase 설정
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCmUu1gBrvxAFfQbCwToKIraFgEdBGIt6o
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=gameplaza-kr0.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://gameplaza-kr0-default-rtdb.asia-southeast1.firebasedatabase.app
NEXT_PUBLIC_FIREBASE_PROJECT_ID=gameplaza-kr0
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=gameplaza-kr0.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=44559014883
NEXT_PUBLIC_FIREBASE_APP_ID=1:44559014883:web:edab1727ac2d7a965cded6
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-6WBCMK3RYF
```

### 5. PWA Push Notifications
```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BKd0F7QbaOONvQ1Y7Tj5SGYP-7PY9jKXzSqPqPbPUzOhS7kcMdYCYKqWjRETeQc2TKZMSKqHYXBHpAV8QqnGXTg
VAPID_PRIVATE_KEY=4VQjhbsd_5vCCYHmvLqzVBLWPWH9wPaVU5UBpFPWV4A
```

### 6. 기타
```
CRON_SECRET=your-secure-cron-secret-here
DATABASE_URL=postgresql://postgres.rupeyejnfurlcpgneekg:tpgml12%40%40S@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres
```

## 🔧 설정 방법

1. [Vercel 대시보드](https://vercel.com) 접속
2. `gameplaza-v2` 프로젝트 선택
3. Settings 탭 클릭
4. 왼쪽 메뉴에서 Environment Variables 선택
5. 위의 모든 환경 변수를 하나씩 추가:
   - Key: 변수명
   - Value: 값
   - Environment: Production, Preview, Development 모두 체크
6. Save 버튼 클릭

## 🔄 재배포

환경 변수 추가 후 재배포 필요:
1. Deployments 탭으로 이동
2. 최신 배포 항목에서 ... 메뉴 클릭
3. Redeploy 선택
4. "Use existing Build Cache" 체크 해제
5. Redeploy 버튼 클릭

## ✅ 확인 사항

재배포 후 다음 사항 확인:
- 로그인 페이지 정상 작동
- 구글 OAuth 로그인 가능
- API 호출 에러 없음
- 데이터베이스 연결 정상

## 🔒 보안 주의사항

- `SUPABASE_SERVICE_ROLE_KEY`는 절대 클라이언트에 노출되면 안됨
- `NEXTAUTH_SECRET`는 프로덕션에서 반드시 다른 값으로 변경 권장
- 환경 변수는 GitHub에 커밋하지 않음 (.env.local은 .gitignore에 포함)