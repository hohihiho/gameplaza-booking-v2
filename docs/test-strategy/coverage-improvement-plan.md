# 📊 게임플라자 예약 시스템 - 테스트 커버리지 개선 계획

## 🎯 현재 커버리지 분석

### 전체 커버리지 현황
```
전체 평균 커버리지: ~45% (추정)
목표 커버리지: 80%
개선 필요도: 높음 (35%p 향상 필요)
```

### 영역별 커버리지 분석

#### 🟢 양호한 영역 (70% 이상)
- **JWT Token Service**: 93.47%
- **User Repository**: 91.3% 
- **Checkin Repository**: 69.35%
- **User Supabase Repository**: 62.06%

#### 🟡 개선 필요 영역 (30-70%)
- **Reservation Repository V2**: 36.66%
- **Google Auth Service**: 31.42%
- **Session Repository**: 12.3%

#### 🔴 심각한 영역 (30% 미만)
- **Admin Repository**: 0%
- **Device Repositories**: 0%
- **Notification/Payment Repositories**: 0%
- **Time Slot Repositories**: 0%
- **Infrastructure Seeds**: 0%
- **Test Utils**: 3.77%

---

## 🚨 우선순위별 개선 계획

### Phase 1: Critical 영역 (2주)
**목표**: 핵심 비즈니스 로직 80% 달성

#### 1.1 예약 시스템 (최우선)
```typescript
// 커버리지 개선 대상
src/application/use-cases/reservation/
├── create-reservation.use-case.ts (0% → 90%)
├── cancel-reservation.use-case.ts (0% → 85%)
└── adjust-time.use-case.ts (0% → 80%)

src/infrastructure/repositories/
├── supabase-reservation.repository.ts (0% → 85%)
└── supabase-reservation.repository.v2.ts (36% → 80%)
```

**개선 전략**:
- 단위 테스트: 비즈니스 로직 검증
- 통합 테스트: DB 연동 검증
- 에러 케이스: 예외 상황 처리

#### 1.2 인증 시스템
```typescript
// 커버리지 개선 대상
src/infrastructure/services/
├── google-auth.service.ts (31% → 80%)
└── jwt-token.service.ts (93% → 95%) // 미세 개선

lib/auth/
├── middleware.ts (테스트 추가 필요)
└── phone-auth.ts (기존 실패 테스트 수정)
```

#### 1.3 관리자 시스템
```typescript
// 커버리지 개선 대상
src/infrastructure/repositories/
└── admin.supabase.repository.ts (0% → 80%)

app/api/admin/
├── checkin/ (테스트 추가)
├── reservations/ (테스트 추가)
└── devices/ (테스트 추가)
```

### Phase 2: High Priority 영역 (2주)
**목표**: 주요 기능 영역 75% 달성

#### 2.1 기기 관리 시스템
```typescript
src/infrastructure/repositories/
├── device.supabase.repository.ts (0% → 75%)
├── supabase-device.repository.ts (0% → 75%)
└── supabase-device.repository.v2.ts (0% → 75%)

src/application/use-cases/device/
├── create-device.use-case.ts (테스트 강화)
├── change-device-status.use-case.ts (테스트 강화)
└── delete-device.use-case.ts (테스트 추가)
```

#### 2.2 체크인 시스템
```typescript
src/application/use-cases/check-in/
├── process-check-in.use-case.ts (기존 테스트 강화)
├── process-check-out.use-case.ts (기존 테스트 강화)
└── handle-no-show.use-case.ts (기존 테스트 강화)

src/infrastructure/repositories/
└── checkin.supabase.repository.ts (69% → 85%)
```

#### 2.3 시간 슬롯 시스템
```typescript
src/infrastructure/repositories/
├── supabase-time-slot-schedule.repository.ts (0% → 75%)
└── supabase-time-slot-template.repository.ts (0% → 75%)

src/application/use-cases/time-slot/
├── create-time-slot-template.use-case.ts (기존 테스트 강화)
├── get-available-time-slots.use-case.ts (기존 테스트 강화)
└── schedule-time-slots.use-case.ts (기존 테스트 강화)
```

