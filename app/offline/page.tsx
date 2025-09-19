'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { WifiOff, RefreshCw } from 'lucide-react';

export default function OfflinePage() {
  useEffect(() => {
    // 온라인 상태가 되면 자동으로 새로고침
    const handleOnline = () => {
      window.location.reload();
    };

    window.addEventListener('online', handleOnline);

    // 5초마다 연결 상태 확인
    const interval = setInterval(() => {
      if (navigator.onLine) {
        window.location.reload();
      }
    }, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      clearInterval(interval);
    };
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full text-center"
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto">
            <WifiOff className="w-12 h-12 text-gray-400 dark:text-gray-600" />
          </div>
        </motion.div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          인터넷 연결이 끊어졌습니다
        </h1>
        
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          네트워크 연결을 확인하고 다시 시도해 주세요.
          <br />
          연결이 복구되면 자동으로 페이지가 새로고침됩니다.
        </p>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleRefresh}
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
          다시 시도
        </motion.button>

        <div className="mt-12 text-sm text-gray-500 dark:text-gray-500">
          <p>5초마다 자동으로 연결 상태를 확인합니다.</p>
        </div>
      </motion.div>
    </div>
  );
}