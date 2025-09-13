// 크론잡 - 예약 시작 시간 체크 및 기기 상태 업데이트
// 비전공자 설명: 체크인은 되었지만 아직 예약 시간이 되지 않은 기기들을 확인하고,
// 예약 시간이 되면 자동으로 '대여 중' 상태로 변경하는 API입니다.

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/db';
import { forceCheckDeviceStatus } from '@/lib/device-status-manager';

export async function GET(request: NextRequest) {
  try {
    // 보안: Authorization 헤더 확인 (GitHub Actions에서만 호출 가능)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Legacy rental start cron job redirecting to new auto-check system...');

    // 새로운 자동 관리 시스템 사용
    const result = await forceCheckDeviceStatus();
    
    // 기존 응답 형식 유지 (호환성을 위해)
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
    
    return NextResponse.json({
      success: true,
      message: 'Rental start times checked successfully (via new auto-check system)',
      timestamp: new Date().toISOString(),
      updatedCount: result.startedCount,
      currentTime: currentTime,
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