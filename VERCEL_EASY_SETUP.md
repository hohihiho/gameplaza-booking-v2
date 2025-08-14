# 🚀 Vercel 환경변수 복사-붙여넣기 가이드

## 1단계: Vercel 접속
1. https://vercel.com 접속
2. 로그인
3. `gameplaza-v2` 프로젝트 클릭
4. Settings → Environment Variables

## 2단계: 운영 환경 변수 (Production만 체크)

아래를 하나씩 복사해서 추가하세요:

### 변수 1
```
Key: NEXT_PUBLIC_SUPABASE_URL
Value: https://rfcxbqlgvppqjxgpwnzd.supabase.co
Environment: Production ✅ (나머지는 체크 해제)
```

### 변수 2
```
Key: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmY3hicWxndnBwcWp4Z3B3bnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMzU0MDUsImV4cCI6MjA2NTkxMTQwNX0.XDLyIizkYB1Tz8rNwPez8LV1H_bIQGTh_KP1crpfM-o
Environment: Production ✅
```

### 변수 3
```
Key: SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmY3hicWxndnBwcWp4Z3B3bnpkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDMzNTQwNSwiZXhwIjoyMDY1OTExNDA1fQ.cQarFwfGAmkgnsxRhJPLOPHvpA1WS2iWI-2QwcxCBzg
Environment: Production ✅
```

## 3단계: 개발 환경 변수 (Preview & Development 체크)

### 변수 4
```
Key: NEXT_PUBLIC_SUPABASE_URL
Value: https://rupeyejnfurlcpgneekg.supabase.co
Environment: Preview ✅ Development ✅ (Production은 체크 해제)
```

### 변수 5
```
Key: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1cGV5ZWpuZnVybGNwZ25lZWtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NjY0MjgsImV4cCI6MjA2NjQ0MjQyOH0.klSRGXI1hzkAG_mfORuAK5C74vDclX8VFeLEsyv9CAs
Environment: Preview ✅ Development ✅
```

### 변수 6
```
Key: SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1cGV5ZWpuZnVybGNwZ25lZWtnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDg2NjQyOCwiZXhwIjoyMDY2NDQyNDI4fQ.49VEsYv-jDnKPb1wK_wBmXgcdQWnYilLYaqbbaAHCt4
Environment: Preview ✅ Development ✅
```

## 4단계: 추가 변수 (모든 환경)

### 변수 7 - NextAuth Secret
터미널에서 이 명령어 실행:
```bash
openssl rand -base64 32
```

나온 결과를 복사해서:
```
Key: NEXTAUTH_SECRET
Value: [위에서 생성한 값]
Environment: Production ✅ Preview ✅ Development ✅ (모두 체크)
```

### 변수 8
```
Key: NEXTAUTH_URL
Value: https://gameplaza-v2.vercel.app
Environment: Production ✅
```

### 변수 9
```
Key: NEXTAUTH_URL
Value: http://localhost:3000
Environment: Preview ✅ Development ✅
```

## 5단계: 저장 확인
각 변수 추가할 때마다 **Add** 버튼 클릭!

## 6단계: 재배포
1. Deployments 탭 클릭
2. 최근 배포 옆 ⋮ 메뉴 클릭
3. Redeploy 클릭
4. Redeploy 버튼 클릭

## ✅ 완료!
5분 정도 기다리면 배포 완료됩니다.