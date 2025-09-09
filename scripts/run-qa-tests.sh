#!/bin/bash

# 🧪 게임플라자 QA 자동화 테스트 실행 스크립트
# 사용법: ./run-qa-tests.sh [mode]
# 모드: full, critical, mobile, time-based

echo "🎮 게임플라자 QA 자동화 테스트 시작"
echo "=================================="

# 개발 서버 확인
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "⚠️  개발 서버가 실행되지 않음. 서버를 시작합니다..."
    npm run dev &
    sleep 10
fi

# 테스트 데이터 생성
echo "📊 테스트 데이터 생성 중..."
npm run generate-test-data

MODE=${1:-"critical"}

case $MODE in
    "full")
        echo "🚀 전체 테스트 실행..."
        npm run test:e2e
        ;;
    "critical") 
        echo "🔴 Critical 테스트만 실행..."
        npm run test:e2e -- --grep "Critical"
        ;;
    "mobile")
        echo "📱 모바일 테스트 실행..."
        npm run test:e2e:mobile
        ;;
    "time-based")
        echo "⏰ 시간 기반 테스트 실행..."
        npm run test:e2e -- --grep "시간|Time|KST"
        ;;
    *)
        echo "❌ 잘못된 모드: $MODE"
        echo "사용 가능한 모드: full, critical, mobile, time-based"
        exit 1
        ;;
esac

echo "✅ 테스트 완료!"
echo "📊 결과 확인: http://localhost:3000/test-results"