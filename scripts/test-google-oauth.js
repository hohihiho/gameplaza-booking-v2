#!/usr/bin/env node

// Google OAuth 클라이언트 검증 스크립트
const https = require('https');

const CLIENT_ID = '44559014883-248e8a3kb4meo4peee4ga8vr5190566m.apps.googleusercontent.com';
const CLIENT_SECRET = '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';

console.log('🔍 Google OAuth 클라이언트 검증 시작...\n');
console.log('Client ID:', CLIENT_ID);
console.log('Client Secret:', CLIENT_SECRET.substring(0, 10) + '...');

// OAuth 2.0 토큰 엔드포인트로 테스트
const postData = new URLSearchParams({
  client_id: CLIENT_ID,
  client_secret: CLIENT_SECRET,
  grant_type: 'authorization_code',
  code: 'invalid_code_for_test', // 일부러 잘못된 코드
  redirect_uri: 'https://gameplaza-v2.vercel.app/api/auth/callback/google'
}).toString();

const options = {
  hostname: 'oauth2.googleapis.com',
  port: 443,
  path: '/token',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('\n📊 응답 상태 코드:', res.statusCode);
    
    try {
      const response = JSON.parse(data);
      console.log('📋 응답 내용:', JSON.stringify(response, null, 2));
      
      if (response.error === 'invalid_client') {
        console.log('\n❌ 오류: invalid_client');
        console.log('클라이언트 ID 또는 시크릿이 잘못되었습니다.');
        console.log('\n해결 방법:');
        console.log('1. Google Cloud Console에서 OAuth 2.0 클라이언트 ID 확인');
        console.log('2. 클라이언트 시크릿이 올바른지 확인');
        console.log('3. OAuth 클라이언트가 활성화되어 있는지 확인');
      } else if (response.error === 'invalid_grant') {
        console.log('\n✅ 클라이언트 인증 성공!');
        console.log('클라이언트 ID와 시크릿이 유효합니다.');
        console.log('(invalid_grant는 예상된 에러입니다 - 테스트용 잘못된 코드를 사용했기 때문)');
      } else {
        console.log('\n⚠️ 예상하지 못한 응답:', response.error);
      }
    } catch (e) {
      console.log('응답 파싱 실패:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('요청 실패:', e);
});

req.write(postData);
req.end();