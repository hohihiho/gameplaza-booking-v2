'use client';

import { useState, useEffect } from 'react';
import { authClient } from '@/lib/auth/cloudflare-client';
import { useSession, useAuthActions } from '@/components/providers/AuthProvider';

export default function TestCloudflareAuthPage() {
  const { data: session, isPending: isLoading } = useSession();
  const { signInWithGoogle, signOut } = useAuthActions();
  const [loading, setLoading] = useState(false);
  const [debugSession, setDebugSession] = useState<any>(null);
  const [apiSession, setApiSession] = useState<any>(null);

  // 디버깅을 위한 세션 확인
  useEffect(() => {
    const checkSessions = async () => {
      try {
        // Better Auth React Hook 결과
        console.log('🔍 Better Auth useSession 결과:', { session, isLoading });
        setDebugSession({ session, isLoading });

        // 쿠키 확인
        const cookies = document.cookie;
        console.log('🍪 현재 쿠키들:', cookies);

        // 직접 API 호출
        const response = await fetch('/api/auth/get-session', {
          credentials: 'include', // 쿠키 포함
        });
        const sessionData = await response.json();
        console.log('🔍 API 직접 호출 결과:', sessionData);
        setApiSession(sessionData);
      } catch (error) {
        console.error('❌ 세션 확인 에러:', error);
      }
    };

    checkSessions();
  }, [session, isLoading]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    console.log('🔥 Cloudflare Google 로그인 시작');
    try {
      console.log('🔄 signInWithGoogle 호출 중...');
      await signInWithGoogle('/test-cloudflare-auth');
      console.log('✅ Google 로그인 성공');
    } catch (error) {
      console.error('❌ Cloudflare Google 로그인 실패:', error);
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
        <h1 className="text-2xl font-bold mb-6 text-center">Cloudflare Better Auth 테스트</h1>
        
        {/* 디버깅 정보 */}
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <h3 className="font-bold text-yellow-800 mb-2">🔍 디버깅 정보</h3>
          <div className="text-xs space-y-2">
            <div>
              <strong>Better Auth useSession:</strong>
              <pre className="mt-1 text-yellow-700 overflow-auto">
                {JSON.stringify(debugSession, null, 2)}
              </pre>
            </div>
            <div>
              <strong>API 직접 호출:</strong>
              <pre className="mt-1 text-yellow-700 overflow-auto">
                {JSON.stringify(apiSession, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        {session || apiSession?.user ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-100 rounded">
              <h3 className="font-bold text-green-800">Cloudflare 로그인 성공!</h3>
              <pre className="text-xs mt-2 text-green-700 overflow-auto">
                {JSON.stringify(session || apiSession, null, 2)}
              </pre>
            </div>
            <button 
              onClick={signOut}
              className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
            >
              로그아웃
            </button>
            <button 
              onClick={() => window.location.href = '/'}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
            >
              홈으로 가기
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-center text-gray-600">Cloudflare Better Auth로 로그인이 필요합니다.</p>
            <button 
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 disabled:opacity-50"
            >
              {loading ? '로그인 중...' : 'Google로 로그인 (Cloudflare)'}
            </button>
            
            <div className="mt-4 text-sm text-gray-500">
              <p>✅ Cloudflare Workers/Pages 최적화</p>
              <p>✅ D1 데이터베이스 연동</p>
              <p>✅ Google OAuth + Passkey 지원</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}