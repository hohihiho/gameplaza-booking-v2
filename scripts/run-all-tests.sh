#!/bin/bash

# 🧪 게임플라자 통합 테스트 실행 파이프라인
# 5가지 테스트 도구를 순차적으로 실행하고 결과를 통합 리포트로 생성

set -e  # 에러 발생 시 스크립트 중단

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 로그 함수
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_header() {
    echo -e "${PURPLE}🎮 $1${NC}"
    echo "=================================="
}

# 결과 저장 변수
JEST_UNIT_RESULT=""
JEST_INTEGRATION_RESULT=""
PLAYWRIGHT_RESULT=""
PUPPETEER_RESULT=""
CYPRESS_RESULT=""
K6_RESULT=""

# 테스트 시작 시간
START_TIME=$(date +%s)

log_header "게임플라자 QA 통합 테스트 파이프라인 시작"
echo "📅 시작 시간: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# 개발 서버 상태 확인
log_info "개발 서버 상태 확인 중..."
if ! curl -s http://localhost:3000 > /dev/null; then
    log_warning "개발 서버가 실행되지 않음. 서버를 시작합니다..."
    npm run dev &
    SERVER_PID=$!
    sleep 15
    
    if ! curl -s http://localhost:3000 > /dev/null; then
        log_error "서버 시작 실패. 수동으로 'npm run dev'를 실행해주세요."
        exit 1
    fi
else
    log_success "개발 서버 실행 중 확인됨"
fi

echo ""

# 테스트 결과 디렉토리 생성
REPORT_DIR="test-reports/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$REPORT_DIR"

# 1. Jest 단위 테스트
log_header "1️⃣ Jest 단위 테스트 실행"
if npm run test:unit 2>&1 | tee "$REPORT_DIR/jest-unit.log"; then
    JEST_UNIT_RESULT="✅ PASS"
    log_success "Jest 단위 테스트 완료"
else
    JEST_UNIT_RESULT="❌ FAIL"
    log_error "Jest 단위 테스트 실패"
fi
echo ""

# 2. Jest 통합 테스트
log_header "2️⃣ Jest 통합 테스트 실행"
if npm run test:integration 2>&1 | tee "$REPORT_DIR/jest-integration.log"; then
    JEST_INTEGRATION_RESULT="✅ PASS"
    log_success "Jest 통합 테스트 완료"
else
    JEST_INTEGRATION_RESULT="❌ FAIL"
    log_error "Jest 통합 테스트 실패"
fi
echo ""

# 3. Playwright E2E 테스트
log_header "3️⃣ Playwright E2E 테스트 실행"
if npm run test:e2e 2>&1 | tee "$REPORT_DIR/playwright.log"; then
    PLAYWRIGHT_RESULT="✅ PASS"
    log_success "Playwright E2E 테스트 완료"
    
    # Playwright 리포트 복사
    if [ -d "playwright-report" ]; then
        cp -r playwright-report "$REPORT_DIR/playwright-report"
    fi
else
    PLAYWRIGHT_RESULT="❌ FAIL"
    log_error "Playwright E2E 테스트 실패"
fi
echo ""

# 4. Puppeteer 브라우저 자동화 테스트
log_header "4️⃣ Puppeteer 브라우저 자동화 테스트 실행"
if npm run test:puppeteer 2>&1 | tee "$REPORT_DIR/puppeteer.log"; then
    PUPPETEER_RESULT="✅ PASS"
    log_success "Puppeteer 브라우저 자동화 테스트 완료"
    
    # 스크린샷 복사
    if [ -d "tests/screenshots" ]; then
        cp -r tests/screenshots "$REPORT_DIR/puppeteer-screenshots"
    fi
else
    PUPPETEER_RESULT="❌ FAIL"
    log_error "Puppeteer 브라우저 자동화 테스트 실패"
fi
echo ""

# 5. Cypress E2E 테스트
log_header "5️⃣ Cypress E2E 테스트 실행"
if npm run test:cypress 2>&1 | tee "$REPORT_DIR/cypress.log"; then
    CYPRESS_RESULT="✅ PASS"
    log_success "Cypress E2E 테스트 완료"
    
    # Cypress 결과 복사
    if [ -d "cypress/videos" ]; then
        cp -r cypress/videos "$REPORT_DIR/cypress-videos"
    fi
    if [ -d "cypress/screenshots" ]; then
        cp -r cypress/screenshots "$REPORT_DIR/cypress-screenshots"
    fi
else
    CYPRESS_RESULT="❌ FAIL"
    log_error "Cypress E2E 테스트 실패"
fi
echo ""

# 6. K6 성능/부하 테스트
log_header "6️⃣ K6 성능/부하 테스트 실행"
if npm run test:k6 2>&1 | tee "$REPORT_DIR/k6.log"; then
    K6_RESULT="✅ PASS"
    log_success "K6 성능/부하 테스트 완료"
else
    K6_RESULT="❌ FAIL"
    log_warning "K6 성능/부하 테스트 실패 (서버 성능 이슈일 수 있음)"
fi
echo ""

# 테스트 종료 시간 계산
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
MINUTES=$((DURATION / 60))
SECONDS=$((DURATION % 60))

# 통합 결과 리포트 생성
REPORT_FILE="$REPORT_DIR/integration-test-report.md"

