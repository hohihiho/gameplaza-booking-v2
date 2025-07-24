// 서버 사이드 푸시 알림 유틸리티
import webpush from 'web-push';
import { createAdminClient } from '@/lib/supabase';
import { notificationTemplates } from '@/lib/push-notifications';

// VAPID 설정
webpush.setVapidDetails(
  'mailto:admin@gameplaza.kr',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

// 특정 사용자에게 푸시 알림 전송
export async function sendPushNotification(
  userId: string,
  notification: ReturnType<typeof notificationTemplates[keyof typeof notificationTemplates]>
) {
  try {
    // 사용자의 구독 정보 가져오기
    const supabase = createAdminClient();
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