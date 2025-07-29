#!/bin/bash

# 🧪 로컬 테스트 실행 스크립트
# 게임플라자 예약 시스템 QA 스크립트

set -e  # 에러 발생 시 스크립트 중단

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 설정
COVERAGE_THRESHOLD=80
PORT=3000
TEST_TIMEOUT=300  # 5분

# 함수: 진행 상황 출력
print_step() {
    echo -e "${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

# 함수: 의존성 체크
check_dependencies() {
    print_step "의존성 확인 중..."
    
    # Node.js 버전 체크
    if ! command -v node &> /dev/null; then
        print_error "Node.js가 설치되지 않았습니다"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js 18 이상이 필요합니다. 현재 버전: $(node --version)"
        exit 1
    fi
    
    # npm 체크
    if ! command -v npm &> /dev/null; then
        print_error "npm이 설치되지 않았습니다"
        exit 1
    fi
    
    print_success "의존성 확인 완료"
}

# 함수: 프로젝트 설정
setup_project() {
    print_step "프로젝트 설정 중..."
    
    # 의존성 설치
    if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules/.package-lock.json" ]; then
        print_info "의존성 설치 중..."
        npm ci
    fi
    
    # 환경변수 체크
    if [ ! -f ".env.local" ]; then
        print_warning ".env.local 파일이 없습니다. 테스트용 환경변수를 사용합니다."
        cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=https://test.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=test-anon-key
SUPABASE_SERVICE_ROLE_KEY=test-service-role-key
EOF
    fi
    
    print_success "프로젝트 설정 완료"
}

# 함수: 포트 확인 및 정리
check_port() {
    print_step "포트 $PORT 확인 중..."
    
    if lsof -ti:$PORT > /dev/null 2>&1; then
        print_warning "포트 $PORT가 사용 중입니다. 프로세스를 종료합니다."
        lsof -ti:$PORT | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
    
    print_success "포트 확인 완료"
}

# 함수: 단위 테스트 및 커버리지
run_unit_tests() {
    print_step "단위 테스트 및 커버리지 실행 중..."
    
    # Jest 테스트 실행
    if npm run test:coverage; then
        print_success "단위 테스트 통과"
        
        # 커버리지 체크
        if [ -f "coverage/coverage-summary.json" ]; then
            COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
            echo -e "${PURPLE}📊 현재 커버리지: $COVERAGE%${NC}"
            
            if (( $(echo "$COVERAGE >= $COVERAGE_THRESHOLD" | bc -l) )); then
                print_success "커버리지 목표 달성: $COVERAGE% >= $COVERAGE_THRESHOLD%"
            else
                print_warning "커버리지 미달: $COVERAGE% < $COVERAGE_THRESHOLD%"
                return 1
            fi
        else
            print_warning "커버리지 리포트를 찾을 수 없습니다"
        fi
    else
        print_error "단위 테스트 실패"
        return 1
    fi
}

# 함수: 타입 체크 및 린트
run_code_quality() {
    print_step "코드 품질 검사 중..."
    
    # TypeScript 타입 체크
    if npm run type-check; then
        print_success "TypeScript 타입 체크 통과"
    else
        print_error "TypeScript 타입 체크 실패"
        return 1
    fi
    
    # ESLint 검사
    if npm run lint; then
        print_success "ESLint 검사 통과"
    else
        print_error "ESLint 검사 실패"
        return 1
    fi
}

# 함수: 애플리케이션 빌드
build_application() {
    print_step "애플리케이션 빌드 중..."
    
    if npm run build; then
        print_success "빌드 완료"
    else
        print_error "빌드 실패"
        return 1
    fi
}

# 함수: E2E 테스트
run_e2e_tests() {
    print_step "E2E 테스트 준비 중..."
    
    # Playwright 브라우저 설치 확인
    if ! npx playwright --version &> /dev/null; then
        print_info "Playwright 설치 중..."
        npx playwright install
    fi
    
    # 애플리케이션 시작
    print_info "애플리케이션 시작 중..."
    npm start &
    SERVER_PID=$!
    
    # 서버 준비 대기
    print_info "서버 준비 대기 중..."
    timeout $TEST_TIMEOUT bash -c "
        while ! curl -f http://localhost:$PORT > /dev/null 2>&1; do
            sleep 2
        done
    " || {
        print_error "서버 시작 시간 초과"
        kill $SERVER_PID 2>/dev/null || true
        return 1
    }
    
    print_success "서버 준비 완료"
    
    # E2E 테스트 실행
    print_step "E2E 테스트 실행 중..."
    
    local e2e_result=0
    
    # Chromium 테스트
    if npx playwright test --project=chromium --reporter=line; then
        print_success "Chromium E2E 테스트 통과"
    else
        print_error "Chromium E2E 테스트 실패"
        e2e_result=1
    fi
    
    # Firefox 테스트 (선택사항)
    if command -v firefox &> /dev/null; then
        if npx playwright test --project=firefox --reporter=line; then
            print_success "Firefox E2E 테스트 통과"
        else
            print_warning "Firefox E2E 테스트 실패"
        fi
    fi
    
    # 서버 종료
    kill $SERVER_PID 2>/dev/null || true
    wait $SERVER_PID 2>/dev/null || true
    
    return $e2e_result
}

