// 서버 사이드 푸시 알림 유틸리티
import webpush from 'web-push';
import { createAdminClient } from '@/lib/db';
import { notificationTemplates } from '@/lib/push-notifications';

// VAPID 설정 - 환경 변수가 있을 때만 설정
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

// VAPID 키가 유효한 형식인지 확인하는 함수
function isValidVapidKey(key: string | undefined): boolean {
  if (!key) return false;
  // URL safe Base64 패턴 확인 (=가 없어야 함)
  const urlSafeBase64Pattern = /^[A-Za-z0-9_-]+$/;
  return urlSafeBase64Pattern.test(key);
}

// 빌드 시점이 아닌 런타임에 설정하도록 지연 초기화
let vapidInitialized = false;

function initializeVapid() {
  if (vapidInitialized) return;
  
  if (vapidPublicKey && vapidPrivateKey && 
      isValidVapidKey(vapidPublicKey) && 
      isValidVapidKey(vapidPrivateKey)) {
    try {
      webpush.setVapidDetails(
        'mailto:admin@gameplaza.kr',
        vapidPublicKey,
        vapidPrivateKey
      );
      vapidInitialized = true;
      console.log('VAPID 키가 성공적으로 설정되었습니다.');
    } catch (error) {
      console.error('VAPID 키 설정 실패:', error);
      console.log('푸시 알림 기능이 비활성화됩니다.');
    }
  } else {
    console.log('유효한 VAPID 키가 없어 푸시 알림이 비활성화됩니다.');
  }
}

// 특정 사용자에게 푸시 알림 전송
export async function sendPushNotification(
  userId: string,
  notification: ReturnType<typeof notificationTemplates[keyof typeof notificationTemplates]>
) {
  // VAPID 초기화 시도
  initializeVapid();
  
  // VAPID 키가 설정되지 않은 경우 건너뛰기
  if (!vapidInitialized) {
    console.log('VAPID가 초기화되지 않아 푸시 알림을 건너뜁니다.');
    return false;
  }

  try {
    // 사용자의 구독 정보 가져오기
    import { getDB, supabase } from '@/lib/db';
    const { data: subscription, error } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', userId)
      .single();

    if (error || !subscription) {
      console.log('구독 정보를 찾을 수 없습니다:', userId);
      return false;
    }

    // 알림 전송
    try {
      await webpush.sendNotification(
        subscription.subscription,
        JSON.stringify({
          title: notification.title,
          body: notification.body,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          tag: notification.tag,
          data: notification.data,
          timestamp: Date.now(),
        })
      );

      // 전송 로그 기록
      await supabase.from('push_notification_logs').insert({
        user_id: userId,
        type: notification.data?.type || 'unknown',
        title: notification.title,
        body: notification.body,
        data: notification.data,
        status: 'sent',
        sent_at: new Date().toISOString(),
      });

      return true;
    } catch (error: any) {
      console.error('푸시 알림 전송 실패:', error);

      // 구독이 만료된 경우 삭제
      if (error.statusCode === 410) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', userId);
      }

      // 실패 로그 기록
      await supabase.from('push_notification_logs').insert({
        user_id: userId,
        type: notification.data?.type || 'unknown',
        title: notification.title,
        body: notification.body,
        data: notification.data,
        status: 'failed',
        error: error.message,
      });

      return false;
    }
  } catch (error) {
    console.error('푸시 알림 처리 오류:', error);
    return false;
  }
}

// 여러 사용자에게 푸시 알림 전송
export async function sendBulkPushNotifications(
  userIds: string[],
  notification: ReturnType<typeof notificationTemplates[keyof typeof notificationTemplates]>
) {
  const results = await Promise.allSettled(
    userIds.map(userId => sendPushNotification(userId, notification))
  );

  const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
  const failed = results.length - successful;

  return { successful, failed };
}

// 예약 승인 알림 전송
export async function sendReservationApprovedNotification(userId: string, reservationNumber: string) {
  const notification = notificationTemplates.reservationApproved(reservationNumber);
  return sendPushNotification(userId, notification);
}

// 예약 리마인더 알림 전송
export async function sendReservationReminderNotification(userId: string, hours: number, deviceName: string) {
  const notification = notificationTemplates.reservationReminder(hours, deviceName);
  return sendPushNotification(userId, notification);
}

// 예약 취소 알림 전송
export async function sendReservationCancelledNotification(userId: string, reservationNumber: string) {
  const notification = notificationTemplates.reservationCancelled(reservationNumber);
  return sendPushNotification(userId, notification);
}

// 공지사항 알림 전송
export async function sendAnnouncementNotification(userIds: string[], title: string, message: string) {
  const notification = notificationTemplates.announcement(title, message);
  return sendBulkPushNotifications(userIds, notification);
}