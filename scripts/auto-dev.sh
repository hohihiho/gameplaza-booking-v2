#!/bin/bash

# 게임플라자 개발 서버 자동 관리 스크립트
# 3000번 포트 충돌 해결 및 자동 재시작

PORT=3000
MAX_RESTARTS=5
RESTART_COUNT=0

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 로그 함수
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR $(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN $(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

# 포트 정리 함수
cleanup_port() {
    log "3000번 포트 정리 중..."
    
    # 3000번 포트를 사용하는 프로세스 찾기
    PIDS=$(lsof -ti:$PORT 2>/dev/null)
    
    if [ ! -z "$PIDS" ]; then
        warn "3000번 포트를 사용하는 프로세스 발견: $PIDS"
        echo $PIDS | xargs kill -9 2>/dev/null
        sleep 2
        log "포트 정리 완료"
    else
        log "3000번 포트가 깨끗합니다"
    fi
}

# 개발 서버 시작 함수
start_dev_server() {
    log "개발 서버 시작 중... (시도 $((RESTART_COUNT + 1))/$MAX_RESTARTS)"
    
    # 포트 정리
    cleanup_port
    
    # npm run dev 실행
    npm run dev &
    DEV_PID=$!
    
    # 서버가 제대로 시작됐는지 확인 (10초 대기)
    sleep 10
    
    if kill -0 $DEV_PID 2>/dev/null; then
        log "개발 서버가 성공적으로 시작되었습니다 (PID: $DEV_PID)"
        return 0
    else
        error "개발 서버 시작 실패"
        return 1
    fi
}

# 메인 루프
main() {
    log "게임플라자 자동 개발 서버 시작"
    
    while [ $RESTART_COUNT -lt $MAX_RESTARTS ]; do
        if start_dev_server; then
            # 서버가 정상적으로 시작된 경우, 프로세스 모니터링
            while kill -0 $DEV_PID 2>/dev/null; do
                sleep 5
            done
            
            warn "개발 서버가 중단되었습니다. 재시작합니다..."
            RESTART_COUNT=$((RESTART_COUNT + 1))
        else
            error "개발 서버 시작 실패. 재시도합니다..."
            RESTART_COUNT=$((RESTART_COUNT + 1))
            sleep 3
        fi
    done
    
    error "최대 재시작 횟수($MAX_RESTARTS)에 도달했습니다. 스크립트를 종료합니다."
    exit 1
}

# Ctrl+C 시그널 처리
trap 'log "스크립트 종료 중..."; cleanup_port; exit 0' INT

# 스크립트 실행
main