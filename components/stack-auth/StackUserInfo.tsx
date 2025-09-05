'use client';

import { useUser } from "@stackframe/stack";

export function StackUserInfo() {
  const user = useUser();

  if (!user) {
    return (
      <div className="p-4 border border-gray-300 rounded">
        <p className="text-gray-500">Stack Auth: 로그인되지 않음</p>
      </div>
    );
  }

  return (
    <div className="p-4 border border-green-300 rounded bg-green-50">
      <h3 className="font-semibold mb-2">Stack Auth 사용자 정보</h3>
      <div className="space-y-1 text-sm">
        <p><strong>ID:</strong> {user.id}</p>
        <p><strong>이메일:</strong> {user.primaryEmail}</p>
        <p><strong>이름:</strong> {user.displayName || '설정되지 않음'}</p>
        <p><strong>이메일 인증:</strong> {user.primaryEmailVerified ? '완료' : '미완료'}</p>
        <p><strong>가입일:</strong> {user.createdAtMillis ? new Date(user.createdAtMillis).toLocaleDateString('ko-KR') : '알 수 없음'}</p>
      </div>
    </div>
  );
}