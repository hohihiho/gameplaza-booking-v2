// 페이지 테스트 스크립트
// 비전공자 설명: 모든 페이지가 정상적으로 작동하는지 확인하는 프로그램입니다

const http = require('http');

// 색상 출력 설정
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

// 테스트할 페이지 목록
const pages = [
  { path: '/', name: '홈페이지' },
  { path: '/login', name: '로그인 페이지' },
  { path: '/reservations', name: '예약 목록' },
  { path: '/reservations/new', name: '예약 신청' },
  { path: '/mypage', name: '마이페이지' },
  { path: '/admin', name: '관리자 페이지' }
];

// 페이지 테스트 함수
function testPage(path, name) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      if (res.statusCode === 200) {
        console.log(`${colors.green}✓${colors.reset} ${name} - ${path}`);
        resolve(true);
      } else {
        console.log(`${colors.red}✗${colors.reset} ${name} - ${path} (상태 코드: ${res.statusCode})`);
        resolve(false);
      }
    });

    req.on('error', (error) => {
      console.log(`${colors.red}✗${colors.reset} ${name} - ${path} (오류: ${error.message})`);
      resolve(false);
    });

    req.end();
  });
}

// 모든 페이지 테스트 실행
async function runTests() {
  console.log(`${colors.blue}🧪 페이지 테스트 시작...${colors.reset}\n`);
  
  let successCount = 0;
  let failCount = 0;

  for (const page of pages) {
    const success = await testPage(page.path, page.name);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
    // 각 테스트 사이 잠시 대기
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n${colors.blue}📊 테스트 결과:${colors.reset}`);
  console.log(`  성공: ${colors.green}${successCount}${colors.reset}`);
  console.log(`  실패: ${colors.red}${failCount}${colors.reset}`);

  if (failCount === 0) {
    console.log(`\n${colors.green}🎉 모든 페이지가 정상 작동합니다!${colors.reset}`);
  } else {
    console.log(`\n${colors.yellow}⚠️  일부 페이지에 문제가 있습니다.${colors.reset}`);
    console.log('개발 서버가 실행 중인지 확인하세요: npm run dev');
  }
}

// 서버 연결 확인 후 테스트 시작
console.log('서버 연결 확인 중...');
const checkReq = http.request({ hostname: 'localhost', port: 3000, path: '/' }, (res) => {
  console.log('서버 연결 성공!\n');
  runTests();
});

checkReq.on('error', () => {
  console.log(`${colors.red}❌ 서버에 연결할 수 없습니다.${colors.reset}`);
  console.log('다음 명령어로 개발 서버를 먼저 실행하세요:');
  console.log(`${colors.yellow}npm run dev${colors.reset}`);
});

checkReq.end();