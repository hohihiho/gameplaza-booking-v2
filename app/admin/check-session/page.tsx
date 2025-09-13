'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/hooks/useAuth';

export default function CheckSessionPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkProfile = async () => {
      if (user?.id) {
        // JWT 인증으로 변경되었으므로 user 정보를 직접 사용
        setProfileData(user);
      }
      setLoading(authLoading ? true : false);
    };

    checkProfile();
  }, [user, authLoading]);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">세션 및 프로필 확인</h1>
      
      <div className="space-y-6">
        {/* JWT 세션 정보 */}
        <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-4">JWT 세션 정보</h2>
          {user ? (
            <div className="space-y-2 text-sm">
              <p><span className="font-semibold">ID:</span> {user.id}</p>
              <p><span className="font-semibold">이메일:</span> {user.email}</p>
              <p><span className="font-semibold">이름:</span> {user.name}</p>
              <p><span className="font-semibold">역할:</span> {user.role}</p>
              <p><span className="font-semibold">인증 상태:</span> {isAuthenticated ? '✅ 인증됨' : '❌ 인증되지 않음'}</p>
            </div>
          ) : (
            <p className="text-gray-500">로그인되지 않음</p>
          )}
        </div>

        {/* 사용자 프로필 정보 */}
        <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-4">사용자 프로필 정보</h2>
          {profileData ? (
            <div className="space-y-2 text-sm">
              <p><span className="font-semibold">ID:</span> {profileData.id}</p>
              <p><span className="font-semibold">이메일:</span> {profileData.email}</p>
              <p><span className="font-semibold">이름:</span> {profileData.name}</p>
              <p><span className="font-semibold">역할:</span> {profileData.role}</p>
              <p><span className="font-semibold">생성일:</span> {new Date(profileData.createdAt).toLocaleString('ko-KR')}</p>
              <p><span className="font-semibold">수정일:</span> {new Date(profileData.updatedAt).toLocaleString('ko-KR')}</p>
            </div>
          ) : (
            <p className="text-gray-500">프로필을 찾을 수 없음</p>
          )}
        </div>

        {/* 원본 데이터 */}
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">원본 데이터</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">JWT User Data:</h3>
              <pre className="text-xs overflow-x-auto whitespace-pre-wrap bg-white dark:bg-gray-900 p-4 rounded">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
            <div>
              <h3 className="font-medium mb-2">Profile Data:</h3>
              <pre className="text-xs overflow-x-auto whitespace-pre-wrap bg-white dark:bg-gray-900 p-4 rounded">
                {JSON.stringify(profileData, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}