// 기기 타입 조회 API - Cloudflare D1 사용
import { NextRequest, NextResponse } from 'next/server';
import { getD1Database } from '@/lib/db/d1';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rentableOnly = searchParams.get('rentable') === 'true';
    
    const db = getD1Database();

    // 기기 타입과 관련 정보 조회
    let query = `
      SELECT 
        dt.*,
        dc.name as category_name,
        dc.display_order as category_display_order,
        COUNT(d.id) as total_devices,
        COUNT(CASE WHEN d.status = 'available' THEN 1 END) as available_devices
      FROM device_types dt
      LEFT JOIN device_categories dc ON dt.category_id = dc.id
      LEFT JOIN devices d ON dt.id = d.device_type_id
      WHERE 1=1
    `;

    // 대여 가능한 기기만 필터링
    if (rentableOnly) {
      query += ` AND dt.is_rentable = 1`;
    }

    query += `
      GROUP BY dt.id, dc.name, dc.display_order
      ORDER BY dc.display_order ASC, dt.display_order ASC
    `;

    const deviceTypesResult = await db.prepare(query).all();
    const deviceTypes = deviceTypesResult.results || [];

    // 플레이 모드 정보 조회
    const playModesResult = await db.prepare(`
      SELECT * FROM play_modes
      ORDER BY device_type_id, display_order ASC
    `).all();
    const playModes = playModesResult.results || [];

    // 각 기기 타입에 플레이 모드 매핑
    const deviceTypesWithModes = deviceTypes.map(deviceType => ({
      ...deviceType,
      play_modes: playModes.filter(mode => mode.device_type_id === deviceType.id),
      rental_settings: deviceType.rental_settings ? JSON.parse(deviceType.rental_settings) : null,
      device_categories: {
        id: deviceType.category_id,
        name: deviceType.category_name,
        display_order: deviceType.category_display_order
      }
    }));

    // 카테고리별로 그룹화
    const categoriesMap = new Map();
    
    deviceTypesWithModes.forEach(deviceType => {
      const categoryId = deviceType.category_id;
      const categoryName = deviceType.category_name;
      const categoryDisplayOrder = deviceType.category_display_order;

      if (!categoriesMap.has(categoryId)) {
        categoriesMap.set(categoryId, {
          id: categoryId,
          name: categoryName,
          display_order: categoryDisplayOrder,
          deviceTypes: []
        });
      }

      categoriesMap.get(categoryId).deviceTypes.push(deviceType);
    });

    const categories = Array.from(categoriesMap.values())
      .sort((a, b) => a.display_order - b.display_order);

    return NextResponse.json({
      deviceTypes: deviceTypesWithModes,
      categories
    });

  } catch (error) {
    console.error('기기 타입 조회 오류:', error);
    return NextResponse.json(
      { error: '기기 타입 정보를 불러올 수 없습니다.' },
      { status: 500 }
    );
  }
}