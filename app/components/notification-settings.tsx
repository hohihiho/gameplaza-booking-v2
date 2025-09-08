'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, Loader2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from '@/lib/auth/better-auth-client';
import {
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  getPushSubscriptionStatus,
  showLocalNotification,
} from '@/lib/push-notifications';

export default function NotificationSettings() {
  const { data: session } = useSession();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [notificationSupported, setNotificationSupported] = useState(true);

  // 초기 상태 확인
  useEffect(() => {
    checkNotificationStatus();
  }, []);

  const checkNotificationStatus = async () => {
    try {
      // 알림 지원 여부 확인
      if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
        setNotificationSupported(false);
        setIsLoading(false);
        return;
      }

      // 현재 구독 상태 확인
      const subscription = await getPushSubscriptionStatus();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('알림 상태 확인 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleNotifications = async () => {
    if (!session?.user?.id) return;

    setIsToggling(true);

    try {
      if (isSubscribed) {
        // 알림 끄기
        const success = await unsubscribeFromPushNotifications(session.user.id);
        if (success) {
          setIsSubscribed(false);
          showSuccessMessage();
        }
      } else {
        // 알림 켜기
        const subscription = await subscribeToPushNotifications(session.user.id);
        if (subscription) {
          setIsSubscribed(true);
          showSuccessMessage();
          
          // 테스트 알림 표시
          setTimeout(() => {
            showLocalNotification('알림이 활성화되었습니다', {
              body: '예약 관련 알림을 받으실 수 있습니다.',
            });
          }, 1000);
        }
      }
    } catch (error) {
      console.error('알림 설정 변경 실패:', error);
    } finally {
      setIsToggling(false);
    }
  };

  const showSuccessMessage = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  if (!notificationSupported) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <BellOff className="w-5 h-5 text-gray-400" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              푸시 알림 미지원
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              이 브라우저는 푸시 알림을 지원하지 않습니다.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-center py-2">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isSubscribed ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
            {isSubscribed ? (
              <Bell className="w-5 h-5 text-green-600 dark:text-green-400" />
            ) : (
              <BellOff className="w-5 h-5 text-gray-400" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              푸시 알림
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              예약 승인, 리마인더 등의 알림을 받습니다
            </p>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={handleToggleNotifications}
            disabled={isToggling}
            className={`
              relative inline-flex h-6 w-11 items-center rounded-full
              transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:ring-offset-2
              ${isSubscribed ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'}
              ${isToggling ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <span
              className={`
                inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                ${isSubscribed ? 'translate-x-6' : 'translate-x-1'}
              `}
            />
          </button>

          <AnimatePresence>
            {showSuccess && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute -top-8 right-0 bg-green-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                저장됨
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 알림 종류 설명 */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
          받을 수 있는 알림:
        </p>
        <ul className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
          <li>• 예약 승인/거절 알림</li>
          <li>• 예약 시간 1시간 전 리마인더</li>
          <li>• 예약 취소/변경 알림</li>
          <li>• 운영시간 변경 등 중요 공지사항</li>
        </ul>
      </div>
    </div>
  );
}