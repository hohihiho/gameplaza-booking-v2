#!/bin/bash

# 게임플라자 빠른 수정 스크립트
# 자주 발생하는 문제들을 원클릭으로 해결

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 로그 함수들
log() { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }
info() { echo -e "${BLUE}[STEP]${NC} $1"; }

# 진행 표시
show_progress() {
    echo -n "$1"
    for i in {1..3}; do
        sleep 0.5
        echo -n "."
    done
    echo " 완료!"
}

# 포트 3000 정리
fix_port_conflict() {
    info "🔧 포트 3000 충돌 해결 중"
    
    PIDS=$(lsof -ti:3000 2>/dev/null)
    if [ ! -z "$PIDS" ]; then
        warn "3000번 포트를 사용하는 프로세스 발견: $PIDS"
        echo $PIDS | xargs kill -9 2>/dev/null
        show_progress "포트 정리"
        log "✅ 포트 3000 해제 완료"
    else
        log "✅ 포트 3000이 이미 깨끗합니다"
    fi
}

# node_modules 재설치
reinstall_dependencies() {
    info "📦 의존성 재설치 중"
    
    if [ -d "node_modules" ]; then
        warn "기존 node_modules 삭제 중..."
        rm -rf node_modules
    fi
    
    if [ -f "package-lock.json" ]; then
        warn "package-lock.json 삭제 중..."
        rm package-lock.json
    fi
    
    show_progress "npm install 실행"
    npm install
    log "✅ 의존성 재설치 완료"
}

# Next.js 캐시 정리
clear_nextjs_cache() {
    info "🧹 Next.js 캐시 정리 중"
    
    if [ -d ".next" ]; then
        rm -rf .next
        show_progress "Next.js 캐시 정리"
        log "✅ Next.js 캐시 정리 완료"
    else
        log "✅ Next.js 캐시가 이미 깨끗합니다"
    fi
}

# TypeScript 캐시 정리
clear_typescript_cache() {
    info "🔄 TypeScript 캐시 정리 중"
    
    if [ -f "tsconfig.tsbuildinfo" ]; then
        rm tsconfig.tsbuildinfo
        show_progress "TypeScript 캐시 정리"
        log "✅ TypeScript 캐시 정리 완료"
    else
        log "✅ TypeScript 캐시가 이미 깨끗합니다"
    fi
}

# ESLint 자동 수정
fix_eslint_errors() {
    info "🔍 ESLint 자동 수정 실행 중"
    
    if command -v npx &> /dev/null; then
        show_progress "ESLint 자동 수정"
        npx eslint --fix . --ext .js,.jsx,.ts,.tsx 2>/dev/null || true
        log "✅ ESLint 자동 수정 완료"
    else
        warn "npx를 찾을 수 없습니다. ESLint 수정을 건너뜁니다."
    fi
}

# Prettier 포맷팅
format_code() {
    info "💄 Prettier 코드 포맷팅 중"
    
    if command -v npx &> /dev/null; then
        show_progress "코드 포맷팅"
        npx prettier --write . 2>/dev/null || true
        log "✅ 코드 포맷팅 완료"
    else
        warn "npx를 찾을 수 없습니다. 포맷팅을 건너뜁니다."
    fi
}

# Git 상태 정리
cleanup_git() {
    info "📋 Git 상태 확인 및 정리"
    
    # Git 저장소인지 확인
    if [ ! -d ".git" ]; then
        warn "Git 저장소가 아닙니다. Git 정리를 건너뜁니다."
        return
    fi
    
    # 스테이징되지 않은 변경사항 확인
    if [[ $(git status --porcelain) ]]; then
        warn "변경사항이 있습니다:"
        git status --short
        
        read -p "변경사항을 stash 하시겠습니까? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git stash push -m "auto-stash-$(date +%Y%m%d-%H%M%S)"
            log "✅ 변경사항을 stash에 저장했습니다"
        fi
    else
        log "✅ Git 상태가 깨끗합니다"
    fi
}

