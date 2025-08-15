#!/usr/bin/env node

/**
 * Google OAuth 설정 테스트 스크립트
 * OAuth 클라이언트 ID와 리다이렉트 URI 설정을 확인합니다.
 */

require('dotenv').config({ path: '.env.local' });

console.log('=== Google OAuth 설정 확인 ===\n');

// 환경 변수 확인
const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

console.log('1. 환경 변수 상태:');
console.log(`   Client ID: ${clientId ? '✅ 설정됨' : '❌ 없음'}`);
console.log(`   Client Secret: ${clientSecret ? '✅ 설정됨' : '❌ 없음'}`);

if (clientId) {
  console.log(`   Client ID 값: ${clientId}`);
}

console.log('\n2. 필요한 리다이렉트 URI:');
console.log('   프로덕션:');
console.log('   - https://gameplaza-v2.vercel.app/api/auth/callback/google');
console.log('   - https://www.gameplaza.kr/api/auth/callback/google');
console.log('   개발:');
console.log('   - http://localhost:3000/api/auth/callback/google');

console.log('\n3. Google Cloud Console 설정 확인 필요:');
console.log('   1) https://console.cloud.google.com/apis/credentials 접속');
console.log(`   2) OAuth 2.0 클라이언트 ID "${clientId}" 클릭`);
console.log('   3) "승인된 리디렉션 URI"에 위 URI들이 모두 추가되어 있는지 확인');
console.log('   4) 저장 버튼 클릭');

console.log('\n4. OAuth 동의 화면 설정:');
console.log('   1) https://console.cloud.google.com/apis/credentials/consent 접속');
console.log('   2) 게시 상태 확인:');
console.log('      - 테스트 모드: 테스트 사용자 목록에 이메일 추가 필요');
console.log('      - 프로덕션 모드: 모든 사용자 로그인 가능');
console.log('   3) 앱 이름이 "게임플라자"로 설정되어 있는지 확인');

console.log('\n5. NextAuth 설정:');
console.log(`   NEXTAUTH_URL (로컬): ${process.env.NEXTAUTH_URL || '❌ 없음'}`);
console.log(`   NEXTAUTH_SECRET: ${process.env.NEXTAUTH_SECRET ? '✅ 설정됨' : '❌ 없음'}`);

console.log('\n=== 문제 해결 체크리스트 ===');
console.log('□ Google Cloud Console에 모든 리다이렉트 URI 추가');
console.log('□ OAuth 동의 화면 게시 상태 확인 (테스트/프로덕션)');
console.log('□ 테스트 모드인 경우 테스트 사용자 추가');
console.log('□ Vercel 대시보드에 환경 변수 설정');
console.log('□ 브라우저 캐시 및 쿠키 삭제');
console.log('□ Google 계정 권한 재설정 (https://myaccount.google.com/permissions)');

console.log('\n💡 AccessDenied 에러 원인:');
console.log('1. 리다이렉트 URI가 Google Console에 등록되지 않음');
console.log('2. OAuth 동의 화면이 테스트 모드이고 테스트 사용자가 아님');
console.log('3. Client ID/Secret이 올바르지 않음');
console.log('4. 도메인이 검증되지 않음 (프로덕션 모드)');