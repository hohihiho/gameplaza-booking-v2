'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  Smartphone, 
  X, 
  Share, 
  Plus,
  CheckCircle,
  Info
} from 'lucide-react';
import { usePWAInstall } from '@/lib/hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'button' | 'card' | 'floating';
  className?: string;
  showText?: boolean;
}

export default function PWAInstallButton({ 
  variant = 'button', 
  className = '',
  showText = true 
}: PWAInstallButtonProps) {
  const { 
    isInstallable, 
    isInstalled, 
    isIOS, 
    shouldShowIOSGuide,
    install 
  } = usePWAInstall();
  
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // 이미 설치되었거나 설치 불가능하면 표시하지 않음 (iOS 제외)
  if (isInstalled && !shouldShowIOSGuide) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (isInstallable) {
      setIsInstalling(true);
      try {
        const success = await install();
        if (success) {
          console.log('PWA 설치 성공');
        }
      } catch (error) {
        console.error('PWA 설치 실패:', error);
      } finally {
        setIsInstalling(false);
      }
    }
  };

  if (variant === 'card') {
    return (
      <>
        <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800 ${className}`}>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Smartphone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                앱으로 설치하기
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                홈 화면에 추가하여 더 빠르고 편리하게 이용하세요
              </p>
              <button
                onClick={handleInstallClick}
                disabled={isInstalling}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
              >
                {isInstalling ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    설치 중...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    {isIOS ? 'iOS 설치 가이드' : '앱 설치'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* iOS 설치 가이드 모달 */}
        <AnimatePresence>
          {showIOSModal && (
            <motion.div 
              className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowIOSModal(false)}
            >
              <motion.div
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '100%', opacity: 0 }}
                className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full sm:max-w-md shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold dark:text-white">iOS 앱 설치</h2>
                  <button
                    onClick={() => setShowIOSModal(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">1</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white mb-1">공유 버튼 터치</p>
                      <p>하단 중앙의 <Share className="w-4 h-4 inline mx-1" /> 공유 버튼을 눌러주세요</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">2</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white mb-1">"홈 화면에 추가" 선택</p>
                      <p>메뉴에서 <Plus className="w-4 h-4 inline mx-1" /> "홈 화면에 추가"를 찾아 터치하세요</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">3</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white mb-1">추가 완료</p>
                      <p>우측 상단의 "추가" 버튼을 눌러 설치를 완료하세요</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-green-700 dark:text-green-300">
                      설치 후 홈 화면에서 게임플라자 아이콘을 터치하여 앱처럼 사용하세요!
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  if (variant === 'floating') {
    return (
      <>
        <motion.button
          onClick={handleInstallClick}
          disabled={isInstalling}
          className={`fixed bottom-20 right-4 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-colors disabled:opacity-50 z-40 ${className}`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
        >
          {isInstalling ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Download className="w-6 h-6" />
          )}
        </motion.button>

        {/* iOS 설치 가이드 모달 */}
        <AnimatePresence>
          {showIOSModal && (
            <motion.div 
              className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowIOSModal(false)}
            >
              <motion.div
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '100%', opacity: 0 }}
                className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full sm:max-w-md shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center">
                  <h2 className="text-lg font-semibold dark:text-white mb-4">iOS 앱 설치</h2>
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-3">
                    <p><Share className="w-4 h-4 inline mr-2" />공유 → <Plus className="w-4 h-4 inline mx-1" />홈 화면에 추가</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  // 기본 버튼 variant
  return (
    <>
      <button
        onClick={handleInstallClick}
        disabled={isInstalling}
        className={`flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 ${className}`}
      >
        {isInstalling ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            {showText && '설치 중...'}
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            {showText && (isIOS ? 'iOS 설치' : '앱 설치')}
          </>
        )}
      </button>

      {/* iOS 설치 가이드 모달 */}
      <AnimatePresence>
        {showIOSModal && (
          <motion.div 
            className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowIOSModal(false)}
          >
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full sm:max-w-md shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold dark:text-white">iOS 앱 설치</h2>
                <button
                  onClick={() => setShowIOSModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white mb-1">공유 버튼 터치</p>
                    <p>하단 중앙의 <Share className="w-4 h-4 inline mx-1" /> 공유 버튼을 눌러주세요</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white mb-1">"홈 화면에 추가" 선택</p>
                    <p>메뉴에서 <Plus className="w-4 h-4 inline mx-1" /> "홈 화면에 추가"를 찾아 터치하세요</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white mb-1">추가 완료</p>
                    <p>우측 상단의 "추가" 버튼을 눌러 설치를 완료하세요</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-green-700 dark:text-green-300">
                    설치 후 홈 화면에서 게임플라자 아이콘을 터치하여 앱처럼 사용하세요!
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}