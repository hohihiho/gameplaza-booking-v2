'use client';

import { useState, useEffect } from 'react';
import { 
  Clock, 
  MapPin, 
  Users, 
  AlertCircle,
  Wifi,
  BatteryCharging,
  Coffee,
  ShoppingBag,
  CheckCircle,
  XCircle,
  MessageCircle,
  Gamepad2,
  Calendar,
  Info,
  ChevronRight,
  Shield,
  Star
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface GuideContent {
  id: string;
  category: 'arcade' | 'reservation';
  section: string;
  title: string;
  content: string[];
  order_index: number;
  is_active: boolean;
}

export default function GuidePage() {
  const [activeTab, setActiveTab] = useState<'arcade' | 'reservation'>('arcade');
  const [guideContents, setGuideContents] = useState<GuideContent[]>([]);
  const [loading, setLoading] = useState(true);

  // 데이터 로드
  useEffect(() => {
    const fetchGuideContents = async () => {
      try {
        const response = await fetch('/api/guide-contents');
        const data = await response.json();
        
        if (response.ok) {
          setGuideContents(data.contents);
        } else {
          console.error('가이드 콘텐츠 로드 실패:', data.error);
        }
      } catch (error) {
        console.error('가이드 콘텐츠 로드 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGuideContents();
  }, []);

  // 섹션별 콘텐츠 가져오기
  const getContentBySection = (category: 'arcade' | 'reservation', section: string) => {
    return guideContents.find(content => 
      content.category === category && 
      content.section === section && 
      content.is_active
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-5 py-8">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            이용안내
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            광주 게임플라자 이용 가이드
          </p>
        </div>

        {/* 탭 */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-white dark:bg-gray-900 rounded-lg shadow-sm p-1 border border-gray-200 dark:border-gray-800">
            <button
              onClick={() => setActiveTab('arcade')}
              className={`px-6 py-2.5 rounded-md transition-all font-medium text-sm ${
                activeTab === 'arcade'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Gamepad2 className="w-4 h-4 inline mr-2" />
              오락실 이용안내
            </button>
            <button
              onClick={() => setActiveTab('reservation')}
              className={`px-6 py-2.5 rounded-md transition-all font-medium text-sm ${
                activeTab === 'reservation'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4 inline mr-2" />
              예약 이용안내
            </button>
          </div>
        </div>

        {/* 컨텐츠 */}
        <div className="max-w-4xl mx-auto">
          {activeTab === 'arcade' ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* 기본 정보 */}
              <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                    <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h2 className="text-xl font-bold dark:text-white">기본 정보</h2>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Clock className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium dark:text-white">영업시간</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          층별로 다른 영업시간 운영<br/>
                          자세한 시간은 영업일정 확인
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium dark:text-white">위치</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          광주광역시 동구 충장로안길 6
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <MessageCircle className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium dark:text-white">카카오톡 문의</p>
                        <Link href="https://open.kakao.com/o/sJPbo3Sb" target="_blank">
                          <p className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                            1:1 문의하기
                          </p>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 편의시설 */}
              <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                    <Star className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h2 className="text-xl font-bold dark:text-white">편의시설</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Wifi className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm dark:text-white">무료 WiFi</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <BatteryCharging className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm dark:text-white">충전 스테이션</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Coffee className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm dark:text-white">음료 자판기</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <ShoppingBag className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm dark:text-white">짐 보관 바구니</span>
                  </div>
                </div>
              </div>

              {/* 이용 수칙 */}
              <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h2 className="text-xl font-bold dark:text-white">
                    {getContentBySection('arcade', 'rules')?.title || '이용 수칙'}
                  </h2>
                </div>
                <div className="space-y-2">
                  {(getContentBySection('arcade', 'rules')?.content || [
                    '게임기는 소중히 다뤄주세요',
                    '다른 이용자를 배려해주세요', 
                    '쓰레기는 쓰레기통에 버려주세요',
                    '대기카드 놓은 순서대로 이용해주시고, 순서가 되면 바로 플레이해주세요',
                    '유령카드를 만들지 마시고 실제 플레이할 때만 대기카드를 놓아주세요',
                    '게임기에 음료수를 흘리지 않도록 주의해주세요',
                    '음료수를 흘리거나 쏟으셨을 시 기기 닦는 걸레로 닦지 마시고 현장 관리자에게 알려주세요',
                    '게임 플레이 중 프리징 문제 발생 시 현장 관리자에게 문의해주세요',
                    '보수가 필요한 문제의 경우 1:1 카카오톡 문의에 남겨주세요'
                  ]).map((rule, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm dark:text-gray-300">{rule}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 방송기기 이용 안내 */}
              <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <Wifi className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <h2 className="text-xl font-bold dark:text-white">방송기기 이용 안내</h2>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm dark:text-gray-300">방송기기 컴퓨터는 방송이나 녹화의 용도로만 사용해주세요</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm dark:text-gray-300">OBS의 스트림키를 삭제하지 말아주세요</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm dark:text-gray-300">유튜브 로그아웃을 하지 말아주세요</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm dark:text-gray-300">녹화 시, 녹화파일은 USB로 옮겨주세요</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm dark:text-gray-300">인터넷 사용량 문제로 클라우드 사용을 하지 말아주세요</span>
                    </div>
                </div>
              </div>

              {/* 음료수 자판기 안내 */}
              <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Coffee className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h2 className="text-xl font-bold dark:text-white">음료수 자판기 안내</h2>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <span className="text-sm dark:text-gray-300">지폐 오류 발생 시 현장 관리자에게 문의해주세요</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <span className="text-sm dark:text-gray-300">음료수가 나오지 않을 경우 현장 관리자에게 문의해주세요</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <span className="text-sm dark:text-gray-300">음료수를 쏟으셨을 경우 현장 관리자에게 문의해주세요</span>
                  </div>
                </div>
              </div>

              {/* 선불카드 안내 */}
              <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                    <Star className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h2 className="text-xl font-bold dark:text-white">선불카드 안내</h2>
                </div>
                <div className="space-y-3">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <h3 className="font-medium mb-2 dark:text-white">카드 구매 및 충전</h3>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• 카드 가격: 5,000원</li>
                      <li>• 10,000원 충전 시 1,000원 추가 충전</li>
                      <li>• 최대 충전 한도: 30만원 (추가충전 포함)</li>
                      <li>• 자판기에서 카드 구매 및 충전 가능</li>
                    </ul>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <h3 className="font-medium mb-2 dark:text-white">기타 판매 물품</h3>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• 게임카드: 카드판매기에서 구매</li>
                      <li>• 장갑: 500원</li>
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* 예약 시스템 안내 */}
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-white/20 backdrop-blur rounded-lg">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold">예약 시스템</h2>
                </div>
                <p className="mb-4 text-white/90">
                  기기 대여 예약을 하고싶다면?
                </p>
                <Link href="/reservations/new">
                  <button className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur rounded-lg hover:bg-white/30 transition-colors font-semibold">
                    예약하러 가기
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </Link>
              </div>

              {/* 예약 방법 */}
              <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                    <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h2 className="text-xl font-bold dark:text-white">예약 방법</h2>
                </div>
                <div className="space-y-4">
                  {[
                    { step: 1, title: '로그인', desc: '구글 계정으로 간편 로그인' },
                    { step: 2, title: '날짜 선택', desc: '예약하고 싶은 날짜 선택' },
                    { step: 3, title: '기기 선택', desc: '원하는 게임기 종류 선택' },
                    { step: 4, title: '시간대 선택', desc: '이용 가능한 시간대 확인 후 선택' },
                    { step: 5, title: '상세 옵션 선택', desc: '기기번호, 크레딧타입, 인원 선택' },
                    { step: 6, title: '최종 확인', desc: '예약 정보 확인 후 신청 완료' },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-4">
                      <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold">
                        {item.step}
                      </div>
                      <div>
                        <p className="font-medium dark:text-white">{item.title}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <p className="text-sm text-green-700 dark:text-green-300">
                      관리자 승인 후 예약이 확정됩니다
                    </p>
                  </div>
                </div>
              </div>

              {/* 예약 규정 */}
              <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                    <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h2 className="text-xl font-bold dark:text-white">예약 규정</h2>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="w-5 h-5 text-indigo-600" />
                      <h3 className="font-semibold dark:text-white">예약 시간대</h3>
                    </div>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                      <li>• 예약은 이용 시간 24시간 전까지만 가능합니다.</li>
                      <li>• 예약은 정해진 시간대로만 가능합니다. 시간별 예약은 불가능합니다.</li>
                      <li>• 각 기기별로 예약 가능한 시간대가 다르니 확인 후 선택해주세요.</li>
                      <li>• 당일 예약은 시스템상 불가능하며, 당일 예약을 희망하시는 경우 1:1 카카오톡으로 문의해주시면 가능 여부를 확인해드립니다.</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="w-5 h-5 text-amber-600" />
                      <h3 className="font-semibold dark:text-white">취소 규정</h3>
                    </div>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                      <li>• 예약하신 시간 24시간 전까지는 언제든지 자유롭게 취소하실 수 있습니다.</li>
                      <li>• 대여 시작 24시간 이내에는 시스템상 취소가 불가능합니다.</li>
                      <li>• 24시간 이전 예약 취소 모두 1:1 카카오톡으로 문의해주시면 상황에 따라 도와드리겠습니다.</li>
                      <li>• 예약 후 연락 없이 방문하지 않으실 경우(노쇼) 향후 예약에 제한이 있을 수 있습니다.</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="w-5 h-5 text-purple-600" />
                      <h3 className="font-semibold dark:text-white">예약 제한 및 확정 조건</h3>
                    </div>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                      <li>• 한 번에 최대 3개까지 예약을 보유하실 수 있습니다.</li>
                      <li>• 다음날부터 최대 3주 후까지의 날짜에 예약이 가능합니다.</li>
                      <li>• 조기 영업 및 밤샘 영업은 해당 시간대에 2대 이상의 예약이 접수되어야 영업이 확정됩니다.</li>
                      <li>• 2대 이상의 예약이 접수되더라도 관리자의 개인 일정이나 부득이한 사정으로 인해 예약이 거절 및 취소될 수 있으며, 이 경우 미리 안내드립니다.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 예약 이용 안내 */}
              <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                    <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h2 className="text-xl font-bold dark:text-white">예약 이용 안내</h2>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Shield className="w-5 h-5 text-green-600" />
                      <h3 className="font-semibold dark:text-white">결제 안내</h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      모든 결제는 현장에서 진행됩니다.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="w-5 h-5 text-amber-600" />
                      <h3 className="font-semibold dark:text-white">밤샘대여 체크인</h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      밤샘대여를 예약하신 고객님께서는 최소 23시 45분 이전까지 체크인하시는 것을 추천드립니다.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Star className="w-5 h-5 text-purple-600" />
                      <h3 className="font-semibold dark:text-white">무한크레딧 옵션</h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      무한크레딧 옵션을 처음 이용하시는 경우, 관리자에게 문의해주시면 사용 방법을 친절하게 안내해드립니다.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <MessageCircle className="w-5 h-5 text-indigo-600" />
                      <h3 className="font-semibold dark:text-white">문의사항 안내</h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      체크인 시간에 늦을 것 같거나 기타 문의사항이 발생하신 경우 1:1 카카오톡으로 문의해주시면 신속하게 도와드립니다.<br/>
                      만약 답변이 없을 경우, 오픈카톡의 부관리자에게 문의해주시면 됩니다.
                    </p>
                  </div>
                </div>
              </div>

            </motion.div>
          )}
        </div>

        {/* 하단 링크 */}
        <div className="mt-12 text-center">
          <div className="inline-flex flex-col sm:flex-row gap-4 w-full max-w-lg mx-auto">
            <Link href="/machines" className="flex-1">
              <button className="w-full px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 group">
                <Gamepad2 className="w-5 h-5 inline mr-2 group-hover:rotate-12 transition-transform" />
                기기 현황 보기
              </button>
            </Link>
            <Link href="/schedule" className="flex-1">
              <button className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 group">
                <Calendar className="w-5 h-5 inline mr-2 group-hover:rotate-12 transition-transform" />
                운영 일정 보기
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}