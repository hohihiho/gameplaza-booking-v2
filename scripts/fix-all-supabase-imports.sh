#!/bin/bash

# 모든 Supabase import를 DB import로 일괄 변경하는 스크립트

echo "🔧 모든 Supabase import를 DB import로 변경 시작..."

# 변경 카운터
count=0

# 모든 TypeScript 파일 처리
find . -type f -name "*.ts" -o -name "*.tsx" -not -path "./node_modules/*" -not -path "./.next/*" | while read file; do
  changed=false

  # @/lib/supabase/admin -> @/lib/db
  if grep -q "@/lib/supabase/admin" "$file"; then
    sed -i '' "s|from '@/lib/supabase/admin'|from '@/lib/db'|g" "$file"
    sed -i '' "s|from \"@/lib/supabase/admin\"|from \"@/lib/db\"|g" "$file"
    changed=true
  fi

  # @/lib/supabase/client -> @/lib/db
  if grep -q "@/lib/supabase/client" "$file"; then
    sed -i '' "s|from '@/lib/supabase/client'|from '@/lib/db'|g" "$file"
    sed -i '' "s|from \"@/lib/supabase/client\"|from \"@/lib/db\"|g" "$file"
    changed=true
  fi

  # @/lib/supabase/server -> @/lib/db
  if grep -q "@/lib/supabase/server" "$file"; then
    sed -i '' "s|from '@/lib/supabase/server'|from '@/lib/db'|g" "$file"
    sed -i '' "s|from \"@/lib/supabase/server\"|from \"@/lib/db\"|g" "$file"
    changed=true
  fi

  # @/lib/supabase/service-role -> @/lib/db
  if grep -q "@/lib/supabase/service-role" "$file"; then
    sed -i '' "s|from '@/lib/supabase/service-role'|from '@/lib/db'|g" "$file"
    sed -i '' "s|from \"@/lib/supabase/service-role\"|from \"@/lib/db\"|g" "$file"
    sed -i '' "s|createServiceRoleClient|createAdminClient|g" "$file"
    changed=true
  fi

  # @/lib/supabase (general) -> @/lib/db
  if grep -q "@/lib/supabase'" "$file"; then
    sed -i '' "s|from '@/lib/supabase'|from '@/lib/db'|g" "$file"
    changed=true
  fi

  if grep -q "@/lib/supabase\"" "$file"; then
    sed -i '' "s|from \"@/lib/supabase\"|from \"@/lib/db\"|g" "$file"
    changed=true
  fi

  if [ "$changed" = true ]; then
    echo "✓ 수정됨: $file"
    ((count++))
  fi
done

echo "✅ Supabase import 변경 완료!"
echo "총 수정된 파일 수: $count"

# 남은 참조 확인
remaining=$(grep -r "@/lib/supabase" --include="*.ts" --include="*.tsx" . 2>/dev/null | grep -v node_modules | grep -v .next | wc -l)
echo "남은 참조 수: $remaining"

if [ "$remaining" -gt 0 ]; then
  echo "⚠️  아직 변경되지 않은 참조가 있습니다:"
  grep -r "@/lib/supabase" --include="*.ts" --include="*.tsx" . 2>/dev/null | grep -v node_modules | grep -v .next | head -10
fi