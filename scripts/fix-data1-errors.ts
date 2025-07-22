#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

async function fixData1Errors() {
  console.log('Fixing data$1 and supabaseAdmin errors...\n');
  
  const files = await glob('app/api/admin/**/*.ts', {
    ignore: ['**/*.backup', '**/node_modules/**']
  });
  
  let totalFixed = 0;
  
  for (const file of files) {
    const filePath = path.resolve(file);
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;
    
    // 변수 이름 추적을 위한 맵
    const variableMap = new Map<string, number>();
    
    // data$1 패턴 찾기 및 수정
    content = content.replace(/const\s*{\s*data\$1\s*}\s*=\s*await\s+(\w+)\.from\(['"]([\w_]+)['"]\)/g, (match, client, table) => {
      // 각 쿼리의 컨텍스트를 파악하여 적절한 변수명 생성
      let varName = '';
      
      // 테이블 이름을 기반으로 변수명 생성
      if (table === 'users') varName = 'userData';
      else if (table === 'admins') varName = 'adminData';
      else if (table === 'reservations') varName = 'reservationsData';
      else if (table === 'devices') varName = 'devicesData';
      else if (table === 'device_types') varName = 'deviceTypesData';
      else if (table === 'rental_time_slots') varName = 'timeSlotsData';
      else if (table === 'banned_words') varName = 'bannedWordsData';
      else varName = table.replace(/_/g, '') + 'Data';
      
      // 같은 변수명이 이미 사용되었으면 숫자 추가
      if (variableMap.has(varName)) {
        const count = variableMap.get(varName)! + 1;
        variableMap.set(varName, count);
        varName = varName + count;
      } else {
        variableMap.set(varName, 1);
      }
      
      return `const { data: ${varName} } = await ${client}.from('${table}')`;
    });
    
    // error$1 패턴 찾기 및 수정
    content = content.replace(/const\s*{\s*error\$1\s*}\s*=\s*await/g, 'const { error } = await');
    
    // 중복된 supabaseAdmin 선언 제거 (함수 내에서)
    // 함수별로 처리
    const functionPattern = /(export\s+async\s+function\s+\w+[^{]*{|\.(?:get|post|put|delete|patch)\s*\([^)]*\)\s*(?::\s*[^{]+)?\s*{)/gi;
    const functions = content.split(functionPattern);
    
    for (let i = 1; i < functions.length; i += 2) {
      let funcBody = functions[i + 1];
      if (!funcBody) continue;
      
      // 첫 번째 supabaseAdmin 선언 찾기
      const firstDeclaration = funcBody.match(/const\s+supabaseAdmin\s*=\s*createAdminClient\(\)\s*;/);
      if (firstDeclaration) {
        // 이후의 모든 중복 선언 제거
        let count = 0;
        funcBody = funcBody.replace(/const\s+supabaseAdmin\s*=\s*createAdminClient\(\)\s*;/g, (match) => {
          if (count === 0) {
            count++;
            return match; // 첫 번째는 유지
          }
          return ''; // 나머지는 제거
        });
      }
      
      functions[i + 1] = funcBody;
    }
    
    content = functions.join('');
    
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
fixData1Errors().catch(console.error);