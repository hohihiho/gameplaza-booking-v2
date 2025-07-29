#!/bin/bash

# E2E 테스트를 Rate Limiting 문제 없이 안전하게 실행하는 스크립트

set -e

echo "🧪 E2E 테스트 안전 실행 시작..."

# 테스트 환경변수 파일 로드
if [ -f ".env.test" ]; then
    echo "📄 테스트 환경변수 로드 중..."
    set -a # automatically export all variables
    source .env.test
    set +a
else
    echo "⚠️ .env.test 파일이 없습니다. 기본 환경변수 설정..."
    export NODE_ENV=test
    export NEXT_PUBLIC_TEST_MODE=true
    # 최소 필수 환경변수 설정
    export NEXTAUTH_SECRET=test-secret-key-for-testing-32chars
    export GOOGLE_CLIENT_ID=test-google-client-id
    export GOOGLE_CLIENT_SECRET=test-google-client-secret
    export NEXT_PUBLIC_SUPABASE_URL=https://test.supabase.co
    export NEXT_PUBLIC_SUPABASE_ANON_KEY=test-anon-key
    export SUPABASE_SERVICE_ROLE_KEY=test-service-role-key
    export JWT_ACCESS_SECRET=test-jwt-access-secret-key-32chars
    export JWT_REFRESH_SECRET=test-jwt-refresh-secret-key-32chars
fi

# 기존 프로세스 정리
echo "📋 기존 프로세스 정리..."
pkill -f "next dev" || true
pkill -f ":3000" || true

# 포트 3000 강제 해제
echo "🔌 포트 3000 정리..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# 잠시 대기
sleep 2

# 테스트 실행 (간단한 테스트만)
echo "🚀 Playwright E2E 테스트 실행 (간단한 테스트만)..."
npx playwright test tests/e2e/specs/simple-test.spec.ts --config=playwright.config.ts --reporter=html

# 결과 확인
if [ $? -eq 0 ]; then
    echo "✅ E2E 테스트 성공!"
    echo "📊 테스트 리포트: playwright-report/index.html"
else
    echo "❌ E2E 테스트 실패!"
    echo "📊 실패 리포트: playwright-report/index.html"
    echo "💡 전체 테스트를 실행하려면: npm run test:e2e"
    exit 1
fi