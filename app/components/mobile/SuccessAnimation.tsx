'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface SuccessAnimationProps {
  onComplete?: () => void;
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

export default function SuccessAnimation({
  onComplete,
  size = 'md',
  message
}: SuccessAnimationProps) {
  const sizeConfig = {
    sm: { circle: 64, icon: 24, text: 'text-sm' },
    md: { circle: 96, icon: 40, text: 'text-base' },
    lg: { circle: 128, icon: 56, text: 'text-lg' }
  };

  const config = sizeConfig[size];

  useEffect(() => {
    // 햅틱 피드백
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([50, 30, 50]);
    }
    
    if (onComplete) {
      const timer = setTimeout(onComplete, 2000);
      return () => clearTimeout(timer);
    }
    
    return undefined;
  }, [onComplete]);

  return (
    <motion.div
      className="flex flex-col items-center justify-center gap-4"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.3 }}
    >
      {/* 원형 배경 */}
      <div className="relative">
        <motion.svg
          width={config.circle}
          height={config.circle}
          viewBox={`0 0 ${config.circle} ${config.circle}`}
          initial={{ rotate: -90 }}
        >
          {/* 배경 원 */}
          <circle
            cx={config.circle / 2}
            cy={config.circle / 2}
            r={config.circle / 2 - 4}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-gray-200 dark:text-gray-700"
          />
          
          {/* 진행 원 */}
          <motion.circle
            cx={config.circle / 2}
            cy={config.circle / 2}
            r={config.circle / 2 - 4}
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            className="text-green-500"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </motion.svg>
        
        {/* 체크 아이콘 */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
        >
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
            }}
            transition={{ 
              delay: 0.6,
              duration: 0.4,
              times: [0, 0.5, 1]
            }}
          >
            <Check className={`text-green-500`} size={config.icon} />
          </motion.div>
        </motion.div>
      </div>
      
      {/* 메시지 */}
      {message && (
        <motion.p
          className={`${config.text} font-medium text-gray-900 dark:text-white text-center`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {message}
        </motion.p>
      )}
    </motion.div>
  );
}