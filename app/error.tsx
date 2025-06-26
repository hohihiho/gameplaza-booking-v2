// 에러 페이지
// 비전공자 설명: 예상치 못한 오류가 발생했을 때 보여주는 페이지입니다
'use client';

import Link from 'next/link';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold text-red-600 mb-4">⚠️ 오류가 발생했습니다</h1>
        <p className="text-gray-600 mb-8">
          죄송합니다. 일시적인 오류가 발생했습니다.<br />
          잠시 후 다시 시도해주세요.
        </p>
        <div className="space-y-4">
          <button
            onClick={reset}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            다시 시도
          </button>
          <div>
            <Link href="/" className="text-gray-600 hover:text-gray-900">
              홈으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}