#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

async function fixDuplicateErrors() {
  console.log('Fixing duplicate error declarations...\n');
  
  const files = await glob('app/api/**/*.ts', {
    ignore: ['**/*.backup', '**/node_modules/**']
  });
  
  let totalFixed = 0;
  
  for (const file of files) {
    const filePath = path.resolve(file);
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;
    
    // 함수별로 처리
    const functionPattern = /(export\s+async\s+function\s+\w+[^{]*{|\.(?:get|post|put|delete|patch)\s*\([^)]*\)\s*(?::\s*[^{]+)?\s*{)/gi;
    const functions = content.split(functionPattern);
    
    for (let i = 1; i < functions.length; i += 2) {
      let funcBody = functions[i + 1];
      if (!funcBody) continue;
      
      // error 변수 사용 추적
      const errorDeclarations: Array<{match: string, index: number}> = [];
      const errorPattern = /const\s*{\s*error\s*}\s*=\s*await/g;
      let match;
      
      while ((match = errorPattern.exec(funcBody)) !== null) {
        errorDeclarations.push({
          match: match[0],
          index: match.index
        });
      }
      
      // 2개 이상의 error 선언이 있으면 수정
      if (errorDeclarations.length > 1) {
        // 각 error 선언 뒤의 컨텍스트를 파악하여 적절한 이름 부여
        for (let j = 1; j < errorDeclarations.length; j++) {
          const declaration = errorDeclarations[j];
          
          // declaration null 체크
          if (!declaration) {
            console.warn(`Declaration at index ${j} is undefined, skipping...`);
            continue;
          }
          
          const beforeDeclaration = funcBody.substring(0, declaration.index);
          const afterDeclaration = funcBody.substring(declaration.index + 100); // 뒤 100자 확인
          
          let errorName = 'error';
          
          // 컨텍스트 기반으로 error 이름 결정
          if (afterDeclaration.includes('updateError')) {
            errorName = 'updateError';
          } else if (afterDeclaration.includes('insertError')) {
            errorName = 'insertError';
          } else if (afterDeclaration.includes('deleteError')) {
            errorName = 'deleteError';
          } else if (afterDeclaration.includes('historyError')) {
            errorName = 'historyError';
          } else if (afterDeclaration.includes('adjustmentError')) {
            errorName = 'adjustmentError';
          } else if (beforeDeclaration.includes('.insert')) {
            errorName = 'insertError';
          } else if (beforeDeclaration.includes('.update')) {
            errorName = 'updateError';
          } else if (beforeDeclaration.includes('.delete')) {
            errorName = 'deleteError';
          } else if (beforeDeclaration.includes('rpc')) {
            errorName = 'rpcError';
          } else {
            errorName = `error${j}`;
          }
          
          // 해당 위치의 error를 새 이름으로 변경
          const before = funcBody.substring(0, declaration.index);
          const after = funcBody.substring(declaration.index);
          
          funcBody = before + after.replace(/const\s*{\s*error\s*}/, `const { error: ${errorName} }`);
        }
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
fixDuplicateErrors().catch(console.error);