'use client';

import React, { useState } from 'react';
import { createAdminClient } from '@/lib/supabase';

export default function CheckTotalCountPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>({});

  const checkCounts = async () => {
    setLoading(true);
    const supabaseAdmin = createAdminClient();
    const counts: any = {};

    try {
      // 1. 전체 예약 수 확인
      const { count: totalCount, error: totalError } = await supabaseAdmin
        .from('reservations')
        .select('*', { count: 'exact', head: true });
      
      counts.total = { count: totalCount, error: totalError };

      // 2. 상태별 카운트
      const statuses = ['pending', 'approved', 'rejected', 'cancelled', 'completed', 'checked_in', 'no_show'];
      counts.byStatus = {};
      
      for (const status of statuses) {
        const { count, error } = await supabaseAdmin
          .from('reservations')
          .select('*', { count: 'exact', head: true })
          .eq('status', status);
        
        counts.byStatus[status] = { count, error };
      }

      // 3. 연도별 카운트
      const currentYear = new Date().getFullYear();
      counts.byYear = {};
      
      for (let year = currentYear - 2; year <= currentYear; year++) {
        const { count, error } = await supabaseAdmin
          .from('reservations')
          .select('*', { count: 'exact', head: true })
          .gte('date', `${year}-01-01`)
          .lte('date', `${year}-12-31`);
        
        counts.byYear[year] = { count, error };
      }

      // 4. API로 받아오는 데이터 수 확인
      const apiResponse = await fetch('/api/v2/admin/reservations?limit=10000');
      const apiData = await apiResponse.json();
      counts.apiDataCount = apiData.data?.reservations?.length || 0;
      counts.apiTotal = apiData.data?.total || 0;

    } catch (error) {
      console.error('Count check error:', error);
      counts.error = error.message;
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
            <h2 className="font-bold mb-2">전체 예약 수</h2>
            <pre className="text-lg font-mono">
              {results.total?.count || 0}개
              {results.total?.count > 1000 && ' (⚠️ 1000개 초과!)'}
            </pre>
          </div>

          <div className="p-4 bg-blue-100 rounded">
            <h2 className="font-bold mb-2">상태별 카운트</h2>
            <pre className="text-sm">
              {JSON.stringify(results.byStatus, null, 2)}
            </pre>
          </div>

          <div className="p-4 bg-green-100 rounded">
            <h2 className="font-bold mb-2">연도별 카운트</h2>
            <pre className="text-sm">
              {JSON.stringify(results.byYear, null, 2)}
            </pre>
          </div>

          <div className="p-4 bg-yellow-100 rounded">
            <h2 className="font-bold mb-2">API 응답 데이터</h2>
            <p>실제 받은 데이터: {results.apiDataCount}개</p>
            <p>API가 보고한 total: {results.apiTotal}</p>
          </div>
        </div>
      )}
    </div>
  );
}