### Phase 3: Medium Priority 영역 (1주)
**목표**: 지원 기능 영역 70% 달성

#### 3.1 알림 시스템
```typescript
src/infrastructure/repositories/
└── notification.supabase.repository.ts (0% → 70%)

// 새로운 테스트 작성
app/api/v2/notifications/ (삭제된 파일들 복구 후 테스트)
```

#### 3.2 결제 시스템
```typescript
src/infrastructure/repositories/
└── payment.supabase.repository.ts (0% → 70%)

// 새로운 테스트 작성
app/api/v2/payments/ (삭제된 파일들 복구 후 테스트)
```

#### 3.3 시간 조정 시스템
```typescript
src/infrastructure/repositories/
└── time-adjustment.supabase.repository.ts (0% → 70%)

// 연관 유스케이스 테스트 강화
src/application/use-cases/reservation/adjust-time.use-case.ts
```

### Phase 4: 유틸리티 및 기타 (1주)
**목표**: 공통 모듈 및 테스트 도구 80% 달성

#### 4.1 테스트 유틸리티
```typescript
src/test-utils/
├── index.ts (0% → 90%)
├── kst-time.ts (0% → 85%)
├── mock-data.ts (0% → 80%)
├── render.tsx (0% → 85%)
└── supabase.ts (18% → 80%)
```

#### 4.2 시드 데이터
```typescript
src/infrastructure/seeds/
├── index.ts (0% → 70%)
└── superadmin.seed.ts (0% → 70%)
```

---

## 🛠️ 실행 전략

### 1. 실패 테스트 수정
```bash
# 1단계: 기존 실패 테스트 수정
npm run test -- --verbose --no-coverage

# 주요 수정 대상:
# - lib/utils/__tests__/time.test.ts
# - app/api/auth/phone/__tests__/route.test.ts  
# - src/infrastructure/repositories/__tests__/admin.supabase.repository.test.ts
```

### 2. Mock 개선
```typescript
// jest.setup.js 개선
// Supabase 클라이언트 mock 완전성 강화
jest.mock('@/lib/supabase', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      // 누락된 메서드들 추가
    })),
  })),
}));
```

### 3. 테스트 작성 가이드라인

#### 3.1 Repository 테스트 패턴
```typescript
// Template: Repository 테스트
describe('RepositoryName', () => {
  let repository: RepositoryType;
  let mockSupabase: MockSupabaseClient;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    repository = new RepositoryType(mockSupabase);
  });

  describe('create', () => {
    it('성공적으로 생성한다', async () => {
      // Arrange
      const input = createMockInput();
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: expectedOutput,
        error: null,
      });

      // Act
      const result = await repository.create(input);

      // Assert
      expect(result).toEqual(expectedOutput);
      expect(mockSupabase.from).toHaveBeenCalledWith('table_name');
    });

    it('에러 발생 시 예외를 던진다', async () => {
      // Arrange
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      // Act & Assert
      await expect(repository.create(input)).rejects.toThrow('Database error');
    });
  });

  // findById, update, delete 등 모든 메서드 테스트
});
```

#### 3.2 Use Case 테스트 패턴
```typescript
// Template: Use Case 테스트
describe('UseCaseName', () => {
  let useCase: UseCaseType;
  let mockRepository: jest.Mocked<RepositoryType>;
  let mockService: jest.Mocked<ServiceType>;

  beforeEach(() => {
    mockRepository = createMockRepository();
    mockService = createMockService();
    useCase = new UseCaseType(mockRepository, mockService);
  });

  describe('execute', () => {
    it('정상적으로 실행된다', async () => {
      // Arrange
      const input = createValidInput();
      mockRepository.create.mockResolvedValue(expectedResult);

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(expectedResult);
      expect(mockRepository.create).toHaveBeenCalledWith(input);
    });

    it('비즈니스 규칙 위반 시 에러를 반환한다', async () => {
      // Arrange
      const invalidInput = createInvalidInput();

      // Act
      const result = await useCase.execute(invalidInput);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('비즈니스 규칙 위반');
      expect(mockRepository.create).not.toHaveBeenCalled();
    });
  });
});
```

