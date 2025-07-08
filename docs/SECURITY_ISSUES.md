# 보안 이슈 및 개선 방안

## 현재 보안 구조의 문제점

### 1. **Service Role Key 노출 위험**
- **문제**: `supabaseAdmin`에서 Service Role Key를 사용하고 있으나, 이는 서버 사이드에서만 사용해야 함
- **위험**: 클라이언트에서 접근 가능한 경우 모든 RLS 우회 가능

### 2. **클라이언트 사이드 권한 검증**
- **문제**: 관리자 권한을 클라이언트에서 직접 확인
- **위험**: 브라우저에서 조작 가능

### 3. **NextAuth와 Supabase Auth 혼용**
- **문제**: 두 가지 인증 시스템이 혼재되어 있음
- **위험**: 인증 로직의 일관성 부족

## 권장 보안 아키텍처

### 1. **API Routes를 통한 모든 관리자 작업**
```typescript
// ❌ 나쁜 예: 클라이언트에서 직접 Supabase 호출
const { data } = await supabase.from('admins').select()

// ✅ 좋은 예: API Route 사용
const response = await fetch('/api/admin/admins')
```

### 2. **서버 사이드 권한 검증**
```typescript
// API Route에서 권한 검증
export async function GET(request: Request) {
  const session = await getServerSession()
  const isAdmin = await checkAdminRole(session.user.id)
  
  if (!isAdmin) {
    return new Response('Unauthorized', { status: 401 })
  }
  
  // Service Role Key는 서버에서만 사용
  const { data } = await supabaseAdmin.from('admins').select()
  return Response.json(data)
}
```

### 3. **환경 변수 분리**
```env
# 클라이언트 접근 가능 (public)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# 서버에서만 사용 (절대 노출 금지)
SUPABASE_SERVICE_ROLE_KEY=
```

## 즉시 필요한 조치

1. **supabaseAdmin 사용 제한**
   - 모든 클라이언트 컴포넌트에서 제거
   - API Routes에서만 사용

2. **관리자 페이지 리팩토링**
   - 모든 데이터 fetching을 API Routes로 이동
   - 클라이언트는 UI 렌더링만 담당

3. **Middleware 강화**
   - 서버 사이드에서 관리자 권한 검증
   - 세션 탈취 방지

## 장기적 개선 사항

1. **통합 인증 시스템**
   - NextAuth 또는 Supabase Auth 중 하나로 통일
   - 일관된 세션 관리

2. **감사 로그**
   - 모든 관리자 작업 기록
   - 이상 행동 감지

3. **2단계 인증**
   - 관리자 계정에 필수 적용
   - TOTP 기반 구현

## 결론

현재 구조는 개발 편의성을 위해 보안이 희생된 상태입니다. 프로덕션 환경에서는 반드시 위의 개선사항들을 적용해야 합니다.