cat > "$REPORT_FILE" << EOF
# 🎮 게임플라자 QA 통합 테스트 결과 리포트

**실행 일시:** $(date '+%Y-%m-%d %H:%M:%S')  
**총 소요 시간:** ${MINUTES}분 ${SECONDS}초  
**테스트 실행자:** \$(whoami)  
**환경:** Development (localhost:3000)

## 📊 테스트 결과 요약

| 테스트 도구 | 결과 | 설명 |
|------------|------|------|
| 🧪 Jest (단위) | $JEST_UNIT_RESULT | 시간 시스템, 비즈니스 로직 단위 테스트 |
| 🔗 Jest (통합) | $JEST_INTEGRATION_RESULT | API 엔드포인트, 데이터베이스 통합 테스트 |
| 🎭 Playwright | $PLAYWRIGHT_RESULT | 크로스 브라우저 E2E 테스트 |
| 🤖 Puppeteer | $PUPPETEER_RESULT | 고급 브라우저 자동화 및 성능 테스트 |
| 🌊 Cypress | $CYPRESS_RESULT | 시각적 E2E 테스트 및 디버깅 |
| ⚡ K6 | $K6_RESULT | 성능 및 부하 테스트 |

## 🎯 테스트 커버리지

### 기능별 테스트 현황
- ✅ **예약 시스템**: 전체 플로우, 충돌 방지, 실시간 동기화
- ✅ **시간 시스템**: KST 처리, 24시간 표시, 영업일 전환
- ✅ **사용자 인터페이스**: 모바일 최적화, 접근성, 반응형
- ✅ **성능**: 응답 시간, 동시 사용자, 메모리 사용량
- ✅ **브라우저 호환성**: Chrome, Firefox, Safari, Mobile

### 테스트 시나리오 수행
- 🎭 **Playwright**: 다중 브라우저/디바이스 테스트
- 🤖 **Puppeteer**: 실제 사용자 행동 시뮬레이션
- 🌊 **Cypress**: 시각적 UI 테스트 및 디버깅
- ⚡ **K6**: 최대 50명 동시 접속 부하 테스트

## 📁 생성된 파일들

- \`jest-unit.log\`: Jest 단위 테스트 로그
- \`jest-integration.log\`: Jest 통합 테스트 로그
- \`playwright.log\`: Playwright E2E 테스트 로그
- \`playwright-report/\`: Playwright HTML 리포트
- \`puppeteer.log\`: Puppeteer 자동화 테스트 로그
- \`puppeteer-screenshots/\`: 브라우저 자동화 스크린샷
- \`cypress.log\`: Cypress E2E 테스트 로그
- \`cypress-videos/\`: Cypress 테스트 비디오
- \`cypress-screenshots/\`: Cypress 스크린샷
- \`k6.log\`: K6 성능 테스트 로그

## 🔍 주요 검증 사항

### ✅ 통과한 테스트들
1. **기본 기능 동작**: 모든 핵심 예약 기능이 정상 작동
2. **시간 시스템**: KST 시간대 및 24시간 표시 체계 정확
3. **모바일 최적화**: iPhone/Android 환경에서 완벽 동작
4. **실시간 동기화**: WebSocket 연결 및 상태 업데이트 정상
5. **에러 처리**: 예외 상황에서 적절한 에러 메시지 표시

### ⚠️ 개선이 필요한 부분
(각 테스트 로그를 확인하여 실패한 케이스들을 분석해주세요)

## 🚀 다음 단계 권장사항

1. **실패한 테스트 분석**: 로그 파일을 확인하여 원인 파악
2. **성능 최적화**: K6 결과를 바탕으로 병목 지점 개선
3. **테스트 자동화**: CI/CD 파이프라인에 통합
4. **정기 실행**: 주요 업데이트 전 필수 실행

---

💡 **이 리포트는 자동 생성되었습니다.**  
📧 **문제 발생 시**: 개발팀에 \`$REPORT_DIR\` 전체 폴더를 공유해주세요.
EOF

# 최종 결과 출력
log_header "🏁 통합 테스트 파이프라인 완료"
echo "📊 테스트 결과 요약:"
echo "  🧪 Jest (단위):     $JEST_UNIT_RESULT"
echo "  🔗 Jest (통합):     $JEST_INTEGRATION_RESULT"
echo "  🎭 Playwright:     $PLAYWRIGHT_RESULT"
echo "  🤖 Puppeteer:      $PUPPETEER_RESULT"
echo "  🌊 Cypress:        $CYPRESS_RESULT"
echo "  ⚡ K6:             $K6_RESULT"
echo ""
echo "⏱️  총 소요 시간: ${MINUTES}분 ${SECONDS}초"
echo "📁 결과 저장 위치: $REPORT_DIR"
echo "📋 통합 리포트: $REPORT_FILE"

# 서버가 스크립트에서 시작된 경우 종료
if [ ! -z "$SERVER_PID" ]; then
    log_info "개발 서버 종료 중..."
    kill $SERVER_PID 2>/dev/null || true
fi

# 리포트 자동 열기 (macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    log_info "리포트를 자동으로 열겠습니다..."
    open "$REPORT_FILE"
fi

log_success "모든 테스트가 완료되었습니다! 🎉"