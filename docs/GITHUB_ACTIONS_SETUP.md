# GitHub Actions 설정 가이드

## 🔧 필요한 GitHub Secrets 설정

GitHub 저장소의 Settings > Secrets and variables > Actions에서 다음 시크릿들을 추가해야 합니다:

### 1. **PRODUCTION_URL**
- 설명: 배포된 서비스의 URL
- 예시: `https://gameplaza.vercel.app`
- Vercel 배포 후 생성되는 URL 입력

### 2. **CRON_SECRET**
- 설명: 크론잡 API 보안을 위한 시크릿 키
- 예시: `your-random-secret-key-here`
- 랜덤한 문자열 생성하여 사용 (최소 32자 이상 권장)
- 생성 방법: `openssl rand -hex 32`

### 3. **SUPABASE_URL**
- 설명: Supabase 프로젝트 URL
- 예시: `https://xxxxxxxxxxxxx.supabase.co`
- Supabase 대시보드 > Settings > API에서 확인

### 4. **SUPABASE_ANON_KEY**
- 설명: Supabase 익명 키 (public)
- 예시: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- Supabase 대시보드 > Settings > API에서 확인

## 📋 환경 변수 설정 (.env.local)

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가:

```env
# Cron Job Secret
CRON_SECRET=your-random-secret-key-here

# Supabase (이미 있을 것)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🚀 워크플로우 설명

### 1. **cron-jobs.yml**
- 목적: 예약 종료된 기기 상태를 자동으로 'available'로 변경
- 실행 주기: 10분마다
- 수동 실행: Actions 탭에서 "Run workflow" 클릭 가능

### 2. **keep-alive.yml**  
- 목적: Supabase 무료 플랜 7일 비활성화 방지
- 실행 주기: 매일 1회 (한국시간 오전 9시)
- 수동 실행: Actions 탭에서 "Run workflow" 클릭 가능

## ✅ 설정 확인 방법

1. GitHub Actions 탭에서 워크플로우가 표시되는지 확인
2. "Run workflow" 버튼으로 수동 실행 테스트
3. 실행 로그에서 성공 메시지 확인

## 🔍 트러블슈팅

### 워크플로우가 실행되지 않는 경우
- GitHub Actions가 활성화되어 있는지 확인
- 저장소가 public이거나 private 저장소의 경우 Actions 사용량 확인

### API 호출이 실패하는 경우
- Secrets가 올바르게 설정되었는지 확인
- Vercel 배포가 완료되었는지 확인
- API 엔드포인트가 정상 작동하는지 브라우저에서 테스트

### Supabase 연결이 실패하는 경우
- Supabase 프로젝트가 활성화되어 있는지 확인
- API 키가 올바른지 확인
- RLS 정책이 적절히 설정되었는지 확인