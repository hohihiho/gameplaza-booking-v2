#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');

// 사용하지 않는 변수들을 대량으로 수정
function massFixUnused() {
  try {
    console.log('🚀 대량 사용하지 않는 변수 수정 시작...');
    
    const output = execSync('npx tsc --noEmit 2>&1', { encoding: 'utf-8' });
    const lines = output.split('\n');
    
    const fixes = [];
    for (const line of lines) {
      // TS6133: 사용하지 않는 변수
      const match = line.match(/^(.+?)\((\d+),(\d+)\): error TS6133: '(.+?)' is declared but its value is never read\.$/);
      if (match) {
        const [, filePath, lineNum, colNum, varName] = match;
        fixes.push({ filePath: filePath.trim(), lineNum: parseInt(lineNum), varName });
      }
    }
    
    console.log(`📦 ${fixes.length}개의 사용하지 않는 변수 발견`);
    
    // 파일별로 그룹핑하고 한번에 처리
    const fileGroups = {};
    fixes.forEach(fix => {
      if (!fileGroups[fix.filePath]) fileGroups[fix.filePath] = [];
      fileGroups[fix.filePath].push(fix);
    });
    
    let totalFixed = 0;
    
    for (const [filePath, fileFixes] of Object.entries(fileGroups)) {
      if (!fs.existsSync(filePath)) continue;
      
      let content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      let modified = false;
      
      // 라인 번호 역순으로 정렬 (뒤에서부터 처리)
      fileFixes.sort((a, b) => b.lineNum - a.lineNum);
      
      for (const fix of fileFixes) {
        if (fix.lineNum > lines.length) continue;
        
        const line = lines[fix.lineNum - 1];
        const varName = fix.varName;
        
        // 1. import 라인 처리
        if (line.trim().startsWith('import')) {
          // 단일 import: import { varName } from ...
          if (line.match(new RegExp(`import\\s*\\{\\s*${varName}\\s*\\}\\s*from`))) {
            lines[fix.lineNum - 1] = '';
            modified = true;
            totalFixed++;
          }
          // 다중 import에서 제거: import { a, varName, b } from ...
          else if (line.includes(`{`) && line.includes(`}`) && line.includes(varName)) {
            let newLine = line;
            // varName, 또는 , varName 패턴 제거
            newLine = newLine.replace(new RegExp(`\\s*,\\s*${varName}\\s*`), '');
            newLine = newLine.replace(new RegExp(`\\s*${varName}\\s*,\\s*`), '');
            newLine = newLine.replace(new RegExp(`\\{\\s*${varName}\\s*\\}`), '{}');
            
            // 빈 import가 되면 라인 삭제
            if (newLine.match(/import\s*\{\s*\}\s*from/) || newLine.match(/import\s*\{\s*,\s*\}\s*from/)) {
              lines[fix.lineNum - 1] = '';
            } else {
              lines[fix.lineNum - 1] = newLine;
            }
            modified = true;
            totalFixed++;
          }
        }
        // 2. 변수 선언 주석 처리
        else if (line.includes(`const ${varName}`) || line.includes(`let ${varName}`) || line.includes(`var ${varName}`)) {
          lines[fix.lineNum - 1] = '  // ' + line.trim();
          modified = true;
          totalFixed++;
        }
        // 3. 함수 파라미터 주석 처리 (간단한 케이스만)
        else if (line.includes(varName) && (line.includes('function') || line.includes('=>'))) {
          lines[fix.lineNum - 1] = '  // ' + line.trim();
          modified = true;
          totalFixed++;
        }
      }
      
      if (modified) {
        // 연속된 빈 줄 정리
        const cleanedLines = [];
        let lastWasEmpty = false;
        for (const line of lines) {
          const isEmpty = line.trim() === '';
          if (isEmpty && lastWasEmpty) continue;
          cleanedLines.push(line);
          lastWasEmpty = isEmpty;
        }
        
        fs.writeFileSync(filePath, cleanedLines.join('\n'), 'utf-8');
        console.log(`✅ ${filePath}: ${fileFixes.length}개 수정`);
      }
    }
    
    console.log(`\n🎉 총 ${totalFixed}개의 사용하지 않는 변수가 수정되었습니다!`);
    return totalFixed;
    
  } catch (error) {
    console.error('❌ 에러:', error.message);
    return 0;
  }
}

if (require.main === module) {
  massFixUnused();
}

module.exports = { massFixUnused };