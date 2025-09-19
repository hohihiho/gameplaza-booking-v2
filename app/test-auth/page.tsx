'use client';

import { useState } from 'react';
import { signIn, useSession } from '@/lib/auth/client';

export default function TestAuthPage() {
  const { data: session, isLoading } = useSession();
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    console.log('🔥 Google 로그인 시작');
    try {
      console.log('🔄 signIn.social 호출 중...');
      await signIn.social({
        provider: 'google',
        callbackURL: '/test-auth'
      });
      console.log('✅ signIn.social 성공');
    } catch (error) {
      console.error('❌ Google 로그인 실패:', error);
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
        <div>로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6 text-center">Better Auth 테스트</h1>
        
        {session ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-100 rounded">
              <h3 className="font-bold text-green-800">로그인 성공!</h3>
              <pre className="text-xs mt-2 text-green-700 overflow-auto">
                {JSON.stringify(session, null, 2)}
              </pre>
            </div>
            <button 
              onClick={() => window.location.href = '/'}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
            >
              홈으로 가기
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-center text-gray-600">로그인이 필요합니다.</p>
            <button 
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 disabled:opacity-50"
            >
              {loading ? '로그인 중...' : 'Google로 로그인 (테스트)'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}