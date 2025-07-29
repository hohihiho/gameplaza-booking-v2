#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// User.create 패턴 수정
const patterns = [
  {
    // new User({ ... name: ... }) -> User.create({ ... fullName: ... })
    pattern: /new User\({([^}]+)name:\s*(['"][^'"]+['"]|[^,}]+),([^}]*)}\)/g,
    replacement: (match, before, nameValue, after) => {
      return `User.create({${before}fullName: ${nameValue},${after}})`;
    }
  },
  {
    // expect 문에서 name -> fullName
    pattern: /expect\(([^)]+)\)\.toMatchObject\({([^}]+)name:\s*(['"][^'"]+['"]|[^,}]+)/g,
    replacement: (match, expectTarget, before, nameValue) => {
      return `expect(${expectTarget}).toMatchObject({${before}fullName: ${nameValue}`;
    }
  },
  {
    // expect.objectContaining에서 name -> fullName
    pattern: /expect\.objectContaining\({([^}]+)name:\s*(['"][^'"]+['"]|[^,}]+)/g,
    replacement: (match, before, nameValue) => {
      return `expect.objectContaining({${before}fullName: ${nameValue}`;
    }
  }
];

// 테스트 파일 찾기
const testFiles = glob.sync('src/**/__tests__/**/*.test.ts', {
  cwd: process.cwd()
});

console.log(`Found ${testFiles.length} test files to check...`);

let totalFixed = 0;

testFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  patterns.forEach(({ pattern, replacement }) => {
    const newContent = content.replace(pattern, replacement);
    if (newContent !== content) {
      content = newContent;
      modified = true;
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed: ${file}`);
    totalFixed++;
  }
});

console.log(`\nTotal files fixed: ${totalFixed}`);