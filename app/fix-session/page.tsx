'use client';

import { useSession, signOut } from "@/lib/auth-compat";
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function FixSessionPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    checkSessionStatus();
  }, []);

  const checkSessionStatus = async () => {
    setIsChecking(true);
    try {
      const response = await fetch('/api/auth/fix-session');
      const data = await response.json();
      setSessionStatus(data);
      
      if (data.error) {
        setError(data.error);
      }
    } catch (err) {
      setError('세션 상태를 확인할 수 없습니다.');
    } finally {
      setIsChecking(false);
    }
  };

  const handleLogoutAndLogin = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  const handleForceUpdate = async () => {
    setIsChecking(true);
    try {
      // 세션 업데이트 시도
      await update();
      
      // 페이지 새로고침
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      setError('세션 업데이트에 실패했습니다.');
    } finally {
      setIsChecking(false);
    }
  };

  if (status === 'loading' || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">세션 정보를 확인하는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4">
      <div className="max-w-2xl mx-auto pt-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8"
        >
          <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
            세션 권한 복구
          </h1>

          {/* 현재 세션 상태 */}
          <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <h2 className="font-semibold mb-2 text-gray-700 dark:text-gray-300">
              현재 세션 상태
            </h2>
            <div className="space-y-1 text-sm">
              <p className="text-gray-600 dark:text-gray-400">
                이메일: <span className="font-medium text-gray-900 dark:text-white">
                  {session?.user?.email || 'N/A'}
                </span>
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                관리자 권한: <span className={`font-medium ${session?.user?.isAdmin ? 'text-green-600' : 'text-red-600'}`}>
                  {session?.user?.isAdmin ? '있음' : '없음'}
                </span>
              </p>
            </div>
          </div>

          {/* 데이터베이스 상태 */}
          {sessionStatus && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h2 className="font-semibold mb-2 text-blue-700 dark:text-blue-300">
                데이터베이스 권한 상태
              </h2>
              <div className="space-y-1 text-sm">
                <p className="text-blue-600 dark:text-blue-400">
                  관리자 권한: <span className={`font-medium ${sessionStatus.isAdmin ? 'text-green-600' : 'text-red-600'}`}>
                    {sessionStatus.isAdmin ? '있음' : '없음'}
                  </span>
                </p>
                {sessionStatus.adminData && (
                  <p className="text-blue-600 dark:text-blue-400">
                    슈퍼 관리자: <span className="font-medium">
                      {sessionStatus.adminData.is_super_admin ? '예' : '아니오'}
                    </span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 권한 불일치 경고 */}
          {sessionStatus?.isAdmin && !session?.user?.isAdmin && (
            <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                <strong>권한 불일치 감지됨!</strong><br />
                데이터베이스에는 관리자 권한이 있지만 세션에 반영되지 않았습니다.
                아래 버튼을 클릭하여 세션을 복구하세요.
              </p>
            </div>
          )}

          {/* 에러 메시지 */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="space-y-3">
            <button
              onClick={handleLogoutAndLogin}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              로그아웃 후 다시 로그인
            </button>
            
            <button
              onClick={handleForceUpdate}
              className="w-full px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
            >
              세션 강제 업데이트 시도
            </button>

            <button
              onClick={() => router.push('/admin')}
              className="w-full px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
            >
              관리자 페이지로 이동
            </button>
          </div>

          {/* 도움말 */}
          <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
            <p>💡 팁: 로그아웃 후 다시 로그인하면 대부분의 세션 문제가 해결됩니다.</p>
          </div>
        </motion.div>

        {/* 디버그 정보 (개발 모드) */}
        {process.env.NODE_ENV === 'development' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-4 bg-gray-900 text-gray-100 rounded-lg p-4 text-xs font-mono"
          >
            <p className="mb-2 font-semibold">디버그 정보:</p>
            <pre className="overflow-auto">
              {JSON.stringify({ session, sessionStatus }, null, 2)}
            </pre>
          </motion.div>
        )}
      </div>
    </div>
  );
}