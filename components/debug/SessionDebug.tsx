'use client';

import { useEffect, useState } from 'react';
import { useSession } from '@/components/providers/AuthProvider';

export default function SessionDebug() {
  const { data: session, isPending: isLoading } = useSession();
  const [apiSession, setApiSession] = useState<any>(null);

  useEffect(() => {
    const checkApiSession = async () => {
      try {
        const response = await fetch('/api/auth/get-session', {
          credentials: 'include',
        });
        const data = await response.json();
        setApiSession(data);
        console.log('🔍 SessionDebug - API 세션:', data);
      } catch (error) {
        console.error('❌ SessionDebug - API 호출 실패:', error);
      }
    };

    checkApiSession();
  }, []);

  // 세션이 있으면 간단한 정보만 표시
  if (session?.user || apiSession?.user) {
    return (
      <div className="fixed top-4 right-4 bg-green-100 border border-green-300 rounded p-2 text-xs">
        <div className="font-bold text-green-800">✅ 로그인됨</div>
        <div className="text-green-600">
          {session?.user?.name || apiSession?.user?.name || 'Unknown User'}
        </div>
      </div>
    );
  }

  // 로딩 중
  if (isLoading) {
    return (
      <div className="fixed top-4 right-4 bg-yellow-100 border border-yellow-300 rounded p-2 text-xs">
        <div className="text-yellow-800">🔄 세션 확인 중...</div>
      </div>
    );
  }

  // 로그인되지 않음
  return (
    <div className="fixed top-4 right-4 bg-red-100 border border-red-300 rounded p-2 text-xs">
      <div className="text-red-800">❌ 로그인 필요</div>
    </div>
  );
}