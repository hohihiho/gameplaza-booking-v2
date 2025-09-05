'use client';

import { useUser, useStackApp } from "@stackframe/stack";
import { useEffect } from "react";

export default function TestStackAuthPage() {
  const user = useUser();
  const app = useStackApp();

  useEffect(() => {
    console.log("Stack Auth App:", app);
    console.log("Current User:", user);
  }, [app, user]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Stack Auth 연결 테스트</h1>
        
        <div className="space-y-4">
          <div className="border-l-4 border-blue-500 pl-4">
            <h2 className="font-semibold mb-2">프로젝트 정보</h2>
            <p className="text-sm text-gray-600">
              Project ID: {process.env.NEXT_PUBLIC_STACK_PROJECT_ID}
            </p>
          </div>

          <div className="border-l-4 border-green-500 pl-4">
            <h2 className="font-semibold mb-2">연결 상태</h2>
            <p className="text-sm">
              {app ? (
                <span className="text-green-600">✅ Stack Auth 연결됨</span>
              ) : (
                <span className="text-red-600">❌ Stack Auth 연결 실패</span>
              )}
            </p>
          </div>

          <div className="border-l-4 border-purple-500 pl-4">
            <h2 className="font-semibold mb-2">사용자 정보</h2>
            <p className="text-sm">
              {user ? (
                <span className="text-purple-600">
                  로그인됨: {user.primaryEmail || user.id}
                </span>
              ) : (
                <span className="text-gray-500">로그인되지 않음</span>
              )}
            </p>
          </div>

          <div className="mt-6 pt-6 border-t">
            {!user ? (
              <button
                onClick={() => app?.redirectToSignIn()}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                로그인 테스트
              </button>
            ) : (
              <button
                onClick={() => app?.redirectToSignOut()}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                로그아웃
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}