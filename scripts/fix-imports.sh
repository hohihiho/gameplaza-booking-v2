#!/bin/bash

echo "🔧 Import 오류 수정 시작..."

# @/auth를 @/lib/auth로 변경
echo "1. @/auth import 수정..."
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -not -path "./node_modules/*" -not -path "./.git/*" | while read file; do
  if grep -q "from '@/auth'" "$file"; then
    sed -i '' "s|from '@/auth'|from '@/lib/auth'|g" "$file"
    echo "   ✅ $file"
  fi
done

# @/lib/supabase/client를 @/lib/db로 변경
echo "2. @/lib/supabase/client import 수정..."
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -not -path "./node_modules/*" -not -path "./.git/*" | while read file; do
  if grep -q "from '@/lib/supabase/client'" "$file"; then
    sed -i '' "s|from '@/lib/supabase/client'|from '@/lib/db'|g" "$file"
    echo "   ✅ $file"
  fi
done

# next-auth/react 제거 또는 Better Auth로 변경
echo "3. next-auth/react import 제거..."
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -not -path "./node_modules/*" -not -path "./.git/*" | while read file; do
  if grep -q "from 'next-auth/react'" "$file"; then
    # 일단 주석 처리
    sed -i '' "s|import.*from 'next-auth/react'|// import removed - using Better Auth|g" "$file"
    echo "   ✅ $file"
  fi
done

echo "✨ Import 오류 수정 완료!"