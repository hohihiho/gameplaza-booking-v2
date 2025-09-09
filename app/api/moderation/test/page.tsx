'use client';

import { useState } from 'react';

export default function ModerationTestPage() {
  const [text, setText] = useState('');
  const [context, setContext] = useState('nickname');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState<any>(null);

  const testText = async () => {
    if (!text.trim()) {
      alert('텍스트를 입력해주세요');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/moderation/check?text=${encodeURIComponent(text)}&context=${context}`,
        { method: 'GET' }
      );
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('테스트 오류:', error);
      alert('테스트 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/moderation/check?test=true');
      const data = await response.json();
      setStats(data);
      setShowStats(true);
    } catch (error) {
      console.error('통계 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const testExamples = [
    '시발',
    '씨발',
    'ㅅㅂ',
    'tlqkf',
    '관리자',
    'admin',
    '정상닉네임',
    'ㅁㅊ',
    '병신',
    'ㅂㅅ',
    '개새끼',
    '좆같',
    '정상_닉네임123',
    '시1발',
    '씌발'
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">단어 필터링 테스트</h1>

        {/* 입력 폼 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">테스트할 텍스트</label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="검사할 텍스트를 입력하세요"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">검증 컨텍스트</label>
            <select
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="nickname">닉네임</option>
              <option value="general">일반 텍스트</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={testText}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? '검사 중...' : '검사하기'}
            </button>
            <button
              onClick={loadStats}
              disabled={loading}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:opacity-50"
            >
              통계 보기
            </button>
          </div>
        </div>

        {/* 예제 버튼들 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="font-semibold mb-3">빠른 테스트 예제</h3>
          <div className="flex flex-wrap gap-2">
            {testExamples.map((example) => (
              <button
                key={example}
                onClick={() => {
                  setText(example);
                  setContext('nickname');
                }}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-sm"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        {/* 검사 결과 */}
        {result && (
          <div className={`bg-white rounded-lg shadow p-6 mb-6 ${result.isValid ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'}`}>
            <h3 className="font-semibold mb-3">검사 결과</h3>
            
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="font-medium w-32">상태:</span>
                <span className={result.isValid ? 'text-green-600' : 'text-red-600'}>
                  {result.isValid ? '✅ 사용 가능' : '❌ 사용 불가'}
                </span>
              </div>
              
              {result.message && (
                <div className="flex items-start">
                  <span className="font-medium w-32">메시지:</span>
                  <span>{result.message}</span>
                </div>
              )}
              
              {result.testedText && (
                <div className="flex items-start">
                  <span className="font-medium w-32">입력 텍스트:</span>
                  <span className="font-mono bg-gray-100 px-2 py-1 rounded">{result.testedText}</span>
                </div>
              )}
              
              {result.normalizedText && (
                <div className="flex items-start">
                  <span className="font-medium w-32">정규화 텍스트:</span>
                  <span className="font-mono bg-gray-100 px-2 py-1 rounded">{result.normalizedText}</span>
                </div>
              )}
              
              {result.detectedWords && (
                <div className="flex items-start">
                  <span className="font-medium w-32">감지된 금지어:</span>
                  <div className="flex flex-wrap gap-1">
                    {result.detectedWords.map((word: string, idx: number) => (
                      <span key={idx} className="bg-red-100 text-red-700 px-2 py-1 rounded text-sm">
                        {word}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {result.validations && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="font-medium mb-2">상세 검증 결과</h4>
                  <div className="space-y-1 text-sm">
                    <div>길이 체크 (2-20자): {result.validations.lengthCheck ? '✅' : '❌'}</div>
                    <div>자음/모음만: {result.validations.hasOnlyConsonantsOrVowels ? '❌ 자음/모음만 있음' : '✅'}</div>
                    <div>특수문자 과다: {result.validations.hasTooManySpecialChars ? '❌ 특수문자 과다' : '✅'}</div>
                    <div>반복 문자: {result.validations.hasRepeatedChars ? '❌ 반복 문자 있음' : '✅'}</div>
                    <div>숫자만: {result.validations.isOnlyNumbers ? '❌ 숫자만 있음' : '✅'}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 통계 */}
        {showStats && stats && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-3">금지어 통계</h3>
            
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="font-medium w-32">전체 금지어:</span>
                <span className="font-bold text-lg">{stats.totalBannedWords}개</span>
              </div>
              
              <div className="mt-4">
                <h4 className="font-medium mb-2">카테고리별 분포</h4>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>관리자 관련:</span>
                    <span>{stats.categories.admin}개</span>
                  </div>
                  <div className="flex justify-between">
                    <span>욕설:</span>
                    <span>{stats.categories.profanity}개</span>
                  </div>
                  <div className="flex justify-between">
                    <span>성적 표현:</span>
                    <span>{stats.categories.sexual}개</span>
                  </div>
                  <div className="flex justify-between">
                    <span>공격적 표현:</span>
                    <span>{stats.categories.offensive}개</span>
                  </div>
                </div>
              </div>
              
              {stats.sampleWords && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">샘플 금지어 (처음 10개)</h4>
                  <div className="flex flex-wrap gap-1">
                    {stats.sampleWords.map((word: string, idx: number) => (
                      <span key={idx} className="bg-gray-100 px-2 py-1 rounded text-sm">
                        {word}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="mt-4 pt-4 border-t text-sm text-gray-600">
                <p>API 엔드포인트: {stats.testEndpoint}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}