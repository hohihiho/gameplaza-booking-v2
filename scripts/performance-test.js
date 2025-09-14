#!/usr/bin/env node

/**
 * 게임플라자 V3 API 성능 테스트 스크립트
 *
 * V2 대비 V3의 성능 개선을 측정합니다.
 */

const baseUrl = 'http://localhost:3000';

// 테스트할 API 엔드포인트들
const testEndpoints = [
  { name: 'Health Check', url: '/api/v2/health/db', method: 'GET' },
  { name: 'Ready Check', url: '/api/v2/ready', method: 'GET' },
  { name: 'Metrics', url: '/api/v2/metrics', method: 'GET' },
  { name: 'Statistics - Devices', url: '/api/v2/statistics/devices', method: 'GET' },
  { name: 'Statistics - Reservations', url: '/api/v2/statistics/reservations', method: 'GET' },
  { name: 'Statistics - Users', url: '/api/v2/statistics/users', method: 'GET' },
];

// V3 API 엔드포인트들 (비교용)
const v3Endpoints = [
  { name: 'V3 Reservations', url: '/api/v3/reservations', method: 'GET' },
  { name: 'V3 Admin', url: '/api/v3/admin', method: 'GET' },
];

/**
 * API 호출 및 성능 측정
 */
async function measureApiPerformance(endpoint, iterations = 5) {
  const results = [];

  console.log(`🔍 Testing ${endpoint.name} (${iterations} iterations)...`);

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();

    try {
      const response = await fetch(`${baseUrl}${endpoint.url}`, {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const duration = performance.now() - start;

      results.push({
        iteration: i + 1,
        status: response.status,
        duration: Math.round(duration),
        success: response.ok
      });

      // 응답 본문 읽기 (성능에 포함)
      await response.text();

    } catch (error) {
      const duration = performance.now() - start;
      results.push({
        iteration: i + 1,
        status: 'ERROR',
        duration: Math.round(duration),
        success: false,
        error: error.message
      });
    }

    // 요청 간 100ms 대기
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return results;
}

/**
 * 성능 통계 계산
 */
function calculateStats(results) {
  const durations = results.map(r => r.duration);
  const successCount = results.filter(r => r.success).length;

  durations.sort((a, b) => a - b);

  return {
    avg: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
    min: durations[0],
    max: durations[durations.length - 1],
    p95: durations[Math.floor(durations.length * 0.95)] || durations[durations.length - 1],
    p99: durations[Math.floor(durations.length * 0.99)] || durations[durations.length - 1],
    successRate: ((successCount / results.length) * 100).toFixed(1),
    totalRequests: results.length
  };
}

/**
 * 메인 테스트 실행
 */
async function runPerformanceTest() {
  console.log('🚀 게임플라자 성능 테스트 시작\n');
  console.log(`기준 URL: ${baseUrl}`);
  console.log(`테스트 시간: ${new Date().toLocaleString('ko-KR')}\n`);

  const allResults = {};

  // 기본 엔드포인트 테스트
  for (const endpoint of testEndpoints) {
    try {
      const results = await measureApiPerformance(endpoint, 5);
      const stats = calculateStats(results);
      allResults[endpoint.name] = { results, stats };

      console.log(`✅ ${endpoint.name}:`);
      console.log(`   평균: ${stats.avg}ms, P95: ${stats.p95}ms, 성공률: ${stats.successRate}%\n`);
    } catch (error) {
      console.log(`❌ ${endpoint.name}: 테스트 실패 - ${error.message}\n`);
    }
  }

  // V3 엔드포인트 테스트 (인증 없이 테스트 가능한 것만)
  console.log('🔬 V3 API 성능 테스트...\n');

  for (const endpoint of v3Endpoints) {
    try {
      const results = await measureApiPerformance(endpoint, 3);
      const stats = calculateStats(results);
      allResults[endpoint.name] = { results, stats };

      console.log(`✅ ${endpoint.name}:`);
      console.log(`   평균: ${stats.avg}ms, P95: ${stats.p95}ms, 성공률: ${stats.successRate}%\n`);
    } catch (error) {
      console.log(`❌ ${endpoint.name}: 테스트 실패 - ${error.message}\n`);
    }
  }

  // 성능 리포트 생성
  console.log('📊 성능 테스트 결과 요약\n');
  console.log('═'.repeat(80));
  console.log('| 엔드포인트                    | 평균응답 | P95응답 | P99응답 | 성공률 |');
  console.log('═'.repeat(80));

  Object.entries(allResults).forEach(([name, data]) => {
    const stats = data.stats;
    console.log(
      `| ${name.padEnd(28)} | ${String(stats.avg).padStart(6)}ms | ${String(stats.p95).padStart(5)}ms | ${String(stats.p99).padStart(5)}ms | ${String(stats.successRate).padStart(4)}% |`
    );
  });

  console.log('═'.repeat(80));

  // 성능 기준 평가
  console.log('\n🎯 성능 기준 평가:');

  const performanceThresholds = {
    excellent: 100,
    good: 200,
    acceptable: 500,
    poor: 1000
  };

  Object.entries(allResults).forEach(([name, data]) => {
    const avgTime = data.stats.avg;
    let rating;

    if (avgTime < performanceThresholds.excellent) rating = '🟢 Excellent';
    else if (avgTime < performanceThresholds.good) rating = '🔵 Good';
    else if (avgTime < performanceThresholds.acceptable) rating = '🟡 Acceptable';
    else if (avgTime < performanceThresholds.poor) rating = '🟠 Poor';
    else rating = '🔴 Critical';

    console.log(`   ${name}: ${rating} (${avgTime}ms)`);
  });

  // 성능 지표 요약
  const allStats = Object.values(allResults).map(r => r.stats);
  const overallAvg = Math.round(
    allStats.reduce((sum, stat) => sum + stat.avg, 0) / allStats.length
  );

  console.log('\n🏆 전체 성능 요약:');
  console.log(`   평균 응답시간: ${overallAvg}ms`);
  console.log(`   테스트 완료: ${new Date().toLocaleString('ko-KR')}`);

  // D1 마이그레이션 성과 평가
  if (overallAvg < 200) {
    console.log('\n✨ D1 마이그레이션 성공! 목표 성능(200ms 이하) 달성');
  } else if (overallAvg < 500) {
    console.log('\n👍 D1 마이그레이션 양호. 추가 최적화 권장');
  } else {
    console.log('\n⚠️ D1 마이그레이션 성능 점검 필요');
  }
}

// 스크립트 실행
if (require.main === module) {
  runPerformanceTest().catch(console.error);
}

module.exports = { measureApiPerformance, calculateStats };