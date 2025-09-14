#!/bin/bash

# 남은 동적 import 문제 수정 스크립트

echo "🔧 남은 동적 import 문제 수정 시작..."

# 각 파일 개별 수정
files=(
  "app/api/admin/users/[id]/route.ts"
  "app/api/admin/users/route.ts"
  "app/api/moderation/check/route.ts"
  "app/api/v2/test/max-rental/route.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "수정 중: $file"

    # 파일 상단에 import가 이미 있는지 확인
    if ! grep -q "^import { getDB, supabase } from '@/lib/db'" "$file"; then
      # NextRequest import 뒤에 추가
      sed -i '' '/^import.*NextRequest/a\
import { getDB, supabase } from '\''@/lib/db'\''
' "$file"
    fi

    # 함수 내부의 동적 import 제거
    sed -i '' '/^[[:space:]]*import { getDB, supabase } from '\''@\/lib\/db'\'';$/d' "$file"

    echo "✅ 수정 완료: $file"
  else
    echo "파일을 찾을 수 없음: $file"
  fi
done

echo "🎉 남은 동적 import 수정 완료!"