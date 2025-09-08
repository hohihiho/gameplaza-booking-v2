import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // D1 데이터베이스에서 실제 기기 상태 조회
    const deviceCounts = query.getDeviceCount();
    
    const total = deviceCounts.reduce((sum, device) => sum + (device.total || 0), 0);
    const available = deviceCounts.reduce((sum, device) => sum + (device.available || 0), 0);
    const availablePercentage = total > 0 ? Math.round((available / total) * 100) : 0;
    
    const result = {
      total,
      available,
      availablePercentage,
      devices: deviceCounts
    };
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Device count API error:', error);
    return NextResponse.json({ 
      error: '기기 상태 조회에 실패했습니다',
      total: 0,
      available: 0,
      availablePercentage: 0,
      devices: []
    }, { status: 500 });
  }
}