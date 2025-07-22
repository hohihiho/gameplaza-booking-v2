# /hooks - 자동화 훅 시스템

특정 이벤트 발생 시 자동으로 실행되는 훅 시스템을 관리합니다.

## 🔗 훅 시스템 개요

### 핵심 개념
- **이벤트 기반**: 특정 조건이나 액션에 반응
- **자동 실행**: 수동 개입 없이 백그라운드에서 동작
- **체인 가능**: 여러 훅을 순차적으로 실행
- **조건부 실행**: 특정 조건을 만족할 때만 실행

### 게임플라자 특화 훅
- **기획서 동기화**: 기능 구현 후 자동 문서 업데이트
- **모바일 검증**: 컴포넌트 변경 시 모바일 최적화 확인
- **시간 검증**: 시간 관련 코드 변경 시 KST 처리 확인
- **보안 검사**: API 변경 시 자동 보안 검토

## 🎯 훅 카테고리

### 📝 문서화 훅
```bash
# post-feature-implementation
# 새 기능 구현 후 실행
trigger: 새로운 컴포넌트나 API 추가
action: 
  - 기획서 업데이트 확인
  - API 문서 생성
  - README 업데이트
  - 사용자 가이드 갱신
```

### 🔍 품질 검증 훅
```bash
# pre-commit-quality-check  
# 커밋 전 실행
trigger: git commit 명령어
action:
  - 린트 검사
  - 타입 체크
  - 테스트 실행
  - 보안 스캔
```

### 📱 모바일 최적화 훅
```bash
# mobile-optimization-check
# UI 컴포넌트 변경 시 실행
trigger: components/ 디렉토리 파일 변경
action:
  - 터치 타겟 크기 검증
  - 뷰포트 설정 확인
  - 성능 영향 분석
  - 접근성 검사
```

### ⏰ 시간 처리 검증 훅
```bash
# kst-time-validation
# 시간 관련 코드 변경 시 실행
trigger: Date, time, schedule 키워드 포함 파일 변경
action:
  - KST 처리 방식 검증
  - 24시간 표시 체계 확인
  - 시간대 변환 로직 점검
```

## 🔧 훅 구현 방법

### 1. Git 훅 활용
```bash
#!/bin/bash
# .git/hooks/pre-commit

echo "🔍 게임플라자 품질 검사 시작..."

# 1. 린트 검사
echo "📝 린트 검사 중..."
npm run lint
if [ $? -ne 0 ]; then
  echo "❌ 린트 검사 실패"
  exit 1
fi

# 2. 타입 체크
echo "🔍 타입 체크 중..."
npx tsc --noEmit
if [ $? -ne 0 ]; then
  echo "❌ 타입 체크 실패"
  exit 1
fi

# 3. KST 시간 처리 검증
echo "⏰ KST 시간 처리 검증 중..."
if grep -r "new Date(" --include="*.ts" --include="*.tsx" . | grep -v "new Date(20" | grep -q .; then
  echo "⚠️ UTC 파싱이 감지되었습니다. KST 기준으로 변경해주세요."
  echo "❌ 발견된 파일들:"
  grep -r "new Date(" --include="*.ts" --include="*.tsx" . | grep -v "new Date(20"
  exit 1
fi

# 4. 모바일 터치 타겟 검증
echo "📱 모바일 최적화 검증 중..."
# 추가 검증 로직...

echo "✅ 모든 검사 통과!"
exit 0
```

### 2. npm 스크립트 훅
```json
{
  "scripts": {
    "pre-commit": "./scripts/pre-commit-hook.sh",
    "post-build": "./scripts/post-build-hook.sh",
    "pre-deploy": "./scripts/pre-deploy-hook.sh"
  }
}
```

