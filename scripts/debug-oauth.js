#!/usr/bin/env node

/**
 * OAuth 디버그 스크립트
 * Google OAuth 설정 문제를 진단합니다.
 */

const https = require('https');
require('dotenv').config({ path: '.env.local' });

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

console.log('=== OAuth 디버깅 정보 ===\n');

// 1. 환경 변수 확인
console.log('1. 환경 변수:');
console.log(`   Client ID: ${CLIENT_ID}`);
console.log(`   Client Secret: ${CLIENT_SECRET ? CLIENT_SECRET.substring(0, 10) + '...' : '없음'}`);

// 2. 리다이렉트 URI 확인
console.log('\n2. 필수 리다이렉트 URI:');
const requiredUris = [
  'https://gameplaza-v2.vercel.app/api/auth/callback/google',
  'https://www.gameplaza.kr/api/auth/callback/google',
  'http://localhost:3000/api/auth/callback/google'
];

requiredUris.forEach(uri => {
  console.log(`   ✅ ${uri}`);
});

// 3. 가능한 문제 원인
console.log('\n3. AccessDenied 에러 체크리스트:\n');

console.log('   ⚠️  Google Cloud Console 확인:');
console.log('   1. OAuth 동의 화면이 "테스트" 모드인가?');
console.log('      → 테스트 모드라면 테스트 사용자 목록에 이메일이 추가되어 있는지 확인');
console.log('      → https://console.cloud.google.com/apis/credentials/consent');
console.log('');
console.log('   2. 리다이렉트 URI가 정확히 일치하는가?');
console.log('      → 대소문자, 슬래시, 프로토콜(http/https) 모두 정확해야 함');
console.log('      → https://console.cloud.google.com/apis/credentials');
console.log('');
console.log('   3. OAuth 클라이언트가 올바른 프로젝트에 있는가?');
console.log('      → 프로젝트 선택 드롭다운 확인');
console.log('');

console.log('   ⚠️  추가 확인 사항:');
console.log('   4. Google Workspace 조직 정책:');
console.log('      → 회사/학교 계정인 경우 조직 정책으로 인한 차단 가능');
console.log('      → 개인 Gmail 계정으로 테스트');
console.log('');
console.log('   5. 브라우저 확장 프로그램:');
console.log('      → 광고 차단기나 보안 확장이 OAuth 흐름을 방해할 수 있음');
console.log('      → 시크릿 모드에서 테스트');
console.log('');
console.log('   6. 쿠키/세션 문제:');
console.log('      → 브라우저 쿠키 삭제');
console.log('      → https://myaccount.google.com/permissions 에서 앱 권한 제거 후 재시도');

// 4. 해결 방법
console.log('\n4. 권장 해결 순서:\n');
console.log('   Step 1: Google Cloud Console에서 OAuth 동의 화면 확인');
console.log('           - 테스트 모드 → 테스트 사용자 추가 OR 프로덕션 모드로 변경');
console.log('');
console.log('   Step 2: 리다이렉트 URI 재확인 (복사-붙여넣기로 정확히)');
console.log('           - 위 목록의 3개 URI 모두 추가되어 있어야 함');
console.log('');
console.log('   Step 3: 다른 Google 계정으로 테스트');
console.log('           - 개인 Gmail 계정 사용');
console.log('');
console.log('   Step 4: 브라우저 환경 초기화');
console.log('           - 시크릿 모드 또는 다른 브라우저에서 테스트');

// 5. 직접 링크
console.log('\n5. 바로가기 링크:\n');
console.log(`   OAuth 클라이언트 설정:`);
console.log(`   https://console.cloud.google.com/apis/credentials/oauthclient/${CLIENT_ID.split('-')[0]}?project=${CLIENT_ID.split('-')[0]}`);
console.log('');
console.log('   OAuth 동의 화면:');
console.log('   https://console.cloud.google.com/apis/credentials/consent');
console.log('');
console.log('   Google 계정 권한 관리:');
console.log('   https://myaccount.google.com/permissions');

console.log('\n========================================');
console.log('💡 가장 가능성 높은 원인:');
console.log('1. OAuth 동의 화면이 테스트 모드이고 테스트 사용자가 아님');
console.log('2. 리다이렉트 URI가 정확히 일치하지 않음');
console.log('========================================\n');