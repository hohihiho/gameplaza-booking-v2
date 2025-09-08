'use client';

import { useSession } from '@/lib/auth/better-auth-client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';

export default function CheckSessionPage() {
  const { data: session } = useSession();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkProfile = async () => {
      if (session?.user?.id) {
        const supabase = createClient();
        
        // profiles 테이블에서 조회
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        if (profileError) {
          console.error('Profile 조회 실패:', profileError);
        }
        
        setProfileData(profile);
      }
      setLoading(false);
    };
    
    checkProfile();
  }, [session]);

  if (loading) return <div className="p-8">Loading...</div>;

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

        {/* Supabase 프로필 정보 */}
        <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-4">Supabase 프로필 정보</h2>
          {profileData ? (
            <div className="space-y-2 text-sm">
              <p><span className="font-semibold">ID:</span> {profileData.id}</p>
              <p><span className="font-semibold">이메일:</span> {profileData.email}</p>
              <p><span className="font-semibold">이름:</span> {profileData.name}</p>
              <p><span className="font-semibold">닉네임:</span> {profileData.nickname}</p>
              <p><span className="font-semibold">전화번호:</span> {profileData.phone}</p>
              <p><span className="font-semibold">관리자:</span> {profileData.is_admin ? '✅ 예' : '❌ 아니오'}</p>
              <p><span className="font-semibold">차단:</span> {profileData.is_banned ? '✅ 예' : '❌ 아니오'}</p>
              <p><span className="font-semibold">가입일:</span> {new Date(profileData.created_at).toLocaleString('ko-KR')}</p>
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
              <h3 className="font-medium mb-2">NextAuth Session:</h3>
              <pre className="text-xs overflow-x-auto whitespace-pre-wrap bg-white dark:bg-gray-900 p-4 rounded">
                {JSON.stringify(session, null, 2)}
              </pre>
            </div>
            <div>
              <h3 className="font-medium mb-2">Supabase Profile:</h3>
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