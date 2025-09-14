#!/bin/bash

# 동적 import 문제 수정 스크립트

echo "🔧 동적 import 문제 수정 시작..."

# 함수 내부에 있는 동적 import를 찾아서 수정
find app/api -name "*.ts" -type f | while read file; do
  # 함수 내부의 동적 import가 있는지 확인
  if grep -q "    import { getDB, supabase } from '@/lib/db';" "$file"; then
    echo "수정 중: $file"

    # 파일 상단에 import가 이미 있는지 확인
    if ! grep -q "^import { getDB, supabase } from '@/lib/db'" "$file"; then
      # 상단에 import 추가
      sed -i '' '1s/^/import { getDB, supabase } from '\''@\/lib\/db'\''\n/' "$file"
    fi

    # 함수 내부의 동적 import 제거
    sed -i '' '/^[[:space:]]*import { getDB, supabase } from '\''@\/lib\/db'\'';$/d' "$file"

    echo "✅ 수정 완료: $file"
  fi
done

echo "🎉 모든 동적 import 수정 완료!"