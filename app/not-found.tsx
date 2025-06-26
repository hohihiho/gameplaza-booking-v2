// 404 페이지
// 비전공자 설명: 존재하지 않는 페이지에 접속했을 때 보여주는 페이지입니다
import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-4">페이지를 찾을 수 없습니다</h2>
        <p className="text-gray-600 mb-8">
          요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
        </p>
        <Link 
          href="/" 
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 inline-block"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </main>
  );
}