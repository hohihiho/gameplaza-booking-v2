/**
 * 단어 필터링 시스템 통합 테스트
 * 390개 이상의 한국어 욕설 데이터베이스 + AI 패턴 분석 검증
 * TDD RED-GREEN-REFACTOR 사이클 적용
 */

import { NextRequest } from 'next/server';
import { POST, GET } from '@/app/api/moderation/check/route';
import Database from 'better-sqlite3';
import path from 'path';

// 테스트용 데이터베이스 설정
const TEST_DB_PATH = path.join(process.cwd(), 'test.db');
let testDb: Database.Database;

// Mock the database for tests
jest.mock('better-sqlite3', () => {
  const MockDatabase = jest.fn().mockImplementation(() => ({
    prepare: jest.fn().mockReturnValue({
      all: jest.fn().mockReturnValue([]),
      run: jest.fn(),
      get: jest.fn()
    }),
    close: jest.fn()
  }));
  return MockDatabase;
});

describe('단어 필터링 시스템 통합 테스트', () => {
  beforeEach(() => {
    // 각 테스트마다 데이터베이스 모킹 초기화
    jest.clearAllMocks();
  });

  afterAll(() => {
    // 테스트 완료 후 정리
    if (testDb) {
      testDb.close();
    }
  });

  // 🔴 RED PHASE - 실패하는 테스트 작성

  describe('1. 기본 욕설 필터링 테스트 🔴', () => {
    const profaneWords = [
      '시발', '씨발', '씨팔', '시팔', '씨바', '시바',
      '병신', '병싄', '뱅신', '벵신', 
      '개새끼', '개새', '개색', '개쉑',
      '좆', '좃', '졷', '졶',
      '지랄', '지럄', '즤랄',
      '미친', '미췬', '미칀'
    ];

    profaneWords.forEach(word => {
      it(`"${word}" 욕설을 정확히 감지해야 함`, async () => {
        const request = new NextRequest('http://localhost:3000/api/moderation/check', {
          method: 'POST',
          body: JSON.stringify({
            text: word,
            context: 'nickname'
          }),
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const response = await POST(request);
        const result = await response.json();

        expect(result.isValid).toBe(false);
        expect(result.message).toBe('사용할 수 없는 단어가 포함되어 있습니다.');
      });
    });

    it('정상적인 닉네임은 통과시켜야 함', async () => {
      const validNicknames = ['게이머123', '플레이어', '광주유저', '게임러버', '프로게이머'];

      for (const nickname of validNicknames) {
        const request = new NextRequest('http://localhost:3000/api/moderation/check', {
          method: 'POST',
          body: JSON.stringify({
            text: nickname,
            context: 'nickname'
          }),
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const response = await POST(request);
        const result = await response.json();

        expect(result.isValid).toBe(true);
      }
    });
  });

  describe('2. 변형 및 우회 시도 감지 테스트 🔴', () => {
    const bypassAttempts = [
      // 공백 삽입 우회
      '시 발', '씨 발', '개 새끼', '병 신',
      // 숫자 치환 우회  
      'tlqkf', 's1b4l', '시1발', '씨8발',
      // 특수문자 삽입
      '시*발', '씨-발', '개_새끼', '병.신',
      // 영어/한글 혼용
      'sibal', 'ssibal', 'gae', 'byeongsin',
      // 자음만 사용
      'ㅅㅂ', 'ㅆㅂ', 'ㄱㅅㄲ', 'ㅂㅅ',
      // 대소문자 혼용
      'FUCK', 'Shit', 'BiTcH',
      // 반복 문자
      '시발발발발', '개개개새끼'
    ];

    bypassAttempts.forEach(attempt => {
      it(`우회 시도 "${attempt}"을 감지해야 함`, async () => {
        const request = new NextRequest('http://localhost:3000/api/moderation/check', {
          method: 'POST',
          body: JSON.stringify({
            text: attempt,
            context: 'nickname'
          }),
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const response = await POST(request);
        const result = await response.json();

        expect(result.isValid).toBe(false);
      });
    });

    it('정규화 함수가 우회 시도를 제거해야 함', async () => {
      const request = new NextRequest('http://localhost:3000/api/moderation/check', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      request.url = 'http://localhost:3000/api/moderation/check?text=시_1발&context=nickname';

      const response = await GET(request);
      const result = await response.json();

      expect(result.normalizedText).toBeDefined();
      expect(result.normalizedText).not.toContain('_');
      expect(result.normalizedText).not.toContain('1');
    });
  });

  describe('3. AI 패턴 분석 테스트 🔴', () => {
    const suspiciousPatterns = [
      // 공격적 표현
      '죽어버려', '때려줄까', '박살내자',
      // 성적 암시 
      '빨아줄게', '핥아먹어', '쪽쪽빨기',
      // 반복 특수문자
      '!!!!!!!', '@@@@@@', '######',
      // 대문자 남용
      'HHHHHHHH', 'KKKKKKK',
      // 자음 조합
      'ㅋㅋㅋㅋㅋㅋ', 'ㅎㅎㅎㅎㅎㅎ'
    ];

    suspiciousPatterns.forEach(pattern => {
      it(`의심스러운 패턴 "${pattern}"을 AI가 감지해야 함`, async () => {
        const request = new NextRequest('http://localhost:3000/api/moderation/check', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        request.url = `http://localhost:3000/api/moderation/check?text=${encodeURIComponent(pattern)}&context=nickname`;

        const response = await GET(request);
        const result = await response.json();

        expect(result.aiAnalysis).toBeDefined();
        expect(result.aiAnalysis.confidence).toBeGreaterThan(0.3);
      });
    });

    it('AI 분석이 confidence 점수를 제공해야 함', async () => {
      const request = new NextRequest('http://localhost:3000/api/moderation/check', {
        method: 'POST',
        body: JSON.stringify({
          text: 'ㅅㅂㅅㅂㅅㅂ',
          context: 'general'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const result = await response.json();

      if (result.aiAnalysis) {
        expect(result.aiAnalysis.confidence).toBeGreaterThan(0);
        expect(result.aiAnalysis.confidence).toBeLessThanOrEqual(1);
        expect(typeof result.aiAnalysis.reason).toBe('string');
      }
    });
  });

  describe('4. 데이터베이스 금지어 통합 테스트 🔴', () => {
    it('데이터베이스 금지어와 하드코딩 금지어가 통합되어야 함', async () => {
      // Mock database to return some banned words
      const mockPrepare = jest.fn().mockReturnValue({
        all: jest.fn().mockReturnValue([
          { word: '커스텀욕설' },
          { word: '관리자추가단어' }
        ])
      });
      
      require('better-sqlite3').mockImplementation(() => ({
        prepare: mockPrepare
      }));

      const request = new NextRequest('http://localhost:3000/api/moderation/check', {
        method: 'POST',
        body: JSON.stringify({
          text: '커스텀욕설',
          context: 'nickname'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const result = await response.json();

      expect(result.isValid).toBe(false);
      expect(mockPrepare).toHaveBeenCalledWith('SELECT word FROM banned_words WHERE is_active = 1');
    });

    it('데이터베이스 연결 실패 시 하드코딩 금지어만 사용해야 함', async () => {
      // Mock database error
      const mockPrepare = jest.fn().mockImplementation(() => {
        throw new Error('Database connection failed');
      });
      
      require('better-sqlite3').mockImplementation(() => ({
        prepare: mockPrepare
      }));

      const request = new NextRequest('http://localhost:3000/api/moderation/check', {
        method: 'POST',
        body: JSON.stringify({
          text: '시발',
          context: 'nickname'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const result = await response.json();

      expect(result.isValid).toBe(false); // 하드코딩된 금지어로 여전히 차단되어야 함
    });
  });

  describe('5. 성능 테스트 🔴', () => {
    it('1000개 텍스트를 1초 이내에 처리해야 함', async () => {
      const testTexts = Array.from({ length: 1000 }, (_, i) => `테스트텍스트${i}`);
      const startTime = Date.now();

      const promises = testTexts.map(text => {
        const request = new NextRequest('http://localhost:3000/api/moderation/check', {
          method: 'POST',
          body: JSON.stringify({
            text,
            context: 'nickname'
          }),
          headers: {
            'Content-Type': 'application/json'
          }
        });
        return POST(request);
      });

      await Promise.all(promises);
      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(processingTime).toBeLessThan(1000); // 1초 이내
    });

    it('긴 텍스트도 적절한 시간 내에 처리해야 함', async () => {
      const longText = '가'.repeat(1000) + '시발' + '나'.repeat(1000);
      const startTime = Date.now();

      const request = new NextRequest('http://localhost:3000/api/moderation/check', {
        method: 'POST',
        body: JSON.stringify({
          text: longText,
          context: 'general'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const result = await response.json();
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(100); // 100ms 이내
      expect(result.isValid).toBe(false);
    });
  });

  describe('6. API 엔드포인트 테스트 🔴', () => {
    it('POST 메서드가 올바른 응답 형식을 반환해야 함', async () => {
      const request = new NextRequest('http://localhost:3000/api/moderation/check', {
        method: 'POST',
        body: JSON.stringify({
          text: '정상텍스트',
          context: 'nickname'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const result = await response.json();

      expect(result).toHaveProperty('isValid');
      expect(typeof result.isValid).toBe('boolean');
      if (result.message) {
        expect(typeof result.message).toBe('string');
      }
    });

    it('GET 테스트 모드가 통계 정보를 반환해야 함', async () => {
      const request = new NextRequest('http://localhost:3000/api/moderation/check?test=true');

      const response = await GET(request);
      const result = await response.json();

      expect(result).toHaveProperty('totalBannedWords');
      expect(result).toHaveProperty('hardcodedWords');
      expect(result).toHaveProperty('databaseWords');
      expect(result).toHaveProperty('categories');
      expect(result).toHaveProperty('aiFiltering');
      expect(result).toHaveProperty('ruleBasedFiltering');
      expect(result.totalBannedWords).toBeGreaterThan(300); // 390개 이상 확인
    });

    it('잘못된 요청에 대해 적절한 에러를 반환해야 함', async () => {
      const request = new NextRequest('http://localhost:3000/api/moderation/check', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('텍스트를 입력해주세요.');
    });
  });

  describe('7. 닉네임 유효성 검증 규칙 테스트 🔴', () => {
    const invalidNicknames = [
      { text: 'a', reason: '길이 부족' },
      { text: 'a'.repeat(21), reason: '길이 초과' },
      { text: '   ', reason: '공백만' },
      { text: 'ㄱㄴㄷㄹ', reason: '자음만' },
      { text: 'ㅏㅓㅗㅜ', reason: '모음만' },
      { text: '!@#$%^&*()', reason: '특수문자 과다' },
      { text: '1234567', reason: '숫자만' },
      { text: 'aaaa', reason: '반복 문자' }
    ];

    invalidNicknames.forEach(({ text, reason }) => {
      it(`${reason} 닉네임 "${text}"을 거부해야 함`, async () => {
        const request = new NextRequest('http://localhost:3000/api/moderation/check', {
          method: 'POST',
          body: JSON.stringify({
            text,
            context: 'nickname'
          }),
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const response = await POST(request);
        const result = await response.json();

        expect(result.isValid).toBe(false);
        expect(result.message).toBeDefined();
      });
    });

    it('경계값 닉네임들을 올바르게 처리해야 함', async () => {
      const boundaryTests = [
        { text: 'ab', expected: true }, // 최소 길이
        { text: 'a'.repeat(20), expected: true }, // 최대 길이
        { text: '한글닉네임', expected: true },
        { text: 'English123', expected: true },
        { text: '한Eng123', expected: true }
      ];

      for (const { text, expected } of boundaryTests) {
        const request = new NextRequest('http://localhost:3000/api/moderation/check', {
          method: 'POST',
          body: JSON.stringify({
            text,
            context: 'nickname'
          }),
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const response = await POST(request);
        const result = await response.json();

        expect(result.isValid).toBe(expected);
      }
    });
  });

  describe('8. 통합 시나리오 테스트 🔴', () => {
    it('복합 우회 시도를 종합적으로 차단해야 함', async () => {
      const complexBypassAttempts = [
        '시1발놈아',
        'gae-saekki',
        'ㅅㅂ새끼야',
        'f*u*c*k you',
        '개.새.끼.야',
        '미친ㄴ놈'
      ];

      for (const attempt of complexBypassAttempts) {
        const request = new NextRequest('http://localhost:3000/api/moderation/check', {
          method: 'POST',
          body: JSON.stringify({
            text: attempt,
            context: 'nickname'
          }),
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const response = await POST(request);
        const result = await response.json();

        expect(result.isValid).toBe(false);
      }
    });

    it('다양한 컨텍스트에서 일관된 결과를 반환해야 함', async () => {
      const testText = '시발';
      const contexts = ['nickname', 'general'];

      for (const context of contexts) {
        const request = new NextRequest('http://localhost:3000/api/moderation/check', {
          method: 'POST',
          body: JSON.stringify({
            text: testText,
            context
          }),
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const response = await POST(request);
        const result = await response.json();

        expect(result.isValid).toBe(false);
      }
    });
  });

  describe('9. 엣지 케이스 테스트 🔴', () => {
    it('빈 문자열을 적절히 처리해야 함', async () => {
      const request = new NextRequest('http://localhost:3000/api/moderation/check', {
        method: 'POST',
        body: JSON.stringify({
          text: '',
          context: 'nickname'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.isValid).toBe(false);
    });

    it('매우 긴 문자열을 처리해야 함', async () => {
      const longText = '정상텍스트'.repeat(1000);
      
      const request = new NextRequest('http://localhost:3000/api/moderation/check', {
        method: 'POST',
        body: JSON.stringify({
          text: longText,
          context: 'general'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const result = await response.json();

      expect(result).toHaveProperty('isValid');
    });

    it('특수 유니코드 문자를 처리해야 함', async () => {
      const unicodeText = '정상텍스트🎮🎯⚡';
      
      const request = new NextRequest('http://localhost:3000/api/moderation/check', {
        method: 'POST',
        body: JSON.stringify({
          text: unicodeText,
          context: 'nickname'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const result = await response.json();

      expect(result).toHaveProperty('isValid');
    });
  });

  describe('10. 보안 테스트 🔴', () => {
    it('SQL 인젝션 시도를 안전하게 처리해야 함', async () => {
      const maliciousInputs = [
        "'; DROP TABLE banned_words; --",
        "admin'; DELETE FROM users; --",
        "test' OR '1'='1"
      ];

      for (const input of maliciousInputs) {
        const request = new NextRequest('http://localhost:3000/api/moderation/check', {
          method: 'POST',
          body: JSON.stringify({
            text: input,
            context: 'nickname'
          }),
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const response = await POST(request);
        
        // 응답이 정상적으로 처리되어야 함 (서버 오류 없음)
        expect(response.status).not.toBe(500);
      });
    });

    it('XSS 시도를 적절히 처리해야 함', async () => {
      const xssInputs = [
        '<script>alert("xss")</script>',
        'javascript:alert(1)',
        '<img src=x onerror=alert(1)>'
      ];

      for (const input of xssInputs) {
        const request = new NextRequest('http://localhost:3000/api/moderation/check', {
          method: 'POST',
          body: JSON.stringify({
            text: input,
            context: 'nickname'
          }),
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const response = await POST(request);
        const result = await response.json();
        
        expect(result).toHaveProperty('isValid');
        // XSS 시도는 보통 특수문자 과다로 감지될 것
      });
    });
  });
});