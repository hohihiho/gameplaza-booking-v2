// 시간대 관리 페이지 - D1 마이그레이션 중 임시 비활성화
'use client';

export default function RentalSlotsPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">시간대 관리</h1>
      
      <div className="space-y-6">
        <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-6">
          <div className="flex items-center mb-2">
            <div className="text-yellow-600 mr-2">⚠️</div>
            <h2 className="text-lg font-semibold">D1 마이그레이션 진행 중</h2>
          </div>
          <p className="text-gray-700">
            이 페이지는 D1 마이그레이션 중 임시로 비활성화되었습니다.
          </p>
        </div>
        
        <div className="bg-blue-100 border border-blue-300 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-2">기능 개요</h2>
          <p className="text-gray-700">
            예약 시간대 설정 및 관리 페이지입니다.
          </p>
        </div>
        
        <div className="bg-gray-100 border border-gray-300 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-2">대체 기능</h2>
          <a 
            href="/admin" 
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            관리자 대시보드로 이동
          </a>
        </div>
      </div>
    </div>
  );
}