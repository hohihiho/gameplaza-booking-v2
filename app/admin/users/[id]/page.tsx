// 사용자 상세 페이지 - D1 마이그레이션 중 임시 비활성화
'use client';

import Link from 'next/link';

export default function UserDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">사용자 상세 정보</h1>
      
      <div className="space-y-6">
        <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-6">
          <div className="flex items-center mb-2">
            <div className="text-yellow-600 mr-2">⚠️</div>
            <h2 className="text-lg font-semibold">D1 마이그레이션 진행 중</h2>
          </div>
          <p className="text-gray-700">
            이 페이지는 D1 마이그레이션 중 임시로 비활성화되었습니다.
          </p>
          <p className="text-gray-700 mt-2">
            요청된 사용자 ID: {params.id}
          </p>
        </div>
        
        <div className="bg-blue-100 border border-blue-300 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-2">기능 개요</h2>
          <div className="space-y-2 text-gray-700">
            <p>• 사용자 상세 정보 표시</p>
            <p>• 예약 이력 조회</p>
            <p>• 사용자 정보 수정</p>
            <p>• 차단 상태 관리</p>
          </div>
        </div>
        
        <div className="bg-gray-100 border border-gray-300 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-2">대체 기능</h2>
          <p className="text-gray-700 mb-4">
            사용자 관리는 메인 관리자 대시보드에서 제한적으로 가능합니다:
          </p>
          <div className="space-x-4">
            <Link 
              href="/admin" 
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              관리자 대시보드로 이동
            </Link>
            <Link 
              href="/admin/users" 
              className="inline-block bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
            >
              사용자 목록으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}