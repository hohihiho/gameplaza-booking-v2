'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, FileText, Shield, Users, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900">
      {/* 헤더 */}
      <section className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-800 py-16 px-5 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-transparent" />
        <div className="relative max-w-6xl mx-auto">
          <Link href="/login" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span>로그인으로 돌아가기</span>
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full mb-4">
              <FileText className="w-4 h-4 text-white" />
              <span className="text-sm text-white font-medium">서비스 이용약관</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">서비스 이용약관</h1>
            <p className="text-lg text-white max-w-2xl mx-auto drop-shadow-md">게임플라자 광주점 서비스 이용약관</p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-5 py-8">
        {/* 약관 내용 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-8 mt-8"
        >
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              제1조 (목적)
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-8">
              이 약관은 게임플라자 광주점(이하 "회사")이 제공하는 게임기 예약 서비스(이하 "서비스")의 이용조건 및 절차에 관한 사항을 규정함을 목적으로 합니다.
            </p>

            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              제2조 (회원가입 및 서비스 이용)
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300 mb-8">
              <li>회원가입은 구글 계정을 통해서만 가능합니다.</li>
              <li>회원은 실명과 실제 연락 가능한 전화번호를 등록해야 합니다.</li>
              <li>1인 1계정 원칙이며, 중복 계정 생성 시 서비스 이용이 제한될 수 있습니다.</li>
              <li>만 14세 미만은 서비스를 이용할 수 없습니다.</li>
            </ul>

            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              제3조 (예약 규정)
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300 mb-8">
              <li>예약은 서비스를 통해서만 가능하며, 현장 예약은 불가합니다.</li>
              <li>예약 시간 10분 전까지 취소가 가능합니다.</li>
              <li>예약 시간 10분 경과 시 자동으로 예약이 취소됩니다.</li>
              <li>무단 불참(No-show) 3회 누적 시 1개월간 예약이 제한됩니다.</li>
              <li>1일 최대 예약 가능 시간은 기기별로 제한될 수 있습니다.</li>
            </ul>

            <h2 className="text-2xl font-bold mb-6">제4조 (이용 요금)</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300 mb-8">
              <li>기기 이용 요금은 예약 시스템에 명시된 금액을 따릅니다.</li>
              <li>예약 대여 시 별도의 대여료가 부과될 수 있습니다.</li>
              <li>요금은 사전 고지 후 변경될 수 있습니다.</li>
            </ul>

            <h2 className="text-2xl font-bold mb-6">제5조 (개인정보 보호)</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300 mb-8">
              <li>회사는 회원의 개인정보를 본인의 승낙 없이 제3자에게 제공하지 않습니다.</li>
              <li>단, 관계법령에 의한 경우는 예외로 합니다.</li>
              <li>회원은 언제든지 자신의 개인정보를 조회하고 수정할 수 있습니다.</li>
            </ul>

            <h2 className="text-2xl font-bold mb-6">제6조 (서비스 이용 제한)</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300 mb-8">
              <li>타인의 정보를 도용하여 회원가입 또는 예약하는 행위</li>
              <li>서비스의 안정적 운영을 방해하는 행위</li>
              <li>기타 관계법령에 위배되는 행위</li>
            </ul>

            <h2 className="text-2xl font-bold mb-6">제7조 (면책사항)</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-8">
              회사는 천재지변, 전쟁 및 기타 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 대한 책임이 면제됩니다.
            </p>

            <h2 className="text-2xl font-bold mb-6">제8조 (약관의 변경)</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-8">
              회사는 필요한 경우 약관을 변경할 수 있으며, 변경된 약관은 서비스 내 공지사항을 통해 공지합니다.
            </p>

            <div className="mt-12 p-6 bg-gray-100 dark:bg-gray-900/50 rounded-2xl">
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                <strong>시행일:</strong> 2024년 1월 1일<br />
                <strong>최종 수정일:</strong> 2024년 1월 1일<br />
                본 약관에 동의하지 않으실 경우 서비스 이용이 제한될 수 있습니다.
              </p>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 text-center"
        >
          <Link 
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all shadow-lg hover:shadow-xl"
          >
            <ArrowLeft className="w-5 h-5" />
            로그인으로 돌아가기
          </Link>
        </motion.div>
      </div>
    </main>
  );
}