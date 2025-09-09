# Cloudflare Workers 배포 가이드

## 📋 개요
광주 게임플라자 예약 시스템을 Cloudflare Workers로 마이그레이션하는 가이드입니다.

## 🚀 빠른 시작

### 1. 로컬 개발
```bash
# 개발 서버 실행 (포트 8788)
npm run cf:dev
```

### 2. 빌드 및 프리뷰
```bash
# Next.js 빌드
npm run cf:build

# Cloudflare Workers 프리뷰
npm run cf:preview
```

### 3. 프로덕션 배포
```bash
# Cloudflare Workers 배포
npm run cf:deploy
```

## 🔐 환경 변수 설정

### 개발 환경 (.dev.vars)
`.dev.vars` 파일을 생성하고 다음 환경 변수를 설정합니다:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://rupeyejnfurlcpgneekg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# NextAuth
NEXTAUTH_URL=https://gameplaza.gwangju.kr
NEXTAUTH_SECRET=your_nextauth_secret

# JWT
JWT_SECRET=your_jwt_secret

# Database
DATABASE_URL=your_database_url

# Web Push
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
```

### 프로덕션 시크릿 설정
```bash
# Supabase 시크릿
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put DATABASE_URL

# Google OAuth 시크릿
wrangler secret put GOOGLE_CLIENT_SECRET

# NextAuth 시크릿
wrangler secret put NEXTAUTH_SECRET

# JWT 시크릿
wrangler secret put JWT_SECRET

# Web Push 시크릿
wrangler secret put VAPID_PRIVATE_KEY
```

## 🌐 도메인 설정

### 1. Cloudflare Dashboard에서 설정
1. [Cloudflare Dashboard](https://dash.cloudflare.com) 접속
2. Workers & Pages 섹션으로 이동
3. `gameplaza-v2` 프로젝트 선택
4. Settings → Custom Domains 클릭
5. `gameplaza.gwangju.kr` 도메인 추가

### 2. DNS 설정
```
Type: CNAME
Name: gameplaza
Content: gameplaza-v2.pages.dev
Proxy: Enabled (Orange Cloud)
```

## 🔄 마이그레이션 체크리스트

### Phase 1: 개발 환경 테스트
- [x] Cloudflare Workers 패키지 설치
- [x] wrangler.toml 설정
- [x] Workers 엔트리 포인트 생성
- [x] 환경 변수 설정
- [ ] 로컬 테스트 (`npm run cf:dev`)
- [ ] 기능 검증

### Phase 2: 스테이징 배포
- [ ] 스테이징 환경 생성
- [ ] 환경 변수 설정
- [ ] 데이터베이스 연결 테스트
- [ ] API 엔드포인트 테스트
- [ ] 실시간 기능 테스트

### Phase 3: 프로덕션 배포
- [ ] 프로덕션 시크릿 설정
- [ ] 도메인 설정
- [ ] SSL 인증서 확인
- [ ] 성능 모니터링 설정
- [ ] 롤백 계획 준비

## 🔍 모니터링

### Cloudflare Analytics
- Workers 대시보드에서 실시간 트래픽 모니터링
- 에러 로그 확인
- 성능 메트릭 분석

### Wrangler Tail (실시간 로그)
```bash
# 실시간 로그 스트리밍
wrangler tail gameplaza-v2

# 특정 환경 로그
wrangler tail gameplaza-v2 --env production
```

## ⚠️ 주의사항

### 1. Edge Runtime 제한사항
- Node.js API 일부 사용 불가
- 파일 시스템 접근 불가
- 최대 실행 시간: 30초 (유료 플랜: 15분)

### 2. 데이터베이스 연결
- Supabase Edge Functions 사용 권장
- Connection Pooling 필수
- Cloudflare D1 고려 (선택적)

### 3. 세션 관리
- KV 네임스페이스 사용
- 세션 TTL 설정 필수
- 분산 환경 고려

## 🔧 트러블슈팅

### 빌드 실패
```bash
# 캐시 삭제 후 재빌드
rm -rf .next node_modules
npm install
npm run cf:build
```

### 환경 변수 인식 안됨
```bash
# 시크릿 목록 확인
wrangler secret list

# 시크릿 재설정
wrangler secret delete KEY_NAME
wrangler secret put KEY_NAME
```

### 배포 실패
```bash
# 로그 확인
wrangler tail

# 디버그 모드 실행
wrangler dev --local
```

## 📚 참고 자료
- [Cloudflare Workers 문서](https://developers.cloudflare.com/workers/)
- [Next.js on Cloudflare](https://developers.cloudflare.com/pages/framework-guides/nextjs/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)

## 💡 성능 최적화 팁

### 1. 캐싱 전략
- 정적 자산: 장기 캐싱 (1년)
- API 응답: 짧은 캐싱 또는 캐싱 없음
- HTML: 짧은 캐싱 (1시간)

### 2. KV 스토리지 활용
- 세션 데이터
- 자주 조회되는 설정값
- 임시 캐시 데이터

### 3. Smart Placement
- wrangler.toml에서 `mode = "smart"` 설정
- 자동으로 최적 위치에 Worker 배치

## 🚨 롤백 계획

### 긴급 롤백 절차
1. Cloudflare Dashboard에서 이전 버전으로 롤백
2. 또는 Vercel로 트래픽 전환:
   ```bash
   # DNS를 Vercel로 변경
   # Type: CNAME
   # Content: cname.vercel-dns.com
   ```

### 백업 유지
- 항상 최근 3개 버전 유지
- 데이터베이스 백업 자동화
- 환경 변수 백업

---

작성일: 2025-09-09
최종 수정: 2025-09-09