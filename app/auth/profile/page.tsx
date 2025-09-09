'use client';

import { useUser, UserButton } from '@stackframe/stack';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProfilePage() {
  const user = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin');
    }
  }, [user, router]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">프로필</h1>
            <UserButton />
          </div>

          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <h2 className="font-semibold text-gray-700">사용자 정보</h2>
              <div className="mt-2 space-y-2">
                <p className="text-sm">
                  <span className="font-medium">ID:</span> {user.id}
                </p>
                <p className="text-sm">
                  <span className="font-medium">이메일:</span> {user.primaryEmail || '이메일 없음'}
                </p>
                <p className="text-sm">
                  <span className="font-medium">이름:</span> {user.displayName || '이름 없음'}
                </p>
                <p className="text-sm">
                  <span className="font-medium">가입일:</span> {new Date(user.signedUpAt).toLocaleDateString('ko-KR')}
                </p>
              </div>
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <h2 className="font-semibold text-gray-700">인증 정보</h2>
              <div className="mt-2 space-y-2">
                <p className="text-sm">
                  <span className="font-medium">이메일 인증:</span>{' '}
                  {user.primaryEmailVerified ? (
                    <span className="text-green-600">✅ 인증됨</span>
                  ) : (
                    <span className="text-red-600">❌ 미인증</span>
                  )}
                </p>
                <p className="text-sm">
                  <span className="font-medium">프로필 이미지:</span>{' '}
                  {user.profileImageUrl ? '설정됨' : '미설정'}
                </p>
              </div>
            </div>

            <div className="pt-6 border-t">
              <button
                onClick={() => router.push('/')}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                홈으로 돌아가기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}