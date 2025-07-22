# /mcp-optimize - MCP 서버 통합 최적화

현재 활성화된 MCP 서버들을 게임플라자 프로젝트에 최적화하여 활용합니다.

## 🔗 활성화된 MCP 서버들

### 📚 Context7
**라이브러리 문서화 전문**
- Next.js, React, Supabase 최신 문서
- TypeScript 타입 정의 및 베스트 프랙티스
- 모바일 최적화 라이브러리 가이드

### 🗄️ Supabase MCP
**백엔드 및 데이터베이스 관리**
- 실시간 구독 설정
- RLS 정책 관리
- 데이터베이스 스키마 최적화
- 성능 모니터링

### 🧠 Shrimp Task Manager
**프로젝트 관리 및 작업 추적**
- 작업 분해 및 우선순위 설정
- 진행상황 추적
- 의존성 관리

## 🎯 게임플라자 특화 MCP 활용 전략

### 1. 예약 시스템 개발 시
```bash
# 1단계: 최신 문서 확인
/mcp-context7-check "Supabase realtime subscription"
/mcp-context7-check "React time picker mobile"

# 2단계: 데이터베이스 설정
/mcp-supabase-check-rls
/mcp-supabase-optimize-performance  

# 3단계: 작업 관리
/mcp-shrimp-break-down "예약 시스템 실시간 동기화"
```

### 2. 모바일 최적화 작업 시
```bash
# 모바일 UI 라이브러리 확인
/mcp-context7-check "React mobile gestures"
/mcp-context7-check "Touch interface best practices"

# 성능 최적화 가이드
/mcp-context7-check "Next.js mobile performance"
/mcp-context7-check "3G network optimization"
```

### 3. 시간 처리 구현 시
```bash
# 시간 라이브러리 최신 문서
/mcp-context7-check "JavaScript Date timezone handling"
/mcp-context7-check "React time display components"

# 데이터베이스 시간 타입 최적화
/mcp-supabase-check-timezone-config
```

## 🔧 통합 워크플로우

### 개발 시작 시 MCP 체크리스트
- [ ] Context7에서 관련 라이브러리 최신 문서 확인
- [ ] Supabase에서 데이터베이스 상태 점검
- [ ] Shrimp에서 작업 계획 수립

### 기능 구현 중 MCP 활용
- [ ] 막힐 때마다 Context7에서 참조 문서 검색
- [ ] 데이터베이스 변경 시 Supabase MCP로 안전하게 적용
- [ ] 진행상황을 Shrimp으로 실시간 추적

### 완료 후 MCP 검증
- [ ] Context7에서 베스트 프랙티스 대조 확인
- [ ] Supabase에서 성능 및 보안 검토
- [ ] Shrimp에서 작업 완료 처리 및 리뷰

## 🚀 자동화된 MCP 워크플로우

### 스마트 문서 검색
```typescript
// 컨텍스트 기반 자동 검색
const autoSearchMCP = (codeContext: string) => {
  const keywords = extractTechKeywords(codeContext);
  const libraries = detectLibraries(codeContext);
  
  return {
    context7Queries: libraries.map(lib => `${lib} best practices`),
    supabaseChecks: keywords.includes('database') ? ['performance', 'security'] : [],
    shrimpTasks: extractActionableItems(codeContext)
  };
};
```

### 통합 상태 대시보드
```bash
# MCP 서버 상태 확인
echo "🔗 MCP 서버 상태 체크"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📚 Context7: [연결 상태]"
echo "🗄️ Supabase: [프로젝트 상태]" 
echo "🧠 Shrimp: [활성 작업 수]"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
```

## 📋 게임플라자 특화 MCP 템플릿

### 예약 시스템 개발 템플릿
```bash
# 1. 기술 조사 (Context7)
"Next.js real-time updates 2025"
"Supabase realtime subscriptions mobile"
"React time picker Korean timezone"

# 2. 데이터베이스 설정 (Supabase MCP)
- 예약 테이블 스키마 검토
- RLS 정책 설정
- 실시간 구독 활성화

# 3. 작업 분해 (Shrimp)
- 시간 선택 UI 구현
- 실시간 동기화 로직
- 충돌 방지 메커니즘
- 모바일 최적화
```

### 모바일 최적화 템플릿  
```bash
# 1. 모바일 가이드 (Context7)
"React mobile touch gestures"
"CSS mobile viewport optimization"
"Progressive Web App 2025"

# 2. 성능 모니터링 (Supabase MCP)
- API 응답 시간 측정
- 데이터베이스 쿼리 최적화
- 실시간 구독 성능 체크

# 3. 최적화 작업 (Shrimp)
- 터치 인터페이스 개선
- 이미지 최적화
- 로딩 성능 향상
- 오프라인 지원
```

## 🔄 MCP 연동 자동화

### 컨텍스트 기반 MCP 제안
```typescript
// 코드 분석 후 관련 MCP 도구 자동 제안
const suggestMCPTools = (fileContent: string, fileName: string) => {
  const suggestions = [];
  
  if (fileName.includes('api/')) {
    suggestions.push('Supabase MCP로 API 성능 확인');
  }
  
  if (fileContent.includes('useState') || fileContent.includes('useEffect')) {
    suggestions.push('Context7에서 React hooks 베스트 프랙티스 확인');
  }
  
  if (fileContent.includes('Date') || fileContent.includes('time')) {
    suggestions.push('Context7에서 시간 처리 라이브러리 확인');
  }
  
  return suggestions;
};
```

### 작업 진행도와 MCP 연동
```bash
# Shrimp Task Manager 진행도에 따른 MCP 활용
- 계획 단계: Context7에서 기술 조사
- 구현 단계: Supabase MCP로 실시간 모니터링  
- 테스트 단계: 모든 MCP로 종합 검증
- 완료 단계: 문서화 및 베스트 프랙티스 정리
```

## 💡 MCP 활용 팁

### 효율적인 검색 키워드
- **일반적**: `React mobile optimization`
- **구체적**: `React touch gestures Korean mobile 2025`
- **문제 해결**: `Supabase realtime connection drops mobile`

### MCP 결과 활용법
1. **즉시 적용**: 간단한 코드 스니펫과 설정
2. **심화 학습**: 복잡한 개념은 단계별로 학습
3. **문서화**: 중요한 정보는 프로젝트 문서에 저장
4. **팀 공유**: 유용한 패턴은 팀 전체와 공유

MCP 최적화를 통해 더 빠르고 정확한 개발이 가능합니다!