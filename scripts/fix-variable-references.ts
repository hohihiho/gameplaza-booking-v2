#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

async function fixVariableReferences() {
  console.log('Fixing variable reference errors...\n');
  
  const files = await glob('app/**/*.ts', {
    ignore: ['**/*.backup', '**/node_modules/**']
  });
  
  let totalFixed = 0;
  
  for (const file of files) {
    const filePath = path.resolve(file);
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;
    let hasChanges = false;
    
    // data$1이 있고 참조하는 변수가 다른 경우 수정
    const dataPatterns = [
      { pattern: /const\s*{\s*data\$1\s*}\s*=\s*await[^;]+;[\s\S]*?if\s*\(\s*profileError\s*\|\|/, replacement: 'const { data: profile, error: profileError } = await', checkVar: 'profileError' },
      { pattern: /const\s*{\s*data\$1\s*}\s*=\s*await[^;]+;[\s\S]*?if\s*\(\s*reservationError\s*/, replacement: 'const { data: reservationData, error: reservationError } = await', checkVar: 'reservationError' },
      { pattern: /const\s*{\s*data\$1\s*}\s*=\s*await[^;]+;[\s\S]*?if\s*\(\s*userError\s*/, replacement: 'const { data: userData, error: userError } = await', checkVar: 'userError' },
      { pattern: /const\s*{\s*data\$1\s*}\s*=\s*await[^;]+;[\s\S]*?if\s*\(\s*modesError\s*/, replacement: 'const { error: modesError } = await', checkVar: 'modesError' },
      { pattern: /const\s*{\s*data\$1\s*}\s*=\s*await[^;]+;[\s\S]*?if\s*\(\s*devicesError\s*/, replacement: 'const { data: devicesData, error: devicesError } = await', checkVar: 'devicesError' },
      { pattern: /const\s*{\s*data\$1\s*}\s*=\s*await[^;]+;[\s\S]*?if\s*\(\s*insertError\s*/, replacement: 'const { error: insertError } = await', checkVar: 'insertError' },
      { pattern: /const\s*{\s*data\$1\s*}\s*=\s*await[^;]+;[\s\S]*?if\s*\(\s*error\s*/, replacement: 'const { data, error } = await', checkVar: 'error' },
      { pattern: /const\s*{\s*data\$1\s*}\s*=\s*await[^;]+;[\s\S]*?if\s*\(\s*adminError\s*/, replacement: 'const { data: adminData, error: adminError } = await', checkVar: 'adminError' },
      { pattern: /const\s*{\s*data\$1\s*}\s*=\s*await[^;]+;[\s\S]*?if\s*\(\s*error\s*&&/, replacement: 'const { data, error } = await', checkVar: 'error' },
    ];
    
    // 일반적인 data$1 패턴 처리
    content = content.replace(/const\s*{\s*data\$1\s*}\s*=\s*await\s+(\w+)\.from\(['"]([\w_]+)['"]\)/g, (match, client, table) => {
      // 다음 줄들을 확인하여 어떤 변수를 사용하는지 파악
      const afterMatch = content.substring(content.indexOf(match) + match.length, content.indexOf(match) + match.length + 200);
      
      // 사용되는 변수명 찾기
      let varName = 'data';
      let errorName = 'error';
      
      if (afterMatch.includes('reservationData')) varName = 'reservationData';
      else if (afterMatch.includes('userData')) varName = 'userData';
      else if (afterMatch.includes('adminData')) varName = 'adminData';
      else if (afterMatch.includes('profile')) varName = 'profile';
      else if (afterMatch.includes('timeSlots')) varName = 'timeSlots';
      else if (afterMatch.includes('devicesData')) varName = 'devicesData';
      else if (afterMatch.includes('deviceType')) varName = 'deviceType';
      else if (afterMatch.includes('reservationList')) varName = 'reservationList';
      else if (afterMatch.includes('machines')) varName = 'machines';
      else if (afterMatch.includes('existingAdmin')) varName = 'existingAdmin';
      else if (afterMatch.includes('adminToDelete')) varName = 'adminToDelete';
      else if (afterMatch.includes('slotData')) varName = 'slotData';
      
      if (afterMatch.includes('profileError')) errorName = 'profileError';
      else if (afterMatch.includes('reservationError')) errorName = 'reservationError';
      else if (afterMatch.includes('userError')) errorName = 'userError';
      else if (afterMatch.includes('adminError')) errorName = 'adminError';
      else if (afterMatch.includes('modesError')) errorName = 'modesError';
      else if (afterMatch.includes('devicesError')) errorName = 'devicesError';
      else if (afterMatch.includes('insertError')) errorName = 'insertError';
      else if (afterMatch.includes('deleteError')) errorName = 'deleteError';
      else if (afterMatch.includes('updateError')) errorName = 'updateError';
      else if (afterMatch.includes('fetchError')) errorName = 'fetchError';
      
      hasChanges = true;
      return `const { data: ${varName}, error: ${errorName} } = await ${client}.from('${table}')`;
    });
    
    // 변경사항이 있으면 파일 저장
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed: ${file}`);
      totalFixed++;
    }
  }
  
  console.log(`\n✨ Total files fixed: ${totalFixed}`);
}

// 스크립트 실행
fixVariableReferences().catch(console.error);