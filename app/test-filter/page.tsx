'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';

export default function TestFilterPage() {
  const { data: session } = useSession();
  const [text, setText] = useState('');
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testExamples = {
    korean: [
      '안녕하세요',
      '시발',
      'ㅅㅂ',
      '씨1발',
      '개새끼',
      '병신',
      '좋은 하루 되세요'
    ],
    english: [
      'Hello world',
      'fuck',
      'f@ck',
      'sh1t',
      'b!tch',
      'asshole',
      'Nice to meet you'
    ],
    mixed: [
      '씨발 fuck',
      'hello 개새끼',
      'www.spam.com',
      'test@email.com',
      '010-1234-5678'
    ]
  };

  const checkText = async () => {
    if (!text.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/moderation/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          context: 'nickname'
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error:', error);
      setResult({ error: '검사 중 오류가 발생했습니다' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>로그인이 필요합니다</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-5">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-8 dark:text-white">
          비속어 필터 테스트 페이지
        </h1>

        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 mb-6">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 dark:text-white">
              테스트할 텍스트
            </label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && checkText()}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white dark:bg-gray-800 dark:text-white"
              placeholder="검사할 텍스트를 입력하세요"
            />
          </div>
          
          <button
            onClick={checkText}
            disabled={isLoading || !text.trim()}
            className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '검사 중...' : '검사하기'}
          </button>
        </div>

        {result && (
          <div className={`bg-white dark:bg-gray-900 rounded-xl p-6 border ${
            result.valid 
              ? 'border-green-500' 
              : 'border-red-500'
          } mb-6`}>
            <h3 className="font-semibold mb-2 dark:text-white">
              검사 결과
            </h3>
            <div className="space-y-2">
              <p className={`font-medium ${
                result.valid ? 'text-green-600' : 'text-red-600'
              }`}>
                {result.valid ? '✅ 사용 가능' : '❌ 사용 불가'}
              </p>
              {result.reason && (
                <p className="text-gray-600 dark:text-gray-400">
                  이유: {result.reason}
                </p>
              )}
              {result.severity && (
                <p className="text-gray-600 dark:text-gray-400">
                  심각도: {result.severity}
                </p>
              )}
              {result.categories && (
                <p className="text-gray-600 dark:text-gray-400">
                  카테고리: {result.categories.join(', ')}
                </p>
              )}
              {result.message && (
                <p className="text-gray-600 dark:text-gray-400">
                  {result.message}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-3 dark:text-white">
              한국어 테스트 예시
            </h3>
            <div className="flex flex-wrap gap-2">
              {testExamples.korean.map((example) => (
                <button
                  key={example}
                  onClick={() => setText(example)}
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors dark:text-white"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3 dark:text-white">
              영어 테스트 예시
            </h3>
            <div className="flex flex-wrap gap-2">
              {testExamples.english.map((example) => (
                <button
                  key={example}
                  onClick={() => setText(example)}
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors dark:text-white"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3 dark:text-white">
              혼합/스팸 테스트 예시
            </h3>
            <div className="flex flex-wrap gap-2">
              {testExamples.mixed.map((example) => (
                <button
                  key={example}
                  onClick={() => setText(example)}
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors dark:text-white"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
            필터링 시스템 정보
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
            <li>• 한국어 비속어: 자음/모음 분해, 유사음 변형 감지</li>
            <li>• 영어 비속어: Leetspeak, 특수문자 치환 감지</li>
            <li>• 스팸 필터: URL, 이메일, 전화번호 차단</li>
            <li>• 관리자 금지어: 실시간 추가/삭제 가능</li>
            <li>• 완전 무료 - API 비용 없음!</li>
          </ul>
        </div>
      </div>
    </div>
  );
}