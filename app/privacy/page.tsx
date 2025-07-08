import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: '개인정보 처리방침 - 게임플라자',
  description: '게임플라자 개인정보 처리방침',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* 헤더 */}
      <section className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-800 py-16 px-5 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-transparent" />
        <div className="relative max-w-6xl mx-auto">
          <Link 
            href="/signup" 
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            돌아가기
          </Link>
          
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            개인정보 처리방침
          </h1>
          <p className="text-lg text-indigo-100">
            시행일: 2025년 1월 1일
          </p>
        </div>
      </section>

      {/* 내용 */}
      <section className="max-w-4xl mx-auto px-5 py-12">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-800 space-y-8">
          
          {/* 1. 수집하는 개인정보 */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              1. 수집하는 개인정보
            </h2>
            <div className="space-y-2 text-gray-700 dark:text-gray-300">
              <p className="font-medium">필수 수집 항목:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>이메일 주소 (구글 로그인 시 자동 수집)</li>
                <li>닉네임</li>
                <li>휴대전화번호</li>
                <li>이름 (구글 계정에서 제공 시)</li>
              </ul>
              
              <p className="font-medium mt-4">선택 수집 항목:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>프로필 사진 (구글 계정에서 제공 시)</li>
              </ul>
              
              <p className="font-medium mt-4">자동 수집 항목:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>접속 IP 주소</li>
                <li>접속 시간</li>
                <li>서비스 이용 기록</li>
              </ul>
            </div>
          </div>

          {/* 2. 개인정보 수집 목적 */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              2. 개인정보 수집 및 이용 목적
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
              <li>회원 가입 및 관리</li>
              <li>예약 서비스 제공 및 관리</li>
              <li>본인 확인 및 인증</li>
              <li>고지사항 전달 및 불만 처리</li>
              <li>서비스 이용 통계 및 분석</li>
              <li>마케팅 및 이벤트 정보 제공 (동의한 경우)</li>
            </ul>
          </div>

          {/* 3. 개인정보 보유 기간 */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              3. 개인정보 보유 및 이용 기간
            </h2>
            <div className="space-y-2 text-gray-700 dark:text-gray-300">
              <p>개인정보는 수집 및 이용 목적이 달성될 때까지 보유하며, 회원 탈퇴 시 즉시 삭제합니다.</p>
              
              <p className="font-medium mt-4">단, 관계 법령에 따라 보존이 필요한 경우:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>계약 또는 청약철회 등에 관한 기록: 5년</li>
                <li>대금결제 및 재화 등의 공급에 관한 기록: 5년</li>
                <li>소비자의 불만 또는 분쟁처리에 관한 기록: 3년</li>
                <li>접속 로그 기록: 3개월</li>
              </ul>
            </div>
          </div>

          {/* 4. 개인정보 제3자 제공 */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              4. 개인정보의 제3자 제공
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              게임플라자는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 
              다만, 다음의 경우에는 예외로 합니다:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-300">
              <li>이용자가 사전에 동의한 경우</li>
              <li>법령의 규정에 의하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
            </ul>
          </div>

          {/* 5. 개인정보 파기 절차 */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              5. 개인정보 파기 절차
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
              <li>파기 절차: 회원 탈퇴 시 즉시 파기됩니다.</li>
              <li>파기 방법: 전자적 파일 형태로 저장된 개인정보는 복구 불가능한 방법으로 영구 삭제합니다.</li>
            </ul>
          </div>

          {/* 6. 이용자의 권리 */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              6. 이용자의 권리와 행사 방법
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              이용자는 언제든지 다음의 권리를 행사할 수 있습니다:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-300">
              <li>개인정보 열람 요구</li>
              <li>오류 등이 있을 경우 정정 요구</li>
              <li>삭제 요구</li>
              <li>처리 정지 요구</li>
            </ul>
            <p className="mt-4 text-gray-700 dark:text-gray-300">
              권리 행사는 마이페이지를 통해 하실 수 있으며, 고객센터로 문의하셔도 됩니다.
            </p>
          </div>

          {/* 7. 쿠키 사용 */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              7. 쿠키(Cookie) 사용
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              서비스는 이용자에게 개인화된 서비스를 제공하기 위해 쿠키를 사용합니다. 
              이용자는 웹브라우저 설정을 통해 쿠키 저장을 거부할 수 있으나, 
              이 경우 서비스 이용에 제한이 있을 수 있습니다.
            </p>
          </div>

          {/* 8. 개인정보 보호책임자 */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              8. 개인정보 보호책임자
            </h2>
            <div className="space-y-2 text-gray-700 dark:text-gray-300">
              <p>게임플라자는 개인정보 처리에 관한 업무를 총괄해서 책임지고 있습니다.</p>
              
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mt-4">
                <p className="font-medium">개인정보 보호책임자</p>
                <ul className="mt-2 space-y-1">
                  <li>성명: 홍길동</li>
                  <li>직책: 대표</li>
                  <li>연락처: privacy@gameplaza.kr</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 9. 개정 */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              9. 개인정보 처리방침 변경
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              이 개인정보 처리방침은 2025년 1월 1일부터 적용되며, 
              법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 
              변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.
            </p>
          </div>

          {/* 문의 */}
          <div className="border-t pt-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              개인정보 처리방침에 대한 문의사항은 고객센터로 연락해 주시기 바랍니다.
            </p>
            <Link 
              href="https://open.kakao.com/o/sKZrYdYf"
              target="_blank"
              className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
            >
              카카오톡 1:1 문의
            </Link>
          </div>
          
        </div>
      </section>
    </div>
  );
}