// 기기 현황 API - Cloudflare D1 사용
import { NextRequest, NextResponse } from 'next/server';
import { getD1Database } from '@/lib/db/d1';

export async function GET(request: NextRequest) {
  try {
    const db = getD1Database();
    
    // 카테고리 조회
    const categories = await db.prepare(`
      SELECT * FROM device_categories 
      ORDER BY display_order ASC
    `).all();

    // 기기 타입과 기기들 조회
    const deviceTypes = await db.prepare(`
      SELECT 
        dt.*,
        dc.name as category_name,
        dc.display_order as category_display_order
      FROM device_types dt
      LEFT JOIN device_categories dc ON dt.category_id = dc.id
      ORDER BY dt.display_order ASC
    `).all();

    // 모든 기기 조회
    const devices = await db.prepare(`
      SELECT * FROM devices
      ORDER BY device_type_id, device_number ASC
    `).all();

    // 플레이 모드 조회
    const playModes = await db.prepare(`
      SELECT * FROM play_modes
      ORDER BY device_type_id, display_order ASC
    `).all();

    // 오늘 날짜의 활성 예약 조회
    const today = new Date().toISOString().split('T')[0];
    const reservations = await db.prepare(`
      SELECT 
        r.device_id,
        r.start_time,
        r.end_time,
        r.status,
        u.name as user_name
      FROM reservations r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.date = ? 
      AND r.status IN ('approved', 'checked_in')
    `).bind(today).all();

    // 기기 현황 안내사항 조회
    let machineRules = [];
    try {
      const rulesResult = await db.prepare(`
        SELECT * FROM machine_rules
        WHERE is_active = 1
        ORDER BY display_order ASC
      `).all();
      machineRules = rulesResult.results || [];
    } catch (error) {
      // machine_rules 테이블이 없을 수 있음
      console.log('machine_rules 테이블 조회 실패:', error);
    }

    // 데이터 구조화
    const deviceTypesMap = new Map();
    const devicesMap = new Map();
    const playModesMap = new Map();
    const reservationsMap = new Map();

    // 기기를 타입별로 그룹화
    devices.results?.forEach(device => {
      if (!devicesMap.has(device.device_type_id)) {
        devicesMap.set(device.device_type_id, []);
      }
      devicesMap.get(device.device_type_id).push(device);
    });

    // 플레이 모드를 타입별로 그룹화
    playModes.results?.forEach(mode => {
      if (!playModesMap.has(mode.device_type_id)) {
        playModesMap.set(mode.device_type_id, []);
      }
      playModesMap.get(mode.device_type_id).push({
        id: mode.id,
        name: mode.name,
        price: mode.price,
        display_order: mode.display_order
      });
    });

    // 예약을 기기별로 매핑
    reservations.results?.forEach(reservation => {
      reservationsMap.set(reservation.device_id, reservation);
    });

    // 기기 타입별로 정리
    const formattedDeviceTypes = deviceTypes.results?.map(type => {
      const typeDevices = devicesMap.get(type.id) || [];
      const typeModes = playModesMap.get(type.id) || [];

      return {
        id: type.id,
        name: type.name,
        company: type.category_name || 'Unknown',
        description: type.description || '',
        model_name: type.model_name,
        version_name: type.version_name,
        play_price: '현장 문의',
        is_rentable: type.is_rentable || false,
        total_count: typeDevices.length,
        devices: typeDevices.map(device => {
          const reservation = reservationsMap.get(device.id);
          return {
            id: device.id,
            device_number: device.device_number,
            status: device.status,
            current_user: null,
            reservation_info: reservation ? {
              start_time: reservation.start_time,
              end_time: reservation.end_time,
              user_name: reservation.user_name || 'Unknown',
              is_checked_in: reservation.status === 'checked_in'
            } : undefined
          };
        }),
        category_id: type.category_id,
        display_order: type.display_order,
        rental_settings: type.rental_settings ? JSON.parse(type.rental_settings) : null,
        play_modes: typeModes.sort((a, b) => a.display_order - b.display_order),
        device_categories: {
          id: type.category_id,
          name: type.category_name,
          display_order: type.category_display_order
        }
      };
    }) || [];

    // 카테고리별로 그룹화
    const categoriesWithDevices = categories.results?.map(category => ({
      id: category.id,
      name: category.name,
      display_order: category.display_order,
      deviceTypes: formattedDeviceTypes.filter(type => type.category_id === category.id)
    })).filter(cat => cat.deviceTypes.length > 0) || [];

    return NextResponse.json({
      categories: categoriesWithDevices,
      deviceTypes: formattedDeviceTypes,
      machineRules: machineRules
    });

  } catch (error) {
    console.error('기기 정보 조회 오류:', error);
    return NextResponse.json(
      { error: '기기 정보를 불러올 수 없습니다.' },
      { status: 500 }
    );
  }
}