#!/bin/bash

# Supabase import를 DB import로 일괄 변경하는 스크립트

echo "🔧 Supabase import를 DB import로 변경 시작..."

# createAdminClient imports 변경
find . -type f -name "*.ts" -not -path "./node_modules/*" -not -path "./.next/*" | while read file; do
  if grep -q "@/lib/supabase/admin" "$file"; then
    echo "수정중: $file"
    sed -i '' "s|from '@/lib/supabase/admin'|from '@/lib/db'|g" "$file"
    sed -i '' "s|from \"@/lib/supabase/admin\"|from \"@/lib/db\"|g" "$file"
  fi
done

# createClient imports 변경
find . -type f -name "*.ts" -not -path "./node_modules/*" -not -path "./.next/*" | while read file; do
  if grep -q "@/lib/supabase/client" "$file"; then
    echo "수정중: $file"
    sed -i '' "s|from '@/lib/supabase/client'|from '@/lib/db'|g" "$file"
    sed -i '' "s|from \"@/lib/supabase/client\"|from \"@/lib/db\"|g" "$file"
  fi
done

# server imports 변경
find . -type f -name "*.ts" -not -path "./node_modules/*" -not -path "./.next/*" | while read file; do
  if grep -q "@/lib/supabase/server" "$file"; then
    echo "수정중: $file"
    sed -i '' "s|from '@/lib/supabase/server'|from '@/lib/db'|g" "$file"
    sed -i '' "s|from \"@/lib/supabase/server\"|from \"@/lib/db\"|g" "$file"
  fi
done

echo "✅ Supabase import 변경 완료!"
echo "총 변경된 파일 수:"
grep -r "@/lib/supabase" --include="*.ts" . 2>/dev/null | wc -l