# 함수: 모바일 테스트 (간단 버전)
run_mobile_tests() {
    print_step "모바일 테스트 실행 중..."
    
    # 애플리케이션 시작
    npm start &
    SERVER_PID=$!
    
    # 서버 준비 대기
    timeout $TEST_TIMEOUT bash -c "
        while ! curl -f http://localhost:$PORT > /dev/null 2>&1; do
            sleep 2
        done
    " || {
        print_error "서버 시작 시간 초과"
        kill $SERVER_PID 2>/dev/null || true
        return 1
    }
    
    # iPhone 12 테스트
    if npx playwright test --project="iPhone 12" --reporter=line; then
        print_success "모바일 테스트 통과"
        local mobile_result=0
    else
        print_error "모바일 테스트 실패"
        local mobile_result=1
    fi
    
    # 서버 종료
    kill $SERVER_PID 2>/dev/null || true
    wait $SERVER_PID 2>/dev/null || true
    
    return $mobile_result
}

# 함수: 성능 테스트 (Lighthouse)
run_performance_tests() {
    print_step "성능 테스트 실행 중..."
    
    # Lighthouse CI 설치 확인
    if ! command -v lhci &> /dev/null; then
        print_info "Lighthouse CI 설치 중..."
        npm install -g @lhci/cli@0.12.x
    fi
    
    # 애플리케이션 시작
    npm start &
    SERVER_PID=$!
    
    # 서버 준비 대기
    timeout $TEST_TIMEOUT bash -c "
        while ! curl -f http://localhost:$PORT > /dev/null 2>&1; do
            sleep 2
        done
    " || {
        print_error "서버 시작 시간 초과"
        kill $SERVER_PID 2>/dev/null || true
        return 1
    }
    
    # Lighthouse 실행
    if lhci autorun --config=lighthouse.config.js; then
        print_success "성능 테스트 통과"
        local perf_result=0
    else
        print_warning "성능 테스트에서 일부 기준 미달"
        local perf_result=1
    fi
    
    # 서버 종료
    kill $SERVER_PID 2>/dev/null || true
    wait $SERVER_PID 2>/dev/null || true
    
    return $perf_result
}

