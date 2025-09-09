import { NextRequest, NextResponse } from 'next/server';
import { D1RepositoryFactory, getD1Database } from '@/lib/repositories/d1';
import { z } from 'zod';

// 요청 스키마 정의
const createDeviceSchema = z.object({
  type_id: z.string().uuid('올바른 타입 ID 형식이 아닙니다'),
  device_number: z.number().int().min(1, '기기 번호는 1 이상이어야 합니다'),
  status: z.enum(['available', 'in_use', 'maintenance', 'reserved']).optional(),
  notes: z.string().optional()
});

const createDeviceTypeSchema = z.object({
  name: z.string().min(1, '기기 타입 이름은 필수입니다'),
  description: z.string().optional(),
  category: z.string().optional(),
  max_units: z.number().int().min(1).max(10).optional(),
  display_order: z.number().int().min(0).optional()
});

// GET /api/v2/devices - 기기 목록 조회
export async function GET(request: NextRequest) {
  try {
    const db = getD1Database(request);
    
    if (!db) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      );
    }

    const repos = new D1RepositoryFactory(db);
    const searchParams = request.nextUrl.searchParams;
    
    const typeId = searchParams.get('type_id');
    const status = searchParams.get('status');
    const includeTypes = searchParams.get('include_types') === 'true';
    const statsOnly = searchParams.get('stats_only') === 'true';
    
    // 통계만 반환
    if (statsOnly) {
      const stats = await repos.devices.getDeviceStats();
      return NextResponse.json({
        success: true,
        data: stats
      });
    }
    
    let devices;
    
    if (typeId) {
      // 타입별 기기 조회
      devices = await repos.devices.findByType(typeId);
    } else if (status) {
      // 상태별 기기 조회
      devices = await repos.devices.findByStatus(status);
    } else {
      // 전체 기기 조회
      devices = await repos.devices.findAll();
    }
    
    // 기기 타입 정보 포함
    if (includeTypes) {
      const deviceTypes = await repos.deviceTypes.findActive();
      const typeMap = new Map(deviceTypes.map(t => [t.id, t]));
      
      devices = devices.map(device => ({
        ...device,
        type: typeMap.get(device.type_id)
      }));
    }

    return NextResponse.json({
      success: true,
      data: devices,
      count: devices.length
    });

  } catch (error) {
    console.error('기기 조회 오류:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch devices',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/v2/devices - 새 기기 생성
export async function POST(request: NextRequest) {
  try {
    const db = getD1Database(request);
    
    if (!db) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { create_type, ...deviceData } = body;
    
    const repos = new D1RepositoryFactory(db);

    // 기기 타입 생성 요청
    if (create_type) {
      const typeValidation = createDeviceTypeSchema.safeParse(body);
      if (!typeValidation.success) {
        return NextResponse.json(
          { 
            error: 'Validation failed',
            details: typeValidation.error.errors 
          },
          { status: 400 }
        );
      }

      const deviceType = await repos.deviceTypes.createDeviceType(typeValidation.data);
      
      return NextResponse.json({
        success: true,
        data: deviceType,
        message: '기기 타입이 생성되었습니다.'
      }, { status: 201 });
    }

    // 기기 생성 요청
    const validationResult = createDeviceSchema.safeParse(deviceData);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;
    
    // 기기 타입 존재 확인
    const deviceType = await repos.deviceTypes.findById(data.type_id);
    if (!deviceType || !deviceType.is_active) {
      return NextResponse.json(
        { error: '유효하지 않은 기기 타입입니다.' },
        { status: 400 }
      );
    }

    // 동일 번호 기기 확인
    const existingDevices = await repos.devices.findByType(data.type_id);
    const duplicateNumber = existingDevices.some(d => d.device_number === data.device_number);
    
    if (duplicateNumber) {
      return NextResponse.json(
        { error: '해당 기기 번호가 이미 존재합니다.' },
        { status: 409 }
      );
    }

    // 기기 생성
    const device = await repos.devices.createDevice({
      type_id: data.type_id,
      device_number: data.device_number,
      status: data.status || 'available',
      notes: data.notes
    });

    // 기기 타입 정보 포함하여 반환
    const deviceWithType = {
      ...device,
      type: deviceType
    };

    return NextResponse.json({
      success: true,
      data: deviceWithType,
      message: '기기가 성공적으로 생성되었습니다.'
    }, { status: 201 });

  } catch (error) {
    console.error('기기 생성 오류:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create device',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PATCH /api/v2/devices - 기기 일괄 상태 업데이트
export async function PATCH(request: NextRequest) {
  try {
    const db = getD1Database(request);
    
    if (!db) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { device_ids, status } = body;

    if (!device_ids || !Array.isArray(device_ids) || !status) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    const validStatuses = ['available', 'in_use', 'maintenance', 'reserved'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const repos = new D1RepositoryFactory(db);
    const results = [];

    for (const id of device_ids) {
      try {
        await repos.devices.updateStatus(id, status);
        results.push({ id, success: true });
      } catch (error) {
        results.push({ 
          id, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: `${results.filter(r => r.success).length}개 기기 상태가 업데이트되었습니다.`
    });

  } catch (error) {
    console.error('기기 상태 업데이트 오류:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update devices',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/v2/devices - 기기 타입 비활성화
export async function DELETE(request: NextRequest) {
  try {
    const db = getD1Database(request);
    
    if (!db) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const typeId = searchParams.get('type_id');

    if (!typeId) {
      return NextResponse.json(
        { error: 'type_id is required' },
        { status: 400 }
      );
    }

    const repos = new D1RepositoryFactory(db);
    
    // 기기 타입 존재 확인
    const deviceType = await repos.deviceTypes.findById(typeId);
    if (!deviceType) {
      return NextResponse.json(
        { error: '기기 타입을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 해당 타입의 활성 기기 확인
    const devices = await repos.devices.findByType(typeId);
    const activeDevices = devices.filter(d => d.status !== 'maintenance');
    
    if (activeDevices.length > 0) {
      return NextResponse.json(
        { error: `활성 기기가 ${activeDevices.length}개 있어 비활성화할 수 없습니다.` },
        { status: 400 }
      );
    }

    // 기기 타입 비활성화
    await repos.deviceTypes.setActive(typeId, false);

    return NextResponse.json({
      success: true,
      message: '기기 타입이 비활성화되었습니다.'
    });

  } catch (error) {
    console.error('기기 타입 비활성화 오류:', error);
    return NextResponse.json(
      { 
        error: 'Failed to deactivate device type',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}