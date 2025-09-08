import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // D1 데이터베이스에서 기기 유형별 정보 조회
    const deviceTypes = query.getDeviceTypes();
    
    const result = deviceTypes.map(deviceType => {
      // 각 기기 유형별로 기기들 조회
      const devices = query.getDevicesByType(deviceType.id);
      
      return {
        id: deviceType.id,
        name: deviceType.name,
        display_name: deviceType.display_name,
        description: deviceType.description,
        icon: deviceType.icon,
        color: deviceType.color,
        sort_order: deviceType.sort_order,
        total_count: devices.length,
        available_count: devices.filter(d => d.status === 'available').length,
        occupied_count: devices.filter(d => d.status === 'occupied').length,
        maintenance_count: devices.filter(d => d.status === 'maintenance').length,
        devices: devices.map(device => ({
          id: device.id,
          name: device.name,
          status: device.status,
          position: device.position,
          last_used_at: device.last_used_at
        }))
      };
    });
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Machines API error:', error);
    return NextResponse.json({ 
      error: '기기 정보 조회에 실패했습니다',
      machines: []
    }, { status: 500 });
  }
}