#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// TypeScript 컴파일러를 사용해 사용하지 않는 import 찾기
function getUnusedImports() {
  try {
    const output = execSync('npx tsc --noEmit 2>&1', { encoding: 'utf-8' });
    const lines = output.split('\n');
    
    const unusedImports = [];
    for (const line of lines) {
      const match = line.match(/^(.+?):\((\d+),(\d+)\): error TS6133: '(.+)' is declared but its value is never read\.$/);
      if (match) {
        const [, filePath, lineNum, colNum, varName] = match;
        unusedImports.push({
          filePath: filePath.trim(),
          lineNum: parseInt(lineNum),
          varName: varName
        });
      }
    }
    
    return unusedImports;
  } catch (error) {
    return [];
  }
}

// 파일에서 사용하지 않는 import 제거
function removeUnusedImportFromFile(filePath, varName, lineNum) {
  try {
    if (!fs.existsSync(filePath)) return false;
    
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    if (lineNum > lines.length) return false;
    
    const targetLine = lines[lineNum - 1];
    
    // import 구문에서 해당 변수 제거
    if (targetLine.includes('import')) {
      // 단일 import인 경우: import { varName } from ...
      if (targetLine.match(new RegExp(`import\\s*\\{\\s*${varName}\\s*\\}\\s*from`))) {
        lines[lineNum - 1] = ''; // 전체 라인 삭제
      }
      // 다중 import인 경우: import { var1, varName, var2 } from ...
      else if (targetLine.includes(varName)) {
        let newLine = targetLine;
        // 첫 번째나 중간에 있는 경우: varName, 
        newLine = newLine.replace(new RegExp(`${varName},\\s*`), '');
        // 마지막에 있는 경우: , varName
        newLine = newLine.replace(new RegExp(`,\\s*${varName}`), '');
        // 혼자 있는 경우
        newLine = newLine.replace(new RegExp(`\\{\\s*${varName}\\s*\\}`), '{}');
        
        // 빈 import가 되었다면 라인 삭제
        if (newLine.match(/import\s*\{\s*\}\s*from/)) {
          lines[lineNum - 1] = '';
        } else {
          lines[lineNum - 1] = newLine;
        }
      }
    }
    // 변수 선언인 경우
    else if (targetLine.includes(`const ${varName}`) || targetLine.includes(`let ${varName}`) || targetLine.includes(`var ${varName}`)) {
      // 변수 앞에 주석 추가
      lines[lineNum - 1] = targetLine.replace(varName, `// ${varName}`);
    }
    
    const newContent = lines.join('\n');
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent, 'utf-8');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

// 메인 실행 함수
function main() {
  console.log('🔍 사용하지 않는 import 찾는 중...');
  
  const unusedImports = getUnusedImports();
  console.log(`📦 ${unusedImports.length}개의 사용하지 않는 import 발견`);
  
  if (unusedImports.length === 0) {
    console.log('✅ 모든 import가 정상적으로 사용되고 있습니다!');
    return;
  }
  
  let fixedCount = 0;
  const processedFiles = new Set();
  
  // 파일별로 그룹핑
  const fileGroups = {};
  unusedImports.forEach(item => {
    if (!fileGroups[item.filePath]) {
      fileGroups[item.filePath] = [];
    }
    fileGroups[item.filePath].push(item);
  });
  
  // 각 파일 처리
  for (const [filePath, items] of Object.entries(fileGroups)) {
    console.log(`🔧 ${filePath} 처리 중...`);
    
    // 라인 번호 역순으로 정렬 (뒤에서부터 처리)
    items.sort((a, b) => b.lineNum - a.lineNum);
    
    let fileFixed = false;
    for (const item of items) {
      if (removeUnusedImportFromFile(item.filePath, item.varName, item.lineNum)) {
        console.log(`  ✅ ${item.varName} 제거됨 (라인 ${item.lineNum})`);
        fileFixed = true;
        fixedCount++;
      }
    }
    
    if (fileFixed) {
      processedFiles.add(filePath);
    }
  }
  
  console.log(`\n🎉 ${fixedCount}개의 사용하지 않는 import가 제거되었습니다!`);
  console.log(`📁 ${processedFiles.size}개 파일이 수정되었습니다.`);
  
  if (processedFiles.size > 0) {
    console.log('\n📋 수정된 파일 목록:');
    processedFiles.forEach(file => console.log(`  - ${file}`));
  }
}

if (require.main === module) {
  main();
}