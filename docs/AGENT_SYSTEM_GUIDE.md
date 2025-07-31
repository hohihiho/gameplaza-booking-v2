# 🤖 게임플라자 고급 에이전트 시스템 가이드

## 개요
Awesome Claude Agents가 통합된 강력한 멀티 에이전트 시스템입니다. 24개의 전문 에이전트가 협업하여 빠르고 효율적인 개발을 지원합니다.

## 🚀 빠른 시작

### 1. 기본 사용법
```
"예약 시스템 버그 수정해줘"
```
→ Tech Lead가 자동으로 필요한 에이전트를 선택하고 작업을 조정합니다.

### 2. 특정 에이전트 호출
```
"reservation-system-expert로 예약 충돌 로직 검토해줘"
```
→ 특정 전문가를 직접 호출하여 전문적인 검토를 받습니다.

## 📋 에이전트 카테고리

### 🎯 Orchestrators (조정자)
복잡한 작업의 시작점. 작업을 분석하고 적절한 에이전트에게 할당합니다.

- **gameplaza-tech-lead**: 게임플라자 기술 리더
  - 모든 복잡한 작업의 시작점
  - 작업 분해 및 에이전트 라우팅
  - 실행 순서 결정

### 💎 Core Team (핵심 팀)
모든 프로젝트에서 공통으로 필요한 핵심 기능을 담당합니다.

- **code-reviewer**: 코드 품질 검토
- **performance-optimizer**: 성능 최적화
- **documentation-specialist**: 문서화
- **security-expert**: 보안 검토

### 🌐 Universal Experts (범용 전문가)
특정 프레임워크에 종속되지 않는 일반적인 개발 작업을 담당합니다.

- **backend-developer**: 백엔드 개발
- **frontend-developer**: 프론트엔드 개발
- **api-architect**: API 설계
- **mobile-ux-expert**: 모바일 UX

### 🔧 Specialized Experts (특화 전문가)

#### React 전문가
- **react-component-architect**: React 컴포넌트 설계
- **react-nextjs-expert**: Next.js 전문가

#### Supabase 전문가
- **supabase-backend-expert**: Supabase 백엔드
- **supabase-auth-expert**: 인증 시스템
- **supabase-realtime-expert**: 실시간 동기화

#### 게임플라자 전용
- **reservation-system-expert**: 예약 시스템 전문가
- **kst-time-expert**: KST 시간대 처리
- **mobile-first-expert**: 모바일 최적화
- **device-management-expert**: 기기 관리

## 🔄 워크플로우 예시

### 예시 1: 예약 시스템 개선
```
사용자: "예약 시스템에서 24시간 제한 기능 추가해줘"

1. gameplaza-tech-lead 분석
2. 에이전트 할당:
   - reservation-system-expert: 예약 로직 설계
   - supabase-backend-expert: DB 스키마 수정
   - react-component-architect: UI 업데이트
3. 순차 실행:
   - DB 스키마 → 백엔드 로직 → 프론트엔드 UI
4. code-reviewer: 최종 검토
```

### 예시 2: 모바일 성능 최적화
```
사용자: "모바일에서 로딩이 너무 느려요"

1. gameplaza-tech-lead 분석
2. 병렬 실행:
   - performance-optimizer: 성능 분석
   - mobile-first-expert: 모바일 최적화
3. 순차 실행:
   - 분석 결과 기반 최적화 적용
   - 테스트 및 검증
```

## 💡 프로 팁

### 1. 복잡한 작업은 Tech Lead로 시작
```
❌ "예약 API 만들어줘" (너무 단순)
✅ "예약 시스템 전체 리팩토링 해줘" (Tech Lead 필요)
```

### 2. 구체적인 요구사항 제공
```
❌ "버그 수정해줘"
✅ "예약 시간이 24시간을 넘어가면 에러나는 버그 수정해줘"
```

### 3. 에이전트 조합 활용
```
"모바일 예약 UI 개선해줘"
→ mobile-first-expert + react-component-architect 자동 조합
```

## ⚠️ 주의사항

1. **병렬 실행 제한**: 최대 2개 에이전트만 동시 실행
2. **에이전트 이름 정확성**: 정확한 에이전트 이름 사용
3. **Tech Lead 우선**: 복잡한 작업은 반드시 Tech Lead로 시작
4. **게임플라자 특화**: 게임플라자 전용 에이전트 우선 사용

## 📊 성능 향상 예상

- **개발 속도**: 3-5배 향상
- **코드 품질**: 자동 리뷰로 일관성 유지
- **버그 감소**: 전문가 검토로 사전 방지
- **문서화**: 자동 문서 생성

## 🛠️ 문제 해결

### 에이전트가 응답하지 않을 때
1. 에이전트 이름 확인
2. Tech Lead를 통한 재라우팅
3. 범용 에이전트로 폴백

### 작업이 너무 복잡할 때
1. Tech Lead에게 작업 분해 요청
2. 단계별로 나누어 실행
3. 중간 검토 포인트 설정

## 🔗 관련 문서

- [에이전트 상세 스펙](/docs/agents/)
- [CLAUDE.md](/CLAUDE.md)
- [Awesome Claude Agents 원본](https://github.com/vijaythecoder/awesome-claude-agents)

---

이 시스템을 활용하여 더 빠르고 효율적인 개발을 경험하세요! 🚀