# 함수: 테스트 결과 요약
generate_summary() {
    print_step "테스트 결과 요약 생성 중..."
    
    local summary_file="test-summary-$(date +%Y%m%d-%H%M%S).md"
    
    cat > "$summary_file" << EOF
# 🧪 로컬 테스트 실행 결과

**실행 시간**: $(date)
**브랜치**: $(git branch --show-current 2>/dev/null || echo "unknown")
**커밋**: $(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

## 테스트 결과 요약

$([ $UNIT_TEST_RESULT -eq 0 ] && echo "✅ 단위 테스트: 통과" || echo "❌ 단위 테스트: 실패")
$([ $CODE_QUALITY_RESULT -eq 0 ] && echo "✅ 코드 품질: 통과" || echo "❌ 코드 품질: 실패")
$([ $BUILD_RESULT -eq 0 ] && echo "✅ 빌드: 성공" || echo "❌ 빌드: 실패")
$([ $E2E_RESULT -eq 0 ] && echo "✅ E2E 테스트: 통과" || echo "❌ E2E 테스트: 실패")
$([ $MOBILE_RESULT -eq 0 ] && echo "✅ 모바일 테스트: 통과" || echo "❌ 모바일 테스트: 실패")
$([ $PERF_RESULT -eq 0 ] && echo "✅ 성능 테스트: 통과" || echo "⚠️ 성능 테스트: 일부 미달")

## 커버리지 정보

EOF

    if [ -f "coverage/coverage-summary.json" ]; then
        LINES_PCT=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
        FUNCTIONS_PCT=$(cat coverage/coverage-summary.json | jq '.total.functions.pct')
        BRANCHES_PCT=$(cat coverage/coverage-summary.json | jq '.total.branches.pct')
        STATEMENTS_PCT=$(cat coverage/coverage-summary.json | jq '.total.statements.pct')
        
        cat >> "$summary_file" << EOF
- **Lines**: $LINES_PCT%
- **Functions**: $FUNCTIONS_PCT%
- **Branches**: $BRANCHES_PCT%
- **Statements**: $STATEMENTS_PCT%

EOF
    fi
    
    cat >> "$summary_file" << EOF
## 권장사항

$([ $UNIT_TEST_RESULT -ne 0 ] && echo "- 실패한 단위 테스트를 수정하세요")
$([ $CODE_QUALITY_RESULT -ne 0 ] && echo "- 코드 품질 이슈를 해결하세요")
$([ $E2E_RESULT -ne 0 ] && echo "- E2E 테스트 실패 원인을 확인하세요")
$([ $MOBILE_RESULT -ne 0 ] && echo "- 모바일 호환성 문제를 점검하세요")
$([ $PERF_RESULT -ne 0 ] && echo "- 성능 최적화를 검토하세요")

## 생성된 리포트

- 커버리지 리포트: \`coverage/lcov-report/index.html\`
- E2E 테스트 리포트: \`playwright-report/index.html\`
- Lighthouse 리포트: \`.lighthouseci/\`

EOF
    
    print_success "테스트 요약 생성 완료: $summary_file"
    
    # 브라우저에서 커버리지 리포트 열기 (선택사항)
    if [ -f "coverage/lcov-report/index.html" ] && command -v open &> /dev/null; then
        print_info "커버리지 리포트를 브라우저에서 열겠습니까? (y/N)"
        read -t 5 -n 1 open_coverage || open_coverage="n"
        echo
        if [ "$open_coverage" = "y" ] || [ "$open_coverage" = "Y" ]; then
            open coverage/lcov-report/index.html
        fi
    fi
}

# 함수: 정리 작업
cleanup() {
    print_step "정리 작업 중..."
    
    # 백그라운드 프로세스 종료
    jobs -p | xargs -r kill 2>/dev/null || true
    
    # 임시 파일 정리 (선택사항)
    # rm -rf node_modules/.cache 2>/dev/null || true
    
    print_success "정리 작업 완료"
}

# 메인 실행 함수
main() {
    echo -e "${PURPLE}"
    echo "🧪 게임플라자 예약 시스템 - 로컬 테스트 스위트"
    echo "=================================================="
    echo -e "${NC}"
    
    # 시작 시간 기록
    START_TIME=$(date +%s)
    
    # 의존성 체크
    check_dependencies
    
    # 프로젝트 설정
    setup_project
    
    # 포트 체크
    check_port
    
    # 테스트 실행 (각 단계별 결과 저장)
    UNIT_TEST_RESULT=0
    CODE_QUALITY_RESULT=0
    BUILD_RESULT=0
    E2E_RESULT=0
    MOBILE_RESULT=0
    PERF_RESULT=0
    
    # 단위 테스트
    run_unit_tests || UNIT_TEST_RESULT=$?
    
    # 코드 품질 검사
    run_code_quality || CODE_QUALITY_RESULT=$?
    
    # 빌드
    build_application || BUILD_RESULT=$?
    
    # E2E 테스트 (빌드 성공 시에만)
    if [ $BUILD_RESULT -eq 0 ]; then
        run_e2e_tests || E2E_RESULT=$?
        
        # 모바일 테스트 (E2E 성공 시에만)
        if [ $E2E_RESULT -eq 0 ]; then
            run_mobile_tests || MOBILE_RESULT=$?
        fi
        
        # 성능 테스트
        run_performance_tests || PERF_RESULT=$?
    fi
    
    # 종료 시간 계산
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    
    # 결과 요약
    echo -e "${PURPLE}"
    echo "=================================================="
    echo "🏁 테스트 완료 (소요 시간: ${DURATION}초)"
    echo "=================================================="
    echo -e "${NC}"
    
    # 전체 결과 판정
    TOTAL_FAILURES=$((UNIT_TEST_RESULT + CODE_QUALITY_RESULT + BUILD_RESULT + E2E_RESULT + MOBILE_RESULT))
    
    if [ $TOTAL_FAILURES -eq 0 ]; then
        print_success "모든 테스트 통과! 🎉"
        EXIT_CODE=0
    else
        print_error "$TOTAL_FAILURES개 테스트 실패"
        EXIT_CODE=1
    fi
    
    # 테스트 요약 생성
    generate_summary
    
    # 정리 작업
    cleanup
    
    exit $EXIT_CODE
}

# 시그널 핸들러 설정
trap cleanup EXIT INT TERM

# 스크립트 실행
main "$@"