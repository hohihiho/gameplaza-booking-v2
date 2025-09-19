'use client';

import { useAuth } from '@/lib/auth/client';

export default function CheckSessionPage() {
  const { user, session, isLoading, isAuthenticated, error } = useAuth();

  if (isLoading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">세션 확인</h1>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Better Auth 세션 확인</h1>
      
      <div className="space-y-4">
        <div className="p-4 bg-gray-100 rounded">
          <h2 className="text-lg font-semibold mb-2">인증 상태</h2>
          <p>로그인 여부: {isAuthenticated ? '✅ 로그인됨' : '❌ 로그인 안됨'}</p>
          <p>로딩 상태: {isLoading ? '⏳ 로딩 중' : '✅ 로딩 완료'}</p>
        </div>

        {user && (
          <div className="p-4 bg-blue-100 rounded">
            <h2 className="text-lg font-semibold mb-2">사용자 정보</h2>
            <div className="space-y-1">
              <p><strong>ID:</strong> {user.id}</p>
              <p><strong>이름:</strong> {user.name || 'N/A'}</p>
              <p><strong>이메일:</strong> {user.email}</p>
              <p><strong>닉네임:</strong> {user.nickname || 'N/A'}</p>
              <p><strong>역할:</strong> {user.role || 'N/A'}</p>
              <p><strong>활성 상태:</strong> {user.isActive ? '✅' : '❌'}</p>
              <p><strong>생성일:</strong> {user.createdAt ? new Date(user.createdAt).toLocaleString('ko-KR') : 'N/A'}</p>
              <p><strong>마지막 로그인:</strong> {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('ko-KR') : 'N/A'}</p>
            </div>
          </div>
        )}

        {session && (
          <div className="p-4 bg-green-100 rounded">
            <h2 className="text-lg font-semibold mb-2">세션 정보</h2>
            <pre className="text-sm overflow-auto bg-white p-2 rounded">
              {JSON.stringify(session, null, 2)}
            </pre>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-100 rounded">
            <h2 className="text-lg font-semibold mb-2">오류</h2>
            <pre className="text-sm overflow-auto bg-white p-2 rounded">
              {JSON.stringify(error, null, 2)}
            </pre>
          </div>
        )}

        {!isAuthenticated && (
          <div className="p-4 bg-yellow-100 rounded">
            <h2 className="text-lg font-semibold mb-2">로그인 안내</h2>
            <p>로그인이 필요합니다. 로그인 페이지로 이동하세요.</p>
            <a 
              href="/login" 
              className="inline-block mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              로그인 페이지로 이동
            </a>
          </div>
        )}
      </div>
    </div>
  );
}