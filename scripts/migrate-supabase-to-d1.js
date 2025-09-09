#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// D1 리포지토리 매핑
const repositoryMapping = {
  'users': 'UsersRepository',
  'devices': 'DevicesRepository', 
  'reservations': 'ReservationsRepository',
  'admins': 'AdminsRepository',
  'push_subscriptions': 'PushSubscriptionsRepository',
  'content_pages': 'ContentPagesRepository',
  'holidays': 'HolidaysRepository',
  'schedule_management': 'ScheduleManagementRepository',
  'reservation_rules': 'ReservationRulesRepository',
  'machine_rules': 'MachineRulesRepository',
  'device_types': 'DeviceTypesRepository',
  'schedule_events': 'ScheduleEventsRepository',
  'device_categories': 'DeviceCategoriesRepository',
  'push_message_templates': 'PushMessageTemplatesRepository',
  'banned_words': 'BannedWordsRepository',
  'rental_settings': 'RentalSettingsRepository',
  'terms': 'TermsRepository',
  'payment_accounts': 'PaymentAccountsRepository'
};

// 파일의 import 문과 사용법을 변경하는 함수
function migrateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Supabase import 제거
  if (content.includes("import { createAdminClient } from '@/lib/supabase';")) {
    content = content.replace("import { createAdminClient } from '@/lib/supabase';", '');
    modified = true;
  }
  
  if (content.includes("import { createClient } from '@/lib/supabase/client';")) {
    content = content.replace("import { createClient } from '@/lib/supabase/client';", '');
    modified = true;
  }
  
  // 사용된 리포지토리 찾기
  const usedRepositories = new Set();
  
  Object.keys(repositoryMapping).forEach(tableName => {
    const pattern = new RegExp(`\\.from\\(['"\`]${tableName}['"\`]\\)`, 'g');
    if (pattern.test(content)) {
      usedRepositories.add(repositoryMapping[tableName]);
      
      // supabase.from('table') -> repository 패턴으로 변경
      content = content.replace(
        new RegExp(`(supabase[A-Za-z]*)\\.from\\(['"\`]${tableName}['"\`]\\)`, 'g'),
        `${tableName}Repo`
      );
      
      // repository 인스턴스 생성 코드 추가
      if (!content.includes(`const ${tableName}Repo = new ${repositoryMapping[tableName]}();`)) {
        // createAdminClient() 또는 createClient() 호출을 찾아서 대체
        content = content.replace(
          /const\s+supabase[A-Za-z]*\s*=\s*create[A-Za-z]*Client\(\);?\s*/g,
          `const ${tableName}Repo = new ${repositoryMapping[tableName]}();\n    `
        );
      }
      
      modified = true;
    }
  });
  
  // 사용된 리포지토리들의 import 추가
  if (usedRepositories.size > 0) {
    const imports = Array.from(usedRepositories).map(repo => repo).join(', ');
    const importLine = `import { ${imports} } from '@/lib/d1/repositories';\n`;
    
    // import 섹션에 추가
    if (content.includes("import { NextResponse } from 'next/server';")) {
      content = content.replace(
        "import { NextResponse } from 'next/server';",
        `import { NextResponse } from 'next/server';\n${importLine}`
      );
    } else {
      // 첫 번째 import 다음에 추가
      const lines = content.split('\n');
      let insertIndex = 0;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('import ')) {
          insertIndex = i + 1;
        }
      }
      lines.splice(insertIndex, 0, importLine.trim());
      content = lines.join('\n');
    }
    
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Migrated: ${filePath}`);
    return true;
  }
  
  return false;
}

// API 폴더의 모든 TypeScript 파일 처리
const apiFiles = glob.sync('app/api/**/*.ts', { 
  ignore: ['**/*.test.ts', '**/*.spec.ts'] 
});

console.log(`Found ${apiFiles.length} API files to process...`);

let migratedCount = 0;

apiFiles.forEach(file => {
  if (migrateFile(file)) {
    migratedCount++;
  }
});

console.log(`\n🎉 Migration completed!`);
console.log(`   Files processed: ${apiFiles.length}`);
console.log(`   Files migrated: ${migratedCount}`);
console.log(`   Files unchanged: ${apiFiles.length - migratedCount}`);