# 스키마 관리 전략 및 가이드라인

## 🚨 문제 요약

2024년 8월 반복적인 스키마 불일치 오류가 발생했습니다:
- TypeScript 타입 정의와 실제 Supabase DB 스키마 불일치
- device_types와 play_modes 간의 하이브리드 구조로 인한 혼란
- JSONB vs 관계형 테이블의 이중 구조 문제

## ✅ 즉시 해결된 사항 (2024-08-18)

1. **타입 정의 완전 동기화**: `types/database.ts`를 실제 Supabase 스키마와 100% 일치
2. **누락된 컬럼 복원**: `device_types.category_id`, `device_types.play_modes` 등
3. **관계형 테이블 추가**: `play_modes` 테이블 타입 정의 추가

## 🎯 장기 전략

### 1. 하이브리드 구조 정리 방향

**현재 상태:**
```
device_types {
  play_modes: Json (JSONB 배열) ← 레거시
}

play_modes {  
  device_type_id: string ← 권장 방식
  name: string
  price: number
}
```

**권장 마이그레이션:**
- 새로운 기능은 `play_modes` 테이블만 사용
- `device_types.play_modes`는 캐시용으로만 활용
- 점진적으로 JSONB 의존성 제거

### 2. API 레이어 표준화

```typescript
// 표준 쿼리 패턴
const deviceTypes = await supabase
  .from('device_types')
  .select(`
    *,
    device_categories(id, name),
    play_modes(id, name, price, display_order),  // 관계형 우선
    devices(id, device_number, status)
  `)
  .order('display_order')
```

### 3. 스키마 동기화 자동화

#### A. 타입 생성 자동화
```bash
# 매주 실행 (cron job)
supabase gen types typescript --project-id rupeyejnfurlcpgneekg > types/database.ts
```

#### B. 스키마 검증 스크립트
```typescript
// scripts/verify-schema.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// 실제 DB와 타입 정의 비교 검증
```

## 🔄 개발 워크플로우 개선

### 1. 스키마 변경 프로토콜

1. **Supabase Dashboard에서 스키마 변경**
2. **타입 재생성**: `supabase gen types`
3. **API 코드 업데이트**: 새 컬럼/관계 활용
4. **테스트 실행**: 스키마 불일치 검증
5. **배포**: 변경사항 반영

### 2. 에러 방지 체크리스트

**새 테이블/컬럼 추가 시:**
- [ ] Supabase Dashboard에서 변경
- [ ] 타입 정의 재생성
- [ ] API 코드에서 새 필드 활용
- [ ] 기존 쿼리와 충돌 없는지 확인

**외래키 관계 변경 시:**
- [ ] 관계형 쿼리 패턴 우선 사용
- [ ] JSONB 비정규화는 캐싱/성능용으로만
- [ ] 데이터 일관성 검증 스크립트 실행

## 🛡️ 예방 조치

### 1. 실시간 모니터링

```typescript
// lib/schema-monitor.ts
export const validateSchema = () => {
  // PostgREST 오류 패턴 감지
  // 타입 불일치 자동 감지
  // Slack/이메일 알림
}
```

### 2. 개발 환경 일치성

```yaml
# .github/workflows/schema-check.yml
name: Schema Validation
on: [push, pull_request]
jobs:
  verify-schema:
    steps:
      - name: Check TypeScript types
      - name: Validate Supabase schema
      - name: Compare for mismatches
```

## 📊 성능 최적화 전략

### 1. 쿼리 패턴 표준화

**❌ 비효율적:**
```typescript
// 각각 따로 쿼리 (N+1 문제)
const types = await supabase.from('device_types').select('*')
const modes = await supabase.from('play_modes').select('*')
```

**✅ 효율적:**
```typescript
// 조인된 단일 쿼리
const types = await supabase
  .from('device_types')
  .select('*, play_modes(*)')
```

### 2. 캐싱 전략

```typescript
// 5분 메모리 캐시 (현재 구현)
// + Redis 캐시 (장기 계획)
// + CDN 엣지 캐싱 (정적 데이터)
```

## 🎯 액션 아이템

### 즉시 (완료)
- [x] 타입 정의 완전 동기화
- [x] 누락된 테이블/컬럼 정의 추가

### 이번 주
- [ ] 스키마 검증 스크립트 작성
- [ ] API 쿼리 패턴 표준화
- [ ] 하이브리드 구조 정리 계획 수립

### 이번 달
- [ ] 자동화된 타입 생성 파이프라인
- [ ] 실시간 스키마 모니터링
- [ ] 성능 최적화 적용

## 📝 참고 문서

- [Supabase TypeScript 가이드](https://supabase.com/docs/guides/api/generating-types)
- [PostgREST 쿼리 문법](https://postgrest.org/en/stable/api.html)
- [프로젝트 DB 스키마](https://supabase.com/dashboard/project/rupeyejnfurlcpgneekg/editor)

---

**마지막 업데이트**: 2024-08-18
**작성자**: Claude Code - Backend System Architect
**버전**: 1.0.0