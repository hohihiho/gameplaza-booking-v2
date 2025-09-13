// 알림 스케줄러 서비스
// 크론잡 없이 예약 알림을 처리하는 서비스

import { createClient } from '@/lib/db';

export class NotificationSchedulerService {
  // 예약 생성 시 알림 예약
  static async scheduleNotification(reservationId: string, reservationDate: string, startTime: string) {
    const supabase = await createClient();
    
    // 예약 시간 30분 전 알림 시간 계산
    const [year, month, day] = reservationDate.split('-').map(Number);
    const [hour, minute] = startTime.split(':').map(Number);
    const reservationDateTime = new Date(year, month - 1, day, hour, minute);
    const notificationTime = new Date(reservationDateTime.getTime() - 30 * 60 * 1000); // 30분 전

    // 알림 예약 저장
    const { error } = await supabase
      .from('scheduled_notifications')
      .insert({
        reservation_id: reservationId,
        scheduled_at: notificationTime.toISOString(),
        type: 'reminder',
        status: 'pending'
      });

    if (error) {
      console.error('알림 예약 실패:', error);
    }

    return !error;
  }

  // 페이지 로드 시 대기 중인 알림 확인 및 발송
  static async checkAndSendPendingNotifications() {
    const supabase = await createClient();
    const now = new Date();

    // 현재 시간이 지난 미발송 알림 조회
    const { data: pendingNotifications, error } = await supabase
      .from('scheduled_notifications')
      .select(`
        *,
        reservations (
          id,
          user_id,
          date,
          start_time,
          users (
            email,
            name,
            phone
          )
        )
      `)
      .eq('status', 'pending')
      .lte('scheduled_at', now.toISOString())
      .order('scheduled_at', { ascending: true });

    if (error || !pendingNotifications) {
      console.error('대기 중인 알림 조회 실패:', error);
      return;
    }

    // 각 알림 발송
    for (const notification of pendingNotifications) {
      await this.sendNotification(notification);
      
      // 발송 완료 표시
      await supabase
        .from('scheduled_notifications')
        .update({ 
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('id', notification.id);
    }
  }

  // 실제 알림 발송
  private static async sendNotification(notification: any) {
    const { reservations } = notification;
    if (!reservations) return;

    const user = reservations.users;
    const message = `안녕하세요 ${user.name}님! 오늘 ${reservations.start_time}에 예약하신 게임플라자 이용 시간이 30분 남았습니다.`;

    // 이메일 발송 (실제 구현 필요)
    // await sendEmail(user.email, '예약 알림', message);

    // SMS 발송 (실제 구현 필요) 
    // await sendSMS(user.phone, message);

    console.log('알림 발송:', { to: user.email, message });
  }
}