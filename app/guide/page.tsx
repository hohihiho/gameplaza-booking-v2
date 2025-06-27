// 오락실 이용안내 페이지
// 비전공자 설명: 오락실 운영 정보와 이용 방법을 안내하는 페이지입니다
import { Clock, MapPin, Phone, CreditCard, Users, Shield, Gift, ChevronRight, Calendar } from 'lucide-react';

export default function GuidePage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* 페이지 헤더 */}
      <section className="bg-white dark:bg-gray-900 py-8 px-5 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold dark:text-white">오락실 이용안내</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">광주 게임플라자의 모든 것을 안내드립니다</p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-5 py-8 space-y-8">
        {/* 영업 정보 */}
        <section className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold mb-4 dark:text-white">영업 정보</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-gray-500 mt-0.5" />
              <div>
                <p className="font-medium dark:text-white">영업시간</p>
                <p className="text-gray-600 dark:text-gray-400">오전 10:00 - 익일 오전 2:00 (연중무휴)</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
              <div>
                <p className="font-medium dark:text-white">위치</p>
                <p className="text-gray-600 dark:text-gray-400">광주광역시 서구 게임로 123</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-gray-500 mt-0.5" />
              <div>
                <p className="font-medium dark:text-white">연락처</p>
                <p className="text-gray-600 dark:text-gray-400">062-123-4567 (카카오톡 채널 우선)</p>
              </div>
            </div>
          </div>
        </section>

        {/* 이용 요금 */}
        <section className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold mb-4 dark:text-white">이용 요금</h2>
          
          {/* 일반 이용 */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3 dark:text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              일반 이용 (자유 이용)
            </h3>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">리듬게임</span>
                <span className="font-medium dark:text-white">500원/1곡, 1,000원/3곡</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">아케이드게임</span>
                <span className="font-medium dark:text-white">500원~1,000원/1플레이</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">대전게임</span>
                <span className="font-medium dark:text-white">500원/1판</span>
              </div>
            </div>
          </div>

          {/* 대여 예약 */}
          <div>
            <h3 className="font-semibold mb-3 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              대여 예약 (기기별 시간대)
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              대여 가능 기종: 마이마이, 츄니즘, 발키리, 라이트닝
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">조기영업 시간대</span>
                <span className="font-medium dark:text-white">30,000원~</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">일반 영업 시간대</span>
                <span className="font-medium dark:text-white">40,000원~</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">밤샘영업 시간대</span>
                <span className="font-medium dark:text-white">60,000원~</span>
              </div>
            </div>
            <a 
              href="/guide/reservation" 
              className="inline-flex items-center gap-1 text-sm text-gray-900 dark:text-white font-medium mt-3 hover:underline"
            >
              예약 방법 자세히 보기
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </section>

        {/* 시설 안내 */}
        <section className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold mb-4 dark:text-white">시설 안내</h2>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="font-semibold mb-2 dark:text-white">리듬게임 Zone</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">최신 리듬게임 20대 보유</p>
              <ul className="text-sm text-gray-500 dark:text-gray-500 space-y-1">
                <li>• 유비트, 사운드 볼텍스, 팝픈뮤직</li>
                <li>• 댄스댄스레볼루션, 펌프잇업</li>
                <li>• 마이마이, 츄니즘, 왓카 등</li>
              </ul>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="font-semibold mb-2 dark:text-white">아케이드 Zone</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">클래식 & 최신 아케이드</p>
              <ul className="text-sm text-gray-500 dark:text-gray-500 space-y-1">
                <li>• 슈팅게임, 퍼즐게임</li>
                <li>• 대전격투게임</li>
                <li>• 레트로 게임기</li>
              </ul>
            </div>
          </div>

          <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h3 className="font-semibold mb-2 text-blue-900 dark:text-blue-300">편의시설</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-blue-700 dark:text-blue-400">
              <span>• 무료 WiFi</span>
              <span>• 충전 스테이션</span>
              <span>• 음료 자판기</span>
              <span>• 휴게 공간</span>
              <span>• 짐 보관함</span>
              <span>• 흡연구역</span>
            </div>
          </div>
        </section>

        {/* 이용 규칙 */}
        <section className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold mb-4 dark:text-white flex items-center gap-2">
            <Shield className="w-5 h-5" />
            이용 규칙
          </h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2 dark:text-white">기본 예절</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• 큰 소리로 떠들거나 욕설 금지</li>
                <li>• 다른 이용자에게 피해 주지 않기</li>
                <li>• 기기 파손 시 배상 책임</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2 dark:text-white">금지 사항</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• 음주 후 이용 금지</li>
                <li>• 흡연 금지 (흡연구역 이용)</li>
                <li>• 음식물 반입 금지 (음료는 가능)</li>
                <li>• 기기 임의 조작 금지</li>
              </ul>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
              <h3 className="font-semibold mb-2 text-red-900 dark:text-red-300">안전 수칙</h3>
              <ul className="text-sm text-red-700 dark:text-red-400 space-y-1">
                <li>• 젖은 손으로 기기 조작 금지</li>
                <li>• 과도한 힘 사용 금지</li>
                <li>• 어린이는 보호자 동반 필수</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 특별 서비스 */}
        <section className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold mb-4 dark:text-white flex items-center gap-2">
            <Gift className="w-5 h-5" />
            특별 서비스
          </h2>
          
          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-gray-500 mt-0.5" />
              <div>
                <p className="font-medium dark:text-white">초보자 가이드</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">처음 오신 분들을 위한 게임 설명</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-500 mt-0.5" />
              <div>
                <p className="font-medium dark:text-white">이벤트</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">월별 토너먼트, 스코어 챌린지</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CreditCard className="w-5 h-5 text-gray-500 mt-0.5" />
              <div>
                <p className="font-medium dark:text-white">멤버십</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">단골 고객 할인 혜택</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Gift className="w-5 h-5 text-gray-500 mt-0.5" />
              <div>
                <p className="font-medium dark:text-white">생일 할인</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">생일 당일 20% 할인</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400 mb-4">게임을 예약하고 싶으신가요?</p>
          <a 
            href="/reservations/new" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
          >
            지금 예약하기
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </main>
  );
}