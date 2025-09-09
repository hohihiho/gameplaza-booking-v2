// 기기 현황 페이지 - D1 마이그레이션 중 임시 비활성화
'use client';

import Link from 'next/link';

export default function MachinesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">기기 현황</h1>
        
        <div className="space-y-6">
          <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-6">
            <div className="flex items-center mb-2">
              <div className="text-yellow-600 mr-2">⚠️</div>
              <h2 className="text-lg font-semibold">D1 마이그레이션 진행 중</h2>
            </div>
            <p className="text-gray-700">
              기기 현황 페이지는 D1 마이그레이션 중 임시로 비활성화되었습니다.
            </p>
            <p className="text-gray-700 mt-2">
              마이그레이션 완료 후 실시간 기기 상태 모니터링 기능이 복구될 예정입니다.
            </p>
          </div>
          
          <div className="bg-blue-100 border border-blue-300 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-2">기능 개요</h2>
            <div className="space-y-2 text-gray-700">
              <p>• 실시간 기기 상태 모니터링</p>
              <p>• 기기별 예약 현황 조회</p>
              <p>• 카테고리별 기기 분류</p>
              <p>• 사용 가능 기기 검색</p>
            </div>
          </div>
          
          <div className="bg-gray-100 border border-gray-300 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-2">임시 대체 기능</h2>
            <p className="text-gray-700 mb-4">
              기기 예약은 예약 페이지에서 계속 이용 가능합니다:
            </p>
            <div className="space-x-4">
              <Link 
                href="/reservations/new" 
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                예약하기
              </Link>
              <Link 
                href="/" 
                className="inline-block bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
              >
                메인으로 돌아가기
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}