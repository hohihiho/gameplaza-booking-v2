#!/bin/bash

# 색상 정의
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔄 개발 서버 재시작 스크립트${NC}"
echo ""

# 3000번 포트 확인
PORT_USED=$(lsof -ti:3000)

if [ ! -z "$PORT_USED" ]; then
    echo -e "${RED}⚠️  포트 3000이 사용 중입니다. PID: $PORT_USED${NC}"
    echo -e "${YELLOW}🔪 프로세스를 종료합니다...${NC}"
    
    # 프로세스 종료
    kill -9 $PORT_USED 2>/dev/null
    
    # 잠시 대기
    sleep 1
    
    echo -e "${GREEN}✅ 프로세스가 종료되었습니다.${NC}"
else
    echo -e "${GREEN}✅ 포트 3000이 사용 가능합니다.${NC}"
fi

# .next 디렉토리 삭제 옵션 (선택적)
if [ "$1" == "--clean" ]; then
    echo -e "${YELLOW}🧹 .next 디렉토리를 삭제합니다...${NC}"
    rm -rf .next
    echo -e "${GREEN}✅ 캐시가 삭제되었습니다.${NC}"
fi

echo ""
echo -e "${GREEN}🚀 개발 서버를 시작합니다...${NC}"
echo ""

# 개발 서버 실행
npm run dev