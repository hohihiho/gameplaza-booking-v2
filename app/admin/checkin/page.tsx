// 체크인 관리 페이지 - D1 마이그레이션 중 임시 비활성화
'use client';

export default function CheckinPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">체크인 관리</h1>
      
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
            마이그레이션 완료 후 새로운 API를 통해 복구될 예정입니다.
          </p>
        </div>
        
        <div className="bg-blue-100 border border-blue-300 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-2">대체 기능</h2>
          <p className="text-gray-700 mb-4">
            현재 체크인 처리는 메인 관리자 대시보드에서 가능합니다:
          </p>
          <a 
            href="/admin" 
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            관리자 대시보드로 이동
          </a>
        </div>
        
        <div className="bg-gray-100 border border-gray-300 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-2">기능 개요</h2>
          <p className="text-gray-700">
            이 페이지에서는 승인된 예약 고객의 체크인 처리, 결제 확인, 
            기기 할당 등의 작업을 수행할 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
}