export default function CheckAuthPage() {
  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold mb-4">인증 상태 확인</h1>
      
      <div className="p-4 bg-yellow-100 rounded">
        <h2 className="font-bold mb-2">⚠️ 임시 비활성화</h2>
        <p>이 페이지는 D1 마이그레이션 중 임시로 비활성화되었습니다.</p>
        <p>마이그레이션 완료 후 API client를 통해 복구될 예정입니다.</p>
      </div>
      
      <div className="p-4 bg-blue-100 rounded">
        <h2 className="font-bold mb-2">대체 기능</h2>
        <p>관리자 권한은 메인 관리자 대시보드에서 확인할 수 있습니다:</p>
        <a href="/admin" className="text-blue-600 underline">관리자 대시보드로 이동</a>
      </div>
    </div>
  );
}