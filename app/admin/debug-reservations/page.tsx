// 예약 디버그 페이지 - D1 마이그레이션 중 임시 비활성화
'use client';

import { useState } from 'react';

export default function DebugReservationsPage() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any>(null);

  const testAPI = async () => {
    setTesting(true);
    try {
      const response = await fetch('/api/v2/admin/reservations?limit=10');
      const data = await response.json();
      setResults({
        success: response.ok,
        status: response.status,
        data: data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      setResults({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">예약 디버그</h1>
      
      <div className="space-y-6">
        <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-2">⚠️ D1 마이그레이션 진행 중</h2>
          <p>기존 Supabase 직접 조회 기능은 비활성화되었습니다.</p>
          <p>현재는 API를 통한 데이터 조회만 가능합니다.</p>
        </div>

        <div className="bg-white border border-gray-300 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">API 테스트</h2>
          <button
            onClick={testAPI}
            disabled={testing}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {testing ? '테스트 중...' : '예약 API 테스트'}
          </button>
        </div>

        {results && (
          <div className={`border rounded-lg p-6 ${
            results.success ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
          }`}>
            <h2 className="text-lg font-semibold mb-2">
              {results.success ? '✅ API 테스트 성공' : '❌ API 테스트 실패'}
            </h2>
            <div className="space-y-2 text-sm">
              <p><strong>시간:</strong> {results.timestamp}</p>
              {results.status && <p><strong>상태 코드:</strong> {results.status}</p>}
              {results.error && (
                <p className="text-red-600"><strong>오류:</strong> {results.error}</p>
              )}
            </div>
            
            {results.data && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">응답 데이터:</h3>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                  {JSON.stringify(results.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        <div className="bg-blue-100 border border-blue-300 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-2">대체 기능</h2>
          <p className="mb-4">더 자세한 관리 기능은 메인 관리자 대시보드에서 이용할 수 있습니다:</p>
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