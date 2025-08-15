#!/usr/bin/env node

/**
 * Vercel 환경 변수 설정을 위한 복사 가능한 형식으로 출력
 * 사용법: node scripts/copy-env-vars.js
 */

const fs = require('fs');
const path = require('path');

// .env.local 파일 읽기
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');

// 환경 변수 파싱
const lines = envContent.split('\n');
const envVars = [];

lines.forEach(line => {
  // 주석과 빈 줄 제외
  if (line && !line.startsWith('#') && line.includes('=')) {
    const [key, ...valueParts] = line.split('=');
    const value = valueParts.join('=');
    
    // 중복 제거 (NEXTAUTH_URL, NEXTAUTH_SECRET 등)
    const existingIndex = envVars.findIndex(v => v.key === key.trim());
    if (existingIndex !== -1) {
      envVars[existingIndex] = { key: key.trim(), value: value.trim() };
    } else {
      envVars.push({ key: key.trim(), value: value.trim() });
    }
  }
});

// NEXTAUTH_URL은 프로덕션 URL로 변경
const nextAuthUrlIndex = envVars.findIndex(v => v.key === 'NEXTAUTH_URL');
if (nextAuthUrlIndex !== -1) {
  envVars[nextAuthUrlIndex].value = 'https://gameplaza-v2.vercel.app';
}

console.log('='.repeat(80));
console.log('📋 Vercel 환경 변수 복사용 (하나씩 복사해서 붙여넣기)');
console.log('='.repeat(80));
console.log('');

envVars.forEach(({ key, value }) => {
  console.log(`${key}`);
  console.log(`${value}`);
  console.log('-'.repeat(40));
});

console.log('');
console.log('='.repeat(80));
console.log('✅ 총 ' + envVars.length + '개의 환경 변수');
console.log('');
console.log('📌 Vercel 대시보드에서 설정 방법:');
console.log('1. https://vercel.com 접속');
console.log('2. gameplaza-v2 프로젝트 선택');
console.log('3. Settings → Environment Variables');
console.log('4. 위 변수들을 하나씩 추가 (Key와 Value 복사)');
console.log('5. Environment는 Production, Preview, Development 모두 체크');
console.log('6. Save 클릭');
console.log('');
console.log('🔄 환경 변수 추가 후 재배포:');
console.log('1. Deployments 탭 이동');
console.log('2. 최신 배포에서 ... 메뉴 → Redeploy');
console.log('3. "Use existing Build Cache" 체크 해제');
console.log('4. Redeploy 클릭');
console.log('='.repeat(80));