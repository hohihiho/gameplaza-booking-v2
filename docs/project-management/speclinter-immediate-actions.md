# 🚀 SpecLinter 즉시 실행 계획

## 📌 현재 프로젝트 상태 기반 활용 방안

### 1. 백엔드 v2 API 명세 자동 생성

#### 1.1 도메인 모델 기반 명세 추출
```typescript
// src/domain/reservation/entities/Reservation.ts
export class Reservation {
  // SpecLinter가 이 클래스에서 자동으로 API 명세 생성
  constructor(
    readonly id: ReservationId,
    readonly deviceId: DeviceId,
    readonly timeSlot: TimeSlot,
    readonly numberOfPlayers: NumberOfPlayers,
    readonly status: ReservationStatus
  ) {}
}

// 생성될 명세:
/**
 * POST /api/v2/reservations
 * 
 * Request Body:
 * - device_id: string (uuid, required)
 * - start_time: string (ISO 8601, required)
 * - end_time: string (ISO 8601, required)  
 * - num_players: number (1-4, required)
 * 
 * Response: 201 Created
 * - id: string (uuid)
 * - reservation_number: string (YYMMDD-NNN)
 * - status: string (pending|approved|cancelled)
 */
```

#### 1.2 실행 명령어
```bash
# 1. v2 도메인 모델에서 명세 추출
speclinter extract-spec src/domain/ --output docs/api/v2/

# 2. 품질 검증
speclinter validate docs/api/v2/

# 3. TypeScript 타입 생성
speclinter generate-types docs/api/v2/ --output types/api/v2/
```

### 2. 기존 API 문서화 및 마이그레이션 가이드

#### 2.1 현재 상태 분석
```yaml
현재 문제점:
  - API 문서가 코드에 산재
  - 일관성 없는 응답 형식
  - 버전 관리 부재
  
해결 방안:
  1. 모든 v1 API 역공학으로 명세 생성
  2. v1 → v2 마이그레이션 매핑 작성
  3. Breaking Changes 자동 감지
```

#### 2.2 마이그레이션 명세
```markdown
## API Migration Specification

### /api/reservations → /api/v2/reservations

#### Breaking Changes:
- Response format changed to follow Domain Model
- Error codes standardized
- Authentication header required

#### Mapping:
| v1 Field | v2 Field | Type Change | Note |
|----------|----------|-------------|------|
| date | reservation_date | string → date | ISO 8601 |
| time | start_time, end_time | string → time | Split field |
| machine_id | device_id | number → uuid | Type change |

#### Migration Path:
1. Deploy v2 alongside v1
2. Update clients gradually
3. Monitor v1 usage
4. Deprecate v1 after 30 days
```

### 3. 실시간 명세-구현 동기화

#### 3.1 Git Hook 설정
```bash
#!/bin/bash
# .git/hooks/pre-commit

# API 파일 변경 감지
if git diff --cached --name-only | grep -q "api/"; then
  echo "API 변경 감지. SpecLinter 검증 중..."
  
  # 명세 동기화 확인
  speclinter check-sync --staged
  
  if [ $? -ne 0 ]; then
    echo "❌ 명세와 구현이 일치하지 않습니다!"
    echo "💡 다음 명령어로 명세를 업데이트하세요:"
    echo "   speclinter update-spec --from-code"
    exit 1
  fi
fi
```

#### 3.2 CI/CD 파이프라인
```yaml
# .github/workflows/spec-sync.yml
name: Spec Sync Check

on:
  push:
    branches: [main, develop]
    paths:
      - 'app/api/**'
      - 'src/**'
      - 'docs/**'

jobs:
  check-sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install SpecLinter
        run: npm install -g speclinter-mcp
        
      - name: Check Specification Sync
        run: |
          speclinter check-sync src/ docs/
          speclinter validate docs/planning/
          
      - name: Generate Sync Report
        if: failure()
        run: |
          speclinter report --format markdown > sync-report.md
          
      - name: Upload Report
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: spec-sync-report
          path: sync-report.md
```

### 4. 프론트엔드 인터페이스 문서화

#### 4.1 컴포넌트 Props 자동 문서화
```typescript
// SpecLinter가 자동으로 문서 생성
interface ReservationFormProps {
  /**
   * @speclinter.required
   * @speclinter.description 예약 가능한 기기 목록
   */
  availableDevices: Device[];
  
  /**
   * @speclinter.async
   * @speclinter.throws ReservationError
   */
  onSubmit: (reservation: ReservationInput) => Promise<void>;
}

// 생성될 문서:
/*
## ReservationForm Component

### Props:
- availableDevices (Device[], required): 예약 가능한 기기 목록
- onSubmit (async function, required): 예약 생성 콜백
  - Throws: ReservationError

### Usage:
```tsx
<ReservationForm
  availableDevices={devices}
  onSubmit={handleSubmit}
/>
```
*/
```

### 5. 즉시 실행 가능한 작업 목록

#### Week 1 (즉시 시작)
- [ ] SpecLinter MCP 설치 (`tools/speclinter-mcp`)
- [ ] 현재 기획서 품질 평가 실행
- [ ] v2 API 명세 자동 생성
- [ ] 첫 번째 동기화 리포트 생성

#### Week 2
- [ ] Git Hooks 설정
- [ ] CI/CD 파이프라인 구축
- [ ] 팀원 교육 세션 진행
- [ ] 첫 번째 자동 생성 PR 리뷰

### 6. 성공 지표

#### 단기 (2주)
- 모든 v2 API 문서화 완료
- SpecLinter 품질 점수 B+ 이상
- CI/CD 통합 완료

#### 중기 (1개월)
- 구현-명세 불일치 0건
- 자동 문서 생성률 80%
- 팀 전체 SpecLinter 활용

#### 장기 (3개월)
- 전체 API 문서 커버리지 100%
- 평균 명세 품질 A 등급
- 문서 작성 시간 70% 감소

## 🎯 다음 단계

1. **즉시**: SpecLinter 설치 스크립트 실행
   ```bash
   cd /Users/seeheejang/Documents/project/gameplaza-v2
   git clone https://github.com/orangebread/speclinter-mcp.git tools/speclinter-mcp
   cd tools/speclinter-mcp && npm install && npm run build
   ```

2. **오늘 중**: 첫 품질 평가 실행
   ```bash
   speclinter validate docs/planning/complete_specification.md
   ```

3. **이번 주**: v2 API 명세 자동 생성 및 검증

4. **다음 주**: CI/CD 통합 및 팀 교육