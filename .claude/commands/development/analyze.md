# /analyze - 코드 분석 전문가 모드

코드베이스를 체계적으로 분석하여 문제점을 발견하고 개선점을 제안하는 전문가 모드입니다.

## 🔍 분석 전문가 역할

### 핵심 분석 영역
- **코드 품질**: 가독성, 유지보수성, 확장성 평가
- **성능 분석**: 병목 지점 식별 및 최적화 방안 제시
- **보안 검토**: 취약점 탐지 및 보안 강화 방안
- **아키텍처 평가**: 설계 일관성 및 개선점 분석
- **기술 부채**: 누적된 문제점과 해결 우선순위 제시

### 게임플라자 특화 분석 관점
- **모바일 최적화**: 99% 모바일 사용자를 위한 최적화 상태
- **시간 처리 정확성**: KST 기준 시간 처리 검증
- **실시간 동기화**: Supabase 실시간 기능 효율성
- **예약 시스템**: 비즈니스 로직 정확성 및 성능

## 🎯 분석 워크플로우

### 1. 전체 코드베이스 스캔
```bash
# 코드 메트릭 수집
find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | xargs wc -l
find . -name "*.ts" -o -name "*.tsx" | xargs grep -l "TODO\|FIXME\|HACK"

# 의존성 분석
npm audit
npm outdated
```

### 2. 핫스팟 식별
```typescript
// 복잡도가 높은 파일 찾기
const analyzeComplexity = (filePath: string) => {
  const metrics = {
    cyclomaticComplexity: calculateCyclomaticComplexity(filePath),
    linesOfCode: countLinesOfCode(filePath),
    dependencies: countDependencies(filePath),
    testCoverage: getTestCoverage(filePath)
  };
  
  return {
    file: filePath,
    riskScore: calculateRiskScore(metrics),
    recommendations: generateRecommendations(metrics)
  };
};
```

### 3. 패턴 분석
```typescript
// 코드 패턴 일관성 검사
const analyzePatterns = () => {
  return {
    namingConsistency: checkNamingConventions(),
    importPatterns: analyzeImportStructure(),
    errorHandling: checkErrorHandlingPatterns(),
    stateManagement: analyzeStatePatterns()
  };
};
```

## 📊 분석 카테고리

### 🏗️ 아키텍처 분석
```typescript
// 컴포넌트 계층 구조 분석
const analyzeComponentHierarchy = () => {
  return {
    depth: calculateMaxNestingDepth(),
    coupling: measureComponentCoupling(),
    cohesion: measureComponentCohesion(),
    reusability: assessReusabilityScore()
  };
};

// 데이터 플로우 분석
const analyzeDataFlow = () => {
  return {
    propDrilling: detectPropDrilling(),
    stateManagement: analyzeStateComplexity(),
    sideEffects: identifySideEffects(),
    dataFetching: analyzeDataFetchingPatterns()
  };
};
```

### ⚡ 성능 분석
```typescript
// 렌더링 성능 분석
const analyzeRenderingPerformance = () => {
  return {
    unnecessaryRerenders: detectUnnecessaryRerenders(),
    expensiveCalculations: findExpensiveCalculations(),
    memoryLeaks: detectPotentialMemoryLeaks(),
    bundleSize: analyzeBundleSize()
  };
};

// 네트워크 효율성 분석
const analyzeNetworkEfficiency = () => {
  return {
    apiCalls: countAPICallsPerPage(),
    caching: analyzeCachingStrategy(),
    dataOverfetch: detectDataOverfetch(),
    requestWaterfall: identifyRequestWaterfall()
  };
};
```

### 🔐 보안 분석
```typescript
// 보안 취약점 스캔
const securityAnalysis = () => {
  return {
    xssVulnerabilities: scanForXSS(),
    dataExposure: checkDataExposure(),
    authenticationFlaws: analyzeAuthFlow(),
    inputValidation: checkInputValidation()
  };
};
```

## 🎮 게임플라자 특화 분석

### 시간 처리 분석
```typescript
// KST 시간 처리 검증
const analyzeTimeHandling = (codebase: string[]) => {
  const issues = [];
  
  codebase.forEach(file => {
    // UTC 파싱 감지
    if (file.includes('new Date("') && file.includes('T')) {
      issues.push({
        type: 'UTC_PARSING',
        file: file,
        message: 'UTC 문자열 파싱 감지 - KST 기준으로 변경 필요'
      });
    }
    
    // 24시간 표시 체계 확인
    if (file.includes('getHours()') && !file.includes('24시간')) {
      issues.push({
        type: 'TIME_DISPLAY',
        file: file,
        message: '24시간 표시 체계 적용 필요'
      });
    }
  });
  
  return issues;
};
```

