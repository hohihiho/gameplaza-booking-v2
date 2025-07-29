'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // iOS 감지
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // Standalone 모드 감지
    const isInStandaloneMode = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isInStandaloneMode);

    // 이미 설치된 경우 표시하지 않음
    if (isInStandaloneMode) {
      return;
    }

    // 설치 프롬프트 이벤트 리스너
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // 이전에 닫은 적이 있는지 확인
      const hasDeclined = localStorage.getItem('pwa-install-declined');
      const declinedDate = hasDeclined ? new Date(hasDeclined) : null;
      const daysSinceDeclined = declinedDate 
        ? (Date.now() - declinedDate.getTime()) / (1000 * 60 * 60 * 24)
        : Infinity;
      
      // 7일 후에 다시 표시
      if (!hasDeclined || daysSinceDeclined > 7) {
        setTimeout(() => setShowPrompt(true), 3000); // 3초 후 표시
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // iOS에서는 설치 가능 여부를 다르게 체크
    if (isIOSDevice && !isInStandaloneMode) {
      const hasSeenIOSPrompt = localStorage.getItem('ios-install-prompt-seen');
      if (!hasSeenIOSPrompt) {
        setTimeout(() => setShowPrompt(true), 5000); // 5초 후 표시
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('PWA 설치됨');
        // 설치 성공 추적
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'pwa_install', {
            event_category: 'engagement',
            event_label: 'install_accepted'
          });
        }
      } else {
        console.log('PWA 설치 거부됨');
        localStorage.setItem('pwa-install-declined', new Date().toISOString());
      }
      
      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (error) {
      console.error('설치 중 오류:', error);
    }
  };

  const handleIOSInstall = () => {
    localStorage.setItem('ios-install-prompt-seen', 'true');
    setShowPrompt(false);
  };

  const handleClose = () => {
    setShowPrompt(false);
    if (!isIOS) {
      localStorage.setItem('pwa-install-declined', new Date().toISOString());
    } else {
      localStorage.setItem('ios-install-prompt-seen', 'true');
    }
  };

  if (isStandalone || !showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50"
      >
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  앱으로 설치하기
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  홈 화면에 추가하여 더 빠르게 접속하세요
                </p>
                
                {isIOS ? (
                  <div className="space-y-3">
                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">1</span>
                        <span>하단의 공유 버튼을 탭하세요</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">2</span>
                        <span>'홈 화면에 추가'를 선택하세요</span>
                      </div>
                    </div>
                    <button
                      onClick={handleIOSInstall}
                      className="w-full px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-colors"
                    >
                      확인
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleClose}
                      className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
                    >
                      나중에
                    </button>
                    <button
                      onClick={handleInstall}
                      className="flex-1 px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 rounded-xl transition-colors flex items-center justify-center gap-1"
                    >
                      <Download className="w-4 h-4" />
                      설치
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={handleClose}
                className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}