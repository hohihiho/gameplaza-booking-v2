'use client';

import { useSession } from "@/lib/auth-compat";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DebugSessionPage() {
  const { data: session, status, update } = useSession();
  const [refreshData, setRefreshData] = useState<any>(null);
  const [adminCheckData, setAdminCheckData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchRefreshData();
    fetchAdminCheck();
  }, []);

  const fetchRefreshData = async () => {
    try {
      const response = await fetch('/api/auth/refresh');
      const data = await response.json();
      setRefreshData(data);
    } catch (error) {
      console.error('Error fetching refresh data:', error);
    }
  };

  const fetchAdminCheck = async () => {
    try {
      const response = await fetch('/api/auth/check-admin');
      const data = await response.json();
      setAdminCheckData(data);
    } catch (error) {
      console.error('Error fetching admin check:', error);
    }
  };

  const handleForceUpdate = async () => {
    setLoading(true);
    try {
      // 세션 업데이트 트리거
      const result = await update({
        isAdmin: true // 강제로 isAdmin 추가
      });
      console.log('Update result:', result);
      
      // API 데이터 새로고침
      await fetchRefreshData();
      await fetchAdminCheck();
      
      // 페이지 새로고침
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Error updating session:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold dark:text-white">세션 디버그</h1>
          <button
            onClick={() => router.push('/mypage')}
            className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg"
          >
            마이페이지로
          </button>
        </div>

        <div className="space-y-6">
          {/* 현재 세션 상태 */}
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
            <h2 className="text-lg font-semibold mb-4 dark:text-white">현재 세션 상태</h2>
            <div className="text-sm space-y-2">
              <div>
                <span className="font-medium text-gray-600 dark:text-gray-400">상태:</span>{' '}
                <span className="dark:text-white">{status}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600 dark:text-gray-400">이메일:</span>{' '}
                <span className="dark:text-white">{session?.user?.email || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600 dark:text-gray-400">관리자:</span>{' '}
                <span className={`font-bold ${session?.user?.isAdmin ? 'text-green-600' : 'text-red-600'}`}>
                  {session?.user?.isAdmin ? 'YES' : 'NO'}
                </span>
              </div>
            </div>
            <pre className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded overflow-auto text-xs">
              {JSON.stringify(session, null, 2)}
            </pre>
          </div>

          {/* API 응답 */}
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
            <h2 className="text-lg font-semibold mb-4 dark:text-white">API 응답 (/api/auth/refresh)</h2>
            <pre className="p-4 bg-gray-100 dark:bg-gray-800 rounded overflow-auto text-xs">
              {JSON.stringify(refreshData, null, 2)}
            </pre>
          </div>

          {/* 관리자 체크 결과 */}
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
            <h2 className="text-lg font-semibold mb-4 dark:text-white">관리자 체크 결과 (/api/auth/check-admin)</h2>
            <pre className="p-4 bg-gray-100 dark:bg-gray-800 rounded overflow-auto text-xs">
              {JSON.stringify(adminCheckData, null, 2)}
            </pre>
          </div>

          {/* 액션 버튼들 */}
          <div className="flex gap-4">
            <button
              onClick={handleForceUpdate}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '업데이트 중...' : '세션 강제 업데이트'}
            </button>
            <button
              onClick={fetchRefreshData}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              API 데이터 새로고침
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}