### 3. 파일 감시 기반 훅
```javascript
// scripts/file-watcher.js
const chokidar = require('chokidar');
const { execSync } = require('child_process');

// 컴포넌트 파일 감시
chokidar.watch('app/components/**/*.tsx').on('change', (path) => {
  console.log(`🔍 컴포넌트 변경 감지: ${path}`);
  
  // 모바일 최적화 검사 실행
  try {
    execSync('./scripts/mobile-check.sh', { stdio: 'inherit' });
    console.log('✅ 모바일 최적화 검사 완료');
  } catch (error) {
    console.error('❌ 모바일 최적화 검사 실패');
  }
});

// API 파일 감시
chokidar.watch('app/api/**/*.ts').on('change', (path) => {
  console.log(`🔍 API 변경 감지: ${path}`);
  
  // 보안 검사 실행
  try {
    execSync('./scripts/security-check.sh', { stdio: 'inherit' });
    console.log('✅ 보안 검사 완료');
  } catch (error) {
    console.error('❌ 보안 검사 실패');
  }
});
```

## 📋 게임플라자 특화 훅 스크립트

### KST 시간 검증 훅
```bash
#!/bin/bash
# scripts/kst-validation-hook.sh

echo "⏰ KST 시간 처리 검증 시작..."

# UTC 파싱 검사
echo "🔍 UTC 파싱 검사 중..."
UTC_VIOLATIONS=$(grep -r "new Date(\".*T.*\")" --include="*.ts" --include="*.tsx" . | wc -l)
if [ $UTC_VIOLATIONS -gt 0 ]; then
  echo "❌ UTC 파싱 발견 ($UTC_VIOLATIONS개)"
  echo "다음 파일들을 KST 기준으로 수정해주세요:"
  grep -r "new Date(\".*T.*\")" --include="*.ts" --include="*.tsx" .
  exit 1
fi

# 24시간 표시 검증
echo "🔍 24시간 표시 체계 검사 중..."
HOUR_DISPLAY_CHECK=$(grep -r "getHours()" --include="*.ts" --include="*.tsx" . | grep -v "24시간\|24시" | wc -l)
if [ $HOUR_DISPLAY_CHECK -gt 0 ]; then
  echo "⚠️ 24시간 표시 체계 미적용 가능성 ($HOUR_DISPLAY_CHECK개)"
  echo "새벽 시간 표시를 24~29시 체계로 확인해주세요:"
  grep -r "getHours()" --include="*.ts" --include="*.tsx" . | grep -v "24시간\|24시"
fi

echo "✅ KST 시간 처리 검증 완료"
```

### 모바일 최적화 검증 훅
```bash
#!/bin/bash
# scripts/mobile-optimization-hook.sh

echo "📱 모바일 최적화 검증 시작..."

# 터치 타겟 크기 검사
echo "🔍 터치 타겟 크기 검사 중..."
SMALL_TARGETS=$(grep -r "width.*: *[1-3][0-9]px\|height.*: *[1-3][0-9]px" --include="*.css" --include="*.tsx" . | wc -l)
if [ $SMALL_TARGETS -gt 0 ]; then
  echo "⚠️ 작은 터치 타겟 발견 ($SMALL_TARGETS개)"
  echo "44px 이상으로 조정을 권장합니다:"
  grep -r "width.*: *[1-3][0-9]px\|height.*: *[1-3][0-9]px" --include="*.css" --include="*.tsx" .
fi

# 뷰포트 설정 확인
echo "🔍 뷰포트 설정 확인 중..."
if ! grep -q "viewport" app/layout.tsx; then
  echo "⚠️ 뷰포트 메타태그 확인 필요"
fi

# 폰트 크기 검사 (16px 이상 권장)
echo "🔍 폰트 크기 검사 중..."
SMALL_FONTS=$(grep -r "font-size.*: *1[0-5]px" --include="*.css" --include="*.tsx" . | wc -l)
if [ $SMALL_FONTS -gt 0 ]; then
  echo "⚠️ 작은 폰트 크기 발견 ($SMALL_FONTS개)"
  echo "모바일 접근성을 위해 16px 이상 권장:"
  grep -r "font-size.*: *1[0-5]px" --include="*.css" --include="*.tsx" .
fi

echo "✅ 모바일 최적화 검증 완료"
```

