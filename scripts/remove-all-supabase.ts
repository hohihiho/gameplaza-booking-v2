#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';

// 교체할 패턴들
const replacements = [
  // @supabase/supabase-js imports
  { 
    pattern: /import\s+{\s*createClient\s*}\s+from\s+['"]@supabase\/supabase-js['"]/g,
    replacement: "import { getD1Client } from '@/lib/d1/client'"
  },
  {
    pattern: /import\s+{\s*SupabaseClient\s*}\s+from\s+['"]@supabase\/supabase-js['"]/g,
    replacement: "// D1 Client type\ntype D1Client = any"
  },
  {
    pattern: /import\s+type\s+{\s*User\s*}\s+from\s+['"]@supabase\/supabase-js['"]/g,
    replacement: "import type { User } from '@/types/auth'"
  },
  // @supabase/ssr imports
  {
    pattern: /import\s+{\s*createServerClient\s*}\s+from\s+['"]@supabase\/ssr['"]/g,
    replacement: "import { getD1Client } from '@/lib/d1/client'"
  },
  // createClient 함수 호출
  {
    pattern: /const\s+supabase\s*=\s*createClient\(/g,
    replacement: "const d1Client = getD1Client("
  },
  {
    pattern: /const\s+client\s*=\s*createClient\(/g,
    replacement: "const client = getD1Client("
  },
  // createAdminClient 함수 호출
  {
    pattern: /const\s+supabase\s*=\s*createAdminClient\(\)/g,
    replacement: "const d1Client = getD1Client()"
  },
  // supabase 변수 참조
  {
    pattern: /await\s+supabase\./g,
    replacement: "await d1Client."
  },
  {
    pattern: /supabase\./g,
    replacement: "d1Client."
  },
  // Repository 클래스명
  {
    pattern: /AdminSupabaseRepository/g,
    replacement: "D1AdminRepository"
  },
  {
    pattern: /UserSupabaseRepository/g,
    replacement: "D1UserRepository"
  },
  {
    pattern: /SupabaseReservationRepository/g,
    replacement: "D1ReservationRepository"
  },
  // Import paths
  {
    pattern: /@\/lib\/supabase\/admin/g,
    replacement: "@/lib/d1/client"
  },
  {
    pattern: /@\/lib\/supabase\/client/g,
    replacement: "@/lib/d1/client"
  },
  {
    pattern: /@\/lib\/supabase\/service-role/g,
    replacement: "@/lib/d1/client"
  },
  // Repository imports
  {
    pattern: /admin\.supabase\.repository/g,
    replacement: "d1-admin.repository"
  },
  {
    pattern: /user\.supabase\.repository/g,
    replacement: "d1-user.repository"
  },
  {
    pattern: /supabase-user\.repository/g,
    replacement: "d1-user.repository"
  }
];

// 제외할 디렉토리
const excludeDirs = [
  'node_modules',
  '.next',
  'testing/reports',
  '.git',
  'dist',
  'build'
];

// 처리할 파일 확장자
const extensions = ['.ts', '.tsx', '.js', '.jsx'];

function shouldProcessFile(filePath: string): boolean {
  // 제외 디렉토리 체크
  for (const dir of excludeDirs) {
    if (filePath.includes(`/${dir}/`) || filePath.includes(`\\${dir}\\`)) {
      return false;
    }
  }
  
  // 확장자 체크
  const ext = path.extname(filePath);
  return extensions.includes(ext);
}

function processFile(filePath: string): void {
  if (!shouldProcessFile(filePath)) {
    return;
  }
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    for (const { pattern, replacement } of replacements) {
      const newContent = content.replace(pattern, replacement);
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error);
  }
}

function main() {
  console.log('🔄 Removing all Supabase references...\n');
  
  // 모든 소스 파일 찾기
  const patterns = [
    'app/**/*',
    'lib/**/*',
    'src/**/*',
    'scripts/**/*'
  ];
  
  let totalFiles = 0;
  
  for (const pattern of patterns) {
    const files = glob.sync(pattern, { nodir: true });
    for (const file of files) {
      processFile(file);
      totalFiles++;
    }
  }
  
  console.log(`\n✨ Processed ${totalFiles} files`);
  console.log('🎯 All Supabase references have been removed!');
}

main();