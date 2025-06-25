# 🚀 배포 가이드

> 💡 **초보자를 위한 설명**: 배포는 우리가 만든 서비스를 실제로 사용자들이 접속할 수 있도록 인터넷에 올리는 과정입니다.

## 📋 배포 전 체크리스트

### 필수 준비사항
- [ ] Vercel 계정 생성
- [ ] Supabase 프로젝트 생성
- [ ] Google OAuth 설정 완료
- [ ] Firebase 프로젝트 생성 (FCM용)
- [ ] 도메인 준비 (선택사항)

## 🌍 환경 구성

### 1. 개발 환경 (Development)
> 개발자가 코드를 작성하고 테스트하는 환경

```
URL: http://localhost:3000
용도: 개발 및 테스트
데이터베이스: Supabase 개발 프로젝트
```

### 2. 스테이징 환경 (Staging)
> 실제 환경과 동일하게 테스트하는 환경

```
URL: https://staging-gameplaza.vercel.app
용도: 배포 전 최종 테스트
데이터베이스: Supabase 스테이징 프로젝트
```

### 3. 프로덕션 환경 (Production)
> 실제 사용자가 사용하는 환경

```
URL: https://gameplaza.com
용도: 실제 서비스
데이터베이스: Supabase 프로덕션 프로젝트
```

## 🔐 환경 변수 설정

### 개발 환경 (.env.local)
```bash
# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Firebase FCM
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
FIREBASE_ADMIN_CLIENT_EMAIL=your-admin-email
FIREBASE_ADMIN_PRIVATE_KEY=your-private-key

# SMS (알리고)
ALIGO_API_KEY=your-aligo-key
ALIGO_USER_ID=your-aligo-id
ALIGO_SENDER=your-phone-number
```

### Vercel 환경 변수 설정
1. Vercel 대시보드 → Settings → Environment Variables
2. 각 환경별로 변수 설정 (Development/Preview/Production)
3. 민감한 정보는 반드시 서버 환경 변수로 설정

## 📦 Vercel 배포 과정

### 1. 초기 설정
```bash
# Vercel CLI 설치
npm i -g vercel

# 프로젝트 연결
vercel

# 프로젝트 설정 확인
? Set up and deploy "~/gameplaza-v2"? [Y/n] Y
? Which scope do you want to deploy to? Your Account
? Link to existing project? [y/N] N
? What's your project's name? gameplaza-v2
? In which directory is your code located? ./
```

### 2. 배포 명령어
```bash
# 개발 환경 배포 (미리보기)
vercel

# 프로덕션 배포
vercel --prod
```

### 3. 자동 배포 설정
- GitHub 저장소 연결
- main 브랜치 → 프로덕션 자동 배포
- develop 브랜치 → 스테이징 자동 배포
- PR → 미리보기 배포

## 🗄️ Supabase 설정

### 1. 프로젝트 생성
1. [Supabase Dashboard](https://app.supabase.com) 접속
2. "New Project" 클릭
3. 프로젝트 정보 입력:
   - Name: gameplaza-prod (환경별로 구분)
   - Database Password: 강력한 비밀번호 설정
   - Region: Northeast Asia (Seoul)

### 2. 데이터베이스 초기화
```sql
-- SQL Editor에서 실행
-- database_schema.md 파일의 테이블 구조대로 생성
```

### 3. RLS (Row Level Security) 설정
```sql
-- 각 테이블별 보안 정책 설정
-- 예: users 테이블
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" 
ON users FOR SELECT 
USING (auth.uid() = id);
```

### 4. Storage 버킷 설정
- 프로필 이미지용 버킷
- 기기 이미지용 버킷

## 🔄 CI/CD 파이프라인

### GitHub Actions 설정 (.github/workflows/deploy.yml)
```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test
        
      - name: Build
        run: npm run build
        
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

## 📊 모니터링 설정

### 1. Vercel Analytics
- 프로젝트 설정에서 Analytics 활성화
- 실시간 트래픽 모니터링

### 2. Sentry 에러 모니터링
```bash
npm install @sentry/nextjs
```

### 3. Uptime 모니터링
- Vercel 대시보드에서 설정
- 다운타임 알림 설정

## 🚨 배포 시 주의사항

### 1. 환경 변수 확인
- [ ] 모든 필수 환경 변수가 설정되었는지 확인
- [ ] 프로덕션에 개발용 키가 없는지 확인

### 2. 데이터베이스 마이그레이션
- [ ] 스키마 변경사항 확인
- [ ] 백업 후 마이그레이션 실행

### 3. 캐시 초기화
- [ ] CDN 캐시 무효화
- [ ] 브라우저 캐시 고려

### 4. 롤백 계획
- 이전 버전으로 즉시 롤백 가능
- Vercel 대시보드에서 이전 배포 선택

## 🔧 트러블슈팅

### 빌드 실패 시
```bash
# 로컬에서 빌드 테스트
npm run build

# 타입 체크
npm run type-check

# 린트 확인
npm run lint
```

### 환경 변수 문제
- Vercel 대시보드에서 환경 변수 재확인
- 변수명 오타 확인
- 따옴표 처리 확인

### 데이터베이스 연결 실패
- Supabase 프로젝트 상태 확인
- Connection Pooling 설정 확인
- IP 화이트리스트 확인

## 📱 배포 후 확인사항

### 1. 기능 테스트
- [ ] 로그인/로그아웃
- [ ] 예약 신청
- [ ] 관리자 기능
- [ ] 알림 발송

### 2. 성능 확인
- [ ] 페이지 로딩 속도
- [ ] 이미지 최적화
- [ ] API 응답 시간

### 3. 보안 확인
- [ ] HTTPS 적용
- [ ] 환경 변수 노출 여부
- [ ] CORS 설정

---

> 📌 **참고**: 처음 배포할 때는 스테이징 환경에서 충분히 테스트 후 프로덕션에 배포하세요!