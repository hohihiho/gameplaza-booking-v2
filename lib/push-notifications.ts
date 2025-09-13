// PWA 푸시 알림 관리
import { createClient } from '@/lib/db';

// 알림 권한 요청
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('이 브라우저는 알림을 지원하지 않습니다.');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

// Service Worker 등록
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Worker를 지원하지 않는 브라우저입니다.');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker 등록 성공:', registration);
    return registration;
  } catch (error) {
    console.error('Service Worker 등록 실패:', error);
    return null;
  }
}

// 푸시 구독
export async function subscribeToPushNotifications(userId: string): Promise<PushSubscription | null> {
  try {
    // 1. 알림 권한 확인
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      return null;
    }

    // 2. Service Worker 준비
    const registration = await navigator.serviceWorker.ready;

    // 3. 푸시 구독 생성 (실제 환경에서는 서버에서 VAPID 키를 받아와야 함)
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'YOUR_VAPID_PUBLIC_KEY'
      )
    });

    // 4. 구독 정보를 서버에 저장
    await savePushSubscription(userId, subscription);

    return subscription;
  } catch (error) {
    console.error('푸시 구독 실패:', error);
    return null;
  }
}

// 푸시 구독 취소
export async function unsubscribeFromPushNotifications(userId: string): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
      await removePushSubscription(userId);
      return true;
    }

    return false;
  } catch (error) {
    console.error('푸시 구독 취소 실패:', error);
    return false;
  }
}

// 현재 구독 상태 확인
export async function getPushSubscriptionStatus(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription;
  } catch (error) {
    console.error('구독 상태 확인 실패:', error);
    return null;
  }
}

// 서버에 구독 정보 저장
async function savePushSubscription(userId: string, subscription: PushSubscription) {
  try {
    const response = await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        subscription: subscription.toJSON(),
      }),
    });

    if (!response.ok) {
      throw new Error('구독 정보 저장 실패');
    }
  } catch (error) {
    console.error('구독 정보 저장 오류:', error);
    throw error;
  }
}

// 서버에서 구독 정보 삭제
async function removePushSubscription(userId: string) {
  try {
    const response = await fetch('/api/notifications/unsubscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      throw new Error('구독 정보 삭제 실패');
    }
  } catch (error) {
    console.error('구독 정보 삭제 오류:', error);
    throw error;
  }
}

// VAPID 키 변환 유틸리티
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// 로컬 알림 표시 (테스트용)
export function showLocalNotification(title: string, options?: NotificationOptions) {
  if (!('Notification' in window)) {
    return;
  }

  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      ...options,
    });
  }
}

// 알림 메시지 템플릿
export const notificationTemplates = {
  reservationApproved: (reservationNumber: string) => ({
    title: '예약이 승인되었습니다',
    body: `예약번호 ${reservationNumber}가 승인되었습니다. 예약 시간에 방문해주세요.`,
    tag: 'reservation-approved',
    data: { type: 'reservation', action: 'approved', reservationNumber },
  }),

  reservationReminder: (hours: number, deviceName: string) => ({
    title: '예약 리마인더',
    body: `${hours}시간 후 ${deviceName} 예약이 있습니다.`,
    tag: 'reservation-reminder',
    data: { type: 'reservation', action: 'reminder' },
  }),

  reservationCancelled: (reservationNumber: string) => ({
    title: '예약이 취소되었습니다',
    body: `예약번호 ${reservationNumber}가 취소되었습니다.`,
    tag: 'reservation-cancelled',
    data: { type: 'reservation', action: 'cancelled', reservationNumber },
  }),

  announcement: (title: string, message: string) => ({
    title,
    body: message,
    tag: 'announcement',
    data: { type: 'announcement' },
  }),
};