// 기기 현황 페이지 - 임시 플레이스홀더 (TODO: D1 마이그레이션 필요)
'use client';

import { motion } from 'framer-motion';
import { Wrench, Activity } from 'lucide-react';

export default function MachinesPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center py-16"
        >
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-blue-100 rounded-full mb-6">
              <Wrench className="w-12 h-12 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              기기 현황 페이지
            </h1>
            <div className="flex items-center justify-center gap-2 text-orange-600 mb-6">
              <Activity className="w-5 h-5" />
              <span className="font-semibold">시스템 마이그레이션 중</span>
            </div>
            <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
              현재 Supabase에서 Cloudflare D1으로 데이터베이스를 마이그레이션하고 있습니다.<br />
              기기 현황 및 예약 정보는 곧 다시 제공될 예정입니다.
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">임시 안내</h2>
            <div className="space-y-3 text-left">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">인증 시스템: Better Auth 마이그레이션 완료</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                <span className="text-gray-700">기기 관리: D1 마이그레이션 진행 중</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                <span className="text-gray-700">예약 시스템: D1 마이그레이션 대기 중</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}