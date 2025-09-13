// 크론잡 - 기기 상태 업데이트
// 비전공자 설명: 예약이 끝난 기기들을 자동으로 '사용가능' 상태로 되돌리는 API입니다

import { NextRequest, NextResponse } from 'next/server';
import { forceCheckDeviceStatus } from '@/lib/device-status-manager';

export async function GET(request: NextRequest) {
  try {
    // 보안: Authorization 헤더 확인 (GitHub Actions에서만 호출 가능)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Legacy cron job redirecting to new auto-check system...');

    // 새로운 자동 관리 시스템 사용
    const result = await forceCheckDeviceStatus();
    
    // 기존 응답 형식 유지 (호환성을 위해)
    return NextResponse.json({
      success: true,
      message: 'Device status updated successfully (via new auto-check system)',
      timestamp: new Date().toISOString(),
      devicesChecked: 0, // 기존 필드 유지
      reservationsProcessed: result.expiredCount + result.startedCount,
      errors: result.errors.length,
      newSystemResult: {
        executed: result.executed,
        expiredReservations: result.expiredCount,
        startedReservations: result.startedCount,
        errorDetails: result.errors
      }
    });
    
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}