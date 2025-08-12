'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Shield, Database, Lock, UserCheck, AlertCircle, Mail, Phone, FileText } from 'lucide-react';

export default function PrivacyPage() {
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
              개인정보처리방침
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
              <Shield className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mt-1" />
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">개인정보보호 원칙</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  광주 게임플라자(이하 "회사")는 이용자의 개인정보를 중요시하며, 「개인정보보호법」, 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 등 관련 법령을 준수하고 있습니다. 
                  본 개인정보처리방침을 통해 이용자가 제공하는 개인정보가 어떠한 용도와 방식으로 이용되고 있으며, 개인정보보호를 위해 어떠한 조치가 취해지고 있는지 알려드립니다.
                </p>
              </div>
            </div>
          </div>

          {/* 1. 수집하는 개인정보 */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Database className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              제1조 (수집하는 개인정보의 항목 및 수집방법)
            </h2>
            
            <div className="space-y-6 text-gray-700 dark:text-gray-300">
              <div className="border-l-4 border-indigo-500 pl-4">
                <h3 className="font-bold text-lg mb-3">① 회원가입 시 수집항목</h3>
                <div className="space-y-3">
                  <div>
                    <p className="font-medium text-indigo-600 dark:text-indigo-400">필수항목</p>
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li>이메일 주소 (Google OAuth 인증 시 자동 수집)</li>
                      <li>이름 (Google 계정에서 제공)</li>
                      <li>닉네임 (서비스 내 활동명)</li>
                      <li>휴대전화번호 (본인확인 및 예약 알림용)</li>
                      <li>생년월일 (연령 확인용)</li>
                      <li>Google 계정 고유 식별자 (UID)</li>
                    </ul>
                  </div>
                  
                  <div>
                    <p className="font-medium text-indigo-600 dark:text-indigo-400">선택항목</p>
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li>프로필 사진 (Google 계정에서 제공 시)</li>
                      <li>마케팅 수신 동의 여부</li>
                      <li>선호 게임 장르</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border-l-4 border-indigo-500 pl-4">
                <h3 className="font-bold text-lg mb-3">② 서비스 이용 과정에서 자동 수집되는 정보</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>서비스 이용 기록 (예약 내역, 체크인 시간, 이용 시간)</li>
                  <li>접속 로그 (IP 주소, 접속 시간, 접속 기기 정보)</li>
                  <li>쿠키 (Cookie) 정보</li>
                  <li>브라우저 종류 및 버전</li>
                  <li>운영체제 (OS) 정보</li>
                  <li>기기 고유 식별자 (디바이스 ID)</li>
                  <li>위치 정보 (선택적, 동의 시)</li>
                </ul>
              </div>

              <div className="border-l-4 border-indigo-500 pl-4">
                <h3 className="font-bold text-lg mb-3">③ 결제 정보 (향후 유료 서비스 도입 시)</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>결제 수단 정보 (카드번호 마지막 4자리)</li>
                  <li>결제 내역</li>
                  <li>환불 계좌 정보 (필요 시)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 2. 개인정보 수집 목적 */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <UserCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              제2조 (개인정보의 수집 및 이용목적)
            </h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="font-bold mb-3 text-indigo-600 dark:text-indigo-400">회원관리</h3>
                <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                  <li>• 회원제 서비스 이용에 따른 본인확인</li>
                  <li>• 개인 식별 및 부정이용 방지</li>
                  <li>• 가입 및 가입횟수 제한</li>
                  <li>• 만 14세 미만 아동 가입 제한</li>
                  <li>• 분쟁 조정을 위한 기록 보존</li>
                </ul>
              </div>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="font-bold mb-3 text-indigo-600 dark:text-indigo-400">서비스 제공</h3>
                <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                  <li>• 게임기기 예약 서비스 제공</li>
                  <li>• 예약 확인 및 변경 알림</li>
                  <li>• 체크인/체크아웃 관리</li>
                  <li>• 이용 통계 및 패턴 분석</li>
                  <li>• 맞춤형 서비스 제공</li>
                </ul>
              </div>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="font-bold mb-3 text-indigo-600 dark:text-indigo-400">마케팅 활용</h3>
                <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                  <li>• 이벤트 및 프로모션 안내</li>
                  <li>• 신규 서비스 안내</li>
                  <li>• 맞춤형 광고 제공</li>
                  <li>• 서비스 이용 통계 분석</li>
                  <li>• 고객 만족도 조사</li>
                </ul>
              </div>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="font-bold mb-3 text-indigo-600 dark:text-indigo-400">법적 의무 준수</h3>
                <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                  <li>• 관련 법령에 따른 의무 이행</li>
                  <li>• 법적 분쟁 대응</li>
                  <li>• 수사기관 요청 협조</li>
                  <li>• 정산 및 세무 처리</li>
                  <li>• 소비자 보호 의무 이행</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 3. 개인정보 보유 기간 */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Lock className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              제3조 (개인정보의 보유 및 이용기간)
            </h2>
            
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <div className="p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="font-medium mb-2">원칙</p>
                <p>회사는 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 단, 다음의 정보에 대해서는 아래의 이유로 명시한 기간 동안 보존합니다.</p>
              </div>

              <div className="space-y-3">
                <h3 className="font-bold text-lg">① 회사 내부 방침에 의한 정보 보유</h3>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b dark:border-gray-700">
                      <th className="text-left py-2">보유 정보</th>
                      <th className="text-left py-2">보유 기간</th>
                      <th className="text-left py-2">보유 사유</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    <tr className="border-b dark:border-gray-700">
                      <td className="py-2">회원 정보</td>
                      <td className="py-2">회원 탈퇴 후 30일</td>
                      <td className="py-2">재가입 제한 및 부정이용 방지</td>
                    </tr>
                    <tr className="border-b dark:border-gray-700">
                      <td className="py-2">예약 이력</td>
                      <td className="py-2">1년</td>
                      <td className="py-2">서비스 개선 및 통계 분석</td>
                    </tr>
                    <tr className="border-b dark:border-gray-700">
                      <td className="py-2">불량 이용 기록</td>
                      <td className="py-2">3년</td>
                      <td className="py-2">부정 이용 방지</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="space-y-3">
                <h3 className="font-bold text-lg">② 관련 법령에 의한 정보 보유</h3>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b dark:border-gray-700">
                      <th className="text-left py-2">보유 정보</th>
                      <th className="text-left py-2">근거 법령</th>
                      <th className="text-left py-2">보유 기간</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    <tr className="border-b dark:border-gray-700">
                      <td className="py-2">계약 또는 청약철회 기록</td>
                      <td className="py-2">전자상거래법</td>
                      <td className="py-2">5년</td>
                    </tr>
                    <tr className="border-b dark:border-gray-700">
                      <td className="py-2">대금결제 및 재화 공급 기록</td>
                      <td className="py-2">전자상거래법</td>
                      <td className="py-2">5년</td>
                    </tr>
                    <tr className="border-b dark:border-gray-700">
                      <td className="py-2">소비자 불만/분쟁 처리 기록</td>
                      <td className="py-2">전자상거래법</td>
                      <td className="py-2">3년</td>
                    </tr>
                    <tr className="border-b dark:border-gray-700">
                      <td className="py-2">웹사이트 방문 기록</td>
                      <td className="py-2">통신비밀보호법</td>
                      <td className="py-2">3개월</td>
                    </tr>
                    <tr className="border-b dark:border-gray-700">
                      <td className="py-2">본인확인 정보</td>
                      <td className="py-2">정보통신망법</td>
                      <td className="py-2">6개월</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 4. 개인정보 제3자 제공 */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              제4조 (개인정보의 제3자 제공)
            </h2>
            
            <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
              <p className="font-medium text-red-700 dark:text-red-400 mb-2">원칙적 금지</p>
              <p className="text-gray-700 dark:text-gray-300">
                회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다.
              </p>
            </div>

            <div className="space-y-3 text-gray-700 dark:text-gray-300">
              <p className="font-medium">다만, 아래의 경우에는 예외로 합니다:</p>
              <ol className="list-decimal pl-6 space-y-2">
                <li>
                  <strong>이용자의 사전 동의를 받은 경우</strong>
                  <ul className="list-disc pl-6 mt-1 text-sm">
                    <li>제공받는 자, 제공 목적, 제공 항목, 보유 기간을 명시하여 동의</li>
                  </ul>
                </li>
                <li>
                  <strong>법령의 규정에 의한 경우</strong>
                  <ul className="list-disc pl-6 mt-1 text-sm">
                    <li>수사기관의 적법한 절차에 따른 요청</li>
                    <li>법원의 제출 명령</li>
                    <li>기타 관계 법령에서 정한 절차에 따른 요청</li>
                  </ul>
                </li>
                <li>
                  <strong>서비스 제공을 위한 필수적인 경우</strong>
                  <ul className="list-disc pl-6 mt-1 text-sm">
                    <li>결제 대행사: 결제 정보 (PG사)</li>
                    <li>본인인증 업체: 휴대폰 번호, 이름</li>
                    <li>알림 서비스: 휴대폰 번호 (SMS 발송)</li>
                  </ul>
                </li>
              </ol>
            </div>
          </div>

          {/* 5. 개인정보 처리 위탁 */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              제5조 (개인정보 처리의 위탁)
            </h2>
            
            <div className="space-y-3 text-gray-700 dark:text-gray-300">
              <p>회사는 서비스 향상을 위해 다음과 같이 개인정보를 위탁하고 있습니다:</p>
              
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    <th className="text-left py-3 px-4">수탁업체</th>
                    <th className="text-left py-3 px-4">위탁업무</th>
                    <th className="text-left py-3 px-4">보유기간</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b dark:border-gray-700">
                    <td className="py-3 px-4">Google</td>
                    <td className="py-3 px-4">OAuth 인증, 계정 연동</td>
                    <td className="py-3 px-4">회원 탈퇴 시까지</td>
                  </tr>
                  <tr className="border-b dark:border-gray-700">
                    <td className="py-3 px-4">Supabase</td>
                    <td className="py-3 px-4">데이터베이스 관리, 인증</td>
                    <td className="py-3 px-4">회원 탈퇴 시까지</td>
                  </tr>
                  <tr className="border-b dark:border-gray-700">
                    <td className="py-3 px-4">Vercel</td>
                    <td className="py-3 px-4">웹 호스팅, CDN</td>
                    <td className="py-3 px-4">서비스 이용 시까지</td>
                  </tr>
                  <tr className="border-b dark:border-gray-700">
                    <td className="py-3 px-4">알림 서비스 제공업체</td>
                    <td className="py-3 px-4">SMS, 푸시 알림 발송</td>
                    <td className="py-3 px-4">알림 발송 완료 시까지</td>
                  </tr>
                </tbody>
              </table>

              <p className="text-sm text-gray-600 dark:text-gray-400">
                ※ 위탁업체가 변경될 경우 개인정보처리방침을 통해 고지하겠습니다.
              </p>
            </div>
          </div>

          {/* 6. 개인정보 파기 */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              제6조 (개인정보의 파기절차 및 방법)
            </h2>
            
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <div className="border-l-4 border-indigo-500 pl-4">
                <h3 className="font-bold mb-2">① 파기절차</h3>
                <ol className="list-decimal pl-6 space-y-1 text-sm">
                  <li>이용자의 개인정보는 목적이 달성된 후 별도의 DB로 옮겨져 일정 기간 저장된 후 파기</li>
                  <li>별도 DB로 옮겨진 개인정보는 법률에 의한 경우가 아니고서는 다른 목적으로 이용되지 않음</li>
                  <li>파기 사유가 발생한 경우 파기 계획을 수립하여 파기</li>
                </ol>
              </div>

              <div className="border-l-4 border-indigo-500 pl-4">
                <h3 className="font-bold mb-2">② 파기방법</h3>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  <li><strong>전자적 파일:</strong> 복구 불가능한 방법으로 영구 삭제</li>
                  <li><strong>종이 문서:</strong> 분쇄기로 분쇄하거나 소각</li>
                  <li><strong>데이터베이스:</strong> 로우 레벨 포맷(Low Level Format)</li>
                  <li><strong>백업 데이터:</strong> 별도 관리 후 주기적 삭제</li>
                </ul>
              </div>

              <div className="border-l-4 border-indigo-500 pl-4">
                <h3 className="font-bold mb-2">③ 파기시점</h3>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  <li>회원 탈퇴 요청 시: 즉시 또는 30일 이내</li>
                  <li>동의 철회 시: 지체 없이 파기</li>
                  <li>목적 달성 시: 해당 개인정보 수집 시 동의받은 보유기간 경과 후</li>
                  <li>사업 폐지: 사업 폐지일로부터 30일 이내</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 7. 이용자 권리 */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              제7조 (이용자 및 법정대리인의 권리와 행사방법)
            </h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                <h3 className="font-bold mb-3 text-green-700 dark:text-green-400">이용자의 권리</h3>
                <ul className="text-sm space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>개인정보 열람 요구</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>오류 정정 요구</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>삭제 요구</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>처리정지 요구</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>동의 철회</span>
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <h3 className="font-bold mb-3 text-blue-700 dark:text-blue-400">권리 행사 방법</h3>
                <ul className="text-sm space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span>마이페이지에서 직접 열람/수정</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span>고객센터 이메일 요청</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span>개인정보보호 담당자 연락</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span>서면, 전화 요청</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong>※ 만 14세 미만 아동의 경우:</strong> 법정대리인이 아동의 개인정보 열람, 정정, 삭제, 처리정지를 요구할 수 있습니다.
              </p>
            </div>
          </div>

          {/* 8. 개인정보 보호 조치 */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              제8조 (개인정보의 안전성 확보조치)
            </h2>
            
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <p>회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다:</p>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h3 className="font-bold text-indigo-600 dark:text-indigo-400">기술적 조치</h3>
                  <ul className="text-sm space-y-1">
                    <li>• SSL 인증서를 통한 데이터 암호화</li>
                    <li>• 비밀번호 단방향 암호화 저장</li>
                    <li>• 침입차단시스템(방화벽) 운영</li>
                    <li>• 백신 프로그램 운영 및 정기 업데이트</li>
                    <li>• 접속기록 보관 및 위변조 방지</li>
                    <li>• 개인정보 암호화 저장</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h3 className="font-bold text-indigo-600 dark:text-indigo-400">관리적 조치</h3>
                  <ul className="text-sm space-y-1">
                    <li>• 개인정보 취급 직원 최소화</li>
                    <li>• 정기적인 직원 교육 실시</li>
                    <li>• 내부관리계획 수립 및 시행</li>
                    <li>• 개인정보 접근 권한 관리</li>
                    <li>• 보안서약서 징구</li>
                    <li>• 정기적인 자체 감사 실시</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h3 className="font-bold text-indigo-600 dark:text-indigo-400">물리적 조치</h3>
                  <ul className="text-sm space-y-1">
                    <li>• 전산실 출입통제</li>
                    <li>• 문서보관 장소 시건 장치</li>
                    <li>• CCTV 설치 및 운영</li>
                    <li>• 비인가자 출입 통제</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h3 className="font-bold text-indigo-600 dark:text-indigo-400">기타 조치</h3>
                  <ul className="text-sm space-y-1">
                    <li>• 정기적인 취약점 점검</li>
                    <li>• 개인정보 유출 대응 매뉴얼</li>
                    <li>• 개인정보보호 인증 획득</li>
                    <li>• 정기 모니터링 실시</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* 9. 쿠키 정책 */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              제9조 (쿠키의 운영 및 관리)
            </h2>
            
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-bold mb-2">쿠키란?</h3>
                  <p className="text-sm">
                    웹사이트 방문 시 브라우저에 저장되는 작은 텍스트 파일로, 
                    사용자의 환경설정, 로그인 상태 등을 저장하여 편리한 서비스를 제공합니다.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-bold mb-2">쿠키 사용 목적</h3>
                  <ul className="text-sm space-y-1">
                    <li>• 로그인 상태 유지</li>
                    <li>• 사용자 환경 설정 저장</li>
                    <li>• 이용 패턴 분석</li>
                    <li>• 맞춤형 서비스 제공</li>
                  </ul>
                </div>
              </div>

              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <h3 className="font-bold mb-2">쿠키 관리 방법</h3>
                <p className="text-sm mb-2">
                  브라우저 설정을 통해 쿠키를 관리할 수 있습니다:
                </p>
                <ul className="text-sm space-y-1">
                  <li>• Chrome: 설정 → 개인정보 및 보안 → 쿠키 및 기타 사이트 데이터</li>
                  <li>• Safari: 환경설정 → 개인정보 보호 → 쿠키 및 웹사이트 데이터</li>
                  <li>• Edge: 설정 → 쿠키 및 사이트 권한</li>
                </ul>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                  ※ 쿠키 거부 시 일부 서비스 이용에 제한이 있을 수 있습니다.
                </p>
              </div>
            </div>
          </div>

          {/* 10. 개인정보 보호책임자 */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Phone className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              제10조 (개인정보 보호책임자 및 담당부서)
            </h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-6 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl border border-indigo-200 dark:border-indigo-800">
                <h3 className="font-bold mb-4 text-indigo-700 dark:text-indigo-400">개인정보 보호책임자</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">성명</span>
                    <span className="font-medium">홍길동</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">직책</span>
                    <span className="font-medium">대표이사</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">이메일</span>
                    <span className="font-medium">privacy@gameplaza.kr</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">전화</span>
                    <span className="font-medium">062-123-4567</span>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800">
                <h3 className="font-bold mb-4 text-blue-700 dark:text-blue-400">개인정보 보호담당부서</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">부서명</span>
                    <span className="font-medium">고객지원팀</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">담당자</span>
                    <span className="font-medium">김철수</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">이메일</span>
                    <span className="font-medium">support@gameplaza.kr</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">전화</span>
                    <span className="font-medium">062-123-4568</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                기타 개인정보 침해에 대한 신고나 상담이 필요하신 경우에는 아래 기관에 문의하시기 바랍니다:
              </p>
              <ul className="text-sm mt-3 space-y-1">
                <li>• 개인정보침해신고센터 (privacy.kisa.or.kr / 118)</li>
                <li>• 개인정보분쟁조정위원회 (www.kopico.go.kr / 1833-6972)</li>
                <li>• 대검찰청 사이버수사과 (www.spo.go.kr / 1301)</li>
                <li>• 경찰청 사이버수사국 (ecrm.police.go.kr / 182)</li>
              </ul>
            </div>
          </div>

          {/* 11. 개정 및 고지 */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              제11조 (개인정보처리방침의 변경)
            </h2>
            
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <p>
                이 개인정보처리방침은 2025년 2월 1일부터 적용됩니다. 
                법령이나 서비스의 변경사항을 반영하기 위한 목적 등으로 개인정보처리방침을 수정할 수 있으며, 
                개정 시에는 변경사항에 대해 서비스 공지사항을 통해 고지할 것입니다.
              </p>

              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <h3 className="font-bold mb-3">개정 이력</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b dark:border-gray-700">
                      <th className="text-left py-2">버전</th>
                      <th className="text-left py-2">시행일</th>
                      <th className="text-left py-2">주요 변경사항</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b dark:border-gray-700">
                      <td className="py-2">v2.0</td>
                      <td className="py-2">2025.02.01</td>
                      <td className="py-2">전면 개정, 법령 준수 강화</td>
                    </tr>
                    <tr className="border-b dark:border-gray-700">
                      <td className="py-2">v1.0</td>
                      <td className="py-2">2025.01.01</td>
                      <td className="py-2">최초 제정</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm">
                  <strong>중요:</strong> 정보주체의 권리에 중대한 영향을 미치는 변경이 있을 경우, 
                  시행 최소 7일 전에 홈페이지 공지사항 및 이메일을 통해 사전 고지하겠습니다.
                </p>
              </div>
            </div>
          </div>

          {/* 문의 */}
          <div className="border-t pt-8 text-center">
            <Mail className="w-12 h-12 text-indigo-600 dark:text-indigo-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-4">개인정보 관련 문의</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              개인정보처리방침에 대한 문의사항이나 개인정보 관련 불만사항이 있으시면<br />
              아래 연락처로 문의해 주시기 바랍니다.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="mailto:privacy@gameplaza.kr"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
              >
                <Mail className="w-5 h-5" />
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