export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          🎮 게임플라자 광주점
        </h1>
        <p className="text-center text-lg mb-8">
          게임기 예약 시스템에 오신 것을 환영합니다!
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">🎯 예약하기</h2>
            <p className="text-gray-600 mb-4">
              원하는 게임기를 선택하고 예약하세요
            </p>
            <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              예약하러 가기
            </button>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">📋 내 예약</h2>
            <p className="text-gray-600 mb-4">
              예약 현황을 확인하고 관리하세요
            </p>
            <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
              예약 확인
            </button>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">🎮 기기 현황</h2>
            <p className="text-gray-600 mb-4">
              사용 가능한 게임기를 확인하세요
            </p>
            <button className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600">
              기기 보기
            </button>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">📞 이용 안내</h2>
            <p className="text-gray-600 mb-4">
              이용 방법과 안내사항을 확인하세요
            </p>
            <button className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600">
              안내 보기
            </button>
          </div>
        </div>
        
        <div className="text-center mt-8 text-gray-500">
          <p>📞 문의: 062-123-4567</p>
          <p>🏢 주소: 광주광역시 서구 게임로 123</p>
        </div>
      </div>
    </main>
  )
}