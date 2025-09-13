import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/db';
import { sendReservationReminderNotification } from '@/lib/server/push-notifications';

// 예약 1시간 전 리마인더 전송
export async function GET(request: Request) {
  // Vercel Cron 인증 확인
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const supabase = createAdminClient();
    
    // 현재 시간에서 1시간 후 시간 계산
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    
    // 날짜와 시간 분리
    const date = oneHourLater.toLocaleDateString('en-CA'); // YYYY-MM-DD
    const time = oneHourLater.toTimeString().slice(0, 5); // HH:mm
    
    // 1시간 후에 시작하는 승인된 예약 조회
    const { data: reservations, error } = await supabase
      .from('reservations')
      .select(`
        id,
        user_id,
        start_time,
        devices (
          device_types (
            name
          )
        )
      `)
      .eq('status', 'approved')
      .eq('date', date)
      .gte('start_time', time)
      .lte('start_time', `${oneHourLater.getHours()}:${(oneHourLater.getMinutes() + 5).toString().padStart(2, '0')}`);

    if (error) {
      console.error('예약 조회 오류:', error);
      return NextResponse.json({ error: 'Failed to fetch reservations' }, { status: 500 });
    }

    let sentCount = 0;
    let failCount = 0;

    // 각 예약에 대해 리마인더 전송
    for (const reservation of reservations || []) {
      try {
        const deviceName = reservation.devices?.[0]?.device_types?.[0]?.name || '게임기기';
        const success = await sendReservationReminderNotification(
          reservation.user_id,
          1, // 1시간 전
          deviceName
        );
        
        if (success) {
          sentCount++;
        } else {
          failCount++;
        }
      } catch (err) {
        console.error(`리마인더 전송 실패 - 예약 ID: ${reservation.id}`, err);
        failCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `리마인더 전송 완료 - 성공: ${sentCount}, 실패: ${failCount}`,
      sentCount,
      failCount
    });
  } catch (error) {
    console.error('Cron job 오류:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}