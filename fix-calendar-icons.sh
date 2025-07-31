#!/bin/bash

echo "🔧 Calendar 아이콘을 CalendarDays로 일괄 변경합니다..."

# 1. import 구문에서 Calendar를 CalendarDays로 변경 (이미 CalendarDays가 있는 경우 Calendar만 제거)
find app -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" | while read file; do
  if grep -q "Calendar.*from.*lucide-react" "$file"; then
    echo "📝 Fixing imports in: $file"
    
    # CalendarDays가 이미 있는지 확인
    if grep -q "CalendarDays.*from.*lucide-react" "$file"; then
      # CalendarDays가 있으면 Calendar만 제거
      sed -i '' 's/, Calendar\(.*from.*lucide-react\)/\1/g' "$file"
      sed -i '' 's/Calendar, \(.*from.*lucide-react\)/\1/g' "$file"
    else
      # CalendarDays가 없으면 Calendar를 CalendarDays로 변경
      sed -i '' 's/Calendar\(.*from.*lucide-react\)/CalendarDays\1/g' "$file"
    fi
  fi
done

# 2. JSX에서 <Calendar를 <CalendarDays로 변경
find app -name "*.tsx" -o -name "*.jsx" | while read file; do
  if grep -q "<Calendar " "$file"; then
    echo "📝 Fixing JSX in: $file"
    sed -i '' 's/<Calendar /<CalendarDays /g' "$file"
  fi
done

# 3. icon: Calendar를 icon: CalendarDays로 변경
find app -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" | while read file; do
  if grep -q "icon: Calendar" "$file"; then
    echo "📝 Fixing icon props in: $file"
    sed -i '' 's/icon: Calendar/icon: CalendarDays/g' "$file"
  fi
done

echo "✅ Calendar 아이콘 수정 완료!"
echo "🔄 개발 서버를 재시작하세요."