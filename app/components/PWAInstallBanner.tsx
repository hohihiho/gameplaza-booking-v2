// PWA 설치 배너 컴포넌트
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';
import { usePWAInstall } from '@/app/hooks/usePWAInstall';

export default function PWAInstallBanner() {
  const { isInstallable, isInstalled, installPWA } = usePWAInstall();
  const [showBanner, setShowBanner] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // 로컬 스토리지에서 배너 숨김 상태 확인
    const dismissed = localStorage.getItem('pwa-banner-dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
      return;
    }

    // 설치 가능하고 아직 설치되지 않은 경우 배너 표시
    if (isInstallable && !isInstalled) {
      // 3초 후에 배너 표시
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isInstallable, isInstalled]);

  const handleInstall = async () => {
    await installPWA();
    setShowBanner(false);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setIsDismissed(true);
    localStorage.setItem('pwa-banner-dismissed', 'true');
  };

  if (!showBanner || isDismissed || isInstalled) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed bottom-20 left-4 right-4 md:bottom-4 md:left-auto md:right-4 md:max-w-sm z-50"
      >
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  앱으로 설치하기
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  홈 화면에 추가하면 더 빠르게 접속할 수 있어요
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleInstall}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              설치하기
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              나중에
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}