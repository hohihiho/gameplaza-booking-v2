/**
 * ⚡ K6 성능/부하 테스트: 게임플라자 시스템 한계 테스트
 * 
 * 목적:
 * - 동시 예약 처리 능력 확인
 * - 시스템 병목 지점 발견
 * - 실시간 동기화 성능 측정
 * - 서버 리소스 사용량 모니터링
 */

import http from 'k6/http';
import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// 커스텀 메트릭 정의
const reservationErrors = new Rate('reservation_errors');
const responseTime = new Trend('response_time');
const websocketConnections = new Counter('websocket_connections');

// 테스트 설정
export const options = {
  scenarios: {
    // 시나리오 1: 점진적 부하 증가
    gradual_load: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '2m', target: 10 },   // 2분간 10명까지 증가
        { duration: '5m', target: 10 },   // 5분간 10명 유지
        { duration: '2m', target: 20 },   // 2분간 20명까지 증가
        { duration: '5m', target: 20 },   // 5분간 20명 유지
        { duration: '2m', target: 0 },    // 2분간 0명까지 감소
      ],
      gracefulRampDown: '30s',
    },
    
    // 시나리오 2: 스파이크 테스트 (갑작스런 트래픽 증가)
    spike_test: {
      executor: 'ramping-vus',
      startTime: '16m',
      stages: [
        { duration: '10s', target: 50 },  // 10초 만에 50명
        { duration: '1m', target: 50 },   // 1분간 유지
        { duration: '10s', target: 0 },   // 빠르게 감소
      ],
    },
    
    // 시나리오 3: 예약 충돌 테스트 (동시 예약 시도)
    concurrent_reservations: {
      executor: 'shared-iterations',
      vus: 10,
      iterations: 100,
      startTime: '18m',
      maxDuration: '5m',
    },
    
    // 시나리오 4: WebSocket 연결 테스트
    websocket_load: {
      executor: 'constant-vus',
      vus: 15,
      duration: '3m',
      startTime: '23m',
    }
  },
  
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95%의 요청이 2초 이내
    http_req_failed: ['rate<0.05'],    // 실패율 5% 미만
    reservation_errors: ['rate<0.1'],   // 예약 에러율 10% 미만
    websocket_connections: ['count>10'], // 최소 10개 WebSocket 연결
  }
};

// 테스트 데이터
const testUsers = [
  { name: '테스트유저1', phone: '010-1111-1111' },
  { name: '테스트유저2', phone: '010-2222-2222' },
  { name: '테스트유저3', phone: '010-3333-3333' },
  { name: '부하테스트4', phone: '010-4444-4444' },
  { name: '성능테스트5', phone: '010-5555-5555' },
];

const baseURL = 'http://localhost:3000';

export default function () {
  // 시나리오별 로직 분기
  const scenario = __ENV.K6_SCENARIO || 'gradual_load';
  
  switch (scenario) {
    case 'gradual_load':
      gradualLoadTest();
      break;
    case 'spike_test':
      spikeTest();
      break;
    case 'concurrent_reservations':
      concurrentReservationTest();
      break;
    case 'websocket_load':
      websocketLoadTest();
      break;
    default:
      gradualLoadTest();
  }
}

function gradualLoadTest() {
  console.log('🔄 점진적 부하 테스트 실행 중...');
  
  // 1. 홈페이지 로드 테스트
  const homeResponse = http.get(`${baseURL}/`);
  check(homeResponse, {
    '홈페이지 로드 성공': (r) => r.status === 200,
    '홈페이지 응답 시간 < 2초': (r) => r.timings.duration < 2000,
  });
  
  responseTime.add(homeResponse.timings.duration);
  sleep(1);
  
  // 2. 예약 페이지 로드 테스트
  const reservationResponse = http.get(`${baseURL}/reservations/new`);
  check(reservationResponse, {
    '예약 페이지 로드 성공': (r) => r.status === 200,
    '예약 페이지 응답 시간 < 3초': (r) => r.timings.duration < 3000,
  });
  
  sleep(2);
  
  // 3. API 엔드포인트 테스트
  const apiResponse = http.get(`${baseURL}/api/v2/time-slots`);
  check(apiResponse, {
    'API 응답 성공': (r) => r.status === 200,
    'API 응답 시간 < 1초': (r) => r.timings.duration < 1000,
  });
  
  sleep(1);
}

