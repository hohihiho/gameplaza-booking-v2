'use client';

import { useSession } from 'next-auth/react';

export default function CheckSessionPage() {
  const { data: session } = useSession();

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">세션 및 프로필 확인</h1>
      
      <div className="space-y-6">
        {/* NextAuth 세션 정보 */}
        <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-4">NextAuth 세션 정보</h2>
          {session ? (
            <div className="space-y-2 text-sm">
              <p><span className="font-semibold">ID:</span> {session.user?.id}</p>
              <p><span className="font-semibold">이메일:</span> {session.user?.email}</p>
              <p><span className="font-semibold">이름:</span> {session.user?.name}</p>
              <p><span className="font-semibold">닉네임:</span> {session.user?.nickname}</p>
              <p><span className="font-semibold">역할:</span> {session.user?.role}</p>
              <p><span className="font-semibold">관리자:</span> {session.user?.isAdmin ? '✅ 예' : '❌ 아니오'}</p>
            </div>
          ) : (
            <p className="text-gray-500">로그인되지 않음</p>
          )}
        </div>

        {/* D1 마이그레이션 안내 */}
        <div className="bg-yellow-100 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">⚠️ D1 마이그레이션 진행 중</h2>
          <p>Supabase 프로필 데이터는 D1 마이그레이션 완료 후 API를 통해 조회됩니다.</p>
        </div>

        {/* 원본 데이터 */}
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">NextAuth Session 데이터</h2>
          <pre className="text-xs overflow-x-auto whitespace-pre-wrap bg-white dark:bg-gray-900 p-4 rounded">
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}