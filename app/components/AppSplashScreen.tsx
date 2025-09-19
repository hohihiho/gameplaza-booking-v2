'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { WifiOff, AlertCircle } from 'lucide-react';

/**
 * 메인 페이지에 진입할 때 한 번 보여주는 스플래시 화면입니다.
 * 세션 스토리지를 활용하여 세션당 한 번만 표시됩니다.
 */
export default function AppSplashScreen() {
  const [showSplash, setShowSplash] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    // 세션 스토리지 체크 - 이미 스플래시를 봤는지 확인
    const hasSeenSplash = sessionStorage.getItem('hasSeenSplash');

    if (hasSeenSplash) {
      // 이미 봤다면 스플래시 화면 표시하지 않음
      setShowSplash(false);
      return;
    }

    // 처음 방문이면 스플래시 표시
    setShowSplash(true);

    // 스플래시 표시 시간 후 자동으로 숨김
    setTimeout(() => {
      setShowSplash(false);
      sessionStorage.setItem('hasSeenSplash', 'true');
    }, 2800); // 2.8초 후 스플래시 종료
    // 오프라인 상태 체크
    const checkConnection = () => {
      setIsOffline(!navigator.onLine);
    };

    // 초기 체크
    checkConnection();

    // 온라인/오프라인 이벤트 리스너
    window.addEventListener('online', checkConnection);
    window.addEventListener('offline', checkConnection);

    return () => {
      window.removeEventListener('online', checkConnection);
      window.removeEventListener('offline', checkConnection);
    };
  }, []);

  return (
    <AnimatePresence>
      {showSplash && (
        <motion.div
          key="app-splash"
          className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center bg-gradient-to-br from-purple-50 via-indigo-100 to-purple-200 dark:from-purple-950 dark:via-indigo-900 dark:to-purple-900"
          data-testid="app-splash-screen"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.5 }}
          transition={{ duration: 0.2, ease: [0.76, 0, 0.24, 1] }}
          role="presentation"
        >
          <motion.div
            className="relative"
            initial={{ scale: 0, rotate: -180 }}
            animate={{
              scale: [0, 1.2, 1],
              rotate: [180, -10, 0],
            }}
            transition={{
              duration: 0.5,
              ease: [0.68, -0.55, 0.265, 1.55],
              times: [0, 0.6, 1]
            }}
          >
            {/* 글리치 효과 레이어 */}
            <motion.div
              className="absolute inset-0"
              animate={{
                x: [0, -2, 2, -1, 1, 0],
                opacity: [0, 1, 0]
              }}
              transition={{
                duration: 0.3,
                delay: 0.2,
                repeat: 1,
                ease: "linear"
              }}
            >
              <div className="relative h-16 w-16 sm:h-20 sm:w-20">
                <Image
                  src="/light.png"
                  alt=""
                  fill
                  sizes="80px"
                  priority
                  className="object-contain drop-shadow-lg dark:hidden"
                  style={{ filter: 'hue-rotate(180deg) brightness(2)' }}
                />
                <Image
                  src="/dark.png"
                  alt=""
                  fill
                  sizes="80px"
                  priority
                  className="hidden object-contain drop-shadow-lg dark:block"
                  style={{ filter: 'hue-rotate(180deg) brightness(2)' }}
                />
              </div>
            </motion.div>

            {/* 메인 로고 */}
            <motion.div
              className="relative h-16 w-16 sm:h-20 sm:w-20"
              animate={{
                filter: [
                  'blur(0px) brightness(1)',
                  'blur(2px) brightness(1.5)',
                  'blur(0px) brightness(1)'
                ]
              }}
              transition={{
                duration: 0.5,
                ease: "easeInOut"
              }}
            >
              <Image
                src="/light.png"
                alt="Gameplaza logo"
                fill
                sizes="80px"
                priority
                className="object-contain drop-shadow-lg dark:hidden"
              />
              <Image
                src="/dark.png"
                alt="Gameplaza logo"
                fill
                sizes="80px"
                priority
                className="hidden object-contain drop-shadow-lg dark:block"
              />
            </motion.div>

            {/* 파티클 이펙트 */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute h-1 w-1 bg-purple-500 dark:bg-purple-400 rounded-full"
                initial={{
                  x: 0,
                  y: 0,
                  opacity: 0
                }}
                animate={{
                  x: [0, (Math.random() - 0.5) * 100],
                  y: [0, (Math.random() - 0.5) * 100],
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0]
                }}
                transition={{
                  duration: 0.6,
                  delay: 0.3 + i * 0.05,
                  ease: "easeOut"
                }}
                style={{
                  left: '50%',
                  top: '50%',
                }}
              />
            ))}
          </motion.div>

          {/* 오프라인 상태 표시 */}
          {isOffline && (
            <motion.div
              className="absolute bottom-10 flex flex-col items-center gap-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <WifiOff className="h-6 w-6 text-gray-500 dark:text-gray-400" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                오프라인 상태입니다
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 px-4 py-2 text-xs bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                다시 시도
              </button>
            </motion.div>
          )}

          {/* 로딩 오류 표시 */}
          {loadError && !isOffline && (
            <motion.div
              className="absolute bottom-10 flex flex-col items-center gap-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <AlertCircle className="h-6 w-6 text-yellow-500" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                연결 중 문제가 발생했습니다
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 px-4 py-2 text-xs bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                새로고침
              </button>
            </motion.div>
          )}

        </motion.div>
      )}
    </AnimatePresence>
  );
}
