'use client';

// import removed - using Better Auth;
import { useState, useEffect } from 'react';

export default function DebugAdminPage() {
  const { data: session, status, update } = useSession();
  const [tokenData, setTokenData] = useState<any>(null);

  useEffect(() => {
    // 토큰 데이터 가져오기
    fetch('/api/auth/debug-session')
      .then(res => res.json())
      .then(data => setTokenData(data))
      .catch(err => console.error('Failed to fetch token data:', err));
  }, []);

  const handleRefreshSession = async () => {
    await update();
    window.location.reload();
  };

  const handleRelogin = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">관리자 권한 디버깅</h1>
      
      <div className="flex gap-4 mb-6">
        <button
          onClick={handleRefreshSession}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          세션 새로고침
        </button>
        <button
          onClick={handleRelogin}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          다시 로그인
        </button>
      </div>
      
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-4">
        <h2 className="text-lg font-semibold mb-2">세션 상태</h2>
        <p>Status: <span className="font-mono">{status}</span></p>
      </div>

      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-4">
        <h2 className="text-lg font-semibold mb-2">전체 세션 데이터</h2>
        <pre className="text-xs overflow-x-auto">
          {JSON.stringify(session, null, 2)}
        </pre>
      </div>

      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-4">
        <h2 className="text-lg font-semibold mb-2">사용자 정보</h2>
        <p>Email: <span className="font-mono">{session?.user?.email || 'N/A'}</span></p>
        <p>ID: <span className="font-mono">{session?.user?.id || 'N/A'}</span></p>
        <p>isAdmin: <span className="font-mono">{String(session?.user?.isAdmin)}</span></p>
        <p>isAdmin 타입: <span className="font-mono">{typeof session?.user?.isAdmin}</span></p>
      </div>

      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-4">
        <h2 className="text-lg font-semibold mb-2">체크 결과</h2>
        <p>session?.user?.isAdmin === true: <span className="font-mono">{String(session?.user?.isAdmin === true)}</span></p>
        <p>!!session?.user?.isAdmin: <span className="font-mono">{String(!!session?.user?.isAdmin)}</span></p>
      </div>

      <div className="bg-yellow-100 dark:bg-yellow-900 rounded-lg p-4 mb-4">
        <h2 className="text-lg font-semibold mb-2">JWT 토큰 데이터</h2>
        {tokenData ? (
          <pre className="text-xs overflow-x-auto">
            {JSON.stringify(tokenData, null, 2)}
          </pre>
        ) : (
          <p>토큰 데이터 로딩 중...</p>
        )}
      </div>
    </div>
  );
}