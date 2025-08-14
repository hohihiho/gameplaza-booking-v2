#!/bin/bash

# 색상 코드
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 3000번 포트가 사용 중인지 확인
PORT_IN_USE=$(lsof -ti:3000)

if [ ! -z "$PORT_IN_USE" ]; then
  echo -e "${YELLOW}⚠️  포트 3000이 이미 사용 중입니다. 종료합니다...${NC}"
  kill -9 $PORT_IN_USE
  sleep 1
fi

echo -e "${BLUE}🚀 개발 서버를 시작합니다...${NC}"

# Next.js 개발 서버 시작 (백그라운드) - 3000번 포트 강제 지정
PORT=3000 next dev -H 0.0.0.0 &
DEV_PID=$!

# 서버가 시작될 때까지 대기
echo -e "${YELLOW}⏳ 서버가 준비될 때까지 기다리는 중...${NC}"

# 서버가 준비될 때까지 최대 30초 대기
for i in {1..30}; do
  if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 서버가 준비되었습니다!${NC}"
    
    # 운영체제 확인 후 브라우저 열기
    if [[ "$OSTYPE" == "darwin"* ]]; then
      # macOS
      echo -e "${BLUE}🌐 브라우저를 엽니다...${NC}"
      open http://localhost:3000
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
      # Linux
      echo -e "${BLUE}🌐 브라우저를 엽니다...${NC}"
      xdg-open http://localhost:3000 2>/dev/null || echo "브라우저를 자동으로 열 수 없습니다. http://localhost:3000 으로 접속하세요."
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "win32" ]]; then
      # Windows
      echo -e "${BLUE}🌐 브라우저를 엽니다...${NC}"
      start http://localhost:3000
    else
      echo -e "${YELLOW}⚠️  브라우저를 자동으로 열 수 없습니다. http://localhost:3000 으로 접속하세요.${NC}"
    fi
    
    break
  fi
  
  sleep 1
done

echo -e "${GREEN}✨ 개발 서버가 실행 중입니다!${NC}"
echo -e "${YELLOW}종료하려면 Ctrl+C를 누르세요.${NC}"

# 개발 서버 프로세스 대기
wait $DEV_PID