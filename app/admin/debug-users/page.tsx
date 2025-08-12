'use client';

import { useState, useEffect } from 'react';

export default function DebugUsersPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/users')
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error:', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">사용자 디버그</h1>
      
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-4">
        <p className="text-lg mb-2">전체 사용자 수: {data?.total || 0}</p>
      </div>

      {data?.users && data.users.length > 0 ? (
        <div className="space-y-4">
          {data.users.map((user: any) => (
            <div key={user.id} className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <p><span className="font-semibold">ID:</span> {user.id}</p>
                <p><span className="font-semibold">이름:</span> {user.name || '없음'}</p>
                <p><span className="font-semibold">닉네임:</span> {user.nickname || '없음'}</p>
                <p><span className="font-semibold">이메일:</span> {user.email}</p>
                <p><span className="font-semibold">전화번호:</span> {user.phone || '없음'}</p>
                <p><span className="font-semibold">관리자:</span> {user.is_admin ? '✅ 예' : '❌ 아니오'}</p>
                <p><span className="font-semibold">차단:</span> {user.is_banned ? '✅ 예' : '❌ 아니오'}</p>
                <p><span className="font-semibold">가입일:</span> {new Date(user.created_at).toLocaleString('ko-KR')}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded-lg p-4">
          <p className="text-yellow-800 dark:text-yellow-200">
            {data?.error ? `오류: ${data.error}` : '사용자가 없습니다.'}
          </p>
        </div>
      )}

      <div className="mt-8 bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
        <h2 className="font-semibold mb-2">원본 응답 데이터:</h2>
        <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  );
}