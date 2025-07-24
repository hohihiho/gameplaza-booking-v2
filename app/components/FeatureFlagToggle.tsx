// Feature Flag 토글 컴포넌트 (개발/테스트용)
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, X, ChevronDown } from 'lucide-react';
import { isV2ApiEnabled } from '@/lib/api/client';

export default function FeatureFlagToggle() {
  const [isOpen, setIsOpen] = useState(false);
  const [v2Enabled, setV2Enabled] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // 초기 상태 로드
  useEffect(() => {
    setV2Enabled(isV2ApiEnabled());
  }, []);

  // v2 API 토글
  const toggleV2Api = () => {
    const newValue = !v2Enabled;
    localStorage.setItem('use_v2_api', newValue.toString());
    setV2Enabled(newValue);
    
    // 토스트 표시
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
    
    // 페이지 새로고침 (선택적)
    // window.location.reload();
  };

  // 개발 환경에서만 표시
  if (process.env.NODE_ENV === 'production' && !localStorage.getItem('show_feature_flags')) {
    return null;
  }

  return (
    <>
      {/* 플로팅 버튼 */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 right-5 z-50 w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full shadow-lg flex items-center justify-center"
      >
        <Zap className="w-6 h-6 text-white" />
      </motion.button>

      {/* 모달 */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* 배경 오버레이 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 z-50"
            />

            {/* 모달 컨텐츠 */}
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl"
            >
              <div className="p-6 pb-8">
                {/* 헤더 */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Zap className="w-5 h-5 text-purple-500" />
                    Feature Flags
                  </h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* Feature Flags */}
                <div className="space-y-4">
                  {/* v2 API 토글 */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">v2 API</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          새로운 v2 API 엔드포인트 사용
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full">
                            실험적 기능
                          </span>
                          {v2Enabled && (
                            <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                              활성화됨
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={toggleV2Api}
                        className={`relative w-14 h-7 rounded-full transition-all duration-300 ${
                          v2Enabled 
                            ? 'bg-gradient-to-r from-purple-500 to-indigo-500' 
                            : 'bg-gray-300 dark:bg-gray-700'
                        }`}
                      >
                        <motion.div 
                          className="absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md"
                          animate={{ x: v2Enabled ? 32 : 2 }}
                          transition={{ type: "spring", stiffness: 700, damping: 30 }}
                        />
                      </button>
                    </div>
                  </div>

                  {/* 추가 Feature Flags는 여기에 */}
                </div>

                {/* 안내 메시지 */}
                <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl">
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    <strong>주의:</strong> Feature Flag 변경은 즉시 적용되며, 일부 기능이 불안정할 수 있습니다.
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 토스트 알림 */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-32 left-0 right-0 flex justify-center z-50 pointer-events-none px-5"
          >
            <div className="bg-purple-500 text-white px-6 py-3 rounded-2xl shadow-lg flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span className="font-medium">
                v2 API가 {v2Enabled ? '활성화' : '비활성화'}되었습니다
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}