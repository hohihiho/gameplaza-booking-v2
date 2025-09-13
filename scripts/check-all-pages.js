#!/usr/bin/env node

/**
 * 모든 주요 페이지를 자동으로 체크하는 스크립트
 * 각 페이지에 GET 요청을 보내고 상태 코드를 확인
 */

const pages = [
  // 홈페이지
  { path: '/', name: '홈페이지' },
  
  // V3 시스템
  { path: '/v3/reservations', name: 'V3 예약 목록' },
  
  // 로그인/회원가입
  { path: '/login', name: '로그인' },
  { path: '/signup', name: '회원가입' },
  
  // 마이페이지
  { path: '/mypage', name: '마이페이지' },
  { path: '/mypage/profile', name: '프로필' },
  
  // 예약 관련
  { path: '/reservations', name: '예약 목록' },
  { path: '/schedule', name: '스케줄' },
  
  // 관리자
  { path: '/admin', name: '관리자 대시보드' },
  { path: '/admin/users', name: '사용자 관리' },
  { path: '/admin/devices', name: '기기 관리' },
  
  // 기타
  { path: '/guide', name: '이용 가이드' },
  { path: '/ranking', name: '랭킹' },
];

const apiEndpoints = [
  // 공개 API
  { path: '/api/public/schedule/today', name: 'API: 오늘 일정' },
  { path: '/api/public/device-count', name: 'API: 기기 현황' },
  
  // V3 API
  { path: '/api/v3/reservations', name: 'API: V3 예약' },
  { path: '/api/v3/devices', name: 'API: V3 기기' },
  { path: '/api/v3/admin', name: 'API: V3 관리자' },
  
  // 인증 API
  { path: '/api/auth/session', name: 'API: 세션' },
];

async function checkPages() {
  console.log('🔍 페이지 상태 검사 시작...\n');
  
  const results = {
    success: [],
    error: [],
    warning: []
  };
  
  // 페이지 체크
  console.log('📄 페이지 체크:');
  for (const page of pages) {
    try {
      const response = await fetch(`http://localhost:3000${page.path}`, {
        method: 'GET',
        redirect: 'manual' // 리다이렉트를 수동으로 처리
      });
      
      if (response.status === 200) {
        console.log(`✅ ${page.name}: OK`);
        results.success.push(page.name);
      } else if (response.status >= 300 && response.status < 400) {
        console.log(`⚠️  ${page.name}: 리다이렉트 (${response.status})`);
        results.warning.push(`${page.name} (리다이렉트)`);
      } else {
        console.log(`❌ ${page.name}: 오류 (${response.status})`);
        results.error.push(`${page.name} (${response.status})`);
      }
    } catch (error) {
      console.log(`❌ ${page.name}: 네트워크 오류`);
      results.error.push(`${page.name} (네트워크 오류)`);
    }
  }
  
  console.log('\n🔌 API 체크:');
  for (const api of apiEndpoints) {
    try {
      const response = await fetch(`http://localhost:3000${api.path}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 200) {
        console.log(`✅ ${api.name}: OK`);
        results.success.push(api.name);
      } else if (response.status === 401) {
        console.log(`🔒 ${api.name}: 인증 필요`);
        results.warning.push(`${api.name} (인증 필요)`);
      } else {
        console.log(`❌ ${api.name}: 오류 (${response.status})`);
        results.error.push(`${api.name} (${response.status})`);
      }
    } catch (error) {
      console.log(`❌ ${api.name}: 네트워크 오류`);
      results.error.push(`${api.name} (네트워크 오류)`);
    }
  }
  
  // 결과 요약
  console.log('\n' + '='.repeat(50));
  console.log('📊 검사 결과 요약:');
  console.log(`✅ 정상: ${results.success.length}개`);
  console.log(`⚠️  경고: ${results.warning.length}개`);
  console.log(`❌ 오류: ${results.error.length}개`);
  
  if (results.error.length > 0) {
    console.log('\n❌ 오류 발생 페이지:');
    results.error.forEach(err => console.log(`  - ${err}`));
  }
  
  if (results.warning.length > 0) {
    console.log('\n⚠️  경고 페이지:');
    results.warning.forEach(warn => console.log(`  - ${warn}`));
  }
  
  console.log('\n✨ 검사 완료!');
  
  // 오류가 있으면 비정상 종료 코드 반환
  process.exit(results.error.length > 0 ? 1 : 0);
}

// 서버가 실행 중인지 먼저 확인
fetch('http://localhost:3000')
  .then(() => {
    checkPages();
  })
  .catch(() => {
    console.error('❌ 개발 서버가 실행되지 않았습니다.');
    console.log('💡 먼저 npm run dev를 실행해주세요.');
    process.exit(1);
  });