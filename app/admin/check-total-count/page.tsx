'use client';

import React, { useState } from 'react';
export default function CheckTotalCountPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>({});

  const checkCounts = async () => {
    setLoading(true);
    const counts: any = {};

    try {
      // API로 예약 데이터 수 확인
      const apiResponse = await fetch('/api/v2/admin/reservations?limit=10000');
      const apiData = await apiResponse.json();
      counts.apiDataCount = apiData.data?.reservations?.length || 0;
      counts.apiTotal = apiData.data?.total || 0;
      counts.apiSuccess = apiResponse.ok;

      // 통계 API도 테스트
      try {
        const statsResponse = await fetch('/api/v2/statistics/reservations');
        const statsData = await statsResponse.json();
        counts.statsData = statsData;
      } catch (statsError) {
        counts.statsError = statsError instanceof Error ? statsError.message : String(statsError);
      }

    } catch (error) {
      console.error('Count check error:', error);
      counts.error = error instanceof Error ? error.message : String(error);
    }

    setResults(counts);
    setLoading(false);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">예약 데이터 전체 카운트 확인</h1>
      
      <button
        onClick={checkCounts}
        disabled={loading}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? '확인 중...' : '카운트 확인'}
      </button>

      {Object.keys(results).length > 0 && (
        <div className="space-y-4">
          <div className="p-4 bg-gray-100 rounded">
            <h2 className="font-bold mb-2">API 상태</h2>
            <p className={results.apiSuccess ? 'text-green-600' : 'text-red-600'}>
              {results.apiSuccess ? '✅ API 정상 동작' : '❌ API 오류'}
            </p>
          </div>

          <div className="p-4 bg-yellow-100 rounded">
            <h2 className="font-bold mb-2">예약 데이터 카운트</h2>
            <p>실제 받은 데이터: {results.apiDataCount}개</p>
            <p>API가 보고한 total: {results.apiTotal}</p>
            {results.apiDataCount > 1000 && <p className="text-orange-600">⚠️ 데이터가 1000개를 초과합니다!</p>}
          </div>

          {results.statsData && (
            <div className="p-4 bg-blue-100 rounded">
              <h2 className="font-bold mb-2">통계 데이터</h2>
              <pre className="text-sm overflow-x-auto">
                {JSON.stringify(results.statsData, null, 2)}
              </pre>
            </div>
          )}

          {results.error && (
            <div className="p-4 bg-red-100 rounded">
              <h2 className="font-bold mb-2 text-red-800">오류</h2>
              <p className="text-red-600">{results.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}