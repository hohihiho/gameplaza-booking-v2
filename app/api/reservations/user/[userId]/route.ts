import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET /api/reservations/user/[userId] - 특정 사용자의 예약 목록
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // pending, confirmed, active, completed, cancelled

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: '사용자 ID가 필요합니다'
      }, { status: 400 });
    }

    // 사용자 존재 확인 (선택사항)
    const user = query.getUserById(userId);
    if (!user) {
      return NextResponse.json({
        success: false,
        error: '해당 사용자를 찾을 수 없습니다'
      }, { status: 404 });
    }

    // 사용자 예약 목록 조회
    const reservations = query.getUserReservations(userId, status || undefined);

    // 예약 통계 조회
    const stats = query.getReservationStats(userId);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        nickname: user.nickname,
        email: user.email
      },
      reservations,
      stats,
      count: reservations.length,
      filters: {
        status: status || 'all'
      }
    });
    
  } catch (error) {
    console.error('User Reservations GET API error:', error);
    return NextResponse.json({
      success: false,
      error: '사용자 예약 목록 조회에 실패했습니다',
      reservations: []
    }, { status: 500 });
  }
}