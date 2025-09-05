'use client';

import { useUser } from "@stackframe/stack";

export function StackAuthButton() {
  const user = useUser();

  if (!user) {
    return (
      <div className="stack-auth-component">
        <h2>Stack Auth - 로그인이 필요합니다</h2>
        <button
          onClick={() => {
            // Stack Auth 로그인 리다이렉트는 자동으로 처리됩니다
            window.location.href = '/api/stack/auth/signin';
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Stack Auth로 로그인
        </button>
      </div>
    );
  }

  return (
    <div className="stack-auth-component">
      <h2>Stack Auth - 로그인됨</h2>
      <div className="user-info mb-4">
        <p>이메일: {user.primaryEmail}</p>
        <p>이름: {user.displayName}</p>
        <p>ID: {user.id}</p>
      </div>
      <button
        onClick={() => user.signOut()}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Stack Auth 로그아웃
      </button>
    </div>
  );
}