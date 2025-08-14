'use client';

import React, { useState } from 'react';
import { createAdminClient } from '@/lib/supabase';

export default function DebugReservationsPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>({});

  const runDebug = async () => {
    setLoading(true);
    const debugResults: any = {};

    try {
      // 1. API 호출 테스트
      console.log('=== 1. API 호출 테스트 ===');
      try {
        const apiResponse = await fetch('/api/v2/admin/reservations?limit=10');
        const apiText = await apiResponse.text();
        debugResults.api = {
          status: apiResponse.status,
          statusText: apiResponse.statusText,
          headers: Object.fromEntries(apiResponse.headers.entries()),
          body: apiText,
          parsed: null
        };
        
        try {
          debugResults.api.parsed = JSON.parse(apiText);
        } catch (e) {
          debugResults.api.parseError = e instanceof Error ? e.message : String(e);
        }
        
        console.log('API 응답:', debugResults.api);
      } catch (error) {
        debugResults.api = { error: error instanceof Error ? error.message : String(error) };
      }

      // 2. 직접 Supabase 조회 (Admin Client)
      console.log('=== 2. Supabase Admin Client 조회 ===');
      try {
        const supabaseAdmin = createAdminClient();
        
        // 예약 테이블 전체 카운트
        const { count: totalCount, error: countError } = await supabaseAdmin
          .from('reservations')
          .select('*', { count: 'exact', head: true });
        
        debugResults.totalCount = { count: totalCount, error: countError };
        console.log('전체 예약 수:', totalCount, '에러:', countError);
        
        // 최근 5개 예약 조회
        const { data: recentReservations, error: recentError } = await supabaseAdmin
          .from('reservations')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);
        
        debugResults.recentReservations = { 
          data: recentReservations, 
          error: recentError,
          count: recentReservations?.length || 0
        };
        console.log('최근 예약:', recentReservations);
        
        // 상태별 카운트
        const statuses = ['pending', 'approved', 'rejected', 'cancelled', 'completed'];
        debugResults.statusCounts = {};
        
        for (const status of statuses) {
          const { count, error } = await supabaseAdmin
            .from('reservations')
            .select('*', { count: 'exact', head: true })
            .eq('status', status);
          
          debugResults.statusCounts[status] = { count, error };
        }
        console.log('상태별 카운트:', debugResults.statusCounts);
        
        // Users 테이블 샘플 조회
        const { data: sampleUsers, error: usersError } = await supabaseAdmin
          .from('users')
          .select('*')
          .limit(3);
        
        debugResults.sampleUsers = { data: sampleUsers, error: usersError };
        
        // Devices 테이블 샘플 조회
        const { data: sampleDevices, error: devicesError } = await supabaseAdmin
          .from('devices')
          .select('*')
          .limit(3);
        
        debugResults.sampleDevices = { data: sampleDevices, error: devicesError };
        
      } catch (error) {
        debugResults.supabase = { error: error instanceof Error ? error.message : String(error) };
      }

      // 3. NextAuth 세션 확인
      console.log('=== 3. NextAuth 세션 확인 ===');
      try {
        const sessionResponse = await fetch('/api/auth/session');
        const session = await sessionResponse.json();
        debugResults.session = session;
        console.log('NextAuth 세션:', session);
      } catch (error) {
        debugResults.session = { error: error instanceof Error ? error.message : String(error) };
      }

    } catch (error) {
      console.error('Debug error:', error);
      debugResults.error = error instanceof Error ? error.message : String(error);
    }

    setResults(debugResults);
    setLoading(false);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">예약 데이터 디버깅</h1>
      
      <button
        onClick={runDebug}
        disabled={loading}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? '디버깅 중...' : '디버그 실행'}
      </button>

      {Object.keys(results).length > 0 && (
        <div className="space-y-4">
          <div className="p-4 bg-gray-100 rounded">
            <h2 className="font-bold mb-2">1. API 응답</h2>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(results.api, null, 2)}
            </pre>
          </div>

          <div className="p-4 bg-blue-100 rounded">
            <h2 className="font-bold mb-2">2. 데이터베이스 직접 조회</h2>
            <div className="space-y-2">
              <div>
                <h3 className="font-semibold">전체 예약 수:</h3>
                <pre className="text-xs">{JSON.stringify(results.totalCount, null, 2)}</pre>
              </div>
              <div>
                <h3 className="font-semibold">상태별 카운트:</h3>
                <pre className="text-xs">{JSON.stringify(results.statusCounts, null, 2)}</pre>
              </div>
              <div>
                <h3 className="font-semibold">최근 예약 ({results.recentReservations?.count || 0}개):</h3>
                <pre className="text-xs overflow-auto">{JSON.stringify(results.recentReservations, null, 2)}</pre>
              </div>
            </div>
          </div>

          <div className="p-4 bg-green-100 rounded">
            <h2 className="font-bold mb-2">3. 관련 테이블</h2>
            <div className="space-y-2">
              <div>
                <h3 className="font-semibold">Users 샘플:</h3>
                <pre className="text-xs overflow-auto">{JSON.stringify(results.sampleUsers, null, 2)}</pre>
              </div>
              <div>
                <h3 className="font-semibold">Devices 샘플:</h3>
                <pre className="text-xs overflow-auto">{JSON.stringify(results.sampleDevices, null, 2)}</pre>
              </div>
            </div>
          </div>

          <div className="p-4 bg-yellow-100 rounded">
            <h2 className="font-bold mb-2">4. NextAuth 세션</h2>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(results.session, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}