// 로딩 컴포넌트
// 비전공자 설명: 페이지가 로딩 중일 때 보여주는 화면입니다

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        {/* 로딩 스피너 */}
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
        <p className="mt-4 text-gray-600">로딩 중...</p>
      </div>
    </div>
  );
}