### 4. 커버리지 추적

#### 4.1 일일 커버리지 모니터링
```bash
# 매일 실행할 스크립트
#!/bin/bash
# scripts/daily-coverage-check.sh

echo "📊 Daily Coverage Report - $(date)"

# 전체 테스트 실행
npm run test:coverage > coverage-report.txt

# 커버리지 추출
COVERAGE=$(grep "All files" coverage-report.txt | awk '{print $10}')

echo "Current Coverage: $COVERAGE"

# 목표 대비 진행률
TARGET=80
CURRENT=$(echo $COVERAGE | sed 's/%//')
PROGRESS=$(echo "scale=2; $CURRENT / $TARGET * 100" | bc)

echo "Progress to target: $PROGRESS%"

# Slack/Discord 알림 (옵션)
if (( $(echo "$CURRENT < $TARGET" | bc -l) )); then
  echo "⚠️ Coverage below target ($TARGET%)"
fi
```

#### 4.2 PR별 커버리지 체크
```yaml
# .github/workflows/coverage-check.yml
name: Coverage Check

on: [pull_request]

jobs:
  coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests with coverage
        run: npm run test:coverage
        
      - name: Check coverage threshold
        run: |
          # 커버리지가 목표치 미달인지 확인
          COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
          if (( $(echo "$COVERAGE < 80" | bc -l) )); then
            echo "❌ Coverage $COVERAGE% is below threshold 80%"
            exit 1
          else
            echo "✅ Coverage $COVERAGE% meets threshold"
          fi
```

---

## 📈 성공 지표

### 단기 목표 (4주 후)
- [ ] 전체 커버리지 80% 달성
- [ ] Critical 영역 90% 달성
- [ ] 실패 테스트 0건
- [ ] CI/CD 파이프라인 통합

### 중기 목표 (8주 후)
- [ ] 모든 신규 코드 95% 커버리지
- [ ] 변경 감지 테스트 (Mutation Testing) 도입
- [ ] 성능 회귀 테스트 자동화
- [ ] 테스트 실행 시간 5분 이내

### 장기 목표 (12주 후)
- [ ] 브랜치 커버리지 85% 달성
- [ ] 함수 커버리지 90% 달성
- [ ] E2E 테스트 커버리지 100% (주요 플로우)
- [ ] 테스트 유지보수 자동화

---

## 🔧 도구 및 자동화

### 1. 커버리지 분석 도구
```bash
# 설치할 추가 도구
npm install --save-dev \
  nyc \                      # 고급 커버리지 리포팅
  codecov \                  # 커버리지 시각화
  jest-coverage-badges \     # 커버리지 배지 생성
  @stryker-mutator/core     # Mutation Testing
```

### 2. 자동화 스크립트
```javascript
// scripts/coverage-analysis.js
const fs = require('fs');
const path = require('path');

class CoverageAnalyzer {
  constructor() {
    this.coveragePath = 'coverage/coverage-summary.json';
    this.targetCoverage = 80;
  }
  
  analyze() {
    const coverage = this.loadCoverage();
    const analysis = this.analyzeCoverage(coverage);
    this.generateReport(analysis);
    this.suggestImprovements(analysis);
  }
  
  loadCoverage() {
    if (!fs.existsSync(this.coveragePath)) {
      throw new Error('Coverage report not found. Run npm run test:coverage first.');
    }
    return JSON.parse(fs.readFileSync(this.coveragePath, 'utf8'));
  }
  
  analyzeCoverage(coverage) {
    const files = Object.entries(coverage)
      .filter(([key]) => key !== 'total')
      .map(([file, data]) => ({
        file,
        lines: data.lines.pct,
        statements: data.statements.pct,
        functions: data.functions.pct,
        branches: data.branches.pct,
        uncoveredLines: data.lines.total - data.lines.covered,
      }))
      .sort((a, b) => a.lines - b.lines);
    
    return {
      total: coverage.total,
      worstFiles: files.slice(0, 10),
      missingTests: files.filter(f => f.lines === 0),
      almostThere: files.filter(f => f.lines > 70 && f.lines < this.targetCoverage),
    };
  }
  
  generateReport(analysis) {
    const report = `
