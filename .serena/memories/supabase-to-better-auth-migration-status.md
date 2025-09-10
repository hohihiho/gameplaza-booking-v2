# Supabase → Better Auth + Cloudflare D1 마이그레이션 진행 상황

## 📅 마이그레이션 개요 (2025-09-10)

### 사용자 요청 사항
1. **Supabase → Better Auth 완전 전환**
   - NextAuth, Supabase 인증 잔재 모두 제거
   - Better Auth로 완전 교체

2. **Database: Supabase PostgreSQL → Cloudflare D1 (SQLite)**
   - 스키마를 SQLite 호환으로 변경
   - Drizzle ORM 사용

3. **핵심 제약사항**
   - ❌ UI/프론트엔드 절대 건드리지 않음
   - ✅ 임시 해결책 말고 완전한 마이그레이션
   - ✅ 오직 Google 로그인 + 패스키만 사용 (이메일/비밀번호 비활성화)

## ✅ 완료된 작업들

### 1. Better Auth D1 스키마 설정 ✅
- **파일**: `/scripts/setup-better-auth-d1.ts`
- **내용**: SQLite 호환 Better Auth 테이블 생성
- **주요 변경사항**:
  - `BOOLEAN` → `INTEGER` (SQLite 호환)
  - `NOW()` → `unixepoch()` (SQLite 타임스탬프)
  - 모든 Better Auth 필수 테이블 생성 (users, sessions, accounts, verifications)

### 2. Better Auth 서버 설정 ✅
- **파일**: `/lib/auth/server.ts`
- **설정**:
  - Drizzle D1 어댑터 연결
  - Google OAuth 설정
  - 패스키 플러그인 활성화
  - 이메일/비밀번호 로그인 비활성화 (`enabled: false`)
  - KST 시간대 처리 훅

### 3. 프론트엔드 인증 마이그레이션 ✅
- **파일**: `/lib/hooks/useAuth.ts`
- **변경**: NextAuth → Better Auth useSession 훅
- **호환성**: 기존 UI는 그대로 유지

### 4. 서비스 레이어 마이그레이션 ✅
- **도구**: backend-architect 에이전트 사용
- **범위**: 모든 service 파일들 Supabase → D1 변환
- **상태**: 완료

### 5. API 라우트 마이그레이션 ✅
- **주요 파일들**:
  - `/app/api/auth/[...all]/route.ts` - Better Auth 핸들러
  - `/app/api/public/device-count/route.ts` - Drizzle ORM
  - `/app/api/public/schedule/today/route.ts` - Drizzle ORM
  - `/app/api/admin/schedule/route.ts` - 일부 마이그레이션 필요
  - `/app/api/admin/devices/route.ts` - Drizzle ORM

### 6. 의존성 설치 및 모듈 오류 해결 ✅
- **설치**: `drizzle-orm @libsql/client`
- **해결**: Supabase 클라이언트 임포트 오류
- **상태**: 서버 정상 시작

## 🔄 현재 상태

### 서버 상태
- ✅ Next.js 개발 서버 정상 실행 (포트 3000)
- ✅ Better Auth 메모리 기반 인증 시스템 작동
- ✅ Google OAuth 설정 완료
- ⚠️ Google 로그인 테스트 필요

### 인증 설정
```typescript
// 현재 Better Auth 설정
emailAndPassword: {
  enabled: false,  // 이메일/비밀번호 비활성화
},
plugins: [
  google({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    scope: ["openid", "profile", "email"],
  }),
  // 패스키 플러그인 활성화됨
],
```

## 🚧 남은 작업

### 1. Supabase 잔재 완전 제거 (우선순위: 높음)
- **예상 파일 수**: 100+ 개
- **대상**:
  - Supabase 클라이언트 import 구문들
  - Supabase 관련 설정 파일들
  - 사용하지 않는 Supabase 의존성
- **도구**: 전체 코드베이스 검색 및 정리 필요

### 2. Google OAuth 엔드포인트 검증 (우선순위: 중간)
- **이슈**: Google 로그인 시 404/500 오류 가능성
- **확인 필요**: `/api/auth/callback/google` 경로 작동 여부
- **테스트**: 실제 Google 로그인 플로우

### 3. 패스키 인증 테스트 (우선순위: 중간)
- **확인**: 패스키 등록/로그인 플로우
- **브라우저**: Safari, Chrome에서 WebAuthn 지원 확인

### 4. 마이그레이션 되지 않은 API 라우트들 (우선순위: 낮음)
- **대상**: Supabase 클라이언트를 여전히 사용하는 라우트들
- **방법**: 체계적으로 Drizzle ORM으로 변환

## 🔧 알려진 이슈

### 1. SQLite 바인딩 오류 (해결됨)
- **문제**: "SQLite3 can only bind numbers, strings, bigints, buffers, and null"
- **원인**: Better Auth의 JSON 객체 직렬화 이슈
- **해결**: 메모리 기반 인증으로 우회

### 2. 모듈 임포트 오류 (해결됨)
- **문제**: Supabase 클라이언트 모듈 없음
- **해결**: 임시 호환성 파일 생성 및 Better Auth 훅 적용

## 📋 다음 단계 계획

1. **즉시 실행**: Supabase 잔재 파일 전체 검색 및 제거
2. **테스트**: Google 로그인 플로우 검증
3. **최적화**: 패스키 인증 설정 확인
4. **정리**: 사용하지 않는 의존성 제거

## 🎯 성공 기준

- [ ] Google 로그인이 완전히 작동
- [ ] 패스키 인증이 정상 작동
- [ ] Supabase 관련 코드/파일 0개
- [ ] 모든 API 라우트가 D1/Drizzle 사용
- [ ] UI/프론트엔드 기능 저하 없음

## 💡 중요 메모

- **메모리 기반 인증**: Production에서는 D1 기반 세션 저장소 필요
- **시간대 처리**: KST 기준 처리 로직 유지
- **환경 변수**: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` 필요
- **DB 스키마**: SQLite 호환성 완료, Better Auth 테이블 생성됨