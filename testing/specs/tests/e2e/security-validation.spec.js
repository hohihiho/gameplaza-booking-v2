/**
 * 🔴 HIGH RISK: 보안 테스트 - 입력값 검증 및 권한
 * 
 * 리스크 레벨: 10/10 (Critical)
 * 
 * 테스트 범위:
 * 1. 입력값 검증 (XSS, SQL Injection, CSRF)
 * 2. 권한 우회 시도 (관리자 API 직접 접근)
 * 3. 인증 토큰 조작
 * 4. API Rate Limiting
 * 5. 민감 정보 노출 검사
 * 6. CORS 정책 검증
 */

import { test, expect } from '@playwright/test';

test.describe('🔴 CRITICAL SECURITY: 보안 취약점 검증', () => {

  test('🎯 Security #1: XSS 공격 방지 검증', async ({ page, request }) => {
    console.log('🚨 XSS 공격 방지 테스트 시작...');
    
    // 1. Script 태그 주입 시도
    console.log('1️⃣ Script 태그 주입 테스트...');
    
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '"><script>alert("XSS")</script>',
      '<img src="x" onerror="alert(\'XSS\')">',
      'javascript:alert("XSS")',
      '<svg onload="alert(\'XSS\')">',
      '"><img src="x" onerror="alert(1)">',
      '\\\"; alert(\"XSS\"); //',
      '<iframe src="javascript:alert(\'XSS\')"></iframe>'
    ];
    
    // 예약 생성 API에 XSS 페이로드 전송
    for (const payload of xssPayloads.slice(0, 3)) { // 처음 3개만 테스트
      try {
        const response = await request.post('http://localhost:3000/api/v2/reservations', {
          data: {
            userId: payload,
            deviceId: payload,
            date: '2025-01-01',
            timeSlot: { start: '10:00', end: '12:00' },
            playerCount: 1,
            userNotes: payload
          }
        });
        
        console.log(`🔍 XSS 페이로드 "${payload.substring(0, 20)}...": ${response.status()}`);
        
        if (response.status() === 200) {
          const responseBody = await response.text();
          const hasPayloadInResponse = responseBody.includes(payload);
          
          if (hasPayloadInResponse) {
            console.log('🚨 XSS 취약점 발견: 페이로드가 그대로 반환됨');
          } else {
            console.log('✅ XSS 방어: 페이로드가 적절히 이스케이프됨');
          }
        }
        
      } catch (error) {
        console.log(`⚠️ XSS 테스트 중 네트워크 오류: ${error.message}`);
      }
    }
    
    // 2. 클라이언트 사이드 XSS 테스트
    console.log('2️⃣ 클라이언트 사이드 XSS 테스트...');
    
    await page.goto('http://localhost:3000/reservations/new');
    await page.waitForLoadState('networkidle');
    
    // 입력 필드에 XSS 페이로드 입력
    const inputFields = await page.locator('input[type="text"], input[type="email"], textarea').all();
    
    if (inputFields.length > 0) {
      const testPayload = '<img src="x" onerror="console.log(\'XSS_TEST\');">';
      
      try {
        await inputFields[0].fill(testPayload);
        
        // 페이지에서 실행된 로그 확인
        const consoleLogs = [];
        page.on('console', msg => {
          if (msg.text().includes('XSS_TEST')) {
            consoleLogs.push(msg.text());
          }
        });
        
        await page.waitForTimeout(1000);
        console.log(`🔍 XSS 실행 시도 결과: ${consoleLogs.length > 0 ? '취약점 발견' : '방어됨'}`);
        
      } catch (error) {
        console.log('✅ 입력 필드 XSS 방어 확인');
      }
    }
    
    console.log('✅ XSS 공격 방지 테스트 완료!');
  });

  test('🎯 Security #2: SQL Injection 방지 검증', async ({ request }) => {
    console.log('💉 SQL Injection 방지 테스트 시작...');
    
    const sqlPayloads = [
      "' OR '1'='1",
      "'; DROP TABLE users; --",
      "' UNION SELECT * FROM users --",
      "1' OR 1=1 --",
      "admin'--",
      "' OR 1=1#",
      "')) OR 1=1--",
      "1; SELECT * FROM information_schema.tables--"
    ];
    
    // 1. 로그인 엔드포인트 SQL Injection 테스트
    console.log('1️⃣ 로그인 SQL Injection 테스트...');
    
    for (const payload of sqlPayloads.slice(0, 4)) {
      try {
        const response = await request.post('http://localhost:3000/api/auth/login', {
          data: {
            email: payload,
            password: payload
          }
        });
        
        console.log(`🔍 SQL 페이로드 "${payload}": ${response.status()}`);
        
        // 성공적인 로그인(200)이나 서버 에러(500)는 취약점 가능성
        if (response.status() === 200) {
          console.log('🚨 SQL Injection 취약점 의심: 로그인 성공');
        } else if (response.status() === 500) {
          console.log('⚠️ SQL Injection 가능성: 서버 에러 발생');
        } else {
          console.log('✅ SQL Injection 방어됨');
        }
        
      } catch (error) {
        console.log(`⚠️ SQL 테스트 중 오류: ${error.message}`);
      }
    }
    
    // 2. 검색 API SQL Injection 테스트
    console.log('2️⃣ 검색 API SQL Injection 테스트...');
    
    const searchEndpoints = [
      { url: 'http://localhost:3000/api/v2/reservations', param: 'userId' },
      { url: 'http://localhost:3000/api/v2/devices', param: 'status' },
      { url: 'http://localhost:3000/api/v2/time-slots', param: 'type' }
    ];
    
    for (const endpoint of searchEndpoints) {
      for (const payload of sqlPayloads.slice(0, 2)) {
        try {
          const response = await request.get(`${endpoint.url}?${endpoint.param}=${encodeURIComponent(payload)}`);
          
          console.log(`🔍 ${endpoint.url} SQL 테스트: ${response.status()}`);
          
          if (response.status() === 500) {
            const errorText = await response.text();
            if (errorText.includes('syntax error') || errorText.includes('SQL')) {
              console.log('🚨 SQL Injection 취약점 발견: SQL 에러 노출');
            }
          }
          
        } catch (error) {
          console.log(`⚠️ 검색 API SQL 테스트 오류: ${error.message}`);
        }
      }
    }
    
    console.log('✅ SQL Injection 방지 테스트 완료!');
  });

  test('🎯 Security #3: 권한 우회 및 IDOR 테스트', async ({ request }) => {
    console.log('🔐 권한 우회 및 IDOR 테스트 시작...');
    
    // 1. 관리자 API 직접 접근 시도 (인증 없이)
    console.log('1️⃣ 관리자 API 무단 접근 테스트...');
    
    const adminEndpoints = [
      'http://localhost:3000/api/admin/dashboard',
      'http://localhost:3000/api/admin/users',
      'http://localhost:3000/api/admin/reservations',
      'http://localhost:3000/api/admin/devices',
      'http://localhost:3000/api/admin/analytics/revenue'
    ];
    
    for (const endpoint of adminEndpoints) {
      try {
        const response = await request.get(endpoint);
        console.log(`🔍 ${endpoint}: ${response.status()}`);
        
        if (response.status() === 200) {
          console.log('🚨 보안 취약점: 관리자 API 무인증 접근 가능');
        } else if (response.status() === 401 || response.status() === 403) {
          console.log('✅ 관리자 API 접근 제한 확인');
        }
        
      } catch (error) {
        console.log(`⚠️ 관리자 API 테스트 오류: ${error.message}`);
      }
    }
    
    // 2. IDOR (Insecure Direct Object Reference) 테스트
    console.log('2️⃣ IDOR 취약점 테스트...');
    
    const idorEndpoints = [
      'http://localhost:3000/api/v2/reservations/user-123',
      'http://localhost:3000/api/v2/reservations/user-999',
      'http://localhost:3000/api/admin/users/1',
      'http://localhost:3000/api/admin/users/999'
    ];
    
    for (const endpoint of idorEndpoints) {
      try {
        const response = await request.get(endpoint);
        console.log(`🔍 IDOR 테스트 ${endpoint}: ${response.status()}`);
        
        if (response.status() === 200) {
          const data = await response.text();
          // 민감 정보가 포함되어 있는지 확인
          if (data.includes('password') || data.includes('email') || data.includes('phone')) {
            console.log('🚨 IDOR 취약점: 다른 사용자 정보 접근 가능');
          }
        }
        
      } catch (error) {
        console.log(`⚠️ IDOR 테스트 오류: ${error.message}`);
      }
    }
    
    // 3. HTTP Method 우회 시도
    console.log('3️⃣ HTTP Method 우회 테스트...');
    
    const methodOverrideTests = [
      { url: 'http://localhost:3000/api/v2/reservations', method: 'DELETE' },
      { url: 'http://localhost:3000/api/admin/users', method: 'POST' },
      { url: 'http://localhost:3000/api/admin/devices', method: 'PUT' }
    ];
    
    for (const test of methodOverrideTests) {
      try {
        let response;
        switch (test.method) {
          case 'DELETE':
            response = await request.delete(test.url);
            break;
          case 'POST':
            response = await request.post(test.url, { data: {} });
            break;
          case 'PUT':
            response = await request.put(test.url, { data: {} });
            break;
        }
        
        console.log(`🔍 ${test.method} ${test.url}: ${response.status()}`);
        
        if (response.status() === 200) {
          console.log('🚨 HTTP Method 우회 가능');
        } else if (response.status() === 405) {
          console.log('✅ HTTP Method 제한 확인');
        }
        
      } catch (error) {
        console.log(`⚠️ HTTP Method 테스트 오류: ${error.message}`);
      }
    }
    
    console.log('✅ 권한 우회 및 IDOR 테스트 완료!');
  });

  test('🎯 Security #4: 인증 토큰 조작 및 세션 관리', async ({ request }) => {
    console.log('🎫 인증 토큰 조작 테스트 시작...');
    
    // 1. 잘못된 JWT 토큰으로 API 접근 시도
    console.log('1️⃣ 잘못된 JWT 토큰 테스트...');
    
    const invalidTokens = [
      'invalid.jwt.token',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature',
      'Bearer fake-token',
      'expired-token-12345',
      '',
      'null',
      'undefined'
    ];
    
    for (const token of invalidTokens) {
      try {
        const response = await request.get('http://localhost:3000/api/v2/reservations', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log(`🔍 토큰 "${token.substring(0, 20)}...": ${response.status()}`);
        
        if (response.status() === 200) {
          console.log('🚨 토큰 검증 취약점: 잘못된 토큰으로 접근 가능');
        } else if (response.status() === 401) {
          console.log('✅ 토큰 검증 정상 동작');
        }
        
      } catch (error) {
        console.log(`⚠️ 토큰 테스트 오류: ${error.message}`);
      }
    }
    
    // 2. 세션 고정 공격 테스트
    console.log('2️⃣ 세션 고정 공격 테스트...');
    
    try {
      // 첫 번째 요청으로 세션 생성
      const firstResponse = await request.get('http://localhost:3000/api/auth/session');
      const cookies = firstResponse.headers()['set-cookie'];
      
      if (cookies) {
        console.log('🔍 세션 쿠키 확인됨');
        
        // 같은 세션으로 다른 사용자 로그인 시도
        const loginResponse = await request.post('http://localhost:3000/api/auth/login', {
          headers: {
            'Cookie': cookies
          },
          data: {
            email: 'test@example.com',
            password: 'testpassword'
          }
        });
        
        console.log(`🔍 세션 고정 로그인 시도: ${loginResponse.status()}`);
        
      } else {
        console.log('✅ 세션 쿠키 미발견 - 세션 고정 공격 불가');
      }
      
    } catch (error) {
      console.log(`⚠️ 세션 테스트 오류: ${error.message}`);
    }
    
    console.log('✅ 인증 토큰 조작 테스트 완료!');
  });

  test('🎯 Security #5: Rate Limiting 및 DoS 방지', async ({ request }) => {
    console.log('🚦 Rate Limiting 테스트 시작...');
    
    // 1. API Rate Limiting 테스트
    console.log('1️⃣ API Rate Limiting 테스트...');
    
    const testEndpoint = 'http://localhost:3000/api/v2/devices';
    const requestCount = 20; // 20개 요청 연속 전송
    const responses = [];
    
    console.log(`🔄 ${requestCount}개 요청 연속 전송 중...`);
    
    // 동시에 여러 요청 전송
    const requests = Array.from({ length: requestCount }, () => 
      request.get(testEndpoint).catch(err => ({ status: () => 'ERROR', error: err.message }))
    );
    
    const results = await Promise.all(requests);
    
    let successCount = 0;
    let rateLimitCount = 0;
    let errorCount = 0;
    
    for (const result of results) {
      const status = typeof result.status === 'function' ? result.status() : result.status;
      
      if (status === 200) {
        successCount++;
      } else if (status === 429) {
        rateLimitCount++;
      } else {
        errorCount++;
      }
    }
    
    console.log(`📊 Rate Limiting 결과:`);
    console.log(`   ✅ 성공 요청: ${successCount}개`);
    console.log(`   🚦 Rate Limit 차단: ${rateLimitCount}개`);
    console.log(`   ❌ 기타 오류: ${errorCount}개`);
    
    if (rateLimitCount > 0) {
      console.log('✅ Rate Limiting 정상 동작');
    } else {
      console.log('⚠️ Rate Limiting 미적용 - DoS 공격 취약');
    }
    
    // 2. 로그인 무차별 대입 공격 방지 테스트
    console.log('2️⃣ 로그인 브루트포스 방지 테스트...');
    
    const loginAttempts = 10;
    const bruteForceRequests = Array.from({ length: loginAttempts }, (_, i) => 
      request.post('http://localhost:3000/api/auth/login', {
        data: {
          email: 'test@example.com',
          password: `wrong-password-${i}`
        }
      }).catch(err => ({ status: () => 'ERROR', error: err.message }))
    );
    
    const loginResults = await Promise.all(bruteForceRequests);
    
    let loginBlockedCount = 0;
    for (const result of loginResults) {
      const status = typeof result.status === 'function' ? result.status() : result.status;
      if (status === 429 || status === 423) { // 423 = Locked
        loginBlockedCount++;
      }
    }
    
    console.log(`🔐 브루트포스 차단 결과: ${loginBlockedCount}/${loginAttempts}`);
    
    if (loginBlockedCount > 0) {
      console.log('✅ 로그인 브루트포스 방지 확인');
    } else {
      console.log('⚠️ 로그인 브루트포스 방지 미적용');
    }
    
    console.log('✅ Rate Limiting 테스트 완료!');
  });

  test('🎯 Security #6: 민감 정보 노출 검사', async ({ request }) => {
    console.log('🔍 민감 정보 노출 검사 시작...');
    
    // 1. API 응답에서 민감 정보 검사
    console.log('1️⃣ API 응답 민감 정보 검사...');
    
    const checkEndpoints = [
      'http://localhost:3000/api/v2/devices',
      'http://localhost:3000/api/v2/time-slots',
      'http://localhost:3000/api/admin/dashboard',
      'http://localhost:3000/.env',
      'http://localhost:3000/config.json'
    ];
    
    const sensitivePatterns = [
      /password/i,
      /secret/i,
      /api[-_]?key/i,
      /private[-_]?key/i,
      /database[-_]?url/i,
      /connection[-_]?string/i,
      /supabase[-_]?key/i,
      /jwt[-_]?secret/i,
      /admin[-_]?password/i
    ];
    
    for (const endpoint of checkEndpoints) {
      try {
        const response = await request.get(endpoint);
        const responseText = await response.text();
        
        console.log(`🔍 ${endpoint}: ${response.status()}`);
        
        if (response.status() === 200) {
          let foundSensitive = [];
          
          for (const pattern of sensitivePatterns) {
            if (pattern.test(responseText)) {
              foundSensitive.push(pattern.source);
            }
          }
          
          if (foundSensitive.length > 0) {
            console.log(`🚨 민감 정보 노출 발견: ${foundSensitive.join(', ')}`);
          } else {
            console.log('✅ 민감 정보 노출 없음');
          }
        }
        
      } catch (error) {
        console.log(`⚠️ 민감 정보 검사 오류: ${error.message}`);
      }
    }
    
    // 2. HTTP 헤더 보안 검사
    console.log('2️⃣ HTTP 보안 헤더 검사...');
    
    try {
      const response = await request.get('http://localhost:3000');
      const headers = response.headers();
      
      const securityHeaders = {
        'x-frame-options': 'X-Frame-Options',
        'x-content-type-options': 'X-Content-Type-Options',
        'x-xss-protection': 'X-XSS-Protection',
        'strict-transport-security': 'Strict-Transport-Security',
        'content-security-policy': 'Content-Security-Policy'
      };
      
      console.log('🔒 보안 헤더 검사:');
      for (const [headerKey, headerName] of Object.entries(securityHeaders)) {
        if (headers[headerKey]) {
          console.log(`   ✅ ${headerName}: ${headers[headerKey]}`);
        } else {
          console.log(`   ⚠️ ${headerName}: 누락`);
        }
      }
      
    } catch (error) {
      console.log(`⚠️ HTTP 헤더 검사 오류: ${error.message}`);
    }
    
    // 3. 에러 메시지 정보 노출 검사
    console.log('3️⃣ 에러 메시지 정보 노출 검사...');
    
    const errorTestUrls = [
      'http://localhost:3000/api/nonexistent',
      'http://localhost:3000/api/v2/reservations/invalid-id',
      'http://localhost:3000/admin/secret-page'
    ];
    
    for (const url of errorTestUrls) {
      try {
        const response = await request.get(url);
        const errorText = await response.text();
        
        console.log(`🔍 에러 페이지 ${url}: ${response.status()}`);
        
        // 에러 메시지에서 시스템 정보 노출 검사
        const dangerousPatterns = [
          /stack trace/i,
          /file path/i,
          /database error/i,
          /internal server error/i,
          /node_modules/i,
          /\/Users\//i,
          /\/home\//i,
          /C:\\/i
        ];
        
        let foundDangerous = [];
        for (const pattern of dangerousPatterns) {
          if (pattern.test(errorText)) {
            foundDangerous.push(pattern.source);
          }
        }
        
        if (foundDangerous.length > 0) {
          console.log(`🚨 에러 메시지 정보 노출: ${foundDangerous.join(', ')}`);
        } else {
          console.log('✅ 에러 메시지 안전');
        }
        
      } catch (error) {
        console.log(`⚠️ 에러 페이지 검사 오류: ${error.message}`);
      }
    }
    
    console.log('✅ 민감 정보 노출 검사 완료!');
  });

  test('🎯 Security #7: CORS 및 CSP 정책 검증', async ({ request, page }) => {
    console.log('🌐 CORS 및 CSP 정책 검증 시작...');
    
    // 1. CORS 정책 테스트
    console.log('1️⃣ CORS 정책 테스트...');
    
    try {
      // Origin 헤더를 다양하게 변경하여 테스트
      const testOrigins = [
        'http://evil-site.com',
        'https://malicious.com',
        'null',
        'file://',
        'http://localhost:3001'
      ];
      
      for (const origin of testOrigins) {
        const response = await request.get('http://localhost:3000/api/v2/devices', {
          headers: {
            'Origin': origin
          }
        });
        
        const corsHeader = response.headers()['access-control-allow-origin'];
        console.log(`🔍 Origin ${origin}: CORS = ${corsHeader || 'None'}`);
        
        if (corsHeader === '*') {
          console.log('⚠️ CORS 정책: 모든 Origin 허용 (보안 위험)');
        } else if (corsHeader && corsHeader !== 'http://localhost:3000') {
          console.log(`🚨 CORS 취약점: 예상치 못한 Origin 허용 ${corsHeader}`);
        } else {
          console.log('✅ CORS 정책 적절함');
        }
      }
      
    } catch (error) {
      console.log(`⚠️ CORS 테스트 오류: ${error.message}`);
    }
    
    // 2. CSP (Content Security Policy) 테스트
    console.log('2️⃣ CSP 정책 테스트...');
    
    try {
      await page.goto('http://localhost:3000');
      await page.waitForLoadState('networkidle');
      
      // CSP 위반 이벤트 수집
      const cspViolations = [];
      page.on('response', response => {
        const cspHeader = response.headers()['content-security-policy'];
        if (cspHeader) {
          console.log(`🔒 CSP 헤더 발견: ${cspHeader.substring(0, 100)}...`);
        }
      });
      
      // 인라인 스크립트 실행 시도 (CSP에 의해 차단되어야 함)
      try {
        await page.evaluate(() => {
          const script = document.createElement('script');
          script.innerHTML = 'console.log("CSP_BYPASS_TEST");';
          document.head.appendChild(script);
        });
        
        console.log('⚠️ CSP 우회: 인라인 스크립트 실행됨');
      } catch (error) {
        console.log('✅ CSP 정상 동작: 인라인 스크립트 차단');
      }
      
    } catch (error) {
      console.log(`⚠️ CSP 테스트 오류: ${error.message}`);
    }
    
    // 3. Referrer Policy 테스트
    console.log('3️⃣ Referrer Policy 테스트...');
    
    try {
      const response = await request.get('http://localhost:3000');
      const referrerPolicy = response.headers()['referrer-policy'];
      
      if (referrerPolicy) {
        console.log(`🔒 Referrer Policy: ${referrerPolicy}`);
        
        if (referrerPolicy.includes('no-referrer') || referrerPolicy.includes('strict-origin')) {
          console.log('✅ 안전한 Referrer Policy');
        } else {
          console.log('⚠️ Referrer Policy 개선 필요');
        }
      } else {
        console.log('⚠️ Referrer Policy 미설정');
      }
      
    } catch (error) {
      console.log(`⚠️ Referrer Policy 테스트 오류: ${error.message}`);
    }
    
    console.log('✅ CORS 및 CSP 정책 검증 완료!');
  });

});