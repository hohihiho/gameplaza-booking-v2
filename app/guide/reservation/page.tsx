// 예약 이용안내 페이지
// 비전공자 설명: 예약 시스템 사용 방법을 상세히 안내하는 페이지입니다
'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Clock, Calendar, CreditCard, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ReservationGuidePage() {
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const faqs = [
    {
      id: 'faq1',
      question: '예약 없이도 이용 가능한가요?',
      answer: '네, 가능합니다. 예약은 대여 시에만 필요하며, 일반 이용은 자유롭게 가능합니다.'
    },
    {
      id: 'faq2',
      question: '친구와 함께 예약하고 싶어요.',
      answer: '각자 개별 예약을 하시되, 메모란에 함께 이용 희망을 적어주세요. 관리자가 확인 후 최대한 인접한 기기로 배정해드립니다.'
    },
    {
      id: 'faq3',
      question: '예약 승인은 얼마나 걸리나요?',
      answer: '보통 30분 이내 처리되며, 영업시간 외 신청은 다음 영업일에 처리됩니다.'
    },
    {
      id: 'faq4',
      question: '기기가 고장나면 어떻게 하나요?',
      answer: '즉시 직원에게 알려주시면 다른 기기로 변경해드립니다. 이용 시간은 보장됩니다.'
    },
    {
      id: 'faq5',
      question: '예약 시간을 연장할 수 있나요?',
      answer: '다음 예약이 없는 경우에만 현장에서 연장 가능합니다. 추가 요금이 발생합니다.'
    }
  ];

  const toggleFaq = (id: string) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* 페이지 헤더 */}
      <section className="bg-white dark:bg-gray-900 py-8 px-5 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold dark:text-white">예약 안내</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">게임기 대여 예약 방법과 주의사항을 안내드립니다</p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-5 py-8 space-y-8">
        {/* 예약 시스템 소개 */}
        <section className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold mb-4 dark:text-white">예약 시스템 소개</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            광주 게임플라자는 편리한 웹 예약 시스템을 운영합니다.
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Clock className="w-8 h-8 mx-auto mb-2 text-gray-700 dark:text-gray-300" />
              <p className="font-medium dark:text-white">24시간 예약</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">언제든 예약 가능</p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-700 dark:text-gray-300" />
              <p className="font-medium dark:text-white">실시간 현황</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">예약 상태 즉시 확인</p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <CreditCard className="w-8 h-8 mx-auto mb-2 text-gray-700 dark:text-gray-300" />
              <p className="font-medium dark:text-white">모바일 최적화</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">PWA 지원</p>
            </div>
          </div>
        </section>

        {/* 예약 가능 시간대 */}
        <section className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold mb-4 dark:text-white">예약 가능 시간대</h2>
          
          <div className="mb-4">
            <h3 className="font-semibold mb-3 dark:text-white">기본 시간대</h3>
            <div className="grid gap-2 md:grid-cols-2">
              <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="text-gray-600 dark:text-gray-400">조기영업</span>
                <span className="font-medium dark:text-white">07:00~12:00 (5시간)</span>
              </div>
              <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="text-gray-600 dark:text-gray-400">주간영업</span>
                <span className="font-medium dark:text-white">12:00~18:00 (6시간)</span>
              </div>
              <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="text-gray-600 dark:text-gray-400">야간영업</span>
                <span className="font-medium dark:text-white">18:00~24:00 (6시간)</span>
              </div>
              <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="text-gray-600 dark:text-gray-400">밤샘영업</span>
                <span className="font-medium dark:text-white">24:00~07:00 (7시간)</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h3 className="font-semibold mb-2 text-blue-900 dark:text-blue-300">커스텀 시간대</h3>
            <p className="text-sm text-blue-700 dark:text-blue-400">
              관리자가 특별히 설정한 시간대를 선택할 수 있습니다.<br />
              예시: 08:00~12:00, 14:00~20:00, 10:00~16:00 등
            </p>
          </div>
        </section>

        {/* 예약 방법 */}
        <section className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold mb-4 dark:text-white">예약 방법</h2>
          
          {/* Step 1 */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <h3 className="font-semibold dark:text-white">회원가입</h3>
            </div>
            <div className="ml-11 space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p>1. 구글 계정으로 간편 로그인</p>
              <p>2. 전화번호 인증 (SMS)</p>
              <p>3. 닉네임 설정</p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <h3 className="font-semibold dark:text-white">예약 신청</h3>
            </div>
            <div className="ml-11 space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p>1. 원하는 날짜 선택</p>
              <p>2. 원하는 기기 종류 선택 (마이마이, 츄니즘, 발키리, 라이트닝)</p>
              <p>3. 예약 가능 시간대 확인</p>
              <p>4. 원하는 시간대와 대수 선택</p>
              <p>5. 옵션 선택 (마이마이 2P: +10,000원)</p>
              <p>6. 예약 신청 완료</p>
            </div>
          </div>

          {/* Step 3 */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <h3 className="font-semibold dark:text-white">예약 확인</h3>
            </div>
            <div className="ml-11 space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p>• 관리자 승인 대기 (평균 30분 이내)</p>
              <p>• 승인/거절 시 즉시 알림</p>
              <p>• 마이페이지에서 예약 상태 확인</p>
            </div>
          </div>
        </section>

        {/* 예약 규칙 */}
        <section className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold mb-4 dark:text-white">예약 규칙</h2>
          
          {/* 24시간 룰 */}
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <h3 className="font-semibold mb-2 text-yellow-900 dark:text-yellow-300 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              24시간 룰
            </h3>
            <ul className="text-sm text-yellow-800 dark:text-yellow-400 space-y-1">
              <li>• 1인당 24시간 내 1회 예약만 가능</li>
              <li>• 이용 완료 후 24시간 뒤부터 다음 예약 가능</li>
              <li>• 취소 시에도 24시간 룰 적용</li>
            </ul>
          </div>

          {/* 예약 변경/취소 */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3 dark:text-white">예약 변경/취소</h3>
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                <div>
                  <p className="font-medium dark:text-white">이용 24시간 전</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">무료 취소 가능</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div>
                  <p className="font-medium dark:text-white">이용 24시간~6시간 전</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">50% 취소 수수료</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                <div>
                  <p className="font-medium dark:text-white">이용 6시간 이내</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">취소 불가</p>
                </div>
              </div>
            </div>
          </div>

          {/* 패널티 */}
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <h3 className="font-semibold mb-2 text-red-900 dark:text-red-300">패널티</h3>
            <ul className="text-sm text-red-800 dark:text-red-400 space-y-1">
              <li>• 노쇼 2회: 1개월 예약 제한</li>
              <li>• 노쇼 3회: 블랙리스트 등록</li>
              <li>• 악의적 이용: 영구 이용 제한</li>
            </ul>
          </div>
        </section>

        {/* 체크인 및 결제 */}
        <section className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold mb-4 dark:text-white">체크인 및 결제</h2>
          
          <div className="mb-6">
            <h3 className="font-semibold mb-3 dark:text-white">체크인 절차</h3>
            <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>1. 예약 시간 10분 전부터 체크인 가능</li>
              <li>2. 카운터에서 예약 확인</li>
              <li>3. 기기 번호 배정</li>
              <li>4. 결제 진행</li>
            </ol>
          </div>

          <div>
            <h3 className="font-semibold mb-3 dark:text-white">결제 방법</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="font-medium mb-2 dark:text-white">현금 결제</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">카운터에서 직접 결제</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="font-medium mb-2 dark:text-white">계좌이체</p>
                <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>1. 체크인 시 계좌정보 알림 수신</li>
                  <li>2. 알림 클릭하여 계좌번호 복사</li>
                  <li>3. 이체 완료 후 확인</li>
                </ol>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold mb-4 dark:text-white">자주 묻는 질문</h2>
          
          <div className="space-y-2">
            {faqs.map((faq) => (
              <div key={faq.id} className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <span className="font-medium dark:text-white">{faq.question}</span>
                  <ChevronDown 
                    className={`w-5 h-5 text-gray-500 transition-transform ${
                      expandedFaq === faq.id ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {expandedFaq === faq.id && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400 mb-4">준비되셨나요?</p>
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