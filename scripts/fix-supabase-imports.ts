#!/usr/bin/env node

/**
 * Supabase import 경로 수정 스크립트
 * 모든 파일에서 Supabase 관련 import를 통일된 경로로 변경합니다.
 */

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';
import * as path from 'path';

// 변경할 import 패턴들
const importPatterns = [
  // app/lib/supabase 제거
  {
    from: /import\s*{\s*supabase\s*,?\s*supabaseAdmin\s*}\s*from\s*['"]@\/app\/lib\/supabase['"]/g,
    to: "import { createClient, createAdminClient } from '@/lib/supabase'"
  },
  {
    from: /import\s*{\s*supabase\s*}\s*from\s*['"]@\/app\/lib\/supabase['"]/g,
    to: "import { createClient } from '@/lib/supabase'"
  },
  {
    from: /import\s*{\s*supabaseAdmin\s*}\s*from\s*['"]@\/app\/lib\/supabase['"]/g,
    to: "import { createAdminClient } from '@/lib/supabase'"
  },
  // lib/supabase.ts 제거
  {
    from: /import\s*{\s*createClient\s*}\s*from\s*['"]@\/lib\/supabase['"]/g,
    to: "import { createClient } from '@/lib/supabase'"
  },
  // 개별 파일 import를 통합 import로 변경
  {
    from: /import\s*{\s*createClient\s*}\s*from\s*['"]@\/lib\/supabase\/server['"]/g,
    to: "import { createServerClient as createClient } from '@/lib/supabase'"
  },
  {
    from: /import\s*{\s*createAdminClient\s*}\s*from\s*['"]@\/lib\/supabase\/admin['"]/g,
    to: "import { createAdminClient } from '@/lib/supabase'"
  },
  {
    from: /import\s*{\s*createServiceRoleClient\s*}\s*from\s*['"]@\/lib\/supabase\/service-role['"]/g,
    to: "import { createAdminClient } from '@/lib/supabase'"
  },
  // 상대 경로 수정
  {
    from: /import\s*{\s*createClient\s*}\s*from\s*['"]\.\.\/supabase['"]/g,
    to: "import { createClient } from '@/lib/supabase'"
  },
  {
    from: /import\s*{\s*createClient\s*}\s*from\s*['"]\.\.\/\.\.\/lib\/supabase['"]/g,
    to: "import { createClient } from '@/lib/supabase'"
  }
];

// 코드 내용 변경 패턴들
const codePatterns = [
  // supabase 변수를 createClient() 호출로 변경
  {
    from: /const\s+{\s*data[^}]*}\s*=\s*await\s+supabase\s*\./g,
    to: 'const supabase = createClient();\n  const { data$1 } = await supabase.'
  },
  {
    from: /const\s+{\s*error[^}]*}\s*=\s*await\s+supabase\s*\./g,
    to: 'const supabase = createClient();\n  const { error$1 } = await supabase.'
  },
  // supabaseAdmin 변수를 createAdminClient() 호출로 변경
  {
    from: /const\s+{\s*data[^}]*}\s*=\s*await\s+supabaseAdmin\s*\./g,
    to: 'const supabaseAdmin = createAdminClient();\n  const { data$1 } = await supabaseAdmin.'
  },
  {
    from: /const\s+{\s*error[^}]*}\s*=\s*await\s+supabaseAdmin\s*\./g,
    to: 'const supabaseAdmin = createAdminClient();\n  const { error$1 } = await supabaseAdmin.'
  },
  // createServiceRoleClient를 createAdminClient로 변경
  {
    from: /createServiceRoleClient\(/g,
    to: 'createAdminClient('
  }
];

async function fixFile(filePath: string) {
  try {
    let content = readFileSync(filePath, 'utf-8');
    let modified = false;

    // Import 문 수정
    for (const pattern of importPatterns) {
      if (pattern.from.test(content)) {
        content = content.replace(pattern.from, pattern.to);
        modified = true;
      }
    }

    // 코드 내용 수정 (주의: 이미 수정된 파일은 건너뜀)
    if (!content.includes('const supabase = createClient()') && 
        !content.includes('const supabaseAdmin = createAdminClient()')) {
      for (const pattern of codePatterns) {
        if (pattern.from.test(content)) {
          content = content.replace(pattern.from, pattern.to);
          modified = true;
        }
      }
    }

    if (modified) {
      writeFileSync(filePath, content, 'utf-8');
      console.log(`✅ Fixed: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error);
  }
}

async function main() {
  console.log('🔧 Supabase import 경로 수정 시작...\n');

  // TypeScript/TSX 파일 찾기 (node_modules 제외)
  const files = await glob('**/*.{ts,tsx}', {
    cwd: process.cwd(),
    ignore: ['node_modules/**', 'dist/**', 'build/**', '.next/**', 'scripts/fix-supabase-imports.ts']
  });

  console.log(`📁 ${files.length}개 파일 발견\n`);

  // 각 파일 처리
  for (const file of files) {
    await fixFile(path.join(process.cwd(), file));
  }

  console.log('\n✨ 완료!');
  console.log('\n⚠️  주의사항:');
  console.log('1. createClient()는 클라이언트 사이드용입니다.');
  console.log('2. API 라우트와 서버 컴포넌트에서는 createServerClient()를 사용하세요.');
  console.log('3. 관리자 권한이 필요한 경우 createAdminClient()를 사용하세요.');
  console.log('4. 일부 파일은 수동으로 확인이 필요할 수 있습니다.');
}

main().catch(console.error);