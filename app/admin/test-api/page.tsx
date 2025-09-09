// API 테스트 페이지 - D1 마이그레이션 중 API 테스트
'use client';

import { useState } from 'react';

export default function TestApiPage() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const testAPIs = async () => {
    setTesting(true);
    setResults([]);
    
    const tests = [
      { name: '예약 목록', url: '/api/v2/admin/reservations?limit=5' },
      { name: '기기 목록', url: '/api/v2/devices' },
      { name: '체크인 목록', url: '/api/v2/checkins?limit=5' },
      { name: '통계 - 예약', url: '/api/v2/statistics/reservations' },
      { name: '사용자 목록', url: '/api/v2/statistics/users' },
    ];

    const testResults = [];
    
    for (const test of tests) {
      try {
        const startTime = Date.now();
        const response = await fetch(test.url);
        const endTime = Date.now();
        const data = await response.json();
        
        testResults.push({
          ...test,
          success: response.ok,
          status: response.status,
          responseTime: endTime - startTime,
          data: data,
          error: null
        });
      } catch (error) {
        testResults.push({
          ...test,
          success: false,
          status: 0,
          responseTime: 0,
          data: null,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    setResults(testResults);
    setTesting(false);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">API 테스트</h1>
      
      <div className="space-y-6">
        <div className="bg-blue-100 border border-blue-300 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">D1 API 테스트</h2>
          <p className="text-gray-700 mb-4">
            D1 마이그레이션 후 API 엔드포인트들의 동작을 테스트합니다.
          </p>
          <button
            onClick={testAPIs}
            disabled={testing}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {testing ? '테스트 중...' : '전체 API 테스트 시작'}
          </button>
        </div>

        {results.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">테스트 결과</h2>
            {results.map((result, index) => (
              <div 
                key={index}
                className={`border rounded-lg p-4 ${
                  result.success 
                    ? 'bg-green-50 border-green-300' 
                    : 'bg-red-50 border-red-300'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold">
                    {result.success ? '✅' : '❌'} {result.name}
                  </h3>
                  <div className="text-sm text-gray-600">
                    {result.status} • {result.responseTime}ms
                  </div>
                </div>
                
                <div className="text-sm text-gray-600 mb-2">
                  <strong>URL:</strong> {result.url}
                </div>
                
                {result.error && (
                  <div className="text-sm text-red-600 mb-2">
                    <strong>오류:</strong> {result.error}
                  </div>
                )}
                
                {result.data && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm font-medium">
                      응답 데이터 보기
                    </summary>
                    <pre className="mt-2 bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="bg-gray-100 border border-gray-300 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-2">관리자 기능</h2>
          <p className="text-gray-700 mb-4">
            더 자세한 관리 기능은 메인 관리자 대시보드에서 이용할 수 있습니다:
          </p>
          <a 
            href="/admin" 
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            관리자 대시보드로 이동
          </a>
        </div>
      </div>
    </div>
  );
}