# Coverage Analysis Report

## Overall Statistics
- Lines: ${analysis.total.lines.pct}%
- Statements: ${analysis.total.statements.pct}%
- Functions: ${analysis.total.functions.pct}%
- Branches: ${analysis.total.branches.pct}%

## Files Needing Attention (${analysis.worstFiles.length})
${analysis.worstFiles.map(f => 
  `- ${f.file}: ${f.lines}% (${f.uncoveredLines} uncovered lines)`
).join('\n')}

## Files Without Tests (${analysis.missingTests.length})
${analysis.missingTests.map(f => `- ${f.file}`).join('\n')}

## Almost There (${analysis.almostThere.length})
${analysis.almostThere.map(f => 
  `- ${f.file}: ${f.lines}% (need ${this.targetCoverage - f.lines}% more)`
).join('\n')}
    `;
    
    fs.writeFileSync('coverage-analysis.md', report);
    console.log('📊 Coverage analysis saved to coverage-analysis.md');
  }
  
  suggestImprovements(analysis) {
    console.log('\n🎯 Improvement Suggestions:');
    
    analysis.missingTests.slice(0, 5).forEach(file => {
      console.log(`\n📁 ${file.file}:`);
      console.log('  - Add basic unit tests');
      console.log('  - Test happy path and error cases');
      console.log('  - Mock external dependencies');
    });
    
    analysis.almostThere.slice(0, 3).forEach(file => {
      console.log(`\n🎯 ${file.file} (${file.lines}%):`);
      console.log('  - Add edge case tests');
      console.log('  - Test error handling paths');
      console.log(`  - ${file.uncoveredLines} lines need coverage`);
    });
  }
}

// 실행
new CoverageAnalyzer().analyze();
```

### 3. Git Hook 통합
```bash
#!/bin/sh
# .husky/pre-push

echo "🧪 Running tests and coverage check..."

# 테스트 실행
npm run test:coverage

# 커버리지 체크
COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
TARGET=80

if (( $(echo "$COVERAGE < $TARGET" | bc -l) )); then
  echo "❌ Coverage $COVERAGE% is below target $TARGET%"
  echo "Please add more tests before pushing."
  exit 1
fi

echo "✅ Coverage check passed: $COVERAGE%"
```

---

## 📋 실행 체크리스트

### Week 1-2: Critical 영역
- [ ] 실패 테스트 모두 수정
- [ ] Mock 설정 완전성 확보
- [ ] 예약 시스템 테스트 80% 달성
- [ ] 인증 시스템 테스트 80% 달성
- [ ] 관리자 시스템 테스트 80% 달성

### Week 3-4: High Priority 영역
- [ ] 기기 관리 테스트 75% 달성
- [ ] 체크인 시스템 테스트 85% 달성
- [ ] 시간 슬롯 테스트 75% 달성
- [ ] 커버리지 모니터링 도구 구축

### Week 5: Medium Priority 영역
- [ ] 알림 시스템 테스트 70% 달성
- [ ] 결제 시스템 테스트 70% 달성
- [ ] 시간 조정 테스트 70% 달성

### Week 6: 유틸리티 및 마무리
- [ ] 테스트 유틸리티 80% 달성
- [ ] 전체 커버리지 80% 달성
- [ ] CI/CD 파이프라인 통합
- [ ] 문서화 완료

이 계획을 통해 체계적으로 테스트 커버리지를 개선하고, 지속 가능한 품질 관리 체계를 구축할 수 있습니다.