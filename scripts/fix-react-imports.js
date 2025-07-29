#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// React import 추가
const addReactImport = (content) => {
  // 이미 React import가 있는지 확인
  if (content.includes("import React from 'react'") || content.includes('import * as React')) {
    return content;
  }
  
  // JSX를 사용하는지 확인
  if (content.includes('<') && content.includes('/>')) {
    // 첫 번째 import 문 찾기
    const importMatch = content.match(/^import .* from/m);
    if (importMatch) {
      const firstImportIndex = content.indexOf(importMatch[0]);
      return content.slice(0, firstImportIndex) + "import React from 'react';\n" + content.slice(firstImportIndex);
    } else {
      // import 문이 없으면 파일 맨 앞에 추가
      return "import React from 'react';\n" + content;
    }
  }
  
  return content;
};

// 테스트 파일 찾기
const testFiles = [
  ...glob.sync('src/**/__tests__/**/*.test.tsx', { cwd: process.cwd() }),
  ...glob.sync('app/**/__tests__/**/*.test.tsx', { cwd: process.cwd() }),
  ...glob.sync('tests/**/*.test.tsx', { cwd: process.cwd() })
];

console.log(`Found ${testFiles.length} test files to check...`);

let totalFixed = 0;

testFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  const content = fs.readFileSync(filePath, 'utf8');
  const newContent = addReactImport(content);
  
  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent);
    console.log(`✅ Fixed: ${file}`);
    totalFixed++;
  }
});

console.log(`\nTotal files fixed: ${totalFixed}`);