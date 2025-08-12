'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, Shield, Users, AlertCircle, Clock, CreditCard, Ban, Settings, Scale, HelpCircle } from 'lucide-react';

export default function TermsPage() {
  const searchParams = useSearchParams();
  const isModal = searchParams.get('modal') === 'true';

  return (
    <div className={isModal ? "bg-white dark:bg-gray-900" : "min-h-screen bg-gray-50 dark:bg-gray-950"}>
      {/* 헤더 - 모달일 때는 숨김 */}
      {!isModal && (
        <section className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-800 py-16 px-5 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-transparent" />
          <div className="relative max-w-6xl mx-auto">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              홈으로
            </Link>
            
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              서비스 이용약관
            </h1>
            <p className="text-lg text-indigo-100">
              시행일: 2025년 2월 1일 | 버전: 2.0
            </p>
          </div>
        </section>
      )}

      {/* 내용 */}
      <section className={isModal ? "px-5 py-8" : "max-w-4xl mx-auto px-5 py-12"}>
        <div className={isModal ? "space-y-10" : "bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-800 space-y-10"}>
          
          {/* 서문 */}
          <div className="p-6 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl border border-indigo-200 dark:border-indigo-800">
            <div className="flex items-start gap-3">
              <Scale className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mt-1" />
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">약관의 목적</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  본 약관은 광주 게임플라자(이하 "회사")가 제공하는 게임기기 예약 및 이용 서비스(이하 "서비스")의 이용 조건 및 절차, 
                  회사와 회원 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
                </p>
              </div>
            </div>
          </div>

          {/* 제1장: 총칙 */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white border-b pb-3 dark:border-gray-800">
              제1장 총칙
            </h2>

            {/* 제1조 */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                제1조 (목적)
              </h3>
              <p className="text-gray-700 dark:text-gray-300 pl-8">
                이 약관은 광주 게임플라자(이하 "회사")가 운영하는 게임플라자 예약 시스템(이하 "서비스")을 이용함에 있어 
                회사와 이용자의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.
              </p>
            </div>

            {/* 제2조 */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                제2조 (용어의 정의)
              </h3>
              <div className="pl-8 space-y-3 text-gray-700 dark:text-gray-300">
                <p>본 약관에서 사용하는 용어의 정의는 다음과 같습니다:</p>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>
                    <strong>"서비스"</strong>란 회사가 제공하는 게임기기 예약 및 이용과 관련된 일체의 서비스를 의미합니다.
                  </li>
                  <li>
                    <strong>"회원"</strong>이란 본 약관에 동의하고 회사와 서비스 이용계약을 체결한 자를 의미합니다.
                  </li>
                  <li>
                    <strong>"예약"</strong>이란 회원이 서비스를 통해 특정 시간대의 게임기기 이용을 사전에 신청하는 것을 의미합니다.
                  </li>
                  <li>
                    <strong>"체크인"</strong>이란 예약한 시간에 실제로 게임플라자에 도착하여 이용을 시작하는 것을 의미합니다.
                  </li>
                  <li>
                    <strong>"노쇼(No-show)"</strong>란 예약 후 사전 취소 없이 이용하지 않는 것을 의미합니다.
                  </li>
                  <li>
                    <strong>"게임기기"</strong>란 회사가 보유하고 있는 각종 게임 장비를 의미합니다.
                  </li>
                  <li>
                    <strong>"운영시간"</strong>이란 게임플라자가 운영되는 시간을 의미하며, 회사가 별도로 정합니다.
                  </li>
                  <li>
                    <strong>"개인정보"</strong>란 생존하는 개인에 관한 정보로서 해당 정보에 포함된 성명, 휴대전화번호 등의 사항으로 
                    해당 개인을 식별할 수 있는 정보를 의미합니다.
                  </li>
                </ol>
              </div>
            </div>

            {/* 제3조 */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                제3조 (약관의 게시와 개정)
              </h3>
              <div className="pl-8 space-y-3 text-gray-700 dark:text-gray-300">
                <ol className="list-decimal pl-6 space-y-2">
                  <li>회사는 본 약관의 내용을 회원이 쉽게 알 수 있도록 서비스 초기 화면에 게시합니다.</li>
                  <li>회사는 「약관의 규제에 관한 법률」, 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 등 관련법을 위배하지 않는 범위에서 본 약관을 개정할 수 있습니다.</li>
                  <li>회사가 약관을 개정할 경우에는 적용일자 및 개정사유를 명시하여 현행 약관과 함께 서비스 초기 화면에 그 적용일자 7일 이전부터 적용일자 전일까지 공지합니다.</li>
                  <li>회원이 개정약관에 동의하지 않는 경우, 회원은 이용계약을 해지할 수 있습니다.</li>
                  <li>개정약관의 적용일 이후에도 서비스를 계속 이용하는 경우에는 개정약관에 동의한 것으로 간주합니다.</li>
                </ol>
              </div>
            </div>

            {/* 제4조 */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                제4조 (약관 외 준칙)
              </h3>
              <p className="text-gray-700 dark:text-gray-300 pl-8">
                본 약관에서 정하지 아니한 사항과 본 약관의 해석에 관하여는 「전자상거래 등에서의 소비자보호에 관한 법률」, 
                「약관의 규제에 관한 법률」, 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 등 관련법령 또는 상관례에 따릅니다.
              </p>
            </div>
          </div>

          {/* 제2장: 회원가입 및 서비스 이용 */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white border-b pb-3 dark:border-gray-800">
              제2장 회원가입 및 서비스 이용
            </h2>

            {/* 제5조 */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                제5조 (이용계약의 체결)
              </h3>
              <div className="pl-8 space-y-3 text-gray-700 dark:text-gray-300">
                <ol className="list-decimal pl-6 space-y-2">
                  <li>이용계약은 회원이 되고자 하는 자(이하 "가입신청자")가 본 약관에 동의하고 회사가 정한 가입 양식에 따라 회원정보를 기입하여 회원가입을 신청하고, 회사가 이를 승낙함으로써 체결됩니다.</li>
                  <li>회사는 가입신청자의 신청에 대하여 서비스 이용을 승낙함을 원칙으로 합니다. 다만, 회사는 다음 각 호에 해당하는 신청에 대하여는 승낙을 하지 않거나 사후에 이용계약을 해지할 수 있습니다:
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li>타인의 명의를 도용하여 신청한 경우</li>
                      <li>허위의 정보를 기재하거나, 회사가 요구하는 내용을 기재하지 않은 경우</li>
                      <li>만 14세 미만 아동이 신청한 경우</li>
                      <li>이용자의 귀책사유로 인하여 승인이 불가능하거나 기타 이 약관에서 규정한 제반 사항을 위반하며 신청하는 경우</li>
                      <li>부정한 용도로 서비스를 이용하고자 하는 경우</li>
                      <li>영리를 추구할 목적으로 서비스를 이용하고자 하는 경우</li>
                      <li>기타 회사가 정한 이용신청 요건이 미비한 경우</li>
                    </ul>
                  </li>
                  <li>회원가입은 Google OAuth를 통한 소셜 로그인으로만 가능하며, 1인 1계정 원칙을 준수해야 합니다.</li>
                </ol>
              </div>
            </div>

            {/* 제6조 */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                제6조 (회원정보의 변경)
              </h3>
              <div className="pl-8 space-y-3 text-gray-700 dark:text-gray-300">
                <ol className="list-decimal pl-6 space-y-2">
                  <li>회원은 마이페이지를 통하여 언제든지 본인의 개인정보를 열람하고 수정할 수 있습니다.</li>
                  <li>회원은 회원가입 시 기재한 사항이 변경되었을 경우 온라인으로 수정을 하거나 고객센터를 통하여 회사에 변경 사항을 알려야 합니다.</li>
                  <li>회원정보 변경을 하지 않아 발생한 불이익에 대하여 회사는 책임지지 않습니다.</li>
                  <li>휴대전화번호 변경 시 반드시 업데이트해야 하며, 미변경으로 인한 예약 알림 미수신 등의 불이익은 회원의 책임입니다.</li>
                </ol>
              </div>
            </div>

            {/* 제7조 */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                제7조 (회원 탈퇴 및 자격 상실)
              </h3>
              <div className="pl-8 space-y-3 text-gray-700 dark:text-gray-300">
                <ol className="list-decimal pl-6 space-y-2">
                  <li>회원은 회사에 언제든지 탈퇴를 요청할 수 있으며, 회사는 즉시 회원탈퇴를 처리합니다.</li>
                  <li>회원이 다음 각 호의 사유에 해당하는 경우, 회사는 회원자격을 제한 또는 정지시킬 수 있습니다:
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li>가입 신청 시 허위 내용을 등록한 경우</li>
                      <li>다른 사람의 서비스 이용을 방해하거나 그 정보를 도용하는 등 전자상거래 질서를 위협하는 경우</li>
                      <li>서비스를 이용하여 법령 또는 이 약관이 금지하거나 공서양속에 반하는 행위를 하는 경우</li>
                      <li>노쇼(No-show)를 월 3회 이상 또는 연속 3회 이상 한 경우</li>
                      <li>예약 시스템을 악용하여 다른 회원의 이용을 방해한 경우</li>
                      <li>게임기기를 고의로 파손하거나 훼손한 경우</li>
                    </ul>
                  </li>
                  <li>회사가 회원 자격을 제한·정지시킨 후, 동일한 행위가 2회 이상 반복되거나 30일 이내에 그 사유가 시정되지 아니하는 경우 회사는 회원자격을 상실시킬 수 있습니다.</li>
                </ol>
              </div>
            </div>
          </div>

          {/* 제3장: 예약 및 이용 규정 */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white border-b pb-3 dark:border-gray-800">
              제3장 예약 및 이용 규정
            </h2>

            {/* 제8조 */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                제8조 (예약 서비스)
              </h3>
              <div className="pl-8 space-y-3 text-gray-700 dark:text-gray-300">
                <ol className="list-decimal pl-6 space-y-2">
                  <li>회원은 서비스를 통해 게임기기 이용을 사전에 예약할 수 있습니다.</li>
                  <li>예약 가능 시간 및 규칙:
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li>예약은 최소 30분 단위로 가능합니다</li>
                      <li>1일 최대 예약 가능 시간은 기기별로 상이하며, 서비스에 명시된 제한을 따릅니다</li>
                      <li>동시간대 중복 예약은 불가능합니다</li>
                      <li>예약은 최대 7일 전부터 가능합니다</li>
                      <li>당일 예약은 이용 시작 1시간 전까지 가능합니다</li>
                    </ul>
                  </li>
                  <li>예약 변경 및 취소:
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li>예약 변경은 이용 시작 1시간 전까지 가능합니다</li>
                      <li>예약 취소는 이용 시작 10분 전까지 가능합니다</li>
                      <li>취소 시간을 초과한 경우 노쇼로 처리됩니다</li>
                    </ul>
                  </li>
                  <li>체크인 규정:
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li>예약 시간 10분 전부터 체크인 가능합니다</li>
                      <li>예약 시간 10분 경과 시 자동으로 예약이 취소되며 노쇼로 처리됩니다</li>
                      <li>체크인은 현장에서만 가능합니다</li>
                    </ul>
                  </li>
                </ol>
              </div>
            </div>

            {/* 제9조 */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                제9조 (노쇼 페널티)
              </h3>
              <div className="pl-8 space-y-3 text-gray-700 dark:text-gray-300">
                <ol className="list-decimal pl-6 space-y-2">
                  <li>노쇼 발생 시 다음과 같은 페널티가 부과됩니다:
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li>1회: 경고 및 안내 메시지 발송</li>
                      <li>2회: 7일간 예약 제한</li>
                      <li>3회: 30일간 예약 제한</li>
                      <li>연속 3회 또는 월 3회 이상: 60일간 예약 제한</li>
                    </ul>
                  </li>
                  <li>노쇼 기록은 발생일로부터 6개월간 보관되며, 6개월 경과 시 자동 소멸됩니다.</li>
                  <li>부득이한 사유(천재지변, 질병, 사고 등)로 인한 노쇼는 증빙자료 제출 시 페널티에서 제외될 수 있습니다.</li>
                </ol>
              </div>
            </div>

            {/* 제10조 */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                제10조 (대여 서비스)
              </h3>
              <div className="pl-8 space-y-3 text-gray-700 dark:text-gray-300">
                <ol className="list-decimal pl-6 space-y-2">
                  <li>특정 게임기기는 대여 방식으로만 이용 가능합니다.</li>
                  <li>대여 시 다음 사항을 준수해야 합니다:
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li>대여료는 시간당 요금제로 운영됩니다</li>
                      <li>최소 대여 시간은 1시간입니다</li>
                      <li>대여 가능 시간은 운영시간 내로 제한됩니다</li>
                      <li>대여 연장은 현장에서 가능하나, 후속 예약이 있는 경우 불가능합니다</li>
                    </ul>
                  </li>
                  <li>대여 기기의 파손, 분실 시 회원이 배상 책임을 집니다.</li>
                </ol>
              </div>
            </div>
          </div>

          {/* 제4장: 이용요금 및 결제 */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white border-b pb-3 dark:border-gray-800">
              제4장 이용요금 및 결제
            </h2>

            {/* 제11조 */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                제11조 (이용요금)
              </h3>
              <div className="pl-8 space-y-3 text-gray-700 dark:text-gray-300">
                <ol className="list-decimal pl-6 space-y-2">
                  <li>서비스 이용요금은 다음과 같이 구분됩니다:
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li>무료 이용: 지정된 게임기기의 기본 이용</li>
                      <li>유료 대여: 특정 게임기기의 시간당 대여료</li>
                    </ul>
                  </li>
                  <li>구체적인 이용요금은 서비스 내 요금표에 명시되며, 회사는 운영상 필요에 따라 요금을 조정할 수 있습니다.</li>
                  <li>요금 변경 시 최소 7일 전에 서비스를 통해 공지합니다.</li>
                  <li>이미 예약된 건에 대해서는 예약 당시의 요금이 적용됩니다.</li>
                </ol>
              </div>
            </div>

            {/* 제12조 */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                제12조 (결제 방법)
              </h3>
              <div className="pl-8 space-y-3 text-gray-700 dark:text-gray-300">
                <ol className="list-decimal pl-6 space-y-2">
                  <li>유료 서비스 이용 시 결제는 현장에서 다음 방법으로 가능합니다:
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li>현금</li>
                      <li>신용/체크카드</li>
                      <li>계좌이체</li>
                      <li>기타 회사가 인정하는 결제수단</li>
                    </ul>
                  </li>
                  <li>온라인 사전 결제 시스템이 도입되는 경우, 별도로 공지합니다.</li>
                  <li>결제 관련 분쟁 발생 시 회사의 결제 기록을 기준으로 합니다.</li>
                </ol>
              </div>
            </div>

            {/* 제13조 */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                제13조 (환불 규정)
              </h3>
              <div className="pl-8 space-y-3 text-gray-700 dark:text-gray-300">
                <ol className="list-decimal pl-6 space-y-2">
                  <li>사전 결제한 서비스의 환불은 다음 기준에 따릅니다:
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li>이용 24시간 전 취소: 전액 환불</li>
                      <li>이용 12시간 전 취소: 80% 환불</li>
                      <li>이용 6시간 전 취소: 50% 환불</li>
                      <li>이용 6시간 이내 취소: 환불 불가</li>
                    </ul>
                  </li>
                  <li>회사의 귀책사유로 서비스를 제공하지 못한 경우 전액 환불합니다.</li>
                  <li>천재지변 등 불가항력으로 서비스 제공이 불가능한 경우 전액 환불합니다.</li>
                </ol>
              </div>
            </div>
          </div>

          {/* 제5장: 서비스 이용 제한 */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white border-b pb-3 dark:border-gray-800">
              제5장 서비스 이용 제한
            </h2>

            {/* 제14조 */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Ban className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                제14조 (서비스 이용 제한)
              </h3>
              <div className="pl-8 space-y-3 text-gray-700 dark:text-gray-300">
                <p className="mb-3">회사는 회원이 다음 각 호에 해당하는 경우 서비스 이용을 제한할 수 있습니다:</p>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>타인의 정보를 도용하여 회원가입 또는 예약하는 행위</li>
                  <li>서비스의 안정적 운영을 방해하는 행위
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li>악성코드, 바이러스 등을 유포하는 행위</li>
                      <li>시스템 취약점을 악용하는 행위</li>
                      <li>과도한 요청으로 서버에 부하를 주는 행위</li>
                    </ul>
                  </li>
                  <li>다른 회원의 서비스 이용을 방해하는 행위
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li>허위 예약으로 다른 회원의 이용을 방해</li>
                      <li>예약 후 의도적인 노쇼 반복</li>
                      <li>타인의 예약을 무단 취소하려는 시도</li>
                    </ul>
                  </li>
                  <li>게임플라자 내에서 다음과 같은 행위
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li>타 이용자에게 불쾌감을 주는 행위</li>
                      <li>시설물을 고의로 훼손하는 행위</li>
                      <li>음주, 흡연 등 금지된 행위</li>
                      <li>상업적 목적의 촬영 또는 방송</li>
                    </ul>
                  </li>
                  <li>기타 관계법령에 위배되는 행위</li>
                </ol>
              </div>
            </div>

            {/* 제15조 */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                제15조 (이용제한의 절차)
              </h3>
              <div className="pl-8 space-y-3 text-gray-700 dark:text-gray-300">
                <ol className="list-decimal pl-6 space-y-2">
                  <li>회사는 제14조에 따른 이용제한을 하는 경우 다음 사항을 회원에게 통지합니다:
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li>이용제한 사유</li>
                      <li>이용제한 유형 및 기간</li>
                      <li>이의신청 방법 및 절차</li>
                    </ul>
                  </li>
                  <li>이용제한 통지는 서비스 내 알림, 이메일, SMS 중 1개 이상의 방법으로 합니다.</li>
                  <li>이용제한에 대해 이의가 있는 회원은 통지받은 날로부터 7일 이내에 이의신청을 할 수 있습니다.</li>
                  <li>회사는 이의신청에 대해 15일 이내에 답변해야 합니다.</li>
                </ol>
              </div>
            </div>
          </div>

          {/* 제6장: 책임 및 의무 */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white border-b pb-3 dark:border-gray-800">
              제6장 책임 및 의무
            </h2>

            {/* 제16조 */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                제16조 (회사의 의무)
              </h3>
              <div className="pl-8 space-y-3 text-gray-700 dark:text-gray-300">
                <ol className="list-decimal pl-6 space-y-2">
                  <li>회사는 관련법령과 본 약관이 금지하거나 미풍양속에 반하는 행위를 하지 않으며, 계속적이고 안정적으로 서비스를 제공하기 위하여 최선을 다합니다.</li>
                  <li>회사는 회원이 안전하게 서비스를 이용할 수 있도록 개인정보보호를 위한 보안시스템을 구축하며 개인정보처리방침을 공시하고 준수합니다.</li>
                  <li>회사는 서비스 이용과 관련하여 회원으로부터 제기된 의견이나 불만이 정당하다고 인정할 경우에는 이를 처리하여야 합니다.</li>
                  <li>회사는 서비스의 제공과 관련하여 알게 된 회원의 개인정보를 본인의 동의 없이 제3자에게 제공하지 않습니다.</li>
                </ol>
              </div>
            </div>

            {/* 제17조 */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                제17조 (회원의 의무)
              </h3>
              <div className="pl-8 space-y-3 text-gray-700 dark:text-gray-300">
                <p className="mb-3">회원은 다음 행위를 하여서는 안 됩니다:</p>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>신청 또는 변경 시 허위내용의 등록</li>
                  <li>타인의 정보도용</li>
                  <li>회사에서 게시한 정보의 변경</li>
                  <li>회사가 금지한 정보(컴퓨터 프로그램 등)의 송신 또는 게시</li>
                  <li>회사와 기타 제3자의 저작권 등 지적재산권에 대한 침해</li>
                  <li>회사 및 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위</li>
                  <li>외설 또는 폭력적인 메시지, 화상, 음성 기타 공서양속에 반하는 정보를 공개 또는 게시하는 행위</li>
                  <li>게임플라자 시설물을 파손하거나 훼손하는 행위</li>
                  <li>다른 이용자에게 폭력을 행사하거나 위협하는 행위</li>
                  <li>회사의 동의 없이 영리를 목적으로 서비스를 사용하는 행위</li>
                </ol>
              </div>
            </div>

            {/* 제18조 */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                제18조 (면책조항)
              </h3>
              <div className="pl-8 space-y-3 text-gray-700 dark:text-gray-300">
                <ol className="list-decimal pl-6 space-y-2">
                  <li>회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.</li>
                  <li>회사는 회원의 귀책사유로 인한 서비스 이용의 장애에 대하여는 책임을 지지 않습니다.</li>
                  <li>회사는 회원이 서비스와 관련하여 게재한 정보, 자료, 사실의 신뢰도, 정확성 등의 내용에 관하여는 책임을 지지 않습니다.</li>
                  <li>회사는 회원 간 또는 회원과 제3자 상호간에 서비스를 매개로 하여 발생한 분쟁 등에 대하여 책임을 지지 않습니다.</li>
                  <li>회사는 무료로 제공되는 서비스 이용과 관련하여 관련법령에 특별한 규정이 없는 한 책임을 지지 않습니다.</li>
                  <li>회사는 회원의 부주의로 인한 개인정보 유출에 대해 책임을 지지 않습니다.</li>
                  <li>회사는 게임기기 이용 중 회원의 부주의로 발생한 안전사고에 대해 책임을 지지 않습니다.</li>
                </ol>
              </div>
            </div>

            {/* 제19조 */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                제19조 (손해배상)
              </h3>
              <div className="pl-8 space-y-3 text-gray-700 dark:text-gray-300">
                <ol className="list-decimal pl-6 space-y-2">
                  <li>회원이 본 약관의 규정을 위반함으로 인하여 회사에 손해가 발생하게 되는 경우, 이 약관을 위반한 회원은 회사에 발생하는 모든 손해를 배상하여야 합니다.</li>
                  <li>회원이 서비스를 이용함에 있어 행한 불법행위나 본 약관 위반행위로 인하여 회사가 당해 회원 이외의 제3자로부터 손해배상 청구 또는 소송을 비롯한 각종 이의제기를 받는 경우 당해 회원은 자신의 책임과 비용으로 회사를 면책시켜야 합니다.</li>
                  <li>회원이 고의 또는 과실로 게임기기나 시설물을 파손한 경우, 회원은 원상복구 비용 또는 동등한 가치의 배상을 해야 합니다.</li>
                </ol>
              </div>
            </div>
          </div>

          {/* 제7장: 기타 */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white border-b pb-3 dark:border-gray-800">
              제7장 기타
            </h2>

            {/* 제20조 */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Settings className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                제20조 (통지)
              </h3>
              <div className="pl-8 space-y-3 text-gray-700 dark:text-gray-300">
                <ol className="list-decimal pl-6 space-y-2">
                  <li>회사가 회원에 대한 통지를 하는 경우 본 약관에 별도 규정이 없는 한 서비스 내 알림, 회원이 등록한 이메일, SMS 등으로 할 수 있습니다.</li>
                  <li>회사는 불특정다수 회원에 대한 통지의 경우 1주일 이상 서비스 게시판에 게시함으로써 개별 통지에 갈음할 수 있습니다.</li>
                </ol>
              </div>
            </div>

            {/* 제21조 */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                제21조 (준거법 및 관할법원)
              </h3>
              <div className="pl-8 space-y-3 text-gray-700 dark:text-gray-300">
                <ol className="list-decimal pl-6 space-y-2">
                  <li>본 약관에 명시되지 않은 사항은 대한민국 법령에 의합니다.</li>
                  <li>회사와 회원 간 발생한 분쟁에 관한 소송은 광주지방법원을 관할 법원으로 합니다.</li>
                </ol>
              </div>
            </div>

            {/* 제22조 */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                제22조 (저작권의 귀속)
              </h3>
              <div className="pl-8 space-y-3 text-gray-700 dark:text-gray-300">
                <ol className="list-decimal pl-6 space-y-2">
                  <li>회사가 작성한 저작물에 대한 저작권 기타 지적재산권은 회사에 귀속합니다.</li>
                  <li>회원은 서비스를 이용함으로써 얻은 정보 중 회사에게 지적재산권이 귀속된 정보를 회사의 사전 승낙 없이 복제, 송신, 출판, 배포, 방송 기타 방법에 의하여 영리목적으로 이용하거나 제3자에게 이용하게 하여서는 안 됩니다.</li>
                </ol>
              </div>
            </div>
          </div>

          {/* 부칙 */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white border-b pb-3 dark:border-gray-800">
              부칙
            </h2>

            <div className="space-y-4">
              <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded-xl">
                <h3 className="font-bold mb-4">제1조 (시행일)</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  본 약관은 2025년 2월 1일부터 시행합니다.
                </p>
              </div>

              <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded-xl">
                <h3 className="font-bold mb-4">제2조 (경과조치)</h3>
                <ol className="list-decimal pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                  <li>본 약관 시행 이전에 가입한 회원에게도 본 약관이 적용됩니다.</li>
                  <li>본 약관 시행 이전에 발생한 사항에 대해서는 종전의 약관이 적용됩니다.</li>
                </ol>
              </div>

              <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded-xl">
                <h3 className="font-bold mb-4">개정 이력</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b dark:border-gray-700">
                      <th className="text-left py-2">버전</th>
                      <th className="text-left py-2">시행일</th>
                      <th className="text-left py-2">주요 변경사항</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700 dark:text-gray-300">
                    <tr className="border-b dark:border-gray-700">
                      <td className="py-2">v2.0</td>
                      <td className="py-2">2025.02.01</td>
                      <td className="py-2">전면 개정, 상세 규정 추가</td>
                    </tr>
                    <tr className="border-b dark:border-gray-700">
                      <td className="py-2">v1.0</td>
                      <td className="py-2">2024.01.01</td>
                      <td className="py-2">최초 제정</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 문의 */}
          <div className="border-t pt-8 text-center">
            <HelpCircle className="w-12 h-12 text-indigo-600 dark:text-indigo-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-4">약관 관련 문의</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              본 약관에 대한 문의사항이 있으시면<br />
              아래 연락처로 문의해 주시기 바랍니다.
            </p>
            
            <div className="grid md:grid-cols-2 gap-4 max-w-md mx-auto mb-6">
              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">고객센터</p>
                <p className="font-bold">062-123-4567</p>
              </div>
              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">이메일</p>
                <p className="font-bold">support@gameplaza.kr</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="mailto:support@gameplaza.kr"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
              >
                이메일 문의
              </Link>
              <Link 
                href="https://open.kakao.com/o/sKZrYdYf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-yellow-400 text-gray-900 rounded-lg hover:bg-yellow-500 transition-colors"
              >
                카카오톡 1:1 문의
              </Link>
            </div>
          </div>
          
        </div>
      </section>
    </div>
  );
}