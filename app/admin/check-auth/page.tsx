'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth/client';

export default function CheckAuthPage() {
  const { user, session, isLoading, isAuthenticated, error } = useAuth();
  const [apiTestResult, setApiTestResult] = useState<string>('');

  const testAPI = async () => {
    try {
      const response = await fetch('/api/admin/test-auth');
      const data = await response.json();
      
      console.log('API Response Status:', response.status);
      console.log('API Response:', data);
      
      if (response.ok) {
        setApiTestResult(`API 성공! 상태: ${data.status}`);
      } else {
        setApiTestResult(`API 실패: ${response.status} - ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('API test error:', error);
      setApiTestResult(`API 에러: ${error}`);
    }
  };

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Better Auth 인증 상태 확인</h1>
      
      <div className="space-y-4">
        <div className="p-4 bg-gray-100 rounded">
          <h2 className="font-bold mb-2">사용자 정보</h2>
          <pre className="text-sm overflow-auto">
            {user ? JSON.stringify(user, null, 2) : 'Not logged in'}
          </pre>
        </div>
        
        <div className="p-4 bg-blue-100 rounded">
          <h2 className="font-bold mb-2">세션 정보</h2>
          <pre className="text-sm overflow-auto">
            {session ? JSON.stringify(session, null, 2) : 'No session'}
          </pre>
        </div>
        
        {error && (
          <div className="p-4 bg-red-100 rounded">
            <h2 className="font-bold mb-2">오류</h2>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(error, null, 2)}
            </pre>
          </div>
        )}
        
        <div className="p-4 bg-yellow-100 rounded">
          <h2 className="font-bold mb-2">권한 요약</h2>
          <p>로그인 상태: {isAuthenticated ? '✅ 로그인됨' : '❌ 로그인 안됨'}</p>
          <p>사용자 이름: {user?.name || 'N/A'}</p>
          <p>이메일: {user?.email || 'N/A'}</p>
          <p>사용자 역할: {user?.role || 'N/A'}</p>
          <p>활성 상태: {user?.isActive ? '✅ 활성' : '❌ 비활성'}</p>
        </div>
        
        <div className="space-y-2">
          <button
            onClick={testAPI}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            관리자 API 테스트
          </button>
          
          {apiTestResult && (
            <div className="p-4 bg-green-100 rounded">
              <h3 className="font-bold mb-2">API 테스트 결과</h3>
              <p>{apiTestResult}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}