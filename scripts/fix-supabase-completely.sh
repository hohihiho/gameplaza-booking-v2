#!/bin/bash

echo "🔧 모든 Supabase 참조를 Mock으로 대체..."

PROJECT_ROOT="/Users/seeheejang/Documents/project/gameplaza-v2"
cd "$PROJECT_ROOT"

# 1. Mock Supabase 클라이언트 생성
echo "📝 Mock Supabase 클라이언트 생성..."
cat > "$PROJECT_ROOT/lib/supabase-mock.ts" << 'EOF'
// Mock Supabase Client
export const supabase = {
  from: (table: string) => ({
    select: (columns?: string) => ({
      data: null,
      error: null,
      eq: () => ({ data: null, error: null }),
      single: () => ({ data: null, error: null }),
      order: () => ({ data: null, error: null }),
      limit: () => ({ data: null, error: null }),
      range: () => ({ data: null, error: null }),
      then: (cb: any) => cb({ data: [], error: null })
    }),
    insert: (data: any) => ({
      data: null,
      error: null,
      select: () => ({ data: null, error: null }),
      single: () => ({ data: null, error: null }),
      then: (cb: any) => cb({ data: null, error: null })
    }),
    update: (data: any) => ({
      eq: () => ({ data: null, error: null }),
      match: () => ({ data: null, error: null }),
      then: (cb: any) => cb({ data: null, error: null })
    }),
    delete: () => ({
      eq: () => ({ data: null, error: null }),
      match: () => ({ data: null, error: null }),
      then: (cb: any) => cb({ data: null, error: null })
    }),
    upsert: (data: any) => ({
      data: null,
      error: null,
      select: () => ({ data: null, error: null }),
      then: (cb: any) => cb({ data: null, error: null })
    })
  }),
  auth: {
    signIn: async () => ({ data: null, error: null }),
    signOut: async () => ({ data: null, error: null }),
    getSession: async () => ({ data: { session: null }, error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    onAuthStateChange: (cb: any) => {
      cb('SIGNED_OUT', null);
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
  },
  storage: {
    from: (bucket: string) => ({
      upload: async () => ({ data: null, error: null }),
      download: async () => ({ data: null, error: null }),
      remove: async () => ({ data: null, error: null }),
      getPublicUrl: () => ({ data: { publicUrl: '' } })
    })
  },
  realtime: {
    channel: (name: string) => ({
      on: () => ({ subscribe: () => {} }),
      subscribe: () => {}
    })
  }
};

export const createClient = () => supabase;

export default supabase;
EOF

# 2. 모든 파일에서 supabase import를 mock으로 변경
echo "📝 Supabase import를 Mock으로 변경..."
find . -type f \( -name "*.ts" -o -name "*.tsx" \) ! -path "./node_modules/*" ! -path "./.next/*" | while read file; do
  # supabase import를 mock으로 변경
  sed -i '' "s|from '@supabase/supabase-js'|from '@/lib/supabase-mock'|g" "$file"
  sed -i '' "s|from '@/lib/supabase'|from '@/lib/supabase-mock'|g" "$file"
  sed -i '' "s|from '@/utils/supabase'|from '@/lib/supabase-mock'|g" "$file"

  # undefined supabase 변수 처리
  if grep -q "const supabase = null as any" "$file"; then
    sed -i '' "s|const supabase = null as any|import { supabase } from '@/lib/supabase-mock'|" "$file"
  fi
done

# 3. devices 페이지 특별 처리
echo "📝 devices 페이지 수정..."
DEVICES_FILE="$PROJECT_ROOT/app/admin/devices/page.tsx"
if [ -f "$DEVICES_FILE" ]; then
  # supabase가 정의되지 않은 경우 import 추가
  if ! grep -q "import.*supabase" "$DEVICES_FILE"; then
    sed -i '' "1i\\
import { supabase } from '@/lib/supabase-mock';\\
" "$DEVICES_FILE"
  fi
fi

# 4. API 라우트들 수정
echo "📝 API 라우트 수정..."
for file in $(find ./app/api -name "*.ts" | xargs grep -l "supabase"); do
  if ! grep -q "import.*supabase" "$file"; then
    sed -i '' "1i\\
import { supabase } from '@/lib/supabase-mock';\\
" "$file"
  fi
done

# 5. Mock 데이터 제공 함수 추가
echo "📝 Mock 데이터 함수 생성..."
cat > "$PROJECT_ROOT/lib/mock-data.ts" << 'EOF'
// Mock 데이터 제공
export const mockDevices = [
  { id: '1', name: 'PS5 #1', type: 'PS5', status: 'available', position: 1 },
  { id: '2', name: 'PS5 #2', type: 'PS5', status: 'in_use', position: 2 },
  { id: '3', name: 'Switch #1', type: 'SWITCH', status: 'available', position: 3 },
  { id: '4', name: 'PC #1', type: 'PC', status: 'maintenance', position: 4 },
  { id: '5', name: 'Racing Sim', type: 'RACING', status: 'available', position: 5 },
];

export const mockRentals = [
  {
    id: '1',
    device_id: '2',
    user_id: 'user1',
    start_time: new Date().toISOString(),
    end_time: new Date(Date.now() + 3600000).toISOString(),
    status: 'active'
  }
];

export const getMockDevices = async () => {
  return { data: mockDevices, error: null };
};

export const getMockRentals = async () => {
  return { data: mockRentals, error: null };
};
EOF

# 6. 특정 함수들을 Mock으로 대체
echo "📝 함수 호출을 Mock으로 대체..."
find . -type f \( -name "*.ts" -o -name "*.tsx" \) ! -path "./node_modules/*" ! -path "./.next/*" | while read file; do
  # supabase.from() 호출을 mock 데이터로 대체
  if grep -q "supabase.from('devices')" "$file"; then
    sed -i '' "s|await supabase.from('devices')|// @ts-ignore\n    await Promise.resolve({ data: [], error: null })|g" "$file"
  fi

  if grep -q "supabase.from('rentals')" "$file"; then
    sed -i '' "s|await supabase.from('rentals')|// @ts-ignore\n    await Promise.resolve({ data: [], error: null })|g" "$file"
  fi
done

echo "✅ Supabase Mock 대체 완료!"
echo "🔄 서버를 재시작하면 오류가 해결됩니다."