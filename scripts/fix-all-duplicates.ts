#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

async function fixAllDuplicates() {
  console.log('Fixing all duplicate declarations...\n');
  
  const files = await glob('app/**/*.ts', {
    ignore: ['**/*.backup', '**/node_modules/**']
  });
  
  let totalFixed = 0;
  
  for (const file of files) {
    const filePath = path.resolve(file);
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;
    
    // 함수별로 처리
    const functionPattern = /(export\s+async\s+function\s+\w+[^{]*{|async\s+function\s+\w+[^{]*{|\.(?:get|post|put|delete|patch)\s*\([^)]*\)\s*(?::\s*[^{]+)?\s*{)/gi;
    const functions = content.split(functionPattern);
    
    for (let i = 1; i < functions.length; i += 2) {
      let funcBody = functions[i + 1];
      if (!funcBody) continue;
      
      // supabaseAdmin 중복 제거
      const adminDeclarations: Array<{match: string, index: number}> = [];
      const adminPattern = /const\s+supabaseAdmin\s*=\s*createAdminClient\(\)\s*;/g;
      let match;
      
      while ((match = adminPattern.exec(funcBody)) !== null) {
        adminDeclarations.push({
          match: match[0],
          index: match.index
        });
      }
      
      // 2개 이상의 선언이 있으면 첫 번째만 남기고 제거
      if (adminDeclarations.length > 1) {
        // 뒤에서부터 제거 (인덱스 변경 방지)
        for (let j = adminDeclarations.length - 1; j >= 1; j--) {
          const decl = adminDeclarations[j];
          
          // decl null 체크
          if (!decl) {
            console.warn(`Declaration at index ${j} is undefined, skipping...`);
            continue;
          }
          
          funcBody = funcBody.substring(0, decl.index) + 
                     funcBody.substring(decl.index + decl.match.length);
        }
      }
      
      // supabase 중복 제거 (createClient)
      const supabaseDeclarations: Array<{match: string, index: number}> = [];
      const supabasePattern = /const\s+supabase\s*=\s*createClient\(\)\s*;/g;
      
      while ((match = supabasePattern.exec(funcBody)) !== null) {
        supabaseDeclarations.push({
          match: match[0],
          index: match.index
        });
      }
      
      // 2개 이상의 선언이 있으면 첫 번째만 남기고 제거
      if (supabaseDeclarations.length > 1) {
        for (let j = supabaseDeclarations.length - 1; j >= 1; j--) {
          const decl = supabaseDeclarations[j];
          
          // decl null 체크
          if (!decl) {
            console.warn(`Declaration at index ${j} is undefined, skipping...`);
            continue;
          }
          
          funcBody = funcBody.substring(0, decl.index) + 
                     funcBody.substring(decl.index + decl.match.length);
        }
      }
      
      functions[i + 1] = funcBody;
    }
    
    content = functions.join('');
    
    // 빈 줄이 너무 많이 생기면 정리
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    
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
fixAllDuplicates().catch(console.error);