### 모바일 최적화 분석
```typescript
// 모바일 UX 분석
const analyzeMobileOptimization = () => {
  return {
    touchTargets: analyzeTouchTargetSizes(),
    viewportHandling: checkViewportConfiguration(),
    gestureSupport: analyzeGestureImplementation(),
    performanceOnMobile: checkMobilePerformance()
  };
};

const analyzeTouchTargetSizes = () => {
  // CSS에서 터치 타겟 크기 검사
  const minTouchSize = 44; // px
  const violations = [];
  
  // 버튼, 링크 크기 검사 로직
  return violations;
};
```

### 실시간 동기화 분석
```typescript
// Supabase 실시간 기능 효율성 분석
const analyzeRealtimeEfficiency = () => {
  return {
    subscriptionManagement: checkSubscriptionLifecycle(),
    memoryUsage: analyzeRealtimeMemoryUsage(),
    reconnectionHandling: checkReconnectionLogic(),
    conflictResolution: analyzeConflictResolution()
  };
};
```

## 📋 분석 리포트 템플릿

### 종합 분석 리포트
```
🔍 게임플라자 코드 분석 리포트
생성 시간: [현재 시간]

📊 전체 메트릭:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 총 파일 수: [N개]
📏 총 코드 라인: [N줄]
🧩 컴포넌트 수: [N개]
🌐 API 엔드포인트: [N개]
⚠️ TODO/FIXME: [N개]

🏆 품질 점수:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 전체 품질: [점수]/100
📱 모바일 최적화: [점수]/100
⚡ 성능: [점수]/100
🔐 보안: [점수]/100
🏗️ 아키텍처: [점수]/100

🚨 주요 이슈:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 심각: [N개] - 즉시 수정 필요
🟡 경고: [N개] - 우선순위 높음
🟢 정보: [N개] - 개선 권장

🎯 게임플라자 특화 분석:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏰ KST 시간 처리: [상태]
📱 모바일 터치: [상태]
🔄 실시간 동기화: [상태]
📅 24시간 표시: [상태]

💡 개선 제안:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. [우선순위 1] [개선사항]
2. [우선순위 2] [개선사항]
3. [우선순위 3] [개선사항]

🔧 기술 부채:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- [부채 항목 1] - 예상 해결 시간: [N시간]
- [부채 항목 2] - 예상 해결 시간: [N시간]

📈 성능 최적화 기회:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- [최적화 1] - 예상 개선: [N%]
- [최적화 2] - 예상 개선: [N%]
```

## 🔧 자동 분석 도구 설정

### ESLint 규칙 강화
```json
{
  "rules": {
    "gameplaza/kst-time-only": "error",
    "gameplaza/mobile-touch-size": "warn",
    "gameplaza/24-hour-display": "error",
    "complexity": ["error", 10],
    "max-lines": ["warn", 300],
    "max-depth": ["error", 4]
  }
}
```

### 커스텀 분석 스크립트
```bash
#!/bin/bash
# 게임플라자 특화 코드 분석

echo "🕐 KST 시간 처리 검사"
grep -r "new Date(" --include="*.ts" --include="*.tsx" . | grep -v "new Date(20"

echo "📱 모바일 터치 타겟 검사"  
grep -r "width.*px\|height.*px" --include="*.css" --include="*.tsx" . | awk -F: '{print $1}' | sort | uniq

echo "🔄 실시간 구독 검사"
grep -r "useEffect.*supabase" --include="*.ts" --include="*.tsx" .
```

## 💡 분석 결과 활용

### 우선순위 매트릭스
```
영향도 높음 × 해결 용이 → 즉시 수정
영향도 높음 × 해결 어려움 → 계획적 해결
영향도 낮음 × 해결 용이 → 여유시 수정
영향도 낮음 × 해결 어려움 → 모니터링
```

### 지속적 개선 계획
- **주간**: 새로운 코드 품질 검사
- **월간**: 전체 아키텍처 리뷰
- **분기**: 성능 및 보안 감사
- **연간**: 기술 스택 업데이트 검토

분석 모드에서는 항상 데이터 기반의 객관적인 개선점을 제시합니다.