# 환경 변수 확인
check_env_vars() {
    info "🔐 환경 변수 확인 중"
    
    ENV_FILE=".env.local"
    REQUIRED_VARS=(
        "NEXT_PUBLIC_SUPABASE_URL"
        "NEXT_PUBLIC_SUPABASE_ANON_KEY"
        "SUPABASE_SERVICE_ROLE_KEY"
    )
    
    if [ ! -f "$ENV_FILE" ]; then
        error "❌ $ENV_FILE 파일을 찾을 수 없습니다"
        warn "🔧 .env.example을 복사하여 $ENV_FILE을 생성하세요"
        return 1
    fi
    
    MISSING_VARS=()
    for var in "${REQUIRED_VARS[@]}"; do
        if ! grep -q "^$var=" "$ENV_FILE" || grep -q "^$var=\s*$" "$ENV_FILE"; then
            MISSING_VARS+=("$var")
        fi
    done
    
    if [ ${#MISSING_VARS[@]} -eq 0 ]; then
        log "✅ 모든 필수 환경 변수가 설정되어 있습니다"
    else
        error "❌ 다음 환경 변수가 누락되었습니다:"
        printf '   - %s\n' "${MISSING_VARS[@]}"
    fi
}

# 디스크 공간 확인
check_disk_space() {
    info "💾 디스크 공간 확인 중"
    
    AVAILABLE=$(df . | tail -1 | awk '{print $4}')
    AVAILABLE_GB=$((AVAILABLE / 1024 / 1024))
    
    if [ $AVAILABLE_GB -lt 1 ]; then
        error "❌ 디스크 공간이 부족합니다 (${AVAILABLE_GB}GB 남음)"
        warn "🔧 불필요한 파일을 정리하세요"
    else
        log "✅ 디스크 공간이 충분합니다 (${AVAILABLE_GB}GB 사용 가능)"
    fi
}

# 전체 수정 실행
run_full_fix() {
    echo -e "${BLUE}"
    echo "================================================================"
    echo "🚀 게임플라자 자동 수정 스크립트"
    echo "================================================================"
    echo -e "${NC}"
    
    fix_port_conflict
    clear_nextjs_cache
    clear_typescript_cache
    fix_eslint_errors
    format_code
    check_env_vars
    check_disk_space
    cleanup_git
    
    echo -e "${GREEN}"
    echo "================================================================"
    echo "✅ 자동 수정 완료!"
    echo "================================================================"
    echo -e "${NC}"
    
    log "이제 개발 서버를 시작해보세요: npm run dev"
}

# 메뉴 표시
show_menu() {
    echo -e "${BLUE}"
    echo "게임플라자 빠른 수정 도구"
    echo "=========================="
    echo -e "${NC}"
    echo "1) 🔧 포트 3000 충돌 해결"
    echo "2) 📦 의존성 재설치"
    echo "3) 🧹 Next.js 캐시 정리"
    echo "4) 🔄 TypeScript 캐시 정리"
    echo "5) 🔍 ESLint 자동 수정"
    echo "6) 💄 Prettier 코드 포맷팅"
    echo "7) 📋 Git 상태 정리"
    echo "8) 🔐 환경 변수 확인"
    echo "9) 💾 디스크 공간 확인"
    echo "0) 🚀 전체 수정 실행"
    echo "q) 종료"
    echo
}

# 메인 실행 부분
if [ $# -eq 0 ]; then
    # 인터랙티브 모드
    while true; do
        show_menu
        read -p "선택하세요 (0-9, q): " choice
        echo
        
        case $choice in
            1) fix_port_conflict ;;
            2) reinstall_dependencies ;;
            3) clear_nextjs_cache ;;
            4) clear_typescript_cache ;;
            5) fix_eslint_errors ;;
            6) format_code ;;
            7) cleanup_git ;;
            8) check_env_vars ;;
            9) check_disk_space ;;
            0) run_full_fix; break ;;
            q|Q) echo "👋 종료합니다"; exit 0 ;;
            *) error "잘못된 선택입니다" ;;
        esac
        
        echo
        read -p "계속하려면 Enter를 누르세요..."
        clear
    done
else
    # 명령어 모드
    case $1 in
        "port") fix_port_conflict ;;
        "deps") reinstall_dependencies ;;
        "cache") clear_nextjs_cache ;;
        "ts") clear_typescript_cache ;;
        "lint") fix_eslint_errors ;;
        "format") format_code ;;
        "git") cleanup_git ;;
        "env") check_env_vars ;;
        "disk") check_disk_space ;;
        "all") run_full_fix ;;
        *) 
            echo "사용법: $0 [port|deps|cache|ts|lint|format|git|env|disk|all]"
            echo "또는 인수 없이 실행하면 인터랙티브 메뉴가 표시됩니다."
            ;;
    esac
fi