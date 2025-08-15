#!/bin/bash

# 새 Vercel 통합 DB 초기 설정 스크립트
echo "🚀 Vercel 통합 DB 초기 설정 시작"
echo "================================================"

# DB URL 설정
PROD_DB_URL="postgres://postgres.nymgkiatkfoziluqiijw:UlAdCpnZHRK1ymOk@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 에러 카운터
ERROR_COUNT=0

# 마이그레이션 파일 실행 함수
run_migration() {
    local file=$1
    local name=$(basename $file)
    
    echo -e "${YELLOW}📝 실행 중: $name${NC}"
    
    if psql "$PROD_DB_URL" -f "$file" > /tmp/migration_log_$$.txt 2>&1; then
        echo -e "${GREEN}✅ 성공: $name${NC}"
    else
        echo -e "${RED}❌ 실패: $name${NC}"
        echo "에러 내용:"
        cat /tmp/migration_log_$$.txt | grep -E "ERROR|FATAL" | head -5
        ((ERROR_COUNT++))
    fi
    
    rm -f /tmp/migration_log_$$.txt
    echo ""
}

# 1. 스키마 생성
echo "📦 1단계: 기본 스키마 생성"
echo "--------------------------------"
run_migration "supabase/migrations/001_create_schema.sql"
run_migration "supabase/migrations/002_improved_schema.sql"

# 2. 기기 관리 테이블
echo "📦 2단계: 기기 관리 시스템"
echo "--------------------------------"
run_migration "supabase/migrations/002_device_management.sql"
run_migration "supabase/migrations/003_device_seed_data.sql"

# 3. 대여 시스템
echo "📦 3단계: 대여 시스템 설정"
echo "--------------------------------"
run_migration "supabase/migrations/004_update_rental_time_slots.sql"
run_migration "supabase/migrations/005_add_max_rental_units.sql"
run_migration "supabase/migrations/006_update_device_status_enum.sql"
run_migration "supabase/migrations/007_create_rental_time_slots.sql"
run_migration "supabase/migrations/008_add_rental_settings_to_device_types.sql"
run_migration "supabase/migrations/010_update_device_status_rental.sql"

# 4. 추가 기능
echo "📦 4단계: 추가 기능"
echo "--------------------------------"
run_migration "supabase/migrations/009_create_guide_content.sql"
run_migration "supabase/migrations/011_add_actual_time_fields.sql"

# 5. 스케줄 및 규칙
echo "📦 5단계: 스케줄 및 규칙 시스템"
echo "--------------------------------"
run_migration "supabase/migrations/20240103_create_schedule_events.sql"
run_migration "supabase/migrations/20240107_add_auto_schedule_fields.sql"
run_migration "supabase/migrations/20250102_create_machine_rules.sql"
run_migration "supabase/migrations/20250102_create_reservation_rules.sql"
run_migration "supabase/migrations/20250112_create_holidays_table.sql"

# 6. 결과 요약
echo "================================================"
if [ $ERROR_COUNT -eq 0 ]; then
    echo -e "${GREEN}🎉 모든 마이그레이션 성공!${NC}"
else
    echo -e "${YELLOW}⚠️  일부 마이그레이션 실패 (실패: $ERROR_COUNT개)${NC}"
    echo "이미 존재하는 테이블 오류는 무시해도 됩니다."
fi

echo ""
echo "📋 다음 단계:"
echo "1. Supabase 대시보드에서 테이블 확인"
echo "2. RLS 정책 설정"
echo "3. 초기 데이터 입력 (운영시간, 기기 정보 등)"
echo "4. 관리자 계정 생성"