function spikeTest() {
  console.log('⚡ 스파이크 테스트 (갑작스런 트래픽) 실행 중...');
  
  // 동시에 여러 페이지 요청
  const responses = http.batch([
    ['GET', `${baseURL}/`],
    ['GET', `${baseURL}/reservations`],
    ['GET', `${baseURL}/api/v2/devices`],
    ['GET', `${baseURL}/api/v2/time-slots`],
  ]);
  
  responses.forEach((response, index) => {
    check(response, {
      [`배치 요청 ${index + 1} 성공`]: (r) => r.status === 200,
      [`배치 요청 ${index + 1} 응답 시간 적절`]: (r) => r.timings.duration < 5000,
    });
  });
  
  sleep(0.5); // 짧은 대기 시간으로 부하 증가
}

function concurrentReservationTest() {
  console.log('🎯 동시 예약 충돌 테스트 실행 중...');
  
  const randomUser = testUsers[Math.floor(Math.random() * testUsers.length)];
  const reservationData = {
    deviceType: 'BEMANI',
    timeSlot: '14:00-15:00',
    date: '2025-01-25',
    name: randomUser.name,
    phone: randomUser.phone,
    notes: `K6 부하테스트 - VU${__VU} Iter${__ITER}`
  };
  
  const reservationResponse = http.post(
    `${baseURL}/api/v2/reservations/create`,
    JSON.stringify(reservationData),
    {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'K6-LoadTest/1.0',
      },
    }
  );
  
  const reservationSuccess = check(reservationResponse, {
    '예약 요청 처리됨': (r) => r.status === 200 || r.status === 409, // 409는 충돌로 정상
    '예약 응답 시간 < 3초': (r) => r.timings.duration < 3000,
  });
  
  if (!reservationSuccess) {
    reservationErrors.add(1);
    console.error(`❌ 예약 실패 - VU${__VU}: ${reservationResponse.status} ${reservationResponse.body}`);
  } else if (reservationResponse.status === 409) {
    console.log(`⚠️ 예약 충돌 감지됨 - VU${__VU}: 정상적인 충돌 방지 작동`);
  } else {
    console.log(`✅ 예약 성공 - VU${__VU}: ${randomUser.name}`);
  }
  
  sleep(1);
}

function websocketLoadTest() {
  console.log('🔌 WebSocket 연결 부하 테스트 실행 중...');
  
  const wsURL = 'ws://localhost:3000/api/ws';
  
  const response = ws.connect(wsURL, {}, function (socket) {
    websocketConnections.add(1);
    console.log(`🔗 WebSocket 연결 성공 - VU${__VU}`);
    
    socket.on('open', () => {
      console.log(`📡 WebSocket 열림 - VU${__VU}`);
      
      // 주기적으로 메시지 전송
      socket.send(JSON.stringify({
        type: 'SUBSCRIBE',
        data: { event: 'reservation_updates' }
      }));
    });
    
    socket.on('message', (data) => {
      console.log(`📨 메시지 수신 - VU${__VU}: ${data}`);
    });
    
    socket.on('close', () => {
      console.log(`🔌 WebSocket 연결 종료 - VU${__VU}`);
    });
    
    socket.on('error', (e) => {
      console.error(`❌ WebSocket 에러 - VU${__VU}: ${e.error()}`);
    });
    
    // 30초간 연결 유지
    sleep(30);
  });
  
  check(response, {
    'WebSocket 연결 성공': (r) => r && r.status === 101,
  });
}

// 테스트 완료 후 실행
export function teardown(data) {
  console.log('🏁 K6 부하 테스트 완료');
  console.log('📊 결과 요약:');
  console.log(`- 총 예약 에러율: ${reservationErrors.rate * 100}%`);
  console.log(`- 평균 응답 시간: ${responseTime.avg}ms`);
  console.log(`- WebSocket 연결 수: ${websocketConnections.count}`);
}

// 테스트 시작 전 실행
export function setup() {
  console.log('🚀 K6 부하 테스트 시작');
  console.log('🎯 대상 서버:', baseURL);
  console.log('📈 테스트 시나리오:', __ENV.K6_SCENARIO || 'gradual_load');
  
  // 서버 상태 확인
  const healthCheck = http.get(`${baseURL}/api/health`);
  if (healthCheck.status !== 200) {
    console.error('❌ 서버 상태 확인 실패. 테스트를 중단합니다.');
    return null;
  }
  
  console.log('✅ 서버 상태 정상. 테스트를 시작합니다.');
  return { serverReady: true };
}