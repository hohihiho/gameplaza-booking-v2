import { createAdminClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

// 메모리 캐시 (30초 캐시)
let deviceCountCache: {
  data: any;
  timestamp: number;
} | null = null;

const CACHE_DURATION = 30 * 1000; // 30초

export async function GET() {
  try {
    // 캐시 확인 (30초 이내)
    if (deviceCountCache && Date.now() - deviceCountCache.timestamp < CACHE_DURATION) {
      return NextResponse.json(deviceCountCache.data);
    }
    
    const supabase = createAdminClient();
    
    // 최적화된 쿼리: status만 선택하여 네트워크 트래픽 최소화
    const { data: devices, error: devicesError } = await supabase
      .from('devices')
      .select('status');
    
    if (devicesError) {
      throw devicesError;
    }
    
    const total = devices?.length || 0;
    const available = devices?.filter(d => d.status === 'available').length || 0;
    const availablePercentage = total > 0 ? Math.round((available / total) * 100) : 0;
    
    const result = {
      total,
      available,
      availablePercentage
    };
    
    // 결과를 캐시에 저장
    deviceCountCache = {
      data: result,
      timestamp: Date.now()
    };
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Device count API error:', error);
    return NextResponse.json({ 
      error: '기기 상태 조회에 실패했습니다',
      total: 0,
      available: 0,
      availablePercentage: 0
    }, { status: 500 });
  }
}