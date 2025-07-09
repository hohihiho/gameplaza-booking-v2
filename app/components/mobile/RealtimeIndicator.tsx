'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, RefreshCw, Activity } from 'lucide-react';
import { useState, useEffect } from 'react';

interface RealtimeIndicatorProps {
  isConnected: boolean;
  isReconnecting?: boolean;
  lastUpdate?: Date | null;
  updateCount?: number;
  onReconnect?: () => void;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  showDetails?: boolean;
}

export default function RealtimeIndicator({
  isConnected,
  isReconnecting = false,
  lastUpdate,
  updateCount = 0,
  onReconnect,
  position = 'bottom-right',
  showDetails = false
}: RealtimeIndicatorProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [lastUpdateText, setLastUpdateText] = useState('');

  // 위치 스타일
  const positionStyles = {
    'top-left': 'top-20 left-4',
    'top-right': 'top-20 right-4',
    'bottom-left': 'bottom-20 left-4',
    'bottom-right': 'bottom-20 right-4'
  };

  // 마지막 업데이트 시간 텍스트
  useEffect(() => {
    if (!lastUpdate) {
      setLastUpdateText('업데이트 대기 중');
      return;
    }

    const updateTime = () => {
      const now = new Date();
      const diff = Math.floor((now.getTime() - lastUpdate.getTime()) / 1000);

      if (diff < 60) {
        setLastUpdateText(`${diff}초 전`);
      } else if (diff < 3600) {
        setLastUpdateText(`${Math.floor(diff / 60)}분 전`);
      } else {
        setLastUpdateText(`${Math.floor(diff / 3600)}시간 전`);
      }
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);

    return () => clearInterval(timer);
  }, [lastUpdate]);

  return (
    <div className={`fixed ${positionStyles[position]} z-40`}>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="relative"
        >
          {/* 메인 인디케이터 */}
          <motion.button
            onClick={() => setShowTooltip(!showTooltip)}
            onDoubleClick={onReconnect}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-full shadow-lg
              backdrop-blur-sm transition-all duration-200
              ${isConnected 
                ? 'bg-green-500/20 dark:bg-green-500/10 border border-green-500/30' 
                : 'bg-red-500/20 dark:bg-red-500/10 border border-red-500/30'
              }
              hover:scale-105 active:scale-95
            `}
            aria-label={isConnected ? '실시간 연결됨' : '실시간 연결 끊김'}
          >
            {isReconnecting ? (
              <RefreshCw className="w-4 h-4 text-yellow-600 dark:text-yellow-400 animate-spin" />
            ) : isConnected ? (
              <Wifi className="w-4 h-4 text-green-600 dark:text-green-400" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-600 dark:text-red-400" />
            )}
            
            {showDetails && (
              <span className={`text-xs font-medium ${
                isConnected 
                  ? 'text-green-700 dark:text-green-300' 
                  : 'text-red-700 dark:text-red-300'
              }`}>
                {isReconnecting ? '재연결 중' : isConnected ? '실시간' : '오프라인'}
              </span>
            )}

            {/* 업데이트 펄스 애니메이션 */}
            {isConnected && updateCount > 0 && (
              <motion.div
                key={updateCount}
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.5, 0] }}
                transition={{ duration: 0.6 }}
                className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"
              />
            )}
          </motion.button>

          {/* 툴팁 */}
          <AnimatePresence>
            {showTooltip && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className={`
                  absolute ${position.includes('bottom') ? 'bottom-full mb-2' : 'top-full mt-2'}
                  ${position.includes('left') ? 'left-0' : 'right-0'}
                  bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700
                  p-4 min-w-[200px]
                `}
              >
                <div className="space-y-2">
                  {/* 연결 상태 */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">연결 상태</span>
                    <span className={`text-sm font-medium flex items-center gap-1 ${
                      isConnected 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {isReconnecting ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          재연결 중
                        </>
                      ) : isConnected ? (
                        <>
                          <Activity className="w-3 h-3" />
                          연결됨
                        </>
                      ) : (
                        '연결 끊김'
                      )}
                    </span>
                  </div>

                  {/* 마지막 업데이트 */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">마지막 업데이트</span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {lastUpdateText}
                    </span>
                  </div>

                  {/* 업데이트 횟수 */}
                  {updateCount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">업데이트 횟수</span>
                      <span className="text-sm text-gray-900 dark:text-white">
                        {updateCount.toLocaleString()}회
                      </span>
                    </div>
                  )}

                  {/* 재연결 버튼 */}
                  {!isConnected && onReconnect && (
                    <button
                      onClick={onReconnect}
                      className="w-full mt-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      재연결
                    </button>
                  )}

                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    실시간 데이터가 자동으로 업데이트됩니다
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}