### 기획서 동기화 훅
```bash
#!/bin/bash
# scripts/spec-sync-hook.sh

echo "📋 기획서 동기화 검사 시작..."

# 새로운 컴포넌트나 API 추가 감지
NEW_COMPONENTS=$(git diff --cached --name-only | grep -E "(components|api)" | grep -E "\.(tsx|ts)$")

if [ ! -z "$NEW_COMPONENTS" ]; then
  echo "🆕 새로운 컴포넌트/API 발견:"
  echo "$NEW_COMPONENTS"
  
  echo "📝 기획서 업데이트가 필요할 수 있습니다:"
  echo "  - docs/planning/complete_specification.md"
  echo "  - docs/USER_REQUESTS.md"
  
  echo "계속하시겠습니까? (y/N)"
  read -r response
  if [[ ! "$response" =~ ^[Yy]$ ]]; then
    echo "커밋이 취소되었습니다."
    exit 1
  fi
fi

echo "✅ 기획서 동기화 검사 완료"
```

## 🔄 훅 설치 및 활성화

### 자동 설치 스크립트
```bash
#!/bin/bash
# scripts/setup-hooks.sh

echo "🔗 게임플라자 훅 시스템 설치 중..."

# Git 훅 디렉토리 생성
mkdir -p .git/hooks

# 훅 스크립트 복사 및 실행 권한 부여
cp scripts/hooks/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit

cp scripts/hooks/post-commit .git/hooks/post-commit  
chmod +x .git/hooks/post-commit

# npm 훅 설정
npm install --save-dev husky
npx husky install
npx husky add .husky/pre-commit "npm run pre-commit"

echo "✅ 훅 시스템 설치 완료"
echo "📋 활성화된 훅:"
echo "  - pre-commit: 품질 검사"
echo "  - post-commit: 문서 동기화"
echo "  - file-watcher: 실시간 검증"
```

### 훅 비활성화 방법
```bash
# 임시 비활성화
git commit --no-verify

# 완전 비활성화
rm .git/hooks/pre-commit
rm .git/hooks/post-commit
```

## 📊 훅 실행 리포트

### 실행 로그 수집
```bash
# logs/hooks.log
[2025-07-22 14:30:00] pre-commit: KST 검증 통과 ✅
[2025-07-22 14:30:15] pre-commit: 모바일 최적화 검증 통과 ✅  
[2025-07-22 14:30:30] pre-commit: 전체 검사 완료 ✅
[2025-07-22 14:31:00] post-commit: 기획서 동기화 확인 📋
```

### 성능 모니터링
```bash
# 훅 실행 시간 측정
echo "훅 실행 시간 분석:"
echo "  - KST 검증: 2.3초"
echo "  - 모바일 검증: 1.8초"  
echo "  - 보안 검사: 4.2초"
echo "  - 전체: 8.3초"
```

## 💡 훅 사용 팁

### 효율적인 훅 설계
- **빠른 실행**: 2-3초 내 완료
- **명확한 피드백**: 성공/실패 명확히 표시
- **건너뛰기 옵션**: 필요시 우회 가능
- **점진적 도입**: 한 번에 모든 훅 활성화 금지

### 팀 협업 고려사항
- **문서화**: 각 훅의 목적과 동작 방식 설명
- **온보딩**: 새 팀원을 위한 훅 설정 가이드
- **피드백 수집**: 훅의 효과성과 불편함 정기적 확인
- **지속적 개선**: 팀의 워크플로우에 맞게 조정

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"id": "1", "content": "SuperClaude Framework\uc758 \ud398\ub974\uc18c\ub098 \uc2dc\uc2a4\ud15c\uc744 \uc6b0\ub9ac \uc5d0\uc774\uc804\ud2b8 \uc2dc\uc2a4\ud15c\uacfc \ud1b5\ud569", "status": "completed", "priority": "high"}, {"id": "2", "content": "MCP \uc11c\ubc84 \ud1b5\ud569 \ubc29\uc2dd\uc744 \uc6b0\ub9ac \ud504\ub85c\uc81d\ud2b8\uc5d0 \ucd5c\uc801\ud654", "status": "completed", "priority": "medium"}, {"id": "3", "content": "SuperClaude\uc758 \uba85\ub839\uc5b4 \uc544\uc774\ub514\uc5b4\ub97c \uac8c\uc784\ud50c\ub77c\uc790 \ud2b9\ud654\ub85c \uac1c\uc120", "status": "completed", "priority": "medium"}, {"id": "4", "content": "\uc2e4\ud589 \uac00\ub2a5\ud55c \ud6c5(Hook) \uc2dc\uc2a4\ud15c \uc124\uacc4", "status": "completed", "priority": "low"}]